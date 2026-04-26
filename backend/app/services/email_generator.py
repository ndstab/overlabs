import os
import re

import anthropic


GENERATION_MODEL = "claude-sonnet-4-6"


PURPOSE_INSTRUCTIONS: dict[str, str] = {
    "phd": (
        "Ask whether the professor is taking PhD students for the upcoming application "
        "cycle and request a brief conversation about potential fit."
    ),
    "internship": (
        "Ask about the possibility of a research internship (mention the timeframe if it "
        "appears in the CV or context; otherwise leave it general)."
    ),
    "ra": (
        "Ask about RA openings (paid or for credit) in the lab and offer to share more "
        "about the student's background if helpful."
    ),
    "visiting": (
        "Ask about the possibility of a short visiting researcher engagement or "
        "collaboration."
    ),
    "general": (
        "Ask for a brief conversation about potential research collaboration or "
        "opportunities in the lab."
    ),
}


PROMPT_TEMPLATE = """\
You are writing a cold email from a student to a professor seeking a research opportunity. The point of the email is to land a real conversation by demonstrating, in 200-300 words, that the student has actually read the professor's work and has specific, credible reasons to want to work with them.

STUDENT
CV:
{cv_text}
{extra_context_section}{student_papers_section}

PROFESSOR
Name: {professor_name}
University: {university}

PROFESSOR'S PAPERS
Each paper below includes either full text (when an arXiv version exists) or the abstract. Treat each paper as a primary source. Reference specific concepts, methods, datasets, or stated limitations from the actual paper content.

{papers_block}

WHAT TO WRITE

Subject line: concrete, no clichés. Format: "Research inquiry — <specific topic>" using a real concept from one of the professor's papers that connects to the student's work.

Email body, in this order:

1. Salutation: "Dear Prof. {professor_last_name},"

2. One concrete intro sentence: current role/institution + the student's primary technical focus area. If the CV's degree program is NOT in the professor's research area (e.g., a Civil Engineering student emailing a Computer Vision lab), include a brief honest bridge in the same sentence — name how they got into the field (a minor, a recent project pivot, ML coursework). Don't apologize for the background; just preempt the question. If the degree IS in-field, omit this clause.

3. 2-3 sentences on the student's most relevant work, pulled from the CV{student_papers_phrase}. Pick ONLY items that connect to the professor's research area. If the CV mentions unrelated experience (e.g., LLM agents in an email to a 3D vision lab), do NOT include it — it dilutes the signal. When citing metrics, anchor them: name the baseline or direction (e.g., "0.44 LPIPS — lower is better — outperforming the StyleGAN baseline").

4. The overlap section, 3-5 sentences. You MUST cite EXACTLY TWO of the professor's papers explicitly, chosen to cover DISTINCT connection types:
   - Paper A — methodological bridge: a named technique, formulation, or stated limitation in the paper that the student's prior technical work directly engages with at the mechanism level.
   - Paper B — domain bridge: a paper closer to the student's specific subject matter (same task type, dataset family, modality, or applied problem they have actually worked on). This is often the less-obvious pick and is where the email gets its credibility.
   For EACH of the two papers, you must (a) name a concrete detail from the paper — a method name, a specific result, a stated failure mode, a dataset choice, an experimental finding — and (b) state in mechanical terms how a specific technique or result from the student's own completed work addresses, extends, contrasts with, or is constrained by that detail.

5. One direct ask sentence: {purpose_instruction} Use direct phrasing ("I'd like to discuss…", "Could we set up a short call…"). Do not use conditional/passive forms like "I would welcome the opportunity".

6. Sign-off: "Best regards," followed on the next line by the student's name (use the name from the CV; if no clear name, use "[Your name]").

CONSTRAINTS

- Length: 240-320 words for the body. Tight. No filler.
- Tone: professional, direct, genuine. Treat the professor as a peer in the field, not an idol.
- Forbidden phrases (do not use any variant): "deeply inspired", "groundbreaking work", "I was fascinated by", "I have always been passionate about", "your impressive research", "I am writing to express my interest in", "I would welcome the opportunity", "it would be an honor", "I would be grateful".
- Forbidden filler verbs in the overlap section: "maps onto", "aligns with", "connects to", "resonates with", "is directly relevant to", "is analogous to" — these are placeholder phrases used to skip explaining the mechanism. State the mechanism instead.
- Each cited paper's overlap must contain at least one detail that would be impossible to write without having read that specific paper.
- DO NOT invent paraphrased "named concepts" attributed to the professor's papers. If you write a phrase like "the paper's notion of X" or "their concept of X" or "their formulation of X", X must be EXACT terminology from the paper text. If you cannot find the exact terminology, drop the named-concept framing and describe the actual technique in your own words without attributing a label to the paper.
- DO NOT claim equivalence between two different failure modes if the underlying mechanisms differ. An analogy must hold at the mechanism level, not just at the surface description. If the analogy doesn't hold mechanically, drop it and describe a contrast or a question instead.
- Do not invent things about the student that are not in the CV or context. Do not invent things about the professor's papers.
- Do not conflate the student's stated future research interests with the technical scope of their existing projects. If the CV describes a project as image-based, do not call it video-based. If a project is on classification, do not call it generation. Stick strictly to the modality, task, and methods as written in the CV. Future interests stated in the extra context belong in the framing of the ask or in the bridge between past work and the professor's research, not in the description of completed work itself.
{writing_sample_clause}

OUTPUT FORMAT (exact, no markdown, no extra commentary)

SUBJECT: <subject line>

EMAIL:
<email body>
"""


