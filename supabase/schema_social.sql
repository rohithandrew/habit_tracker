-- Habit Tracker — Phase 3-6 schema (friends, permissions, sticky notes, timer, mood)
-- Run this in Supabase Dashboard -> SQL Editor, AFTER schema.sql.
-- Safe to re-run.

-- ============================================================
-- friendships
-- status: pending | accepted | declined | blocked
-- A 'blocked' row means requester_id blocked addressee_id.
-- ============================================================
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

alter table public.friendships enable row level security;

drop policy if exists "Users see friendships they are part of" on public.friendships;
create policy "Users see friendships they are part of" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- All writes go through the security-definer functions below, which enforce
-- the actual business rules (no duplicate requests, blocked users can't
-- re-request, etc). Direct table writes are intentionally not exposed.

-- ============================================================
-- friend_permissions — one row per (owner, friend) direction.
-- Created by respond_to_friend_request() when a request is accepted.
-- can_view_period does not exist as a column: period data has no
-- friend-facing permission at all, anywhere (see §9/§13 of the spec).
-- ============================================================
create table if not exists public.friend_permissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  can_view_habits boolean not null default true,
  can_view_timer boolean not null default true,
  can_view_mood boolean not null default false,
  can_comment boolean not null default true,
  unique (owner_id, friend_id),
  check (owner_id <> friend_id)
);

alter table public.friend_permissions enable row level security;

drop policy if exists "Owners manage permissions they grant" on public.friend_permissions;
create policy "Owners manage permissions they grant" on public.friend_permissions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Friends can see what they were granted" on public.friend_permissions;
create policy "Friends can see what they were granted" on public.friend_permissions
  for select using (auth.uid() = friend_id);

-- ============================================================
-- Friend request lifecycle — business logic lives here, not in the client,
-- so it can't be bypassed by a manipulated request.
-- ============================================================

create or replace function public.find_user_by_username(search_username text)
returns table (id uuid, username text, display_name text, avatar_emoji text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_emoji
  from public.profiles p
  where lower(p.username) = lower(search_username)
    and p.id <> auth.uid();
$$;

grant execute on function public.find_user_by_username(text) to authenticated;

-- Lets the client resolve display info for people it has a friendship row
-- with (any status) — e.g. rendering names on the friend list and incoming
-- request cards — without a general "browse all profiles" hole.
create or replace function public.get_related_profiles(user_ids uuid[])
returns table (id uuid, username text, display_name text, avatar_emoji text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_emoji
  from public.profiles p
  where p.id = any(user_ids)
    and exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = p.id)
         or (f.requester_id = p.id and f.addressee_id = auth.uid())
    );
$$;

grant execute on function public.get_related_profiles(uuid[]) to authenticated;

create or replace function public.send_friend_request(target_id uuid)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.friendships;
begin
  if target_id = auth.uid() then
    raise exception 'Cannot friend yourself';
  end if;

  if exists (
    select 1 from public.friendships
    where status = 'blocked'
      and ((requester_id = auth.uid() and addressee_id = target_id)
        or (requester_id = target_id and addressee_id = auth.uid()))
  ) then
    raise exception 'Cannot send request to this user';
  end if;

  if exists (
    select 1 from public.friendships
    where status in ('pending', 'accepted')
      and ((requester_id = auth.uid() and addressee_id = target_id)
        or (requester_id = target_id and addressee_id = auth.uid()))
  ) then
    raise exception 'A request or friendship already exists';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (auth.uid(), target_id, 'pending')
  returning * into result;

  return result;
