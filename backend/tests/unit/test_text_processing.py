import pytest

from app.models.document import PageText
from app.utils.text_processing import chunk_pages


def _page(text: str, page: int = 1) -> PageText:
    return PageText(page=page, text=text)


def test_empty_input_returns_empty_list():
    assert chunk_pages([], max_tokens=512, overlap=64) == []


def test_single_page_single_chunk():
    words = " ".join([f"word{i}" for i in range(10)])
    chunks = chunk_pages([_page(words)], max_tokens=512, overlap=64)
    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].page == 1


def test_chunk_indices_are_sequential():
    long_text = " ".join([f"word{i}" for i in range(1000)])
    chunks = chunk_pages([_page(long_text)], max_tokens=100, overlap=10)
    for i, chunk in enumerate(chunks):
        assert chunk.chunk_index == i


def test_overlap_produces_more_chunks_than_no_overlap():
    words = " ".join([f"word{i}" for i in range(200)])
    chunks_with_overlap = chunk_pages([_page(words)], max_tokens=100, overlap=50)
    chunks_no_overlap = chunk_pages([_page(words)], max_tokens=100, overlap=0)
    assert len(chunks_with_overlap) > len(chunks_no_overlap)


def test_paragraph_index_tracked():
    text = "First paragraph words.\n\nSecond paragraph words."
    chunks = chunk_pages([_page(text)], max_tokens=512, overlap=0)
    assert len(chunks) >= 1
    assert chunks[0].paragraph == 0


def test_multi_page_page_numbers_preserved():
    pages = [_page("page one content", page=1), _page("page two content", page=2)]
    chunks = chunk_pages(pages, max_tokens=512, overlap=0)
    pages_seen = {c.page for c in chunks}
    assert 1 in pages_seen
    assert 2 in pages_seen


def test_page_with_only_whitespace_is_skipped():
    pages = [_page("   \n\n  ", page=1), _page("real content here", page=2)]
    chunks = chunk_pages(pages, max_tokens=512, overlap=0)
    assert all(c.page == 2 for c in chunks)
