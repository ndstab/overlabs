import asyncio
import logging
import re
from typing import Optional

import httpx
import pymupdf

logging.getLogger("pymupdf").setLevel(logging.ERROR)

ARXIV_PDF_URL = "https://arxiv.org/pdf/{arxiv_id}"

# Keep the most informative portion of each paper's full text.
# ~12 000 chars ≈ 3 000 tokens — covers intro, methods, results, discussion for
# most CS/ML papers after references are stripped.
MAX_FULL_TEXT_CHARS = 12_000

REFERENCES_HEADER = re.compile(
    r"\n\s*(references|bibliography)\s*\n",
    re.IGNORECASE,
)
ACKNOWLEDGEMENTS_HEADER = re.compile(
    r"\n\s*acknowledg(?:e?ments?|ments?)\s*\n",
    re.IGNORECASE,
)
FIGURE_LINE = re.compile(r"^\s*(figure|fig\.?)\s+\d+", re.IGNORECASE)
WHITESPACE_RUN = re.compile(r"\n{3,}")


def _normalize_arxiv_id(arxiv_id: str) -> str:
    return re.sub(r"v\d+$", "", arxiv_id.strip())


def _strip_section_after(text: str, pattern: re.Pattern) -> str:
    """Cuts text at the latest match of pattern (so we don't accidentally cut at an in-text mention)."""
    matches = list(pattern.finditer(text))
    if not matches:
        return text
    return text[: matches[-1].start()]


def _clean_paper_text(text: str) -> str:
    text = _strip_section_after(text, REFERENCES_HEADER)
    text = _strip_section_after(text, ACKNOWLEDGEMENTS_HEADER)

    cleaned_lines = [
        line for line in text.split("\n") if not FIGURE_LINE.match(line)
    ]
    text = "\n".join(cleaned_lines)
    text = WHITESPACE_RUN.sub("\n\n", text)
    text = text.strip()
    if len(text) > MAX_FULL_TEXT_CHARS:
        text = text[:MAX_FULL_TEXT_CHARS]
        # Trim to last complete sentence so the cut is clean.
        last_period = text.rfind(". ")
        if last_period > MAX_FULL_TEXT_CHARS * 0.8:
            text = text[: last_period + 1]
        text += "\n\n[truncated]"
    return text


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    try:
        pages = [page.get_text() for page in doc]
    finally:
        doc.close()
    return "\n".join(pages)


async def fetch_full_text(
    arxiv_id: str,
    client: httpx.AsyncClient,
) -> Optional[str]:
    """Fetch arXiv PDF and return cleaned text. Returns None on any failure."""
    try:
        url = ARXIV_PDF_URL.format(arxiv_id=_normalize_arxiv_id(arxiv_id))
        response = await client.get(url, timeout=20.0, follow_redirects=True)
        if response.status_code != 200:
            return None
        if not response.content:
            return None
        text = _extract_pdf_text(response.content)
        return _clean_paper_text(text) or None
    except Exception:
        return None


async def fetch_papers_full_text(papers: list[dict]) -> list[dict]:
    """
    For each paper, fetch full text from arXiv when an arxiv_id is present.
    Returns the same papers with an added 'full_text' field (None when unavailable).
    All fetches run in parallel.
    """
    if not papers:
        return []

    async with httpx.AsyncClient() as client:
        async def fetch_one(paper: dict) -> Optional[str]:
            arxiv_id = paper.get("arxiv_id")
            if not arxiv_id:
                return None
            return await fetch_full_text(arxiv_id, client)

        results = await asyncio.gather(*[fetch_one(p) for p in papers])

    return [{**paper, "full_text": text} for paper, text in zip(papers, results)]
