-- TRANSPOSER schema
-- Run in Supabase Dashboard -> SQL Editor

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) <= 200),
  original_key text not null default 'C',
  content text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists charts_user_id_idx on public.charts (user_id);
create index if not exists charts_updated_at_idx on public.charts (updated_at desc);

-- keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists charts_set_updated_at on public.charts;
create trigger charts_set_updated_at
  before update on public.charts
  for each row execute function public.set_updated_at();

alter table public.charts enable row level security;

revoke all on public.charts from anon, authenticated;
grant select on public.charts to anon;
grant select, insert, update, delete on public.charts to authenticated;

-- Owners: full CRUD on their own rows
create policy "Owners can read their charts"
  on public.charts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can insert their charts"
  on public.charts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can update their charts"
  on public.charts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners can delete their charts"
  on public.charts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Public read: anyone (incl. anon) can read rows flagged public
create policy "Public charts are readable"
  on public.charts for select
  to anon, authenticated
  using (is_public = true);
