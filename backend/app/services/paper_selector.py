import json
import os
import re

import anthropic


SELECTION_MODEL = "claude-sonnet-4-6"
DEFAULT_SELECTION_COUNT = 7

SELECTION_PROMPT = """\
You are picking which of a professor's papers will produce the strongest, most specific overlap in a cold email written by the student below.

STUDENT
{student_profile}

PROFESSOR'S PAPERS
{papers_block}

Pick exactly {n} papers (or fewer only if fewer than {n} have a real, defensible connection to the student). For each pick, the test is: would referencing this paper let the student write a sentence that only someone who actually read the paper could write — grounded in a specific method, finding, dataset, or limitation that connects to the student's documented work?

Tie-breaking rules:
- Prefer papers from the last 3 years over older ones, except for foundational/highly-cited work the student's background clearly engages with.
- Prefer papers with longer abstracts (more specific content to ground the email in).
- Prefer papers with an arxiv_id field (full text will be available).

Output ONLY a JSON array. No prose, no markdown, no explanation outside the JSON.
Format: [{{"index": <1-based int>, "reason": "<one sentence>"}}, ...]
"""


def _format_papers_for_selection(papers: list[dict]) -> str:
    lines = []
    for i, p in enumerate(papers, 1):
        has_arxiv = "yes" if p.get("arxiv_id") else "no"
        lines.append(
            f"[{i}] {p['title']} ({p.get('year') or 'n/a'}, {p['citation_count']} citations, arxiv: {has_arxiv})\n"
            f"    Abstract: {p['abstract']}"
        )
    return "\n\n".join(lines)


def _build_student_profile(
    cv_text: str,
    extra_context: str,
    student_papers: list[dict],
) -> str:
    sections = [f"CV:\n{cv_text.strip()}"]
    if extra_context.strip():
        sections.append(f"Additional context:\n{extra_context.strip()}")
    if student_papers:
        paper_lines = []
        for i, p in enumerate(student_papers, 1):
            paper_lines.append(
                f"  {i}. {p['title']} ({p.get('year') or 'n/a'})\n"
                f"     Abstract: {p['abstract']}"
            )
        sections.append("Student's own papers:\n" + "\n\n".join(paper_lines))
    return "\n\n".join(sections)


def _parse_selection_array(text: str) -> list[dict]:
    """
    Extract the first JSON array from text. The Claude response is prefilled with '['
    so we prepend it before parsing.
    """
    full = "[" + text
    start = full.find("[")
    if start == -1:
        raise ValueError("No JSON array found in selection response.")

    depth = 0
    end = -1
    for i in range(start, len(full)):
        c = full[i]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        raise ValueError("Unterminated JSON array in selection response.")

    return json.loads(full[start:end])


async def _call_selection_model(prompt: str, client: anthropic.AsyncAnthropic) -> str:
    message = await client.messages.create(
        model=SELECTION_MODEL,
        max_tokens=2000,
        messages=[
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": "["},
        ],
    )
    return message.content[0].text


async def select_relevant_papers(
    papers: list[dict],
    cv_text: str,
    extra_context: str,
    student_papers: list[dict],
    n: int = DEFAULT_SELECTION_COUNT,
) -> list[dict]:
    """
    Stage 1: ask Claude to pick the n most relevant papers from `papers`.
    Returns the selected papers (in selection order). Raises ValueError if the model
    response cannot be parsed after one retry; the caller is responsible for falling back.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")

    if len(papers) <= n:
        return papers

    prompt = SELECTION_PROMPT.format(
        student_profile=_build_student_profile(cv_text, extra_context, student_papers),
        papers_block=_format_papers_for_selection(papers),
        n=n,
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)

    last_error: Exception | None = None
    for _ in range(2):
        try:
            raw = await _call_selection_model(prompt, client)
            selections = _parse_selection_array(raw)
            picked: list[dict] = []
            seen_indices: set[int] = set()
            for sel in selections:
                idx = sel.get("index") if isinstance(sel, dict) else None
                if isinstance(idx, int) and 1 <= idx <= len(papers) and idx not in seen_indices:
                    seen_indices.add(idx)
                    picked.append(papers[idx - 1])
                if len(picked) >= n:
                    break
            if picked:
                return picked
            last_error = ValueError("Selection returned no valid paper indices.")
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e

    raise ValueError(f"Stage 1 selection failed: {last_error}")
