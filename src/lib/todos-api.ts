import { supabase } from '@/lib/supabase';
import type { Todo } from '@/lib/types';

export async function fetchTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Todo[];
}

export async function createTodo(userId: string, text: string): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, text })
    .select('*')
    .single();
  if (error) throw error;
  return data as Todo;
}

export async function toggleTodo(id: string, done: boolean): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update({ done })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
}
