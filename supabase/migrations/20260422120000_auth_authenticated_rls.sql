-- Switch from open anon policies to authenticated-only access.
-- Run after 20260421000000_initial_schema.sql after enabling Email provider in Supabase Auth.
-- Adds chat audit column; only signed-in users (JWT role authenticated) can read/write app tables.

-- Audit: who sent each chat message (new rows only; old rows stay null)
alter table public.chat_messages
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.chat_messages
  alter column created_by set default auth.uid();

-- Drop permissive anon policies from initial migration
drop policy if exists "hourly_notes_anon_all" on public.hourly_notes;
drop policy if exists "chat_messages_anon_all" on public.chat_messages;
drop policy if exists "schedule_events_anon_all" on public.schedule_events;
drop policy if exists "process_path_items_anon_all" on public.process_path_items;

-- Idempotent: drop authenticated policies if re-running this migration
drop policy if exists "hourly_notes_authenticated_all" on public.hourly_notes;
drop policy if exists "chat_messages_authenticated_select" on public.chat_messages;
drop policy if exists "chat_messages_authenticated_insert" on public.chat_messages;
drop policy if exists "chat_messages_authenticated_delete" on public.chat_messages;
drop policy if exists "schedule_events_authenticated_all" on public.schedule_events;
drop policy if exists "process_path_items_authenticated_all" on public.process_path_items;

-- Workspace model: any signed-in ICQA user can manage shared data (tight vs anon, open within team)
create policy "hourly_notes_authenticated_all"
  on public.hourly_notes
  for all
  to authenticated
  using (true)
  with check (true);

create policy "chat_messages_authenticated_select"
  on public.chat_messages
  for select
  to authenticated
  using (true);

create policy "chat_messages_authenticated_insert"
  on public.chat_messages
  for insert
  to authenticated
  with check (coalesce(created_by, auth.uid()) = auth.uid());

create policy "chat_messages_authenticated_delete"
  on public.chat_messages
  for delete
  to authenticated
  using (true);

create policy "schedule_events_authenticated_all"
  on public.schedule_events
  for all
  to authenticated
  using (true)
  with check (true);

create policy "process_path_items_authenticated_all"
  on public.process_path_items
  for all
  to authenticated
  using (true)
  with check (true);
