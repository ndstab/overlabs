import re
import httpx
from typing import Optional


SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"

PAPER_FIELDS = "title,abstract,year,citationCount,externalIds"


def extract_author_id(raw: str) -> str:
    """
    Accepts either a bare numeric author ID or a full Semantic Scholar profile URL.
    e.g. "https://www.semanticscholar.org/author/Jane-Doe/1234567" → "1234567"
    """
    raw = raw.strip()
    # Try to extract a numeric ID from a URL
    match = re.search(r"/(\d+)/?$", raw)
    if match:
        return match.group(1)
    # If it's already a bare ID (all digits or alphanumeric S2 IDs)
    if re.match(r"^[0-9]+$", raw):
        return raw
    raise ValueError(
        f"Could not parse a Semantic Scholar author ID from: '{raw}'. "
        "Provide either a numeric author ID or a full profile URL."
    )


async def fetch_professor_papers(
    author_id: str,
    api_key: Optional[str] = None,
) -> list[dict]:
    """
    Fetch up to 30 papers for a given Semantic Scholar author ID.
    Returns 15 most cited + 15 most recent, deduplicated.
    Each paper: {title, abstract, year, citation_count}
    """
    headers = {}
    if api_key:
        headers["x-api-key"] = api_key

    url = f"{SEMANTIC_SCHOLAR_BASE}/author/{author_id}/papers"
    params = {
        "fields": PAPER_FIELDS,
        "limit": 100,  # fetch a larger pool to select from
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, params=params, headers=headers)

    print(f"[DEBUG] S2 request url: {response.url}")
    print(f"[DEBUG] S2 request headers sent: {headers}")
    print(f"[DEBUG] S2 response status: {response.status_code}")
    print(f"[DEBUG] S2 response body: {response.text[:200]}")

    if response.status_code == 404:
        raise ValueError(f"Author ID '{author_id}' not found on Semantic Scholar.")
    if response.status_code != 200:
        raise RuntimeError(
            f"Semantic Scholar API returned {response.status_code}: {response.text}"
        )

    data = response.json()
    papers: list[dict] = data.get("data", [])

    # Normalize
    normalized = [
        {
            "title": p.get("title") or "",
            "abstract": p.get("abstract") or "",
            "year": p.get("year"),
            "citation_count": p.get("citationCount", 0),
        }
        for p in papers
        if p.get("title")  # skip papers with no title
    ]

    # Filter out papers with no abstract (not useful for overlap detection)
    with_abstract = [p for p in normalized if p["abstract"].strip()]

    # 15 most cited
    by_citations = sorted(with_abstract, key=lambda p: p["citation_count"], reverse=True)
    top_cited = by_citations[:15]

    # 15 most recent
    by_recency = sorted(
        [p for p in with_abstract if p["year"] is not None],
        key=lambda p: p["year"],
        reverse=True,
    )
    top_recent = by_recency[:15]

    # Deduplicate by title
    seen_titles: set[str] = set()
    merged: list[dict] = []
    for paper in top_cited + top_recent:
        key = paper["title"].lower().strip()
        if key not in seen_titles:
            seen_titles.add(key)
            merged.append(paper)

    return merged
