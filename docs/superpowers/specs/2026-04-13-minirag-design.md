# MiniRAG: MSA Contract Q&A System — Design Spec

**Date:** 2026-04-13
**Project:** KPi-Tech AI Interop Engineer Assessment
**Candidate:** Garvit Nag

---

## 1. Overview

A Retrieval-Augmented Generation (RAG) pipeline that lets authenticated users upload a Master Service Agreement (MSA) contract, ask plain-English questions about it, and receive accurate answers backed by a scored, color-coded Similarity Report. An admin-only Evaluation Layer automatically judges system answers against a committed ground truth file using a separate LLM.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python 3.12+) + Pydantic v2 |
| Dependency mgmt | Poetry |
| Embeddings | SentenceTransformers (`all-MiniLM-L6-v2`) |
| Vector store | Pinecone |
| LLM — answer gen | MiniMax M2.5 (free) via OpenRouter |
| LLM — judge | Gemma 4 27B (free) via OpenRouter |
| Auth | Supabase Auth (frontend) + JWT verification (FastAPI) |
| Metadata DB | Supabase Postgres |
| File storage | Supabase Storage |
| PDF parsing | pypdf |
| Containerisation | Docker — FastAPI backend only |

---

## 3. Repository Structure

```
datum/
  backend/
    app/
      api/v1/
        documents.py
        query.py
        evaluation.py
      core/
        config.py            — Pydantic Settings
        dependencies.py      — FastAPI Depends() providers
        exceptions.py        — AppException hierarchy
        security.py          — Supabase JWT verification (python-jose)
      adapters/
        base/
          llm.py             — LlmAdapterBase (ABC)
          vector_store.py    — VectorStoreAdapterBase (ABC)
          embedding.py       — EmbeddingAdapterBase (ABC)
          storage.py         — StorageAdapterBase (ABC)
          pdf_parser.py      — PdfParserAdapterBase (ABC)
        openrouter/
          llm_adapter.py     — OpenRouter HTTP adapter (httpx)
        pinecone/
          vector_store_adapter.py
        sentence_transformers/
          embedding_adapter.py   — asyncio.to_thread() for CPU work
        supabase/
          storage_adapter.py
        pypdf/
          pdf_parser_adapter.py
      models/
        document.py
        query.py
        evaluation.py
      repositories/
        document_repo.py     — Supabase Postgres CRUD (documents, query_history)
        evaluation_repo.py   — Supabase Postgres CRUD (evaluation_results)
      services/
        document_service.py  — ingestion orchestration
        query_service.py     — retrieval + answer generation
        evaluation_service.py — ground truth eval + judging
      utils/
        text_processing.py   — chunking, cleaning
      main.py
    tests/
      unit/
      integration/
    pyproject.toml
    Dockerfile
  frontend/
    src/
      app/
        (auth)/login/page.tsx
        dashboard/page.tsx
        query/[docId]/page.tsx
        evaluation/page.tsx
      features/
        document/
          components/
            DocumentUploadForm.tsx
            DocumentList.tsx
          hooks/
            useDocuments.ts
            document-keys.ts
          services/
            document-service.ts
        query/
          components/
            QueryForm.tsx
            SimilarityReportPanel.tsx
            AnswerPanel.tsx
          hooks/
            useQueryHistory.ts
            query-keys.ts
          services/
            query-service.ts
        evaluation/
          components/
            EvaluationTriggerButton.tsx
            EvaluationSummaryTable.tsx
          hooks/
            useEvaluation.ts
            evaluation-keys.ts
          services/
            evaluation-service.ts
      shared/
        providers/
          supabase-provider.tsx
          query-provider.tsx
        api/
          client.ts
          server-fetch.ts
        components/
          AdminGuard.tsx
          AuthGuard.tsx
        utils/
          errors.ts
          client-env.ts
          env.ts
        types/
        schemas/
      components/
        ui/               — shadcn/ui primitives
  data/
    ground_truth.json     — 10 Q&A pairs (committed to repo)
  docker-compose.yml      — backend service only
  .env.example
```

---

## 4. Data Models

### Supabase Postgres Tables

```sql
-- Per-user uploaded MSA documents
documents (
  id          uuid PK default gen_random_uuid(),
  user_id     uuid NOT NULL,              -- Supabase auth.users FK
  filename    text NOT NULL,
  status      text NOT NULL,             -- 'processing' | 'ready' | 'failed'
  chunk_count int,
  namespace   text NOT NULL,             -- Pinecone namespace: "{user_id}_{doc_id}"
  created_at  timestamptz default now()
)

-- Every question asked, with full chunk payload stored as JSONB
query_history (
  id          uuid PK default gen_random_uuid(),
  user_id     uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question    text NOT NULL,
  answer      text NOT NULL,
  chunks      jsonb NOT NULL,            -- SimilarityChunkType[]
  created_at  timestamptz default now()
)

-- One row per evaluation run (admin only)
evaluation_results (
  id          uuid PK default gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  run_at      timestamptz default now(),
  results     jsonb NOT NULL             -- EvaluationResultRowType[]
)
```

