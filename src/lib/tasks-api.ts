import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export async function fetchUpcomingTasks(userId: string, sinceDateKey: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceDateKey)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchAllTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(
  userId: string,
  dateKey: string,
  text: string,
  color: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, date: dateKey, text, color })
    .select('*')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}
