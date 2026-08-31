-- Habit Tracker — fixes "Delete all my data" silently doing nothing.
-- profiles had select/insert/update policies but no delete policy, so
-- `.from('profiles').delete()` was blocked by RLS with 0 rows affected and
-- no error — the app would sign the user out believing deletion succeeded,
-- while every row remained in the database.
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql.
-- Safe to re-run.

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile" on public.profiles
  for delete using (auth.uid() = id);