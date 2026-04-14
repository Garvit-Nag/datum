-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── documents ────────────────────────────────────────────────────────────────
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  filename    text not null,
  status      text not null check (status in ('processing', 'ready', 'failed')),
  chunk_count int,
  namespace   text not null,
  created_at  timestamptz not null default now()
);

alter table documents enable row level security;

create policy "users_own_documents" on documents
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── query_history ─────────────────────────────────────────────────────────────
create table if not exists query_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  document_id uuid not null references documents(id) on delete cascade,
  question    text not null,
  answer      text not null,
  chunks      jsonb not null,
  created_at  timestamptz not null default now()
);

alter table query_history enable row level security;

create policy "users_own_queries" on query_history
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── evaluation_results ────────────────────────────────────────────────────────
create table if not exists evaluation_results (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  run_at      timestamptz not null default now(),
  results     jsonb not null
);

alter table evaluation_results enable row level security;

-- Only the service role (backend) can insert; admins read via service role
create policy "service_role_only" on evaluation_results
  for all
  using (false);
