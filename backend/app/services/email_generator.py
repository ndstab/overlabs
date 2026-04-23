import os
import re
import anthropic


PROMPT_TEMPLATE = """\
You are an expert at helping PhD and research applicants write highly personalized, \
technically specific cold emails to professors.

Your task: write a cold email from a student to a professor, seeking a research position \
(internship, RA, or PhD supervision depending on context from the CV).

---
STUDENT CV:
{cv_text}

---
ADDITIONAL CONTEXT FROM STUDENT:
{extra_context}

---
PROFESSOR:
Name: {professor_name}
University: {university}

PROFESSOR'S PAPERS (title, abstract, year, citation count):
{papers_formatted}

---
INSTRUCTIONS:
1. Extract the student's research identity from the CV: their specific technical skills, \
projects, methods used, domains of expertise, and any publications or notable work.

2. Identify the most compelling and specific overlaps between the student's background and \
the professor's research. These must be concrete — mention actual paper titles, methods, \
or concepts from the professor's work and connect them to specific things from the student's CV. \
Do not make vague or generic claims about shared interest.

3. Write a cold email with the following structure:
   - Opening: brief, direct, no fluff. State who you are in one sentence.
   - Background: 2–3 sentences on the most relevant parts of the student's experience.
   - Overlap: the heart of the email — 2–3 sentences drawing specific connections \
between the student's work and the professor's research. Name papers or concepts.
   - Ask: one clear sentence requesting to discuss research opportunities.
   - Sign-off: professional.

4. Email body should be 200–300 words. Concise enough to actually be read.

5. Tone: professional and genuine. Not sycophantic. No phrases like "I was deeply inspired by" \
or "your groundbreaking work". Let the specificity do the work.

6. Also write a subject line that is specific, not generic. Use the actual research topic. \
Format: "Research inquiry — [specific topic from their work]"

---
Return your response in exactly this format, with no extra commentary:

SUBJECT: <subject line here>

EMAIL:
<email body here>
"""


def _format_papers(papers: list[dict]) -> str:
    lines = []
    for i, p in enumerate(papers, 1):
        abstract_preview = p["abstract"][:300].strip()
        if len(p["abstract"]) > 300:
            abstract_preview += "..."
        lines.append(
            f"{i}. {p['title']} ({p['year']}, {p['citation_count']} citations)\n"
            f"   Abstract: {abstract_preview}"
        )
    return "\n\n".join(lines)


def _parse_response(text: str) -> tuple[str, str]:
    """
    Parses the model output into (subject_line, email_body).
    Expects the format:
        SUBJECT: <...>

        EMAIL:
        <...>
    """
    text = text.strip()

    subject_match = re.search(r"^SUBJECT:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    email_match = re.search(r"^EMAIL:\s*\n([\s\S]+)", text, re.MULTILINE | re.IGNORECASE)

    if not subject_match or not email_match:
        # Fallback: return raw text as body with a generic subject
        return "Research inquiry", text

    subject_line = subject_match.group(1).strip()
    email_body = email_match.group(1).strip()
    return subject_line, email_body


async def generate_email(
    cv_text: str,
    extra_context: str,
    professor_name: str,
    university: str,
    papers: list[dict],
) -> tuple[str, str]:
    """
    Calls Claude Sonnet with the full context and returns (subject_line, email_body).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")

    papers_formatted = _format_papers(papers) if papers else "No papers found."

    extra_context_text = extra_context.strip() if extra_context.strip() else "(none provided)"

    prompt = PROMPT_TEMPLATE.format(
        cv_text=cv_text.strip(),
        extra_context=extra_context_text,
        professor_name=professor_name.strip(),
        university=university.strip(),
        papers_formatted=papers_formatted,
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = message.content[0].text
    return _parse_response(raw_text)
