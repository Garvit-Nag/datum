from app.models.document import PageText, RawChunk


def _approximate_token_count(text: str) -> int:
    """Whitespace-split token approximation — sufficient for legal prose."""
    return len(text.split())


def chunk_pages(
    pages: list[PageText],
    max_tokens: int,
    overlap: int,
) -> list[RawChunk]:
    """Split document pages into overlapping token-window chunks.

    Each page is split on double-newlines to derive paragraphs. The paragraph
    stream is then windowed with `max_tokens` width and `overlap` step-back,
    producing RawChunk objects tagged with page and paragraph provenance.
    """
    chunks: list[RawChunk] = []
    chunk_index = 0

    for page_obj in pages:
        raw_paragraphs = [p.strip() for p in page_obj.text.split("\n\n") if p.strip()]
        if not raw_paragraphs:
            continue

        # Tokenise each paragraph to word lists for window arithmetic
        para_tokens: list[list[str]] = [p.split() for p in raw_paragraphs]

        # Flatten to a list of (token, paragraph_index) pairs
        token_stream: list[tuple[str, int]] = []
        for para_idx, tokens in enumerate(para_tokens):
            for token in tokens:
                token_stream.append((token, para_idx))

        if not token_stream:
            continue

        pos = 0
        while pos < len(token_stream):
            window = token_stream[pos : pos + max_tokens]
            text = " ".join(t for t, _ in window)
            # Paragraph index is taken from the first token in the window
            paragraph_idx = window[0][1]

            chunks.append(
                RawChunk(
                    chunk_index=chunk_index,
                    page=page_obj.page,
                    paragraph=paragraph_idx,
                    text=text,
                )
            )
            chunk_index += 1

            # Advance by (max_tokens - overlap), minimum 1 to avoid infinite loops
            step = max(max_tokens - overlap, 1)
            pos += step

    return chunks
