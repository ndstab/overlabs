# Overlabs — Cold Email Generator for Research Positions

## Project Overview

A web application that helps students write highly personalized cold emails to professors for research positions. The user uploads their CV, optionally adds context about their background, enters a professor's Semantic Scholar profile, and receives a tailored email that draws specific technical connections between their work and the professor's research.

## Core User Flow

1. User uploads CV as PDF → parsed client-side → raw text extracted in browser
2. User optionally adds free-text context (e.g., "I'm especially interested in their work on X", or background that isn't on the CV)
3. User enters professor's name, university, and Semantic Scholar profile URL or author ID
4. Backend fetches professor's papers from Semantic Scholar API
5. Backend sends CV text + extra context + paper data to Claude Sonnet
6. Claude extracts user's research identity, finds specific technical overlaps, generates a personalized email
7. Frontend displays the subject line and email body

No auth, no database, no payment — purely stateless for V1. Every request is a fresh round-trip.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| PDF Parsing | Client-side via `pdfjs-dist` (browser) |
| Paper Data | Semantic Scholar Academic Graph API |
| LLM | Claude Sonnet via Anthropic SDK (Python) |
| Deployment | TBD (V1 is local/dev only) |

## Folder Structure

```
overlabs/
├── CLAUDE.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── CVUpload.jsx          # PDF upload + client-side parsing
│       │   ├── ProfessorForm.jsx     # Professor name, university, S2 URL/ID
│       │   ├── ExtraContext.jsx      # Optional free-text background field
│       │   ├── EmailOutput.jsx       # Subject line + email body display
│       │   └── LoadingState.jsx      # Generation progress indicator
│       ├── hooks/
│       │   └── usePDFParser.js       # pdfjs-dist wrapper hook
│       └── utils/
│           └── api.js                # fetch calls to FastAPI backend
└── backend/
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py                   # FastAPI app entry point, CORS config
        ├── api/
        │   └── routes/
        │       └── generate.py       # POST /generate endpoint
        ├── services/
        │   ├── semantic_scholar.py   # Fetch + normalize professor papers
        │   └── email_generator.py    # Claude prompt construction + API call
        └── models/
            └── schemas.py            # Pydantic request/response models
```

## Architecture Decisions

### Why no RAG?
A professor typically has 20–100 papers. Titles + abstracts for 30 papers fit comfortably within Claude's 200k context window (~15–20k tokens). Claude performs the semantic matching inline — no embeddings, no vector DB, no chunking needed. RAG becomes relevant when scaling to thousands of documents.

### Paper fetching strategy
Fetch up to 30 papers per professor: 15 most cited + 15 most recent, deduplicated. This gives Claude a representative sample of both the professor's influential work and their current research direction.

### Client-side PDF parsing
CV PDFs are parsed in the browser using `pdfjs-dist`. The extracted plain text is sent to the backend. This avoids storing user files server-side, which is appropriate for a stateless V1. For V2+, move parsing server-side (pdfplumber or PyMuPDF) for better extraction quality.

### Single backend endpoint
`POST /generate` accepts: cv_text, extra_context (optional), professor_name, university, and semantic_scholar_id. Returns: subject_line, email_body. All logic — paper fetching + email generation — happens within this single request.

## Backend Services

### `semantic_scholar.py`
- Resolves author ID from a Semantic Scholar profile URL if a full URL is provided
- Fetches papers using the Semantic Scholar Academic Graph API (`/author/{id}/papers`)
- Retrieves fields: `title`, `abstract`, `year`, `citationCount`, `externalIds`
- Selects top 30 (15 by citation count + 15 by recency, deduplicated)
- Returns a normalized list of `{title, abstract, year, citation_count}`

### `email_generator.py`
- Constructs a structured prompt that includes:
  - The student's CV text and extra context
  - The professor's name, university, and curated paper list
  - Instructions for Claude to extract research identity, identify specific technical overlaps, and write a personalized email
- Makes a single Claude API call (no streaming for V1)
- Parses and returns `subject_line` and `email_body` from the response

## Prompt Design Principles

- Instruct Claude to reference **specific paper titles or concepts** from the professor's work — not generic praise
- Instruct Claude to connect the professor's work to **specific projects, skills, or experiences** from the CV
- Email tone: professional but genuine, not sycophantic
- Email length: 200–300 words for the body (concise enough to actually be read)
- Structure: brief intro → relevant background → specific technical overlap → the ask (research opportunity)
- Subject line: specific, not generic (e.g., "Research inquiry — [topic]" using actual topic from their work)

## API Reference

### `POST /generate`

**Request body:**
```json
{
  "cv_text": "string (extracted from PDF client-side)",
  "extra_context": "string (optional)",
  "professor_name": "string",
  "university": "string",
  "semantic_scholar_id": "string (author ID or full profile URL)"
}
```

**Response:**
```json
{
  "subject_line": "string",
  "email_body": "string"
}
```

**Error responses:**
- `404` — Author not found on Semantic Scholar
- `422` — Validation error (missing required fields)
- `502` — Upstream API failure (Semantic Scholar or Anthropic)

## Environment Variables

```
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
SEMANTIC_SCHOLAR_API_KEY=        # optional; unauthenticated requests are rate-limited to 100/5min
```

## Coding Conventions

### Python (Backend)
- Python 3.11+
- Type hints on all function signatures
- Pydantic v2 for request/response validation
- `httpx` for async HTTP calls (not `requests`)
- Services are plain async functions, not classes — keep it simple for V1
- Raise `HTTPException` at the route level; services raise plain `ValueError` or custom exceptions
- No global state; pass dependencies explicitly

### JavaScript (Frontend)
- Functional components only, hooks for state
- No default exports for components — use named exports
- Keep components focused: one responsibility per file
- `utils/api.js` is the only place that calls `fetch` — no fetch calls inside components
- Tailwind utility classes only — no custom CSS files unless unavoidable
- No UI component library for V1; build what's needed with Tailwind directly

### General
- No over-engineering: if a feature isn't in the V1 spec, don't build it
- No comments explaining *what* the code does — only *why* when non-obvious
- Keep the prompt template in `email_generator.py` as a clearly delimited string constant, easy to iterate on

## Known Limitations (V1)

- Client-side PDF parsing is lower quality than server-side; complex layouts or scanned PDFs may extract poorly
- Semantic Scholar coverage varies — some professors may have incomplete paper lists
- No caching: every generation re-fetches papers and re-calls Claude
- Rate limits: Semantic Scholar unauthenticated API allows ~100 requests/5 min; get an API key for production
- No user feedback loop — no way to regenerate with a different tone or re-run on the same professor without re-uploading

## Build Status

### V1 — Complete
All backend and frontend source files have been scaffolded and verified:

**Backend** (`/backend`)
- `app/main.py` — FastAPI app, CORS configured for `localhost:5173`
- `app/models/schemas.py` — Pydantic request/response models
- `app/api/routes/generate.py` — `POST /generate` endpoint
- `app/services/semantic_scholar.py` — Author ID resolution, paper fetching, top-30 selection
- `app/services/email_generator.py` — Claude Sonnet prompt + response parsing
- `venv/` — Python virtualenv with all dependencies installed
- `requirements.txt` — Pinned dependencies

**Frontend** (`/frontend`)
- `src/App.jsx` — Root component; manages all state and form submission
- `src/components/CVUpload.jsx` — Drag-and-drop PDF upload
- `src/components/ProfessorForm.jsx` — Professor name, university, S2 ID fields
- `src/components/ExtraContext.jsx` — Optional free-text context textarea
- `src/components/EmailOutput.jsx` — Subject + body display with copy button
- `src/components/LoadingState.jsx` — Generation spinner
- `src/hooks/usePDFParser.js` — Client-side pdfjs-dist wrapper
- `src/utils/api.js` — Single `generateEmail()` fetch function
- Tailwind CSS v3 configured, Vite proxy set up (`/api` → `localhost:8000`)

### How to run

**Backend:**
```bash
cd backend
source venv/bin/activate
cp .env.example .env          # then add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. API at `http://localhost:8000`.

---

## Future Work (Post-V1)

- Server-side PDF parsing for better CV extraction quality
- In-memory or Redis caching for professor paper lists
- "Explain overlaps" panel showing what specific connections were found before the email
- Regenerate with different tone/length options
- Auth + DB for saving drafts and previously researched professors
- Support for Google Scholar via a third-party API or official integration if available
