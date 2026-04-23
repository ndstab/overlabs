import os
from fastapi import APIRouter, HTTPException

from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.semantic_scholar import extract_author_id, fetch_professor_papers
from app.services.email_generator import generate_email

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate_cold_email(request: GenerateRequest):
    # Resolve author ID from URL or bare ID
    try:
        author_id = extract_author_id(request.semantic_scholar_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Fetch professor's papers
    s2_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
    print(f"[DEBUG] S2 key loaded: {bool(s2_key)} | value prefix: {s2_key[:6] if s2_key else 'NONE'}")
    try:
        papers = await fetch_professor_papers(
            author_id=author_id,
            api_key=s2_key,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Generate email
    try:
        subject_line, email_body = await generate_email(
            cv_text=request.cv_text,
            extra_context=request.extra_context,
            professor_name=request.professor_name,
            university=request.university,
            papers=papers,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return GenerateResponse(subject_line=subject_line, email_body=email_body)
