import re
import httpx
from typing import Optional


SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"

PAPER_FIELDS = "title,abstract,year,citationCount,externalIds"

PROFESSOR_PAPER_LIMIT = 50
PROFESSOR_FETCH_POOL = 200
STUDENT_FETCH_POOL = 50


def extract_author_id(raw: str) -> str:
    """
    Accepts either a bare numeric author ID or a full Semantic Scholar profile URL.
    e.g. "https://www.semanticscholar.org/author/Jane-Doe/1234567" -> "1234567"
    """
    raw = raw.strip()
    match = re.search(r"/(\d+)/?$", raw)
    if match:
        return match.group(1)
    if re.match(r"^[0-9]+$", raw):
        return raw
    raise ValueError(
        f"Could not parse a Semantic Scholar author ID from: '{raw}'. "
        "Provide either a numeric author ID or a full profile URL."
    )


def _normalize_paper(p: dict) -> dict:
    external_ids = p.get("externalIds") or {}
    return {
        "title": p.get("title") or "",
        "abstract": (p.get("abstract") or "").strip(),
        "year": p.get("year"),
        "citation_count": p.get("citationCount") or 0,
        "arxiv_id": external_ids.get("ArXiv"),
    }


async def _fetch_author_papers(
    author_id: str,
    pool_limit: int,
    api_key: Optional[str],
) -> list[dict]:
    headers = {"x-api-key": api_key} if api_key else {}
    url = f"{SEMANTIC_SCHOLAR_BASE}/author/{author_id}/papers"
    params = {"fields": PAPER_FIELDS, "limit": pool_limit}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, params=params, headers=headers)

    if response.status_code == 404:
        raise ValueError(f"Author ID '{author_id}' not found on Semantic Scholar.")
    if response.status_code != 200:
        raise RuntimeError(
            f"Semantic Scholar API returned {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    raw_papers: list[dict] = data.get("data", [])
    normalized = [_normalize_paper(p) for p in raw_papers if p.get("title")]
    return [p for p in normalized if p["abstract"]]


async def fetch_professor_papers(
    author_id: str,
    api_key: Optional[str] = None,
) -> list[dict]:
    """
    Fetch up to PROFESSOR_PAPER_LIMIT papers for a Semantic Scholar author.
    Selects half by citation count, half by recency, deduplicated by title.
    """
    papers = await _fetch_author_papers(author_id, PROFESSOR_FETCH_POOL, api_key)

    half = PROFESSOR_PAPER_LIMIT // 2
    by_citations = sorted(papers, key=lambda p: p["citation_count"], reverse=True)[:half]
    by_recency = sorted(
        [p for p in papers if p["year"] is not None],
        key=lambda p: p["year"],
        reverse=True,
    )[:half]

    seen: set[str] = set()
    merged: list[dict] = []
    for paper in by_citations + by_recency:
        key = paper["title"].lower().strip()
        if key not in seen:
            seen.add(key)
            merged.append(paper)
        if len(merged) >= PROFESSOR_PAPER_LIMIT:
            break

    return merged


async def fetch_student_papers(
    author_id: str,
    api_key: Optional[str] = None,
) -> list[dict]:
    """
    Fetch all of a student's papers. Students typically have <10 papers,
    so no top-N selection is applied.
    """
    return await _fetch_author_papers(author_id, STUDENT_FETCH_POOL, api_key)
