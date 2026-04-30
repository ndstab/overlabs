import json
import os
import re
from datetime import date
from typing import Any

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
You are writing a cold email from a student to a professor seeking a research opportunity. The point of the email is to land a real conversation by demonstrating, in 250-280 words, that the student has actually read the professor's work and has specific, credible reasons to want to work with them.

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

Subject line: concrete, no clichés. Format: "Research inquiry: <specific topic>" where the topic draws from BOTH the professor's research (a paper topic, method, or finding) AND the student's completed work. A subject that references only the student's future interests gives the professor no reason to open it. Keep it under 70 characters. Do not use em dashes in the subject.

Email body, in this order:

1. Salutation: "Dear Prof. {professor_last_name},"

2. One concrete intro sentence: current role/institution + the student's primary technical focus area. If the degree program is not in the professor's field, bridge it through named facts only — mention the specific minor or the project that demonstrates the focus. Do not write any sentence that observes, acknowledges, or comments on the degree mismatch; name the facts and let the reader draw the inference. If the degree is in-field, omit the bridge entirely.

3. The student-work paragraph. Maximum 70 words. 2-3 sentences. Include only the single most directly relevant project. Describe what it produced (a technique, a result, a finding), not effort or intent. When citing metrics, anchor them (e.g., "0.44 LPIPS (lower is better), outperforming the StyleGAN baseline"). Before writing: rank every project from the CV by direct relevance to THIS professor's papers. The one project that earns a sentence of the form "This connects to [Professor's Paper X] because both [shared method, task, or problem]" gets included. If none passes that test, pick the closest and note the shared problem framing only.

