import { supabase } from '@/lib/supabase';

/**
 * Gathers everything the user owns across tables for a data export. Friend
 * profile info intentionally isn't resolved here — this is the user's own
 * data, not a social graph dump.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [profile, habits, habitLogs, periodLogs, timerSessions, moodEntries, friendships, stickyNotesAuthored] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
      supabase.from('period_logs').select('*').eq('user_id', userId),
      supabase.from('timer_sessions').select('*').eq('user_id', userId),
      supabase.from('mood_entries').select('*').eq('user_id', userId),
      supabase.from('friendships').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase.from('sticky_notes').select('*').or(`author_id.eq.${userId},owner_id.eq.${userId}`),
    ]);

  return {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    habits: habits.data,
    habit_logs: habitLogs.data,
    period_logs: periodLogs.data,
    timer_sessions: timerSessions.data,
    mood_entries: moodEntries.data,
    friendships: friendships.data,
    sticky_notes: stickyNotesAuthored.data,
  };
}

/**
 * Deletes the profiles row, which cascades (via FK) to every table that
 * references it: habits, habit_logs, period_logs, timer_sessions,
 * mood_entries, friendships, friend_permissions, sticky_notes. The
 * underlying auth.users row (email/login) is untouched — deleting that
 * requires the service-role admin API, which only a backend can hold. If the
 * user signs back in, AuthProvider treats the missing profile as a fresh
 * account and restarts onboarding.
 */
export async function deleteAccountData(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}
