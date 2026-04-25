# Overlabs — Two-Stage Deep Matching Pipeline: Low Level Design

**Date:** 2026-04-23
**Status:** Approved for implementation
**Scope:** Backend pipeline upgrade + frontend input expansion

---

## Problem Statement

The current V1 pipeline sends 30 paper abstracts truncated to 300 characters into a single Claude call. This produces surface-level matching ("both interested in NLP") rather than the specific, paper-grounded connections that make a cold email read as genuinely human ("your 2023 paper mentioned limitation X — I addressed this directly in my work by...").

The goal is a pipeline where Claude reads full paper content — both the professor's and, when available, the student's — and generates emails grounded in actual technical substance.

---

## Architecture: Two-Stage LLM Pipeline

```
[Student Inputs]          [Professor Inputs]
CV (PDF text)             S2 Profile ID
Extra context             Professor Name
Purpose of email          University
Writing sample (opt)
Student S2 ID (opt)
        │                        │
        └──────────┬─────────────┘
                   ▼
        ┌─────────────────────┐
        │  Semantic Scholar   │
        │  Fetch up to 50     │
        │  professor papers   │
        │  (title, abstract,  │
        │  year, citations,   │
        │  externalIds)       │
        └──────────┬──────────┘
                   │
        [If student S2 ID provided]
                   │
        ┌──────────▼──────────┐
        │  Fetch student      │
        │  papers (S2 API)    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   STAGE 1           │
        │   LLM Selection     │
        │                     │
        │   Input:            │
        │   - All 50 abstracts│
        │   - Student profile │
        │     (CV + context + │
        │     student papers) │
        │                     │
        │   Output:           │
        │   - 6-7 paper IDs   │
        │   - Reason per pick │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Full Text Fetch    │
        │  (parallel, async)  │
        │                     │
        │  Has arXiv ID →     │
        │    fetch PDF,       │
        │    parse + clean    │
        │  No arXiv ID →      │
        │    use full abstract│
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   STAGE 2           │
        │   LLM Email Gen     │
        │                     │
        │   Input:            │
        │   - 6-7 full papers │
        │   - Student papers  │
        │     (if available)  │
        │   - CV + context    │
        │   - Purpose of email│
        │   - Writing sample  │
        │                     │
        │   Output:           │
        │   - Subject line    │
        │   - Email body      │
        └─────────────────────┘
```

---

## Why No RAG

RAG solves the problem of retrieving from thousands of documents that don't fit in context. This pipeline has 50 paper abstracts — roughly 12,000 tokens — which fits trivially in a single LLM call. Building a vector DB, embedding pipeline, and similarity search for 50 documents adds infrastructure complexity with no accuracy benefit. Stage 1 uses an LLM call instead, which reasons about semantic relevance rather than vector distance. An LLM can detect that a student's limitation matches a professor's future work; cosine similarity cannot.

---

## Token Budget

| Component | Tokens (approx) |
|---|---|
| Stage 1 input (50 abstracts + student profile) | 12,000–15,000 |
| Stage 1 output | ~500 |
| Stage 2: 7 full papers (cleaned) | 42,000–56,000 |
| Stage 2: Student papers (2-3, if provided) | 12,000–20,000 |
| Stage 2: CV + context + prompt | 4,000–6,000 |
| **Stage 2 total input** | **~60,000–82,000** |

All within Claude's 200k context window. Cost at Claude Sonnet pricing: **~$0.20–0.30 per generation** (input only; output is ~600 tokens).

---

## Latency Profile

| Step | Duration | Parallelism |
|---|---|---|
| S2 fetch (professor papers) | 1–2s | — |
| S2 fetch (student papers, if any) | 1–2s | Parallel with professor fetch |
| Stage 1 LLM call | 4–7s | — |
| PDF fetches for 7 papers | 4–9s | Fully parallel (asyncio.gather) |
| PDF parsing + text cleanup | 1–2s | — |
| Stage 2 LLM call | 15–25s | — |
| **Total** | **~25–45s** | — |

UX must communicate pipeline progress with descriptive loading states (see Frontend section).

---

## Paper Selection Strategy (Stage 1)

Fetch up to 50 papers from Semantic Scholar. No hard year filter — Stage 1 instructs the LLM to balance recency (current research direction) with impact (foundational work). The Stage 1 prompt instructs Claude to:

