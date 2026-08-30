-- Habit Tracker — global habit reminder setting + standalone Todo list feature
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql.
-- Safe to re-run.

alter table public.profiles add column if not exists habit_reminder_time time;
alter table public.profiles add column if not exists todo_enabled boolean not null default true;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_idx on public.todos(user_id, created_at);

alter table public.todos enable row level security;

drop policy if exists "Users manage their own todos" on public.todos;
create policy "Users manage their own todos" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
