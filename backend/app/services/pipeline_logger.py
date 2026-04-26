import json
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any


LOG_DIR = Path(__file__).resolve().parents[2] / "logs"


class PipelineLogger:
    """Per-request structured log for the two-stage email pipeline.

    One instance per /generate call. Writes a single JSON file on flush()
    containing the request, fetched papers (metadata only), Stage 1 prompt +
    raw response + parsed selections, full-text fetch results, and Stage 2
    prompt + raw response. Prompts are logged in full so the user can see
    exactly what the model saw.
    """

    def __init__(self) -> None:
        self.run_id = uuid.uuid4().hex[:8]
        self.started_at = datetime.now()
        self._t0 = time.perf_counter()
        self.events: dict[str, Any] = {
            "run_id": self.run_id,
            "started_at": self.started_at.isoformat(timespec="seconds"),
        }

    def _elapsed(self) -> float:
        return round(time.perf_counter() - self._t0, 2)

    def record(self, key: str, value: Any) -> None:
        self.events[key] = value

    @staticmethod
    def paper_summary(p: dict) -> dict:
        return {
            "title": p.get("title"),
            "year": p.get("year"),
            "citation_count": p.get("citation_count"),
            "arxiv_id": p.get("arxiv_id"),
            "has_full_text": bool(p.get("full_text")),
            "full_text_chars": len(p["full_text"]) if p.get("full_text") else 0,
            "abstract_chars": len(p["abstract"]) if p.get("abstract") else 0,
        }

    def flush(self) -> Path:
        self.events["total_seconds"] = self._elapsed()
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        filename = (
            f"{self.started_at.strftime('%Y%m%d-%H%M%S')}-{self.run_id}.json"
        )
        path = LOG_DIR / filename
        path.write_text(json.dumps(self.events, indent=2, default=str))
        print(f"[pipeline] log written: {path}")
        return path
