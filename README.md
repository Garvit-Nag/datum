# Datum — MiniRAG: MSA Contract Q&A System

A Retrieval-Augmented Generation pipeline that lets authenticated users upload a Master Service Agreement, ask plain-English questions, and receive answers backed by a scored Similarity Report. An Evaluation Layer runs all 10 ground truth questions through the pipeline and judges system answers using a separate LLM.

---

## MSA Used

**Atlassian Customer Agreement — October 2025**  
Public URL: [https://www.atlassian.com/legal/customer-agreement](https://www.atlassian.com/legal/customer-agreement)

A comprehensive SaaS customer agreement covering payment terms, service levels, IP ownership, confidentiality obligations, liability caps, governing law, and dispute resolution — covering all 10 required evaluation categories from the brief.

---

## Technical Choices & Justification

| Choice | Value | Why |
|---|---|---|
| **Embedding model** | `BAAI/bge-large-en-v1.5` | 1024-dim SOTA dense retrieval model, top-ranked on BEIR and MTEB benchmarks for legal/long-form text. Outperforms MiniLM on clause-level semantic matching by a large margin. Required prefix `"Represent this sentence for searching relevant passages: "` for asymmetric retrieval. |
| **Chunk size** | 350 tokens | Legal clauses in MSAs are typically 60–200 words. 350 tokens captures a complete clause plus surrounding context without diluting the embedding. Going larger hurts retrieval precision; going smaller fragments clause logic across chunks. |
| **Chunk overlap** | 120 tokens (~34%) | Higher overlap than typical because MSA clauses frequently reference prior sub-sections mid-sentence. 34% overlap ensures clause boundaries are always reachable from either adjacent chunk. |
| **Chunker design** | Sentence-aware | Never cuts mid-sentence. Splits on `[.!?]` followed by uppercase, then packs sentences into windows. Preserves clause integrity better than naive character/token splitting. |
| **Vector store** | Pinecone (serverless) | Namespace-isolated per `user_id + doc_id`. No infrastructure to manage, sub-10ms query latency at free tier. Index dimension: 1024 to match BGE-large. |
| **Answer LLM** | Groq `llama-3.3-70b-versatile` | 70B model with strong instruction-following on legal prose. Groq's LPU delivers ~500 tok/s — fast enough to answer 10 questions sequentially without rate-limit throttling during an evaluation run. System prompt explicitly forbids fabrication outside retrieved context. |
| **Judge LLM** | Google `gemini-2.5-flash` | Separate model from answer generation to eliminate self-evaluation bias. Single batched call for all 10 verdicts — one prompt, one response — reduces latency from ~75s (sequential) to ~15s. Response format: `N\|Verdict\|One sentence reason`. |
| **Auth** | Supabase Auth + FastAPI JWT | PKCE OAuth flow via `@supabase/ssr`. JWT verified server-side using `SUPABASE_JWT_SECRET` — no round-trip to Supabase per request. |
| **Metadata DB** | Supabase Postgres | Managed Postgres with RLS. Documents, chats, queries, and evaluation runs are all user-scoped. |
| **File storage** | Supabase Storage | Objects stored at `{user_id}/{doc_id}/{filename}`, private bucket. |

---

## Architecture

```
Browser
  └── Next.js 16 (App Router) + React 19
        ├── Supabase Auth PKCE (JWT)
        ├── TanStack Query v5 (server state)
        └── Axios (API client with JWT interceptor)
              │
              ▼
        FastAPI (Docker, Python 3.12)
          ├── Adapter Layer
          │     ├── GroqLlmAdapter          (answer generation)
          │     ├── GeminiLlmAdapter        (batch judge — OpenAI-compat endpoint)
          │     ├── PineconeVectorStoreAdapter
          │     ├── SentenceTransformerEmbeddingAdapter  (BGE-large, pre-warmed)
          │     ├── SupabaseStorageAdapter
          │     └── PypdfParserAdapter
          ├── Services
          │     ├── DocumentService         (ingest → chunk → embed → upsert)
          │     ├── QueryService            (embed query → search → LLM answer)
          │     └── EvaluationService       (Phase 1: Groq answers | Phase 2: Gemini batch judge)
          └── Repositories (Supabase Postgres)
```

### Evaluation Pipeline (Two-Phase)

```
Phase 1 — Answer Generation (Groq, sequential per question)
  ├── Embed question → search Pinecone → build context
  ├── Groq llama-3.3-70b generates answer
  └── Stream: answer_ready event with progress

Phase 2 — Batch Judge (Gemini, single call)
  ├── All 10 (expected, system) pairs sent in one prompt
  ├── Gemini returns N|Verdict|Reason lines
  └── Stream: verdict events staggered 150ms for live UI effect
```

---

## Ground Truth File

[`ground_truth.txt`](./ground_truth.txt) — 10 questions and expected answers derived from the Atlassian Customer Agreement (Oct 2025), covering all required categories:

| # | Category |
|---|---|
| 1 | Payment Terms |
| 2 | Late Payment Penalty |
| 3 | Delivery Deadline Penalty |
| 4 | Termination Conditions |
| 5 | Termination Notice Period |
| 6 | Limitation of Liability |
| 7 | Intellectual Property |
| 8 | Confidentiality Duration |
| 9 | Governing Law |
| 10 | Dispute Resolution |

**Format** used by the evaluation UI:

```
C: Category Name
Q: Question text
A: Expected answer text

C: Next Category
Q: ...
A: ...
```

---

## Setup

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- Poetry (Python 3.12)
- Supabase project (free tier)
- Pinecone account — create a **serverless** index, dimension **1024**, metric **cosine**
- Groq account (free tier)
- Google AI Studio account for Gemini API key (free tier)

### 1. Supabase

1. Run `supabase/migrations/001_initial.sql` in the SQL Editor
2. Run `supabase/migrations/002_add_chats.sql` in the SQL Editor
3. Create a Storage bucket named **`documents`** (private)

### 2. Environment variables

The root `.env.example` is split into two sections — a **Backend** block and a **Frontend** block. Copy each block into its own file:

```bash
# Backend — copy the "Backend" section of .env.example into backend/.env
cp .env.example backend/.env

# Frontend — copy the "Frontend" section into frontend/.env.local
cp frontend/.env.local.example frontend/.env.local
```

Then fill in every value. After copying, remove the frontend block from `backend/.env` (and vice versa) so each file only holds its own keys.

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never exposed to browser) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase project settings |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Name of your 1024-dim Pinecone index |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_ANSWER_MODEL` | Defaults to `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_JUDGE_MODEL` | Defaults to `gemini-2.5-flash` |
| `EMBEDDING_MODEL` | Defaults to `BAAI/bge-large-en-v1.5` |
| `MAX_CHUNK_SIZE` | Token window per chunk (default `350`) |
| `CHUNK_OVERLAP` | Token overlap between chunks (default `120`) |
| `TOP_K_RESULTS` | Chunks returned per query (default `5`) |
| `CORS_ORIGINS` | JSON list, e.g. `["http://localhost:3000"]` |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase URL as the backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

### 3. Backend

Pick **one** of the two options below.

**Option A — Docker (recommended, zero setup)**

```bash
docker compose up --build
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

The image installs a CPU-only PyTorch wheel and pre-downloads the BGE embedding model at build time, so the first query after startup doesn't stall on HuggingFace.

**Option B — Native (Poetry + uvicorn)**

Use this when you want hot-reload, faster iteration, or don't have Docker. Poetry creates and manages the virtualenv for you — no need to run `python -m venv` yourself.

```bash
cd backend

# 1. Install CPU-only PyTorch first, or sentence-transformers will pull the
#    ~2 GB CUDA build you don't need.
poetry run pip install torch --index-url https://download.pytorch.org/whl/cpu

# 2. Install the rest of the dependencies (prod only — skip dev tools).
poetry install --only main

# 3. Run the API with hot-reload.
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

The first query will briefly stall (~10–20s) while the BGE-large model downloads into `~/.cache/huggingface`. Subsequent runs are instant.

If you prefer a plain `venv` without Poetry, run `poetry export -f requirements.txt --output requirements.txt --only main` once, then `python -m venv .venv && .venv/Scripts/activate && pip install -r requirements.txt` (use `source .venv/bin/activate` on macOS/Linux) before the same `uvicorn` command above.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```
