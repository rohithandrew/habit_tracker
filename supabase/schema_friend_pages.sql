-- Habit Tracker — friend page sharing: adds a Todo permission so friends can see
-- your Home/Timer/Todo/Mood pages, and removes the sticky notes feature.
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql, schema_social.sql,
-- schema_tasks.sql, and schema_todo.sql.
-- Safe to re-run.

-- ============================================================
-- Remove sticky notes entirely (table + its 5 RLS policies, dropped with it).
-- ============================================================
drop table if exists public.sticky_notes;

-- ============================================================
-- friend_permissions: drop can_comment (sticky notes only), add can_view_todo.
-- respond_to_friend_request() only inserts owner_id/friend_id, so new rows
-- pick up can_view_todo's default automatically — no change needed there.
-- ============================================================
alter table public.friend_permissions drop column if exists can_comment;
alter table public.friend_permissions add column if not exists can_view_todo boolean not null default true;

-- ============================================================
-- is_friend_permitted(): add a can_view_todo branch.
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
-- Friend-facing read access to tasks & todos — neither table had any
-- friend-facing RLS policy before this. Re-issuing "Users manage their own
-- tasks" here too, since the copy in schema_tasks.sql had a typo
-- ("au th.uid()") that made the statement invalid SQL.
-- ============================================================
drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Friends can view shared tasks" on public.tasks;
create policy "Friends can view shared tasks" on public.tasks
  for select using (public.is_friend_permitted(user_id, 'can_view_todo'));

drop policy if exists "Friends can view shared todos" on public.todos;
create policy "Friends can view shared todos" on public.todos
  for select using (public.is_friend_permitted(user_id, 'can_view_todo'));
