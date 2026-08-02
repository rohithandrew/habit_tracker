import { supabase } from '@/lib/supabase';
import type { TimerSession } from '@/lib/types';

export async function fetchActiveSession(userId: string): Promise<TimerSession | null> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data as TimerSession | null;
}

export async function fetchSessionHistory(userId: string, since: Date): Promise<TimerSession[]> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', false)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TimerSession[];
}

export async function startSession(userId: string, taskDescription: string): Promise<TimerSession> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .insert({ user_id: userId, task_description: taskDescription, is_active: true })
    .select('*')
    .single();
  if (error) throw error;
  return data as TimerSession;
}

export async function stopSession(sessionId: string, startedAt: string): Promise<TimerSession> {
  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
  );
  const { data, error } = await supabase
    .from('timer_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', sessionId)
    .select('*')
    .single();
  if (error) throw error;
  return data as TimerSession;
}

export async function fetchFriendActiveSession(ownerId: string): Promise<TimerSession | null> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', ownerId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data as TimerSession | null;
}