### Pydantic Models (backend)

```python
# models/document.py
class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    namespace: str
    created_at: datetime

class PageText(BaseModel):
    page: int
    text: str

class EmbeddedChunk(BaseModel):
    chunk_index: int
    page: int
    paragraph: int
    text: str
    vector: list[float]

class SimilarityChunk(BaseModel):
    rank: int
    page: int
    paragraph: int
    score: float
    signal: Literal['Strong', 'Good', 'Weak', 'Poor']
    preview: str                          # first 120 chars of chunk text

# models/query.py
class QueryRequest(BaseModel):
    document_id: str
    question: str = Field(..., min_length=1, max_length=500)

class QueryResponse(BaseModel):
    answer: str
    chunks: list[SimilarityChunk]
    query_id: str

# models/evaluation.py
class EvaluationRequest(BaseModel):
    document_id: str

class EvaluationResultRow(BaseModel):
    id: int
    category: str
    question: str
    expected_answer: str
    system_answer: str
    verdict: Literal['Match', 'Partial Match', 'No Match']
    reason: str

class EvaluationRunResponse(BaseModel):
    id: str
    run_at: datetime
    results: list[EvaluationResultRow]
    match_count: int
    partial_count: int
    no_match_count: int
    accuracy_pct: float
```

### Ground Truth File (`data/ground_truth.json`)

```json
[
  {
    "id": 1,
    "category": "Payment Terms",
    "question": "When is an invoice due after it is issued?",
    "expected_answer": "..."
  }
]
```

---

## 5. Adapter Interfaces

All external integrations are accessed exclusively through these ABCs. Concrete implementations live under `adapters/<provider>/`. Swapping a provider means writing a new concrete class and updating the dependency wiring in `core/dependencies.py` — no service or router code changes.

```python
class LlmAdapterBase(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str: ...

class VectorStoreAdapterBase(ABC):
    @abstractmethod
    async def upsert(self, namespace: str, chunks: list[EmbeddedChunk]) -> None: ...
    @abstractmethod
    async def search(self, namespace: str, vector: list[float], top_k: int) -> list[SimilarityChunk]: ...
    @abstractmethod
    async def delete_namespace(self, namespace: str) -> None: ...

class EmbeddingAdapterBase(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...

class StorageAdapterBase(ABC):
    @abstractmethod
    async def upload(self, user_id: str, doc_id: str, content: bytes, filename: str) -> str: ...
    # returns the storage object path: "{user_id}/{doc_id}/{filename}"
    @abstractmethod
    async def download(self, path: str) -> bytes: ...

class PdfParserAdapterBase(ABC):
    @abstractmethod
    def parse(self, content: bytes) -> list[PageText]: ...
```

---

## 6. Auth Flow

```
Browser → Supabase.auth.signInWithPassword()
        ← Supabase JWT (stored in Supabase client session)

Browser → axios request
        → interceptor attaches: Authorization: Bearer <supabase_jwt>
        → FastAPI: security.py verifies JWT using SUPABASE_JWT_SECRET (python-jose)
        → extracts user_id from `sub` claim
        → admin check: user_metadata.role == 'admin' (set manually in Supabase dashboard)
```

- `Depends(get_current_user)` applied to all routes — returns `AuthUserType`
- `Depends(get_admin_user)` applied to evaluation routes — raises `403` if not admin
- Session persistence via Supabase client's built-in localStorage/cookie handling on frontend

---

## 7. API Contracts

```
POST   /api/v1/documents/upload          multipart/form-data
                                         → DocumentUploadResponse

GET    /api/v1/documents/                → list[DocumentUploadResponse]

DELETE /api/v1/documents/{doc_id}        → 204
                                           also deletes Pinecone namespace + Storage file

POST   /api/v1/query/                    { document_id, question }
                                         → QueryResponse { answer, chunks, query_id }

POST   /api/v1/evaluation/run            { document_id }  [admin only]
                                         → EvaluationRunResponse

GET    /api/v1/evaluation/results        → list[EvaluationRunResponse]
                                           returns all runs, most recent first
```

---

## 8. Ingestion Pipeline

```
Upload PDF
  → PdfParserAdapter.parse()             → list[PageText]
  → text_processing.chunk()              → list[RawChunk] (512 tok, 64 tok overlap)
                                           each chunk tagged: page, paragraph_index
                                           paragraph_index = position of chunk's origin
                                           paragraph within the page (paragraphs split
                                           on double-newline from pypdf page text)
  → EmbeddingAdapter.embed(texts)        → list[list[float]]  (asyncio.to_thread)
  → VectorStoreAdapter.upsert(namespace) → stored with metadata: doc_id, chunk_index, page, paragraph, preview
  → StorageAdapter.upload()              → raw PDF stored in Supabase Storage
  → document_repo.update_status('ready', chunk_count)
```

