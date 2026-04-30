import asyncio
import os
from typing import Optional

from fastapi import APIRouter, Form, HTTPException, UploadFile, File

from app.models.schemas import GenerateResponse, Purpose
from app.services.semantic_scholar import (
    extract_author_id,
    fetch_professor_papers,
    fetch_student_papers,
)
from app.services.paper_selector import select_relevant_papers
from app.services.paper_fetcher import fetch_papers_full_text
from app.services.email_generator import generate_email
from app.services.invite_codes import (
    GlobalGenerationCapReachedError,
    InvalidInviteCodeError,
    InviteCodeExhaustedError,
    consume_invite_use,
    refund_invite_use,
)
from app.services.pdf_parser import extract_text_from_pdf
from app.services.pipeline_logger import PipelineLogger


router = APIRouter()

DEFAULT_SELECTION_COUNT = 7


@router.post("/generate", response_model=GenerateResponse)
async def generate_cold_email(
    cv_file: UploadFile = File(..., description="CV as PDF"),
    professor_name: str = Form(...),
    university: str = Form(...),
    semantic_scholar_id: str = Form(...),
    invite_code: str = Form(...),
    purpose: Purpose = Form("general"),
    extra_context: str = Form(""),
    student_s2_id: Optional[str] = Form(None),
    writing_sample: Optional[str] = Form(None),
):
    s2_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    log = PipelineLogger()

    # Parse CV PDF server-side
    if cv_file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=422, detail="Uploaded file must be a PDF.")
    pdf_bytes = await cv_file.read()
    try:
        cv_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    log.record(
        "request",
        {
            "professor_name": professor_name,
            "university": university,
            "semantic_scholar_id": semantic_scholar_id,
            "invite_code": invite_code[:4] + "***" if invite_code else "",
            "purpose": purpose,
            "student_s2_id": student_s2_id,
            "cv_text_chars": len(cv_text),
            "extra_context_chars": len(extra_context or ""),
            "writing_sample_chars": len(writing_sample or ""),
        },
    )

    # Resolve professor author ID
    try:
        professor_author_id = extract_author_id(semantic_scholar_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Resolve student author ID (optional)
    student_author_id: str | None = None
    if student_s2_id and student_s2_id.strip():
        try:
            student_author_id = extract_author_id(student_s2_id)
        except ValueError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Student profile: {e}",
            )

    # Step 1: fetch professor papers and (optionally) student papers in parallel
    async def _fetch_student_or_empty() -> list[dict]:
        if not student_author_id:
            return []
        return await fetch_student_papers(student_author_id, api_key=s2_key)

    try:
        professor_papers, student_papers = await asyncio.gather(
            fetch_professor_papers(professor_author_id, api_key=s2_key),
            _fetch_student_or_empty(),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    log.record(
        "professor_papers_pool",
        [PipelineLogger.paper_summary(p) for p in professor_papers],
    )
    log.record(
        "student_papers",
        [PipelineLogger.paper_summary(p) for p in student_papers],
    )

    if not professor_papers:
        log.record("error", "no professor papers")
        log.flush()
        raise HTTPException(
            status_code=404,
            detail="No papers with abstracts found for this professor on Semantic Scholar.",
        )

    # Step 2: Stage 1 selection
    try:
        selected_papers = await select_relevant_papers(
            papers=professor_papers,
            cv_text=cv_text,
            extra_context=extra_context,
            student_papers=student_papers,
            n=DEFAULT_SELECTION_COUNT,
            logger=log,
        )
        log.record("stage1_fallback_used", False)
    except ValueError:
        selected_papers = professor_papers[:DEFAULT_SELECTION_COUNT]
        log.record("stage1_fallback_used", True)
    except RuntimeError as e:
        log.record("error", f"stage1 runtime: {e}")
        log.flush()
        raise HTTPException(status_code=502, detail=str(e))

    log.record(
        "selected_papers_pre_fulltext",
        [PipelineLogger.paper_summary(p) for p in selected_papers],
    )

    # Step 3: fetch full text for selected professor papers
    selected_with_full = await fetch_papers_full_text(selected_papers)
    log.record(
        "selected_papers_post_fulltext",
        [PipelineLogger.paper_summary(p) for p in selected_with_full],
    )

    # Consume usage right before stage-2 generation (the paid model call).
    try:
        consume_invite_use(invite_code)
    except InvalidInviteCodeError as e:
        log.record("error", f"invite code invalid: {e}")
        log.flush()
        raise HTTPException(status_code=403, detail=str(e))
    except InviteCodeExhaustedError as e:
        log.record("error", f"invite code exhausted: {e}")
        log.flush()
        raise HTTPException(status_code=403, detail=str(e))
    except GlobalGenerationCapReachedError as e:
        log.record("error", f"global cap reached: {e}")
        log.flush()
        raise HTTPException(status_code=429, detail=str(e))

    # Step 4: Stage 2 generation
    try:
        subject_line, email_body, paragraphs = await generate_email(
            cv_text=cv_text,
            extra_context=extra_context,
            professor_name=professor_name,
            university=university,
            papers=selected_with_full,
            purpose=purpose,
            student_papers=student_papers,
            writing_sample=writing_sample,
            logger=log,
        )
    except RuntimeError as e:
        refund_invite_use(invite_code)
        log.record("error", f"stage2 runtime: {e}")
        log.flush()
        raise HTTPException(status_code=502, detail=str(e))

    log.record(
        "output",
        {
            "subject_line": subject_line,
            "email_body": email_body,
            "paragraphs": paragraphs,
        },
    )
    log.flush()

    return GenerateResponse(
        subject_line=subject_line,
        email_body=email_body,
        paragraphs=paragraphs,
    )
