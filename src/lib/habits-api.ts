import { toDateKey } from '@/lib/habits';
import { supabase } from '@/lib/supabase';
import type { Habit, HabitLog } from '@/lib/types';
import type { HabitFormValues } from '@/components/habit-form';

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

/** Fetches logs from `since` (inclusive) to today, for building the weekly card and contribution grid. */
export async function fetchHabitLogs(userId: string, since: Date): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', toDateKey(since));
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

export async function fetchHabitById(habitId: string): Promise<Habit> {
  const { data, error } = await supabase.from('habits').select('*').eq('id', habitId).single();
  if (error) throw error;
  return data as Habit;
}

export async function fetchLogsForHabit(habitId: string, since: Date): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', toDateKey(since))
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

export async function createHabit(userId: string, values: HabitFormValues): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      title: values.title,
      emoji: values.emoji,
      color_tag: values.colorTag,
      schedule_type: values.scheduleType,
      schedule_data: values.scheduleData,
      reminder_time: values.reminderTime,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function updateHabit(habitId: string, values: HabitFormValues): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update({
      title: values.title,
      emoji: values.emoji,
      color_tag: values.colorTag,
      schedule_type: values.scheduleType,
      schedule_data: values.scheduleData,
      reminder_time: values.reminderTime,
    })
    .eq('id', habitId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) throw error;
}

export async function setHabitArchived(habitId: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from('habits').update({ archived }).eq('id', habitId);
  if (error) throw error;
}

/** Toggles a day between 'done' and not-logged (deletes the row). */
export async function toggleHabitLog(
  userId: string,
  habitId: string,
  dateKey: string,
  currentlyDone: boolean
): Promise<void> {
  if (currentlyDone) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', dateKey);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('habit_logs').upsert(
    {
      habit_id: habitId,
      user_id: userId,
      date: dateKey,
      status: 'done',
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'habit_id,date' }
  );
  if (error) throw error;
}
