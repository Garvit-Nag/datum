FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir poetry==1.8.3 && \
    poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock* ./

# Install CPU-only PyTorch FIRST — prevents sentence-transformers from
# pulling the full CUDA build (~20GB of GPU drivers you don't need).
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

RUN poetry install --no-interaction --no-ansi --only main

# Pre-download the BGE embedding model into the image cache so the first
# query after container start doesn't stall while HuggingFace is hit.
ENV HF_HOME=/root/.cache/huggingface
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-large-en-v1.5')"

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