def _format_papers_for_generation(papers: list[dict]) -> str:
    lines = []
    for i, p in enumerate(papers, 1):
        header = (
            f"[Paper {i}] {p['title']} ({p.get('year') or 'n/a'}, "
            f"{p['citation_count']} citations)"
        )
        body = p.get("full_text") or p["abstract"]
        source = "FULL TEXT" if p.get("full_text") else "ABSTRACT ONLY"
        lines.append(f"{header}\n[{source}]\n{body.strip()}")
    return "\n\n---\n\n".join(lines)


def _format_student_papers(papers: list[dict]) -> str:
    if not papers:
        return ""
    lines = ["\n\nSTUDENT'S OWN PAPERS"]
    for i, p in enumerate(papers, 1):
        body = p.get("full_text") or p["abstract"]
        source = "FULL TEXT" if p.get("full_text") else "ABSTRACT"
        lines.append(
            f"[Student Paper {i}] {p['title']} ({p.get('year') or 'n/a'})\n"
            f"[{source}]\n{body.strip()}"
        )
    return "\n\n".join(lines)


def _last_name(full_name: str) -> str:
    parts = full_name.strip().split()
    return parts[-1] if parts else full_name.strip()


def _parse_response(text: str) -> tuple[str, str]:
    text = text.strip()
    subject_match = re.search(r"^SUBJECT:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    email_match = re.search(r"^EMAIL:\s*\n([\s\S]+)", text, re.MULTILINE | re.IGNORECASE)

    if not subject_match or not email_match:
        return "Research inquiry", text

    return subject_match.group(1).strip(), email_match.group(1).strip()


async def generate_email(
    cv_text: str,
    extra_context: str,
    professor_name: str,
    university: str,
    papers: list[dict],
    purpose: str,
    student_papers: list[dict],
    writing_sample: str | None,
    logger=None,
) -> tuple[str, str]:
    """
    Stage 2: generate the email using full paper content where available.
    Returns (subject_line, email_body).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")

    extra_context_section = ""
    if extra_context.strip():
        extra_context_section = (
            f"\n\nAdditional context from the student:\n{extra_context.strip()}"
        )

    student_papers_section = _format_student_papers(student_papers)
    student_papers_phrase = (
        " and the student's own papers above"
        if student_papers
        else ""
    )

    purpose_instruction = PURPOSE_INSTRUCTIONS.get(
        purpose.strip().lower(),
        PURPOSE_INSTRUCTIONS["general"],
    )

    writing_sample_clause = ""
    sample = (writing_sample or "").strip()
    if sample:
        writing_sample_clause = (
            "- Match the cadence and formality of this writing sample without copying any phrasing from it:\n"
            f'  """\n  {sample}\n  """'
        )

    papers_block = (
        _format_papers_for_generation(papers)
        if papers
        else "No papers available."
    )

    prompt = PROMPT_TEMPLATE.format(
        cv_text=cv_text.strip(),
        extra_context_section=extra_context_section,
        student_papers_section=student_papers_section,
        professor_name=professor_name.strip(),
        professor_last_name=_last_name(professor_name),
        university=university.strip(),
        papers_block=papers_block,
        student_papers_phrase=student_papers_phrase,
        purpose_instruction=purpose_instruction,
        writing_sample_clause=writing_sample_clause,
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)

    if logger is not None:
        logger.record("stage2_prompt", prompt)

    message = await client.messages.create(
        model=GENERATION_MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    if logger is not None:
        logger.record("stage2_raw_response", raw)

    return _parse_response(raw)