end;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_to_friend_request(request_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.friendships;
begin
  select * into req from public.friendships
  where id = request_id and addressee_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'Request not found';
  end if;

  if accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = request_id;

    insert into public.friend_permissions (owner_id, friend_id)
    values (req.requester_id, req.addressee_id)
    on conflict (owner_id, friend_id) do nothing;

    insert into public.friend_permissions (owner_id, friend_id)
    values (req.addressee_id, req.requester_id)
    on conflict (owner_id, friend_id) do nothing;
  else
    update public.friendships set status = 'declined', responded_at = now() where id = request_id;
  end if;
end;
$$;

grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;

create or replace function public.cancel_friend_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friendships
  where id = request_id and requester_id = auth.uid() and status = 'pending';
end;
$$;

grant execute on function public.cancel_friend_request(uuid) to authenticated;

create or replace function public.unfriend(other_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friend_permissions
  where (owner_id = auth.uid() and friend_id = other_user_id)
     or (owner_id = other_user_id and friend_id = auth.uid());

  delete from public.friendships
  where status = 'accepted'
    and ((requester_id = auth.uid() and addressee_id = other_user_id)
      or (requester_id = other_user_id and addressee_id = auth.uid()));
end;
$$;

grant execute on function public.unfriend(uuid) to authenticated;

create or replace function public.block_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friend_permissions
  where (owner_id = auth.uid() and friend_id = target_id)
     or (owner_id = target_id and friend_id = auth.uid());

  delete from public.friendships
  where (requester_id = auth.uid() and addressee_id = target_id)
     or (requester_id = target_id and addressee_id = auth.uid());

  insert into public.friendships (requester_id, addressee_id, status, responded_at)
  values (auth.uid(), target_id, 'blocked', now());
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friendships
  where requester_id = auth.uid() and addressee_id = target_id and status = 'blocked';
end;
$$;

grant execute on function public.unblock_user(uuid) to authenticated;

-- ============================================================
-- Friend-facing read access to habits / habit_logs / timer_sessions.
-- Gated on: an accepted friendship AND the specific permission flag.
-- Nothing equivalent is ever added for period_logs.
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

grant execute on function public.is_friend_permitted(uuid, text) to authenticated;

drop policy if exists "Friends can view shared habits" on public.habits;
create policy "Friends can view shared habits" on public.habits
  for select using (public.is_friend_permitted(user_id, 'can_view_habits'));

drop policy if exists "Friends can view shared habit logs" on public.habit_logs;
create policy "Friends can view shared habit logs" on public.habit_logs
  for select using (public.is_friend_permitted(user_id, 'can_view_habits'));

-- ============================================================
-- timer_sessions
-- ============================================================
create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_description text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  is_active boolean not null default true
);

create index if not exists timer_sessions_user_idx on public.timer_sessions(user_id, started_at desc);

alter table public.timer_sessions enable row level security;

drop policy if exists "Users manage their own timer sessions" on public.timer_sessions;
create policy "Users manage their own timer sessions" on public.timer_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Friends can view shared timer sessions" on public.timer_sessions;
create policy "Friends can view shared timer sessions" on public.timer_sessions
  for select using (public.is_friend_permitted(user_id, 'can_view_timer'));

-- ============================================================
-- mood_entries
-- Friends never see `note`, even when mood sharing is on: they can only
-- query the mood_entries_public view below, which excludes it. There is
-- no friend-facing RLS policy on the base table at all.
-- ============================================================
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  mood smallint not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists mood_entries_user_date_idx on public.mood_entries(user_id, date);

alter table public.mood_entries enable row level security;

drop policy if exists "Users manage their own mood entries" on public.mood_entries;
create policy "Users manage their own mood entries" on public.mood_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.mood_entries_public
with (security_invoker = true)
as
  select id, user_id, date, mood, created_at
  from public.mood_entries;

drop policy if exists "Friends can view shared mood entries" on public.mood_entries;
create policy "Friends can view shared mood entries" on public.mood_entries
  for select using (public.is_friend_permitted(user_id, 'can_view_mood'));

-- ============================================================
-- sticky_notes
-- ============================================================
create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('habit_grid', 'timer_session', 'mood_calendar')),
  target_id uuid,
  position_x real not null default 0.5,
  position_y real not null default 0.5,
  color text not null default '#FFE58A',
  text text not null,
  created_at timestamptz not null default now(),
  check (author_id <> owner_id)
);

create index if not exists sticky_notes_owner_idx on public.sticky_notes(owner_id, target_type);
create index if not exists sticky_notes_author_idx on public.sticky_notes(author_id);

alter table public.sticky_notes enable row level security;

drop policy if exists "Owner sees notes from currently-accepted friends" on public.sticky_notes;
create policy "Owner sees notes from currently-accepted friends" on public.sticky_notes
  for select using (
    owner_id = auth.uid()
    and exists (
      select 1 from public.friendships
      where status = 'accepted'
        and ((requester_id = auth.uid() and addressee_id = sticky_notes.author_id)
          or (requester_id = sticky_notes.author_id and addressee_id = auth.uid()))
    )
  );

drop policy if exists "Authors see their own notes" on public.sticky_notes;
create policy "Authors see their own notes" on public.sticky_notes
  for select using (author_id = auth.uid());

drop policy if exists "Friends can leave notes where permitted" on public.sticky_notes;
create policy "Friends can leave notes where permitted" on public.sticky_notes
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.friend_permissions
      where owner_id = sticky_notes.owner_id and friend_id = auth.uid() and can_comment = true
    )
    and (
      (target_type = 'habit_grid' and public.is_friend_permitted(owner_id, 'can_view_habits'))
      or (target_type = 'timer_session' and public.is_friend_permitted(owner_id, 'can_view_timer'))
      or (target_type = 'mood_calendar' and public.is_friend_permitted(owner_id, 'can_view_mood'))
    )
  );

drop policy if exists "Authors edit their own note within 15 minutes" on public.sticky_notes;
create policy "Authors edit their own note within 15 minutes" on public.sticky_notes
  for update using (author_id = auth.uid() and created_at > now() - interval '15 minutes')
  with check (author_id = auth.uid());

drop policy if exists "Owner or recent author can delete a note" on public.sticky_notes;
create policy "Owner or recent author can delete a note" on public.sticky_notes
  for delete using (
    owner_id = auth.uid()
    or (author_id = auth.uid() and created_at > now() - interval '15 minutes')
  );
