-- Habit Tracker — Phase 8 settings columns (notifications, recap)
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql and schema_social.sql.
-- Safe to re-run.

alter table public.profiles add column if not exists weekly_recap_enabled boolean not null default false;
alter table public.profiles add column if not exists mood_reminder_time time;