import { supabase } from '@/lib/supabase';
import type { PeriodLog } from '@/lib/types';

export async function fetchPeriodLogs(userId: string): Promise<PeriodLog[]> {
  const { data, error } = await supabase
    .from('period_logs')
    .select('*')
    .eq('user_id', userId)
    .order('cycle_start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PeriodLog[];
}

export async function logPeriodStart(
  userId: string,
  cycleStartDate: string,
  cycleLengthDays: number,
  periodLengthDays: number | null
): Promise<PeriodLog> {
  const { data, error } = await supabase
    .from('period_logs')
    .insert({
      user_id: userId,
      cycle_start_date: cycleStartDate,
      cycle_length_days: cycleLengthDays,
      period_length_days: periodLengthDays,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PeriodLog;
}
