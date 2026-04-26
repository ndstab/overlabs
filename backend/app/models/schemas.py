from typing import Literal
from pydantic import BaseModel


Purpose = Literal["phd", "internship", "ra", "visiting", "general"]


class GenerateResponse(BaseModel):
    subject_line: str
    email_body: str


class ErrorResponse(BaseModel):
    detail: str
