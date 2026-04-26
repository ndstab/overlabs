import logging

import pymupdf


logger = logging.getLogger("pymupdf")
logger.setLevel(logging.ERROR)


def extract_text_from_pdf(data: bytes) -> str:
    """
    Extract plain text from PDF bytes using PyMuPDF.
    Raises ValueError if the PDF cannot be opened or yields no text.
    """
    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Could not open PDF: {e}") from e

    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()

    text = "\n\n".join(pages).strip()
    if not text:
        raise ValueError(
            "No text could be extracted. The PDF may be scanned or image-only."
        )
    return text
