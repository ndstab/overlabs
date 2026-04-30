# Overlabs

**Cold emails professors actually read.**

Overlabs helps students turn scattered CV details into a high-signal research email grounded in a professor's real papers, not generic flattery.  
The product extracts your technical profile, maps it against a professor's published work, and generates a concise outreach email with specific, defensible overlap.

---

## Why Overlabs

Most research cold emails fail for one reason: they are vague.

What usually gets ignored:
- generic praise
- no paper-level specificity
- no credible technical bridge

What gets responses:
- references to concrete paper mechanisms
- clear overlap with the student's prior work
- a direct ask with a focused next step

Overlabs automates the expensive part: reading papers, finding real overlap, and drafting an email that sounds like a future collaborator.

---

## Product Versions

### V1 - Personalized Cold Email Generation
- CV upload + extraction
- Professor lookup via Semantic Scholar
- Two-stage reasoning pipeline:
  - stage 1: select most relevant papers
  - stage 2: generate paper-grounded email
- Highlighted claims with citation explanations

### V1.5 - Evidence-First Drafting
- Better overlap quality controls
- Stricter span-level citation behavior
- More consistent phrase-level evidence mapping

### V2 - Collaboration Workflow (planned)
- saved drafts and regeneration history
- team review / advisor review mode
- richer control over tone, length, and ask style

### V3 - Full Research Outreach Platform (planned)
- account system and credits
- programmatic outreach workflows
- end-to-end research fit scoring and pipeline analytics

---

## How It Works

1. **Input**
   - user uploads CV (PDF)
   - user enters professor details + Semantic Scholar profile/ID
   - optional: extra context and writing sample

2. **Paper Retrieval**
   - fetch candidate papers from Semantic Scholar
   - normalize metadata and abstract/full-text inputs

3. **Relevance Selection (Stage 1)**
   - model selects the strongest paper set for this specific student profile

4. **Email Synthesis (Stage 2)**
   - model writes a structured, concise outreach draft
   - includes phrase-level paper citations for technical claims

5. **Output**
   - subject line
   - email body
   - paragraph-level citation metadata for transparent review

---

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** FastAPI (Python 3.11+)
- **LLM:** Anthropic Claude (Sonnet family)
- **Paper Source:** Semantic Scholar Academic Graph API
- **PDF Parsing:** PyMuPDF

---

## Repository Structure

```text
overlabs/
├── backend/
│   ├── app/
│   │   ├── api/routes/generate.py
│   │   ├── models/schemas.py
│   │   ├── services/
│   │   │   ├── semantic_scholar.py
│   │   │   ├── paper_selector.py
│   │   │   ├── paper_fetcher.py
│   │   │   ├── email_generator.py
│   │   │   └── ...
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    └── package.json
```

---

## Quickstart (Local)

### 1) Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-...
SEMANTIC_SCHOLAR_API_KEY=...
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, point `VITE_API_BASE_URL` to your deployed backend URL.

---

## API

### `POST /generate`

Accepts `multipart/form-data`:
- `cv_file` (PDF)
- `professor_name`
- `university`
- `semantic_scholar_id`
- `purpose`
- `extra_context` (optional)
- `student_s2_id` (optional)
- `writing_sample` (optional)

Returns:
- `subject_line`
- `email_body`
- `paragraphs[]` with citation metadata

---

## Product Principles

- **Evidence over vibes:** every strong claim should map to real paper content.
- **Specificity over flattery:** focus on mechanisms, not adjectives.
- **Concise by design:** professors should be able to read in one pass.
- **Actionable ask:** always end with a clear next-step question.

---

## Deployment

- Frontend: Vercel
- Backend: Render / similar FastAPI host
- Required:
  - configure production CORS in backend
  - set frontend `VITE_API_BASE_URL`
  - set backend API keys in hosting environment

---

## Roadmap

- richer personalization controls
- reusable professor profiles and caching
- draft quality scoring and revision suggestions
- outreach analytics and follow-up workflows

---

## License

Proprietary (unless explicitly stated otherwise).

---

## Built By

Built by [ndstab](https://github.com/ndstab).