---

## 9. Query Pipeline

```
Question
  → EmbeddingAdapter.embed([question])   → query_vector
  → VectorStoreAdapter.search(namespace, query_vector, top_k=5)
                                         → list[SimilarityChunk] (with score, page, paragraph)
  → score_signal() applied per chunk:    ≥0.85 Strong | 0.70–0.84 Good | 0.50–0.69 Weak | <0.50 Poor
  → LlmAdapter.generate(system, user)    → answer string
       system: "Answer only from the provided context. Do not fabricate."
       user:   question + formatted chunk texts
  → query_repo.insert()                  → query_history row
  → return QueryResponse
```

---

## 10. Evaluation Pipeline (Admin Only)

```
Trigger: POST /api/v1/evaluation/run { document_id }
  → load data/ground_truth.json          → 10 GroundTruthItem
  → for each item:
      run full query pipeline            → system_answer
      judge_llm.generate(judge_prompt)   → "Match|Partial Match|No Match\n<reason>"
      parse verdict + reason
  → compute match_count, partial_count, no_match_count, accuracy_pct
  → evaluation_repo.insert()
  → return EvaluationRunResponse
```

**Judge prompt (verbatim from brief):**
> You are evaluating a RAG system's answer against a ground truth answer extracted from a contract document. Compare the two answers and classify the result as exactly one of: Match, Partial Match, or No Match. Then provide a single sentence explaining your classification. Do not add any other commentary.
> Ground Truth Answer: [INSERT] | System Answer: [INSERT]

**Judge model:** Gemma 4 27B (free) via OpenRouter
**Answer model:** MiniMax M2.5 (free) via OpenRouter

---

## 11. Chunking Parameters

| Parameter | Value | Justification |
|---|---|---|
| Chunk size | 512 tokens | Dense enough to capture full legal clauses; small enough for precise retrieval |
| Overlap | 64 tokens (~12.5%) | Preserves clause boundaries that span chunk edges without duplicating too much context |
| Location tracking | page + paragraph index | Required by Similarity Report UI format |

---

## 12. Frontend Pages & Components

### Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Supabase email + password login |
| `/dashboard` | Auth | Upload MSA, list user's documents with status |
| `/query/[docId]` | Auth | Question input, Similarity Report panel, Answer panel |
| `/evaluation` | Admin | Trigger eval run, Evaluation Summary Table |

### Similarity Report Panel

Always mounted on `/query/[docId]`. Shows empty state before first query. Updates on every new query via React Query cache invalidation — no page reload.

| Column | Detail |
|---|---|
| Rank | 1–5 |
| Location | Page X, Para Y |
| Similarity Score | 2 decimal places |
| Score Signal | Strong / Good / Weak / Poor |
| Chunk Preview | First 120 characters of chunk text |

Row background colors (Tailwind):
- Strong (`≥0.85`): `bg-green-50`
- Good (`0.70–0.84`): `bg-blue-50`
- Weak (`0.50–0.69`): `bg-yellow-50`
- Poor (`<0.50`): `bg-red-50`

### Evaluation Summary Table

| Column | Detail |
|---|---|
| # | Question number |
| Category | e.g. Payment Terms |
| Question | Full question text |
| Expected Answer | Truncated to 80 chars |
| System Answer | Truncated to 80 chars |
| Verdict | Color-coded badge |
| Reason | Judge's one-line explanation |

Footer row: `Match: N | Partial Match: N | No Match: N | Overall Accuracy: N%`

Verdict badge colors: Match = green, Partial Match = amber, No Match = red

### Upload Status Polling

`DocumentList` uses `useQuery` with `refetchInterval: 3000` that clears once all visible documents have `status === 'ready'`.

---

## 13. Environment Variables

### Backend (`.env`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
OPENROUTER_API_KEY=
OPENROUTER_ANSWER_MODEL=minimax/minimax-m2.5
OPENROUTER_JUDGE_MODEL=google/gemma-4-27b
EMBEDDING_MODEL=all-MiniLM-L6-v2
MAX_CHUNK_SIZE=512
CHUNK_OVERLAP=64
TOP_K_RESULTS=5
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 14. Docker

`docker-compose.yml` runs the FastAPI backend only. No other services are containerised.

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    volumes:
      - ./data:/app/data:ro    # ground_truth.json read-only mount
```

---

## 15. Definition of Done

A feature is complete when:

1. FastAPI endpoint typed with Pydantic, raises `AppException` subtypes on failure, covered by unit + integration tests.
2. Frontend service function typed end-to-end matching Pydantic model shapes.
3. React Query hook invalidates correct keys on mutation success.
4. Component renders loading, error, and success states without `useEffect`.
5. No `as any`, no orphan files, no inline complex types, no process-journal comments.
6. `README.md` reflects MSA used, chunk size, overlap, embedding model, LLM choices with justifications.
