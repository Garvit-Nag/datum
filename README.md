# Datum — MiniRAG: MSA Contract Q&A System

A Retrieval-Augmented Generation pipeline that lets authenticated users upload a Master Service Agreement, ask plain-English questions, and receive answers backed by a scored Similarity Report. An admin-only Evaluation Layer judges system answers against a committed ground truth using a separate LLM.

---

## MSA Used

**Atlassian Customer Agreement — October 2025**
Public URL: [https://www.atlassian.com/legal/customer-agreement](https://www.atlassian.com/legal/customer-agreement)

An 8-page software SaaS customer agreement covering payment terms, service levels, IP ownership, confidentiality, liability caps, governing law, and dispute resolution — ideal for testing contract Q&A retrieval.

---

## Technical Choices & Justification

| Choice | Value | Justification |
|---|---|---|
| Embedding model | `all-MiniLM-L6-v2` | Fast inference, 384-dim vectors, strong semantic accuracy for English legal text. Widely benchmarked on STS tasks. |
| Chunk size | 512 tokens | Captures full legal clauses (which run 100–400 words) without splitting mid-clause. Balances context density with retrieval precision. |
| Chunk overlap | 64 tokens (~12.5%) | Preserves clause boundaries that span chunk edges without duplicating excessive context. |
| Vector store | Pinecone | Managed, serverless, namespace-isolated per user+document. No infrastructure to run. |
| Answer LLM | MiniMax M2.5 (free) via OpenRouter | Strong instruction-following on long-context legal prose, available free tier. |
| Judge LLM | Gemma 4 27B IT (free) via OpenRouter | Separate model from answer generation to avoid self-evaluation bias. Free tier sufficient for 10-question eval runs. |
| Auth | Supabase Auth + JWT verification in FastAPI | JWT verified using `SUPABASE_JWT_SECRET` — no round-trip to Supabase on every request. |
| Metadata DB | Supabase Postgres | Managed Postgres with RLS — user isolation without custom middleware. |
| File storage | Supabase Storage | Paired with Postgres, objects scoped to `{user_id}/{doc_id}/{filename}`. |

---

## Architecture

```
Browser
  └── Next.js 15 (App Router) + React 19
        ├── Supabase Auth (JWT)
        ├── TanStack Query v5 (server state)
        └── Axios (API client with JWT interceptor)
              │
              ▼
        FastAPI (Docker)
          ├── Adapter Layer
          │     ├── OpenRouterLlmAdapter   (answer + judge)
          │     ├── PineconeVectorStoreAdapter
          │     ├── SentenceTransformerEmbeddingAdapter
          │     ├── SupabaseStorageAdapter
          │     └── PypdfParserAdapter
          ├── Services (document, query, evaluation)
          └── Repositories (Supabase Postgres)
```

---

## Setup

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- Poetry (Python 3.12)
- Supabase project (free tier works)
- Pinecone account (free index, dimension = 384)
- OpenRouter account

### 1. Supabase

1. Run `supabase/migrations/001_initial.sql` in the Supabase SQL Editor
2. Create a Storage bucket named **`documents`** (private)
3. To create an admin user: sign up normally, then in Supabase Dashboard → Authentication → Users → Edit user → Add `{"role": "admin"}` to **User Metadata**

### 2. Environment variables

```bash
cp .env.example backend/.env
# Fill in all values in backend/.env

cp frontend/.env.local.example frontend/.env.local
# Fill in NEXT_PUBLIC_* values
```

### 3. Backend

```bash
docker compose up --build
# API available at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

---

## Ground Truth

`data/ground_truth.json` — 10 questions and expected answers derived directly from the Atlassian Customer Agreement (Oct 2025). Categories: Payment Terms, Late Payment Penalty, Delivery Deadline Penalty, Termination Conditions, Termination Notice Period, Limitation of Liability, Intellectual Property, Confidentiality Duration, Governing Law, Dispute Resolution.

---

## Running Backend Tests

```bash
cd backend
poetry install
poetry run pytest
```
