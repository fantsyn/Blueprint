-- Blueprint · Supabase setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run

-- 1) Profile metadata (optional, name display)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Full app state as JSON (profile, agenda, journal, nutrition)
--    Simple, reliable cross-device sync for the MVP.
create table if not exists public.user_blueprints (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Auto-create profile row when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_blueprints (user_id, data)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_blueprints enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "blueprints_select_own" on public.user_blueprints;
drop policy if exists "blueprints_insert_own" on public.user_blueprints;
drop policy if exists "blueprints_update_own" on public.user_blueprints;
drop policy if exists "blueprints_delete_own" on public.user_blueprints;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "blueprints_select_own" on public.user_blueprints
  for select using (auth.uid() = user_id);
create policy "blueprints_insert_own" on public.user_blueprints
  for insert with check (auth.uid() = user_id);
create policy "blueprints_update_own" on public.user_blueprints
  for update using (auth.uid() = user_id);
create policy "blueprints_delete_own" on public.user_blueprints
  for delete using (auth.uid() = user_id);
