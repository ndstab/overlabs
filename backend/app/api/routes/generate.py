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


router = APIRouter()

DEFAULT_SELECTION_COUNT = 7


@router.post("/generate", response_model=GenerateResponse)
async def generate_cold_email(request: GenerateRequest):
    s2_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")

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

    if not professor_papers:
        raise HTTPException(
            status_code=404,
            detail="No papers with abstracts found for this professor on Semantic Scholar.",
        )

    # Step 2: kick off student paper full-text fetch in background while Stage 1 runs
    student_full_text_task = asyncio.create_task(
        fetch_papers_full_text(student_papers)
    )

    # Step 3: Stage 1 selection
    try:
        selected_papers = await select_relevant_papers(
            papers=professor_papers,
            cv_text=request.cv_text,
            extra_context=request.extra_context,
            student_papers=student_papers,
            n=DEFAULT_SELECTION_COUNT,
        )
    except ValueError:
        # Fallback: use first N papers (already sorted by citation/recency)
        selected_papers = professor_papers[:DEFAULT_SELECTION_COUNT]
    except RuntimeError as e:
        student_full_text_task.cancel()
        raise HTTPException(status_code=502, detail=str(e))

    # Step 4: fetch full text for selected professor papers (parallel)
    selected_with_full = await fetch_papers_full_text(selected_papers)

    # Step 5: await student paper full text (started in step 2)
    student_papers_with_full = await student_full_text_task

    # Step 6: Stage 2 generation
    try:
        subject_line, email_body = await generate_email(
            cv_text=request.cv_text,
            extra_context=request.extra_context,
            professor_name=request.professor_name,
            university=request.university,
            papers=selected_with_full,
            purpose=request.purpose,
            student_papers=student_papers_with_full,
            writing_sample=request.writing_sample,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return GenerateResponse(subject_line=subject_line, email_body=email_body)
