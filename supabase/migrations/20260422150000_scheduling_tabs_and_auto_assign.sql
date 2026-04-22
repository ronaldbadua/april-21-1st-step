-- Scheduling v2: associates master list, pooling rules, and monthly assignments.
-- Requires 20260421000000_initial_schema.sql (public.set_updated_at).

create table if not exists public.associates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  shift_type text not null check (shift_type in ('FHD', 'BHD', 'Part Time', 'Vacation')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pooling_rules (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null unique references public.associates(id) on delete cascade,
  allow_sun_wed_band boolean not null default false,
  allow_wed_sat_band boolean not null default false,
  allow_weekend_part_time boolean not null default false,
  is_ineligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_assignments (
  id uuid primary key default gen_random_uuid(),
  assignment_date date not null,
  role text not null check (role in ('main', 'pooling', 'backup')),
  slot_type text not null check (slot_type in ('FHD', 'BHD', 'Part Time', 'Vacation')),
  associate_id uuid references public.associates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_date, role)
);

create index if not exists idx_monthly_assignments_date on public.monthly_assignments(assignment_date);

drop trigger if exists associates_set_updated_at on public.associates;
create trigger associates_set_updated_at
  before update on public.associates
  for each row execute function public.set_updated_at();

drop trigger if exists pooling_rules_set_updated_at on public.pooling_rules;
create trigger pooling_rules_set_updated_at
  before update on public.pooling_rules
  for each row execute function public.set_updated_at();

drop trigger if exists monthly_assignments_set_updated_at on public.monthly_assignments;
create trigger monthly_assignments_set_updated_at
  before update on public.monthly_assignments
  for each row execute function public.set_updated_at();

alter table public.associates enable row level security;
alter table public.pooling_rules enable row level security;
alter table public.monthly_assignments enable row level security;

drop policy if exists "associates_authenticated_all" on public.associates;
drop policy if exists "pooling_rules_authenticated_all" on public.pooling_rules;
drop policy if exists "monthly_assignments_authenticated_all" on public.monthly_assignments;

create policy "associates_authenticated_all"
  on public.associates
  for all to authenticated
  using (true)
  with check (true);

create policy "pooling_rules_authenticated_all"
  on public.pooling_rules
  for all to authenticated
  using (true)
  with check (true);

create policy "monthly_assignments_authenticated_all"
  on public.monthly_assignments
  for all to authenticated
  using (true)
  with check (true);
