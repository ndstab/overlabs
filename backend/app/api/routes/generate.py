import asyncio
import os
from fastapi import APIRouter, HTTPException

from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.semantic_scholar import (
    extract_author_id,
    fetch_professor_papers,
    fetch_student_papers,
)
from app.services.paper_selector import select_relevant_papers
from app.services.paper_fetcher import fetch_papers_full_text
from app.services.email_generator import generate_email
from app.services.pipeline_logger import PipelineLogger


router = APIRouter()

DEFAULT_SELECTION_COUNT = 7


@router.post("/generate", response_model=GenerateResponse)
async def generate_cold_email(request: GenerateRequest):
    s2_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    log = PipelineLogger()
    log.record(
        "request",
        {
            "professor_name": request.professor_name,
            "university": request.university,
            "semantic_scholar_id": request.semantic_scholar_id,
            "purpose": request.purpose,
            "student_s2_id": request.student_s2_id,
            "cv_text_chars": len(request.cv_text),
            "extra_context_chars": len(request.extra_context or ""),
            "writing_sample_chars": len(request.writing_sample or ""),
        },
    )

    # Resolve professor author ID
    try:
        professor_author_id = extract_author_id(request.semantic_scholar_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Resolve student author ID (optional)
    student_author_id: str | None = None
    if request.student_s2_id and request.student_s2_id.strip():
        try:
            student_author_id = extract_author_id(request.student_s2_id)
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

    # Step 2: Stage 1 selection (student papers used as abstracts only — no full-text fetch)
    try:
        selected_papers = await select_relevant_papers(
            papers=professor_papers,
            cv_text=request.cv_text,
            extra_context=request.extra_context,
            student_papers=student_papers,
            n=DEFAULT_SELECTION_COUNT,
            logger=log,
        )
        log.record("stage1_fallback_used", False)
    except ValueError:
        # Fallback: use first N papers (already sorted by citation/recency)
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

    # Step 3: fetch full text for selected professor papers (parallel)
    selected_with_full = await fetch_papers_full_text(selected_papers)
    log.record(
        "selected_papers_post_fulltext",
        [PipelineLogger.paper_summary(p) for p in selected_with_full],
    )

    # Step 4: Stage 2 generation (student papers passed as abstracts; CV is the primary student ground truth)
    try:
        subject_line, email_body = await generate_email(
            cv_text=request.cv_text,
            extra_context=request.extra_context,
            professor_name=request.professor_name,
            university=request.university,
            papers=selected_with_full,
            purpose=request.purpose,
            student_papers=student_papers,
            writing_sample=request.writing_sample,
            logger=log,
        )
    except RuntimeError as e:
        log.record("error", f"stage2 runtime: {e}")
        log.flush()
        raise HTTPException(status_code=502, detail=str(e))

    log.record("output", {"subject_line": subject_line, "email_body": email_body})
    log.flush()

    return GenerateResponse(subject_line=subject_line, email_body=email_body)
