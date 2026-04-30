import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


class InvalidInviteCodeError(ValueError):
    pass


class InviteCodeExhaustedError(ValueError):
    pass


class GlobalGenerationCapReachedError(ValueError):
    pass


@dataclass(frozen=True)
class InviteCodeConfig:
    code: str
    max_uses: int


DB_PATH = Path(
    os.environ.get(
        "INVITE_CODE_DB_PATH",
        str(Path(__file__).resolve().parents[2] / "invite_codes.sqlite3"),
    )
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _parse_seed_codes(raw: str) -> list[InviteCodeConfig]:
    configs: list[InviteCodeConfig] = []
    if not raw.strip():
        return configs
    for chunk in raw.split(","):
        part = chunk.strip()
        if not part:
            continue
        if ":" not in part:
            raise ValueError(
                f"Invalid INVITE_CODES entry '{part}'. Use CODE:MAX_USES format."
            )
        code, max_uses_raw = part.split(":", 1)
        invite_code = code.strip()
        if not invite_code:
            raise ValueError("Invite code cannot be empty.")
        try:
            max_uses = int(max_uses_raw.strip())
        except ValueError as e:
            raise ValueError(
                f"Invalid max uses for invite code '{invite_code}'."
            ) from e
        if max_uses <= 0:
            raise ValueError(f"Invite code '{invite_code}' must have max uses > 0.")
        configs.append(InviteCodeConfig(code=invite_code, max_uses=max_uses))
    return configs


def init_invite_code_store() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS invite_codes (
                code TEXT PRIMARY KEY,
                max_uses INTEGER NOT NULL,
                used_count INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active
            ON invite_codes (is_active)
            """
        )

        now = _utc_now()
        seed_codes = _parse_seed_codes(os.environ.get("INVITE_CODES", ""))
        for cfg in seed_codes:
            conn.execute(
                """
                INSERT INTO invite_codes (code, max_uses, used_count, is_active, created_at, updated_at)
                VALUES (?, ?, 0, 1, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                    max_uses = excluded.max_uses,
                    is_active = 1,
                    updated_at = excluded.updated_at
                """,
                (cfg.code, cfg.max_uses, now, now),
            )
        conn.commit()


def _global_cap() -> int | None:
    raw = os.environ.get("GLOBAL_GENERATION_CAP", "").strip()
    if not raw:
        return None
    try:
        cap = int(raw)
    except ValueError as e:
        raise ValueError("GLOBAL_GENERATION_CAP must be an integer.") from e
    if cap <= 0:
        raise ValueError("GLOBAL_GENERATION_CAP must be greater than zero.")
    return cap


def consume_invite_use(invite_code: str) -> None:
    code = invite_code.strip()
    if not code:
        raise InvalidInviteCodeError("Invite code is required.")

    cap = _global_cap()
    with _connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if cap is not None:
            total_used = conn.execute(
                "SELECT COALESCE(SUM(used_count), 0) AS total_used FROM invite_codes"
            ).fetchone()["total_used"]
            if int(total_used) >= cap:
                conn.rollback()
                raise GlobalGenerationCapReachedError(
                    "Testing limit reached. Please ask for a new invite batch."
                )

        row = conn.execute(
            """
            SELECT code, max_uses, used_count, is_active
            FROM invite_codes
            WHERE code = ?
            """,
            (code,),
        ).fetchone()

        if row is None or int(row["is_active"]) != 1:
            conn.rollback()
            raise InvalidInviteCodeError("Invalid invite code.")
        if int(row["used_count"]) >= int(row["max_uses"]):
            conn.rollback()
            raise InviteCodeExhaustedError(
                "This invite code has already been used."
            )

        conn.execute(
            """
            UPDATE invite_codes
            SET used_count = used_count + 1, updated_at = ?
            WHERE code = ?
            """,
            (_utc_now(), code),
        )
        conn.commit()


def refund_invite_use(invite_code: str) -> None:
    code = invite_code.strip()
    if not code:
        return
    with _connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            "SELECT used_count FROM invite_codes WHERE code = ?",
            (code,),
        ).fetchone()
        if row is None or int(row["used_count"]) <= 0:
            conn.rollback()
            return
        conn.execute(
            """
            UPDATE invite_codes
            SET used_count = used_count - 1, updated_at = ?
            WHERE code = ?
            """,
            (_utc_now(), code),
        )
        conn.commit()
