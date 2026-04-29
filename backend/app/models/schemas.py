from typing import Literal
from pydantic import BaseModel


Purpose = Literal["phd", "internship", "ra", "visiting", "general"]


class Citation(BaseModel):
    phrase: str
    paper_index: int
    paper_title: str
    paper_year: int | None = None
    explanation: str


class EmailParagraph(BaseModel):
    text: str
    citations: list[Citation] = []


class GenerateResponse(BaseModel):
    subject_line: str
    email_body: str
    paragraphs: list[EmailParagraph]


class ErrorResponse(BaseModel):
    detail: str
