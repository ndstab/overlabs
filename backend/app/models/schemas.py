from typing import Literal, Optional
from pydantic import BaseModel, Field


Purpose = Literal["phd", "internship", "ra", "visiting", "general"]


class GenerateRequest(BaseModel):
    cv_text: str
    extra_context: str = ""
    professor_name: str
    university: str
    semantic_scholar_id: str  # accepts either full URL or bare author ID
    purpose: Purpose = "general"
    student_s2_id: Optional[str] = None
    writing_sample: Optional[str] = Field(default=None, max_length=2000)


class GenerateResponse(BaseModel):
    subject_line: str
    email_body: str


class ErrorResponse(BaseModel):
    detail: str