- Select 6–7 papers that maximize **bilateral relevance**: papers where the professor's specific methods, findings, or stated limitations connect to the student's documented work
- Weight recent papers (last 3 years) slightly higher to reflect the professor's active direction
- Return selections with a one-sentence justification per paper (used internally for debugging; not shown to user)
- Prefer papers with full text available (arXiv) over abstract-only papers, all else equal

---

## Full Paper Text Acquisition

Semantic Scholar's `externalIds` field includes an `ArXiv` key when a paper has an arXiv preprint. For CS/ML: approximately 75–80% of papers have this.

```
Paper has externalIds.ArXiv → fetch https://arxiv.org/pdf/{arxiv_id} → parse → clean
Paper has no ArXiv ID       → use full abstract (not truncated)
```

**PDF text cleanup** (applied before sending to Stage 2):
- Strip the references/bibliography section (detect by "References\n" or "Bibliography\n" header near end of document)
- Strip acknowledgements section
- Strip figure captions (heuristic: lines beginning with "Figure X" or "Fig. X")
- Strip running headers/footers (short repeated lines at page boundaries)
- Keep: abstract, introduction, related work, methodology, experiments, discussion, limitations, conclusion

Expected token reduction after cleanup: 15–25% per paper.

---

## Input Fields

### Required
| Field | Type | Notes |
|---|---|---|
| CV (PDF) | File upload | Parsed client-side with pdfjs-dist, text sent to backend |
| Professor name | Text | Used in prompt and email salutation |
| University | Text | Used in prompt |
| Professor S2 ID | Text | Accepts bare numeric ID or full profile URL |
| Purpose of email | Dropdown | See values below |

**Purpose dropdown values:**
- `phd` — PhD supervision
- `internship` — Research internship (summer or semester)
- `ra` — Research assistant position
- `visiting` — Visiting researcher / collaboration
- `general` — General research inquiry

### Optional
| Field | Type | Notes |
|---|---|---|
| Additional context | Textarea | Free-text: interests, unpublished work, anything not in CV |
| Student S2 ID | Text | Unlocks student paper fetching; accepts URL or bare ID |
| Writing sample | Textarea | 2–3 sentences from anything the student has written; used for voice matching |

UI note: Student S2 ID and writing sample should be grouped under a collapsible "Improve personalization" section to avoid overwhelming first-time users.

---

## Backend: New and Modified Files

### New files

**`app/services/paper_fetcher.py`**
- `async fetch_full_text(arxiv_id: str) -> str | None` — fetches PDF from arXiv, parses with PyMuPDF, applies text cleanup, returns plain text. Returns `None` on fetch failure.
- `async fetch_papers_full_text(papers: list[dict]) -> list[dict]` — takes normalized paper list from S2, fetches full text for each in parallel via `asyncio.gather`, merges full text back into paper dicts. Falls back to full abstract for papers without arXiv IDs or where fetch fails.

**`app/services/paper_selector.py`**
- `async select_relevant_papers(papers: list[dict], student_profile: str, n: int = 7) -> list[dict]` — Stage 1 LLM call. Constructs prompt with all abstracts + student profile, calls Claude, parses selected paper indices, returns subset of the paper list. Raises `ValueError` if Claude returns unparse-able output.

### Modified files

**`app/services/semantic_scholar.py`**
- Increase fetch limit from 100 to 200, select top 50 (was 30) with the same citation+recency strategy but expanded pool
- Add `ArXiv` to extracted fields from `externalIds`
- Export `fetch_professor_papers` unchanged signature; add `fetch_student_papers(author_id: str) -> list[dict]` — fetches all of the student's papers (no top-N selection; students typically have fewer than 10 papers, so the full set is always used). Same normalization and abstract filtering as professor papers.

**`app/services/email_generator.py`**
- `generate_email` gains two new parameters: `purpose: str`, `writing_sample: str | None`
- `student_papers: list[dict]` parameter added (empty list if student S2 ID not provided)
- Prompt updated to: (1) include student papers section when present, (2) tailor the ask based on `purpose`, (3) match writing style from `writing_sample` when present
- Abstract truncation removed — full abstract used for fallback papers (those without fetched full text)

