import { supabase } from '@/lib/supabase';
import type { Friendship, FriendPermission, PublicProfile } from '@/lib/types';

export async function fetchFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  return (data ?? []) as Friendship[];
}

export async function fetchProfilesByIds(ids: string[]): Promise<PublicProfile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.rpc('get_related_profiles', { user_ids: ids });
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function findUserByUsername(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc('find_user_by_username', { search_username: username });
  if (error) throw error;
  const rows = (data ?? []) as PublicProfile[];
  return rows[0] ?? null;
}

export async function sendFriendRequest(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('send_friend_request', { target_id: targetId });
  if (error) throw error;
}

export async function respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_to_friend_request', {
    request_id: requestId,
    accept,
  });
  if (error) throw error;
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_friend_request', { request_id: requestId });
  if (error) throw error;
}

export async function unfriend(otherUserId: string): Promise<void> {
  const { error } = await supabase.rpc('unfriend', { other_user_id: otherUserId });
  if (error) throw error;
}

export async function blockUser(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { target_id: targetId });
  if (error) throw error;
}

export async function unblockUser(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { target_id: targetId });
  if (error) throw error;
}

export async function fetchPermissionFor(ownerId: string, friendId: string): Promise<FriendPermission | null> {
  const { data, error } = await supabase
    .from('friend_permissions')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('friend_id', friendId)
    .maybeSingle();
  if (error) throw error;
  return data as FriendPermission | null;
}

export async function updatePermission(
  ownerId: string,
  friendId: string,
  patch: Partial<
    Pick<FriendPermission, 'can_view_habits' | 'can_view_timer' | 'can_view_todo' | 'can_view_mood' | 'can_view_period'>
  >
): Promise<void> {
  const { error } = await supabase
    .from('friend_permissions')
    .update(patch)
    .eq('owner_id', ownerId)
    .eq('friend_id', friendId);
  if (error) throw error;
}
