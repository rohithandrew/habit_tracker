import { supabase } from '@/lib/supabase';

/**
 * Deletes the profiles row, which cascades (via FK) to every table that
 * references it: habits, habit_logs, period_logs, timer_sessions,
 * mood_entries, friendships, friend_permissions, tasks, todos.
 * The underlying auth.users row (email/login) is untouched — deleting that
 * requires the service-role admin API, which only a backend can hold. If the
 * user signs back in, AuthProvider treats the missing profile as a fresh
 * account and restarts onboarding.
 *
 * Requires a delete policy on public.profiles (auth.uid() = id) — see
 * supabase/schema_profile_delete.sql. Without it RLS silently blocks the
 * delete (0 rows affected, no error), so this call would appear to succeed
 * while leaving all the data in place.
 */
export async function deleteAccountData(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}
