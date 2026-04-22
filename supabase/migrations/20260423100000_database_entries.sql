-- Foundation table for the Database workspace: extensible JSONB payload for future fields.
-- Run after 20260422120000_auth_authenticated_rls.sql (or with RLS for authenticated only).

create table if not exists public.database_entries (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Untitled',
  notes text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid()
);

drop trigger if exists database_entries_set_updated_at on public.database_entries;
create trigger database_entries_set_updated_at
  before update on public.database_entries
  for each row execute function public.set_updated_at();

create index if not exists database_entries_updated_at_idx
  on public.database_entries (updated_at desc);

alter table public.database_entries enable row level security;

drop policy if exists "database_entries_authenticated_all" on public.database_entries;
create policy "database_entries_authenticated_all"
  on public.database_entries
  for all
  to authenticated
  using (true)
  with check (true);