4. The overlap section. HARD LIMIT: 4-5 sentences TOTAL across both papers, maximum 110 words for the entire section. You MUST cite EXACTLY TWO of the professor's papers:
   - Paper A — methodological bridge: a named technique, formulation, or stated limitation in the paper that the student's prior technical work directly engages with at the mechanism level.
   - Paper B — domain bridge: a paper closer to the student's specific subject matter (same task type, dataset family, modality, or applied problem they have actually worked on).
   Sentence budget: 2 sentences per paper (1 naming the in-paper mechanism, 1 stating the mechanical connection to the student's work), plus at most 1 closing question sentence. That is 4-5 sentences total. Do not write a paragraph per paper; write 1-2 sentences per paper and no more.

5. Ask. The ask must take this form: a direct statement of what you want + one concrete follow-up question. Model: "I'd like to discuss [specific thing]. Would you have [time] for a call?" Do not soften or hedge: "I would welcome", "I'd love the opportunity", "I'm hoping to", "if you'd be open" are all forms of asking permission. State intent, then ask a yes/no question.

6. Sign-off: "Best regards," followed on the next line by the student's name (use the name from the CV; if no clear name, use "[Your name]").

CONSTRAINTS

- Length: 250-280 words for the body. HARD CAP 300. Each section has its own word budget: intro 1 sentence (~25 words), student work 2-3 sentences (~65 words), overlap 4-5 sentences (~100 words), ask 2 sentences (~30 words). If you are over 280 words, cut from the overlap section first — shorten each bridge to its single sharpest sentence and drop the rest. A professor stops reading at 300 words.
- Tone: professional, direct, genuine. Treat the professor as a peer in the field, not an idol.
- Forbidden phrases (do not use any variant): "deeply inspired", "groundbreaking work", "I was fascinated by", "I have always been passionate about", "your impressive research", "I am writing to express my interest in", "I would welcome the opportunity", "it would be an honor", "I would be grateful".
- Do not use em dashes (—) anywhere in the subject or body. Use commas, colons, periods, or parentheses instead. This applies to every sentence, including parenthetical asides and metric anchoring.
- Forbidden filler verbs in the overlap section: "maps onto", "aligns with", "connects to", "resonates with", "is directly relevant to", "is analogous to" — these are placeholder phrases used to skip explaining the mechanism. State the mechanism instead.
- Each cited paper's overlap must contain at least one detail that would be impossible to write without having read that specific paper.
- When surfacing an open research question or gap, frame it as something the student wants to investigate — "I want to understand whether X", "the open question I want to pursue is Y" — not as a distanced observation ("it is unclear whether", "there is an open question about"). Active framing signals a collaborator; distanced framing signals a literature reviewer.
- DO NOT invent paraphrased "named concepts" attributed to the professor's papers. If you write a phrase like "the paper's notion of X" or "their concept of X" or "their formulation of X", X must be EXACT terminology from the paper text. If you cannot find the exact terminology, drop the named-concept framing and describe the actual technique in your own words without attributing a label to the paper.
- When drawing a parallel between the student's work and the professor's, use this structure: "In [paper], [specific thing] happens because [mechanism]. In [student's work], [specific thing] happens because [mechanism]." This makes the parallel visible and testable. Never claim two problems are "exactly" or "precisely" the same — state how they are structurally related and where they diverge.
- Do not invent things about the student that are not in the CV or context. Do not invent things about the professor's papers.
- Student year of study: today's date is {today}. Standard program durations: BTech/BE = 4 years, MTech/ME/MS (coursework) = 2 years, MBA = 2 years, PhD = 5 years. If the CV states an expected graduation month and year, compute the student's current year of study using today's date and the program duration, and include it in the intro (e.g., "third-year BTech student"). If no graduation date appears in the CV or extra context, omit the year entirely — do not guess from course codes, project timelines, or any other signal.
- Do not conflate the student's stated future research interests with the technical scope of their existing projects. If the CV describes a project as image-based, do not call it video-based. If a project is on classification, do not call it generation. Stick strictly to the modality, task, and methods as written in the CV. Future interests stated in the extra context belong in the framing of the ask or in the bridge between past work and the professor's research, not in the description of completed work itself.
{writing_sample_clause}

OUTPUT FORMAT

Output STRICT JSON only. No prose, no markdown fences, no commentary outside the JSON. The schema is:

{{
  "subject_line": "<subject>",
  "paragraphs": [
    {{
      "text": "<paragraph text exactly as it should appear in the email>",
      "citations": [
        {{
          "phrase": "<exact substring of this paragraph's text>",
          "paper_index": <1-based index into PROFESSOR'S PAPERS>,
          "explanation": "<1-2 sentences: the specific in-paper detail this phrase draws from, and the mechanical bridge to the student's work>"
        }}
      ]
    }}
  ]
}}

Rules for "paragraphs":
- One entry per paragraph of the final email, in order. Include the salutation, intro, student-work paragraph, overlap paragraph(s), ask, and sign-off as separate entries.
- "text" must be the literal paragraph as it should be displayed. No leading/trailing whitespace.
- Use plain newlines (\\n) only inside the sign-off paragraph (between "Best regards," and the student's name). Otherwise no newlines inside "text".

Rules for "citations":
- Attach citations only to paragraphs that reference the professor's papers (typically the overlap paragraph(s)). Do NOT add citations to the salutation, intro, student-work paragraph (unless that paragraph itself names a professor's paper), the ask, or the sign-off.
- Across the two cited papers (one methodological, one domain), include 3 to 5 citations TOTAL — distributed across both, at least one citation per cited paper. Never fewer than 3, never more than 5. Do not pad the email body to fit more highlights; the word budget above is binding.
- Each citation should highlight either (i) the paper title when first introduced in the email, or (ii) a specific technical claim, term, method, dataset, finding, or stated limitation drawn from the paper. Do not highlight generic phrases ("related work", "this approach", "the model").
- "phrase" should be a concise, self-contained technical span: prefer 5-10 words when possible, and allow shorter spans only for named concepts (e.g., paper titles, method names, canonical terms). Never use a full clause or sentence. Highlight the smallest substring that still preserves the mechanism-level meaning. Examples of good phrases: "perceptual mode collapse", "temporal predictor across frames", "pixel-aligned conditional discriminator", "Weighted Dice Loss". Examples of bad phrases: a 20-word fragment of a sentence, any phrase that spans a comma, or generic fragments like "this approach". If a concept needs more than ~10 words, tighten to its core technical phrase.
- "phrase" MUST be a verbatim substring of the corresponding paragraph's "text" — character-for-character match, including capitalization and punctuation. If you cannot find a clean exact substring for a concept, omit that citation rather than invent one.
- Each "explanation" must be 1-2 sentences and DISTINCT from every other citation's explanation. Format: name the specific in-paper detail (technique name, finding, limitation, dataset choice, experimental result), then state the mechanical bridge to the student's prior work. Two highlights pointing at the same paper must surface different aspects of that paper — never reuse phrasing.
- "paper_index" is 1-based, indexing into the PROFESSOR'S PAPERS list above (i.e., the [Paper N] numbers).

Output JSON only. No leading text, no trailing text, no code fences.
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


def _extract_json_object(text: str) -> dict[str, Any]:
    """Extract the first balanced JSON object from a free-form Claude response."""
    text = text.strip()
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in generation response.")

    depth = 0
    in_string = False
    escape = False
    end = -1
    for i in range(start, len(text)):
        c = text[i]
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        raise ValueError("Unterminated JSON object in generation response.")

    return json.loads(text[start:end])


def _validate_and_clean(
    payload: dict[str, Any],
    papers: list[dict],
) -> tuple[str, list[dict]]:
    """Validate model output, drop hallucinated citations, return (subject, paragraphs)."""
    subject_line = (payload.get("subject_line") or "").strip() or "Research inquiry"
    raw_paragraphs = payload.get("paragraphs") or []
    if not isinstance(raw_paragraphs, list):
        raise ValueError("paragraphs is not a list.")

    cleaned: list[dict] = []
    for p in raw_paragraphs:
        if not isinstance(p, dict):
            continue
        text = (p.get("text") or "").strip()
        if not text:
            continue
        raw_citations = p.get("citations") or []
        citations: list[dict] = []
        if isinstance(raw_citations, list):
            for c in raw_citations:
                if not isinstance(c, dict):
                    continue
                phrase = (c.get("phrase") or "").strip()
                explanation = (c.get("explanation") or "").strip()
                paper_index = c.get("paper_index")
                if not phrase or not explanation:
                    continue
                if not isinstance(paper_index, int):
                    continue
                if not (1 <= paper_index <= len(papers)):
                    continue
                if phrase not in text:
                    # Hallucinated highlight — drop silently rather than break the UI.
                    continue
                paper = papers[paper_index - 1]
                citations.append(
                    {
                        "phrase": phrase,
                        "paper_index": paper_index,
                        "paper_title": paper.get("title") or "",
                        "paper_year": paper.get("year"),
                        "explanation": explanation,
                    }
                )
        cleaned.append({"text": text, "citations": citations})

    if not cleaned:
        raise ValueError("No valid paragraphs after cleaning.")

    return subject_line, cleaned


def _fallback_paragraphs_from_text(text: str) -> tuple[str, list[dict]]:
    """Last-ditch parser for when the model returns plain SUBJECT/EMAIL output."""
    text = text.strip()
    subject_match = re.search(r"^SUBJECT:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    email_match = re.search(r"^EMAIL:\s*\n([\s\S]+)", text, re.MULTILINE | re.IGNORECASE)

    if subject_match and email_match:
        subject = subject_match.group(1).strip()
        body = email_match.group(1).strip()
    else:
        subject = "Research inquiry"
        body = text

    paragraphs = [
        {"text": chunk.strip(), "citations": []}
        for chunk in re.split(r"\n{2,}", body)
        if chunk.strip()
    ]
    if not paragraphs:
        paragraphs = [{"text": body, "citations": []}]
    return subject, paragraphs


def _join_body(paragraphs: list[dict]) -> str:
    return "\n\n".join(p["text"] for p in paragraphs)


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
) -> tuple[str, str, list[dict]]:
    """
    Stage 2: generate the email using full paper content where available.
    Returns (subject_line, email_body, paragraphs) where paragraphs is a list of
    {text, citations} dicts. citations is a list of
    {phrase, paper_index, paper_title, paper_year, explanation}.
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
        today=date.today().strftime("%B %d, %Y"),
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)

    if logger is not None:
        logger.record("stage2_prompt", prompt)

    message = await client.messages.create(
        model=GENERATION_MODEL,
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    if logger is not None:
        logger.record("stage2_raw_response", raw)

    try:
        payload = _extract_json_object(raw)
        subject_line, paragraphs = _validate_and_clean(payload, papers)
        if logger is not None:
            logger.record("stage2_parse_mode", "json")
    except (json.JSONDecodeError, ValueError) as e:
        if logger is not None:
            logger.record("stage2_parse_error", str(e))
            logger.record("stage2_parse_mode", "fallback_plaintext")
        subject_line, paragraphs = _fallback_paragraphs_from_text(raw)

    email_body = _join_body(paragraphs)
    return subject_line, email_body, paragraphs
