-- Habit Tracker — fixes "friend mood notes never show up".
-- The deployed get_shared_mood_entries() was missing `note` from both its
-- RETURNS TABLE and its SELECT list (confirmed via pg_get_functiondef), even
-- though schema_social.sql already had the correct version on disk — that
-- fixed copy never actually got run against this database. Friends' mood
-- values came through fine; only the note text was silently dropped.
-- Run this in Supabase Dashboard -> SQL Editor.
-- Safe to re-run.

-- Postgres won't let CREATE OR REPLACE change a function's return row shape
-- (adding a column counts as a change), so the old version has to be dropped
-- first.
drop function if exists public.get_shared_mood_entries(uuid, date);

create or replace function public.get_shared_mood_entries(target_owner uuid, since_date date)
returns table (id uuid, user_id uuid, date date, mood smallint, note text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select m.id, m.user_id, m.date, m.mood, m.note, m.created_at
  from public.mood_entries m
  where m.user_id = target_owner
    and m.date >= since_date
    and public.is_friend_permitted(target_owner, 'can_view_mood')
  order by m.date asc;
$$;

grant execute on function public.get_shared_mood_entries(uuid, date) to authenticated;