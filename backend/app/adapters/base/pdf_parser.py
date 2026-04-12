from abc import ABC, abstractmethod

from app.models.document import PageText


class PdfParserAdapterBase(ABC):
    @abstractmethod
    def parse(self, content: bytes) -> list[PageText]: ...
