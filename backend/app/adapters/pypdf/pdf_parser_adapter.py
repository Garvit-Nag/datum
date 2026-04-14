import io

import pypdf

from app.adapters.base.pdf_parser import PdfParserAdapterBase
from app.core.exceptions import DocumentProcessingException
from app.models.document import PageText


class PypdfParserAdapter(PdfParserAdapterBase):
    """Extracts per-page text from a PDF using pypdf."""

    def parse(self, content: bytes) -> list[PageText]:
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages: list[PageText] = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append(PageText(page=i + 1, text=text))
            return pages
        except Exception as exc:
            raise DocumentProcessingException(f"PDF parsing failed: {exc}") from exc