**`app/models/schemas.py`**
- `GenerateRequest` gains: `student_s2_id: str | None`, `purpose: str`, `writing_sample: str | None`

**`app/api/routes/generate.py`**
- Orchestrates the two-stage pipeline:
  1. Fetch professor papers (S2)
  2. Fetch student papers (S2, if `student_s2_id` provided) — concurrent with step 1
  3. Stage 1: select 6–7 relevant professor papers
  4. Fetch full text for selected papers (parallel)
  5. Stage 2: generate email
- Raises `HTTPException(404)` if professor or student S2 ID not found
- Raises `HTTPException(502)` on S2 API or Anthropic API failure

---

## Frontend: New and Modified Components

### Modified components

**`ProfessorForm.jsx`** — no changes needed; professor S2 ID field already exists

**`App.jsx`** — state additions:
- `purpose` (string, default `"general"`)
- `studentS2Id` (string, default `""`)
- `writingSample` (string, default `""`)
- These are passed to `generateEmail()` in `utils/api.js`

**`LoadingState.jsx`** — replace generic spinner with sequential descriptive states:
1. "Fetching professor's papers..."
2. "Selecting most relevant papers..."
3. "Reading full papers..."
4. "Finding overlaps and generating email..."

Driven by a timer approximation (since the backend is not streaming stage progress). Switch states at: 2s, 8s, 16s after submit.

**`utils/api.js`** — add `student_s2_id`, `purpose`, `writing_sample` to the fetch payload

### New components

**`PurposeDropdown.jsx`** — controlled select with the five purpose values. Label: "What are you reaching out for?"

**`PersonalizationPanel.jsx`** — collapsible section containing:
- Student S2 ID field (label: "Your Semantic Scholar profile (optional — for students with publications)")
- Writing sample textarea (label: "Paste 2–3 sentences from something you've written (optional — for voice matching)", max ~500 chars)

---

## Error Handling

| Failure | Behaviour |
|---|---|
| Professor S2 ID not found | `404` from route; frontend shows "Professor not found on Semantic Scholar" |
| Student S2 ID not found | `404` from route; frontend shows "Student profile not found — leave the field blank to continue without it" |
| arXiv PDF fetch fails for a paper | Silently fall back to full abstract for that paper; generation continues |
| All 7 selected papers fail PDF fetch | Continue with full abstracts; no error shown to user |
| Stage 1 LLM returns unparseable output | Retry once; if still fails, fall back to top-7 by citation+recency (same as V1 logic) |
| Stage 2 LLM fails | `502` from route; frontend shows generic error |
| S2 API rate limit (429) | `502` from route with message "Semantic Scholar rate limit hit — try again in a moment" |

---

## Prompt Design Notes

### Stage 1 prompt structure
```
You are selecting the most relevant papers for a research email.

STUDENT PROFILE:
{cv_text}
{extra_context}
{student_papers_section — omitted if no student S2 ID}

PROFESSOR PAPERS (abstracts only):
{all 50 papers, numbered, with title / year / citations / full abstract}

Select the 6-7 papers that would generate the most specific and credible
overlap in a cold email. Prioritize papers where the professor's specific
methods, limitations, or stated future work connect to the student's
documented experience. Balance recency with impact.

Return ONLY a JSON array of paper indices (1-based) with one-sentence
justifications, e.g.:
[{"index": 3, "reason": "..."},  ...]
```

### Stage 2 prompt additions over V1
- Student papers section (when provided): same format as professor papers but labeled "STUDENT'S OWN PAPERS"
- Purpose-aware ask: separate instruction per purpose value spelling out what the closing ask should request
- Writing sample instruction: "Match the voice and sentence rhythm of this writing sample: {sample}. Do not copy it; just use it to calibrate formality and cadence."

---

## What Does Not Change

- Client-side PDF parsing for the student's CV (`pdfjs-dist`)
- Single `POST /generate` endpoint
- Response schema (`subject_line`, `email_body`)
- No auth, no database, no caching
- Vite proxy for local dev

---

## Open Questions (Post-V1)

- Should Stage 1 selection reason be surfaced to the user ("We focused on these papers because...") as an "explain overlaps" panel?
- Should writing sample field accept a PDF (e.g. the student's own paper) instead of pasted text?
- Streaming Stage 2 output for faster perceived response time
