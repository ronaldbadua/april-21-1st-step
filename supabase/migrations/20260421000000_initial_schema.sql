-- ICQA Personalize Dashboard — run in Supabase SQL Editor or via CLI
-- Creates tables and temporary permissive anon RLS (replaced by 20260422120000_auth_authenticated_rls.sql).

create extension if not exists "pgcrypto";

create table if not exists public.hourly_notes (
  id uuid primary key default gen_random_uuid(),
  note_date date not null,
  hour smallint not null check (hour >= 0 and hour <= 23),
  status text not null default 'pending'
    check (status in ('resolved', 'pending', 'needs_attention')),
  content text not null default '',
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (note_date, hour)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_name text not null default 'ICQA Team',
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.process_path_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage text not null default 'pending'
    check (stage in ('pending', 'in_progress', 'done')),
  detail text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists hourly_notes_set_updated_at on public.hourly_notes;
create trigger hourly_notes_set_updated_at
  before update on public.hourly_notes
  for each row execute function public.set_updated_at();

drop trigger if exists process_path_items_set_updated_at on public.process_path_items;
create trigger process_path_items_set_updated_at
  before update on public.process_path_items
  for each row execute function public.set_updated_at();

alter table public.hourly_notes enable row level security;
alter table public.chat_messages enable row level security;
alter table public.schedule_events enable row level security;
alter table public.process_path_items enable row level security;

drop policy if exists "hourly_notes_anon_all" on public.hourly_notes;
create policy "hourly_notes_anon_all"
  on public.hourly_notes for all
  using (true) with check (true);

drop policy if exists "chat_messages_anon_all" on public.chat_messages;
create policy "chat_messages_anon_all"
  on public.chat_messages for all
  using (true) with check (true);

drop policy if exists "schedule_events_anon_all" on public.schedule_events;
create policy "schedule_events_anon_all"
  on public.schedule_events for all
  using (true) with check (true);

drop policy if exists "process_path_items_anon_all" on public.process_path_items;
create policy "process_path_items_anon_all"
  on public.process_path_items for all
  using (true) with check (true);

-- Realtime for chat (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
exception
  when duplicate_object then null;
end $$;
