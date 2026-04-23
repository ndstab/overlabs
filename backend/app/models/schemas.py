from pydantic import BaseModel


class GenerateRequest(BaseModel):
    cv_text: str
    extra_context: str = ""
    professor_name: str
    university: str
    semantic_scholar_id: str  # accepts either full URL or bare author ID


class GenerateResponse(BaseModel):
    subject_line: str
    email_body: str


class ErrorResponse(BaseModel):
    detail: str
