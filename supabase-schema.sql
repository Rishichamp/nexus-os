-- NEXUS OS — Supabase schema
-- Paste this whole file into your Supabase project's SQL Editor and click "Run".
-- One-time setup — you don't need to touch this again.

-- to_tsvector(regconfig, text) is STABLE, not IMMUTABLE, in Postgres (text search
-- configs are technically mutable catalog objects). Generated columns require an
-- IMMUTABLE expression, so we wrap it — safe here since we're always using 'english'.
create or replace function immutable_english_tsvector(text) returns tsvector as $$
  select to_tsvector('english', coalesce($1, ''));
$$ language sql immutable;

create table if not exists memories (
  id text primary key,
  content text not null,
  title text,
  summary text,
  layer text,
  tags text[] default '{}',
  entities text[] default '{}',
  importance integer default 5,
  energy text,
  action text,
  "estimatedMinutes" integer,
  "projectId" text,
  completed boolean default false,
  "completedAt" timestamptz,
  "createdAt" timestamptz default now(),
  -- auto-maintained search index used by the chat "recall relevant memories" feature
  "searchVector" tsvector generated always as (
    immutable_english_tsvector(
      coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(array_to_string(tags, ' '), '')
    )
  ) stored
);

create index if not exists memories_search_idx on memories using gin ("searchVector");
create index if not exists memories_created_idx on memories ("createdAt" desc);
create index if not exists memories_layer_idx on memories (layer);

create table if not exists chat_messages (
  id text primary key,
  "sessionId" text not null,
  role text not null,
  content text not null,
  "citedMemoryIds" text[] default '{}',
  "createdAt" timestamptz default now()
);

create index if not exists chat_messages_session_idx on chat_messages ("sessionId", "createdAt");

-- This app talks to Supabase only from the server (API routes) using the
-- service role key, which bypasses Row Level Security entirely — so RLS
-- is intentionally left off here. Don't expose the service role key to
-- the browser/client.
