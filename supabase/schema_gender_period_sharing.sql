-- Habit Tracker — adds a gender field (collected during onboarding, gates the
-- Period tracker feature to female users) and makes period data an optional,
-- off-by-default friend-shareable module like the rest.
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql and schema_social.sql.
-- Safe to re-run.

alter table public.profiles add column if not exists gender text check (gender in ('female', 'male', 'other'));

-- ============================================================
-- friend_permissions: add can_view_period, defaulting off (unlike the other
-- can_view_* columns, which default on) — period data has always been
-- explicitly opt-in only, never shared automatically.
-- ============================================================
alter table public.friend_permissions add column if not exists can_view_period boolean not null default false;

-- ============================================================
-- is_friend_permitted(): add a can_view_period branch.
-- ============================================================
create or replace function public.is_friend_permitted(target_owner uuid, permission_column text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  allowed boolean;
begin
  if permission_column = 'can_view_habits' then
    select can_view_habits into allowed from public.friend_permissions
      where owner_id = target_owner and friend_id = auth.uid();
  elsif permission_column = 'can_view_timer' then
    select can_view_timer into allowed from public.friend_permissions
      where owner_id = target_owner and friend_id = auth.uid();
  elsif permission_column = 'can_view_mood' then
    select can_view_mood into allowed from public.friend_permissions
      where owner_id = target_owner and friend_id = auth.uid();
  elsif permission_column = 'can_view_todo' then
    select can_view_todo into allowed from public.friend_permissions
      where owner_id = target_owner and friend_id = auth.uid();
  elsif permission_column = 'can_view_period' then
    select can_view_period into allowed from public.friend_permissions
      where owner_id = target_owner and friend_id = auth.uid();
  else
    return false;
  end if;

  return coalesce(allowed, false) and exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = auth.uid() and addressee_id = target_owner)
        or (requester_id = target_owner and addressee_id = auth.uid()))
  );
end;
$$;

-- ============================================================
-- Friend-facing read access to period_logs, gated on can_view_period.
-- Unlike mood_entries (which is intentionally RPC-only), period_logs gets a
-- real SELECT policy — same pattern as habits/timer/tasks/todos.
-- ============================================================
drop policy if exists "Friends can view shared period logs" on public.period_logs;
create policy "Friends can view shared period logs" on public.period_logs
  for select using (public.is_friend_permitted(user_id, 'can_view_period'));