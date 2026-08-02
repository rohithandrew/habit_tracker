import { fromDateKey, toDateKey } from '@/lib/habits';
import type { PeriodLog } from '@/lib/types';

export interface PeriodPrediction {
  lastStart: Date;
  averageCycleLength: number;
  currentCycleDay: number;
  nextPeriodStart: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  ovulationDate: Date;
}

/** Rolling average over the last 3-6 logged cycles, per the spec. */
function averageCycleLength(logsDesc: PeriodLog[]): number {
  const recent = logsDesc.slice(0, 6);
  if (recent.length === 0) return 28;
  const sum = recent.reduce((acc, log) => acc + log.cycle_length_days, 0);
  return Math.round(sum / recent.length);
}

export function predictFromLogs(logsDesc: PeriodLog[], today: Date = new Date()): PeriodPrediction | null {
  if (logsDesc.length === 0) return null;

  const lastStart = fromDateKey(logsDesc[0].cycle_start_date);
  const cycleLength = averageCycleLength(logsDesc);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((today.getTime() - lastStart.getTime()) / msPerDay);
  const currentCycleDay = (daysSinceStart % cycleLength) + 1;

  const nextPeriodStart = new Date(lastStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);

  const ovulationOffset = cycleLength - 14;
  const ovulationDate = new Date(lastStart);
  ovulationDate.setDate(ovulationDate.getDate() + ovulationOffset);

  const fertileWindowStart = new Date(ovulationDate);
  fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
  const fertileWindowEnd = new Date(ovulationDate);
  fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

  return {
    lastStart,
    averageCycleLength: cycleLength,
    currentCycleDay,
    nextPeriodStart,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDate,
  };
}

export type PeriodDayKind = 'period' | 'fertile' | 'predicted' | null;

export function classifyDay(
  dateKey: string,
  logsDesc: PeriodLog[],
  prediction: PeriodPrediction | null
): PeriodDayKind {
  for (const log of logsDesc) {
    const start = fromDateKey(log.cycle_start_date);
    const length = log.period_length_days ?? 5;
    for (let i = 0; i < length; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (toDateKey(d) === dateKey) return 'period';
    }
  }

  if (!prediction) return null;

  if (dateKey === toDateKey(prediction.nextPeriodStart)) return 'predicted';

  const fertileStartKey = toDateKey(prediction.fertileWindowStart);
  const fertileEndKey = toDateKey(prediction.fertileWindowEnd);
  if (dateKey >= fertileStartKey && dateKey <= fertileEndKey) return 'fertile';

  return null;
}
