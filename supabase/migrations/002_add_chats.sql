-- ── chats ─────────────────────────────────────────────────────────────────────
-- Each chat is bound to exactly one document for context
create table if not exists chats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  document_id uuid not null references documents(id) on delete cascade,
  title       text not null default 'New Chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table chats enable row level security;

create policy "users_own_chats" on chats
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Link query_history messages to chats
alter table query_history add column if not exists chat_id uuid references chats(id) on delete cascade;
