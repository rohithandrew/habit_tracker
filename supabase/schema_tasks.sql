-- Habit Tracker — daily tasks (simple date + text to-dos shown on the Home calendar widget)
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql.
-- Safe to re-run.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  text text not null,
  color text not null default '#7C9DFF',
  created_at timestamptz not null default now()
);

alter table public.tasks add column if not exists color text not null default '#7C9DFF';

create index if not exists tasks_user_date_idx on public.tasks(user_id, date);

alter table public.tasks enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);