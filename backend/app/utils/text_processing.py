import re

from app.models.document import PageText, RawChunk

_SOFT_HYPHEN = "\u00ad"
_HYPHEN_LINEBREAK_RE = re.compile(r"(\w)-\s*\n\s*(\w)")
_INLINE_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
_SMART_QUOTES = {
    "\u201c": '"', "\u201d": '"', "\u2018": "'", "\u2019": "'",
    "\u2013": "-", "\u2014": "-",
}

# Sentence splitter tuned for legal prose. Splits on [.!?] followed by
# whitespace and an uppercase letter or an opening enumeration like "(a)" / "(i)".
# Avoids splitting section numbers (e.g. "10.4 Suspension") because the next
# character after the period is a digit, not a capital.
_SENTENCE_BOUNDARY_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z(\"'\u201C])")


def _normalize_page_text(text: str) -> str:
    """Clean raw pypdf page text so chunk embeddings are not polluted by
    PDF extraction artefacts (soft hyphens, line-wrapped hyphenation,
    collapsed whitespace, smart quotes)."""
    if not text:
        return ""

    cleaned = text.replace(_SOFT_HYPHEN, "")
    for smart, plain in _SMART_QUOTES.items():
        cleaned = cleaned.replace(smart, plain)

    cleaned = _HYPHEN_LINEBREAK_RE.sub(r"\1\2", cleaned)
    cleaned = _INLINE_WHITESPACE_RE.sub(" ", cleaned)
    cleaned = _MULTI_NEWLINE_RE.sub("\n\n", cleaned)
    return cleaned.strip()


def _split_sentences(paragraph: str) -> list[str]:
    parts = _SENTENCE_BOUNDARY_RE.split(paragraph)
    return [p.strip() for p in parts if p.strip()]


def _token_count(text: str) -> int:
    return len(text.split())


def _majority_paragraph(paragraph_indices: list[int]) -> int:
    """Return the paragraph index that appears most often in the window.
    Ties break toward the earliest paragraph so provenance points to the
    clause where the chunk semantically begins."""
    if not paragraph_indices:
        return 0
    counts: dict[int, int] = {}
    for idx in paragraph_indices:
        counts[idx] = counts.get(idx, 0) + 1
    best_idx = paragraph_indices[0]
    best_count = -1
    for idx, count in counts.items():
        if count > best_count or (count == best_count and idx < best_idx):
            best_idx = idx
            best_count = count
    return best_idx


def chunk_pages(
    pages: list[PageText],
    max_tokens: int,
    overlap: int,
) -> list[RawChunk]:
    """Sentence-aware overlapping chunker.

    For each page, text is normalised, split into paragraphs on double-newlines,
    and then split into sentences. Sentences are packed into windows of up to
    `max_tokens` approximate whitespace tokens without ever cutting a sentence
    in half, and successive windows carry back approximately `overlap` tokens
    worth of trailing sentences so clause text that straddles a boundary is
    retrievable from either side.
    """
    if overlap >= max_tokens:
        overlap = max_tokens // 3

    chunks: list[RawChunk] = []
    chunk_index = 0

    for page_obj in pages:
        normalized = _normalize_page_text(page_obj.text)
        if not normalized:
            continue

        raw_paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]
        if not raw_paragraphs:
            continue

        sentences: list[tuple[str, int]] = []
        for para_idx, paragraph in enumerate(raw_paragraphs):
            for sentence in _split_sentences(paragraph):
                sentences.append((sentence, para_idx))

        if not sentences:
            continue

        i = 0
        n = len(sentences)
        while i < n:
            window_sentences: list[str] = []
            window_paragraphs: list[int] = []
            total_tokens = 0
            j = i

            while j < n:
                sentence, paragraph_idx = sentences[j]
                sentence_tokens = _token_count(sentence)

                # Always take at least one sentence so an exceptionally long
                # sentence still produces a chunk instead of spinning forever.
                if window_sentences and total_tokens + sentence_tokens > max_tokens:
                    break

                window_sentences.append(sentence)
                window_paragraphs.append(paragraph_idx)
                total_tokens += sentence_tokens
                j += 1

            chunks.append(
                RawChunk(
                    chunk_index=chunk_index,
                    page=page_obj.page,
                    paragraph=_majority_paragraph(window_paragraphs),
                    text=" ".join(window_sentences),
                )
            )
            chunk_index += 1

            if j >= n:
                break

            # Walk back from j collecting trailing sentences until we've
            # accumulated ~`overlap` tokens of context to carry into the next
            # window. This preserves clause text that spans a chunk boundary.
            back_tokens = 0
            back_sentences = 0
            k = j - 1
            while k >= i and back_tokens < overlap:
                back_tokens += _token_count(sentences[k][0])
                back_sentences += 1
                k -= 1

            step = (j - i) - back_sentences
            if step < 1:
                step = 1
            i += step

    return chunks
