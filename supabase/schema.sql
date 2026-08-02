-- Habit Tracker — Phase 1-2 schema (profiles, habits, habit_logs)
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: guards with `if not exists` / `drop ... if exists` where practical.

-- ============================================================
-- profiles (one row per auth.users row, created client-side on sign up)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_emoji text not null default '🙂',
  mood_tracking_enabled boolean not null default false,
  period_tracking_enabled boolean not null default false,
  timer_tracking_enabled boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness; multiple NULLs are allowed (before username is chosen).
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Lets the client check username availability without being able to read other
-- users' full profile rows (the `profiles` select policy is owner-only above).
create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(check_username)
  );
$$;

grant execute on function public.is_username_available(text) to authenticated;

-- ============================================================
-- habits
-- ============================================================
do $$ begin
  create type schedule_type as enum ('daily', 'weekdays', 'x_per_week', 'date_range', 'single_day');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  emoji text not null default '✅',
  color_tag text not null default '#7C9DFF',
  schedule_type schedule_type not null,
  schedule_data jsonb not null default '{}'::jsonb,
  reminder_time time,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);

alter table public.habits enable row level security;

drop policy if exists "Users manage their own habits" on public.habits;
create policy "Users manage their own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- habit_logs
-- ============================================================
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  status text not null check (status in ('done', 'skipped', 'missed')),
  completed_at timestamptz,
  unique (habit_id, date)
);

create index if not exists habit_logs_habit_id_idx on public.habit_logs(habit_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, date);

alter table public.habit_logs enable row level security;

drop policy if exists "Users manage their own habit logs" on public.habit_logs;
create policy "Users manage their own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- period_logs — collected during onboarding if the user opts in.
-- No friend-facing read policy exists here, intentionally, and none should
-- ever be added (see HABIT_APP_SPEC.md §9/§13): this data is owner-only,
-- structurally, at the database layer, not just hidden in the UI.
-- The prediction calculator UI itself is a later phase; this table only
-- persists what onboarding collects so that data isn't thrown away.
-- ============================================================
create table if not exists public.period_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cycle_start_date date not null,
  cycle_length_days integer not null default 28,
  period_length_days integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists period_logs_user_id_idx on public.period_logs(user_id);

alter table public.period_logs enable row level security;

drop policy if exists "Users manage their own period logs" on public.period_logs;
create policy "Users manage their own period logs" on public.period_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
