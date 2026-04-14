from abc import ABC, abstractmethod


class StorageAdapterBase(ABC):
    @abstractmethod
    async def upload(
        self, user_id: str, doc_id: str, content: bytes, filename: str
    ) -> str: ...
    # Returns the storage object path: "{user_id}/{doc_id}/{filename}"

    @abstractmethod
    async def download(self, path: str) -> bytes: ...

    @abstractmethod
    async def delete(self, path: str) -> None: ...
