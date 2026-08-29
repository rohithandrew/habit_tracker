import { toDateKey } from '@/lib/habits';
import { supabase } from '@/lib/supabase';
import type { MoodEntry } from '@/lib/types';

export async function fetchMoodHistory(userId: string, since: Date): Promise<MoodEntry[]> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', toDateKey(since))
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MoodEntry[];
}

export async function fetchTodayMood(userId: string): Promise<MoodEntry | null> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', toDateKey(new Date()))
    .maybeSingle();
  if (error) throw error;
  return data as MoodEntry | null;
}

export async function upsertMood(
  userId: string,
  dateKey: string,
  mood: 1 | 2 | 3 | 4 | 5,
  note: string | null
): Promise<MoodEntry> {
  const { data, error } = await supabase
    .from('mood_entries')
    .upsert({ user_id: userId, date: dateKey, mood, note }, { onConflict: 'user_id,date' })
    .select('*')
    .single();
  if (error) throw error;
  return data as MoodEntry;
}

/** Friend-facing: mood + note, via an RPC that checks can_view_mood itself. */
export async function fetchFriendMoodHistory(ownerId: string, since: Date) {
  const { data, error } = await supabase.rpc('get_shared_mood_entries', {
    target_owner: ownerId,
    since_date: toDateKey(since),
  });
  if (error) throw error;
  return (data ?? []) as MoodEntry[];
}
