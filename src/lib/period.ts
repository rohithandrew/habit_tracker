import { fromDateKey, toDateKey } from '@/lib/habits';
import type { PeriodLog } from '@/lib/types';

/** Above this, cycle-length variation is treated as "irregular" (e.g. PCOS) rather than
 * normal month-to-month wobble, and a single confident date stops being shown. */
const IRREGULAR_STD_DEV_THRESHOLD_DAYS = 4;

export interface PeriodPrediction {
  lastStart: Date;
  averageCycleLength: number;
  /** Population std deviation of the last up-to-6 logged cycle lengths; 0 with fewer than 2 logs. */
  cycleLengthStdDev: number;
  /** True once there are at least 2 logged cycles and they vary enough that a single
   * predicted date would be misleading — callers should show a range instead. */
  isIrregular: boolean;
  currentCycleDay: number;
  nextPeriodStart: Date;
  /** Earliest/latest plausible next start — same day as nextPeriodStart when not irregular. */
  nextPeriodRangeStart: Date;
  nextPeriodRangeEnd: Date;
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

function cycleLengthStdDev(logsDesc: PeriodLog[], mean: number): number {
  const recent = logsDesc.slice(0, 6);
  if (recent.length < 2) return 0;
  const variance =
    recent.reduce((acc, log) => acc + (log.cycle_length_days - mean) ** 2, 0) / recent.length;
  return Math.sqrt(variance);
}

export function predictFromLogs(logsDesc: PeriodLog[], today: Date = new Date()): PeriodPrediction | null {
  if (logsDesc.length === 0) return null;

  const lastStart = fromDateKey(logsDesc[0].cycle_start_date);
  const cycleLength = averageCycleLength(logsDesc);
  const stdDev = cycleLengthStdDev(logsDesc, cycleLength);
  const isIrregular = logsDesc.length >= 2 && stdDev > IRREGULAR_STD_DEV_THRESHOLD_DAYS;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((today.getTime() - lastStart.getTime()) / msPerDay);
  const currentCycleDay = (daysSinceStart % cycleLength) + 1;

  const nextPeriodStart = new Date(lastStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);

  const spread = Math.round(stdDev);
  const nextPeriodRangeStart = new Date(lastStart);
  nextPeriodRangeStart.setDate(nextPeriodRangeStart.getDate() + Math.max(1, cycleLength - spread));
  const nextPeriodRangeEnd = new Date(lastStart);
  nextPeriodRangeEnd.setDate(nextPeriodRangeEnd.getDate() + cycleLength + spread);

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
    cycleLengthStdDev: stdDev,
    isIrregular,
    currentCycleDay,
    nextPeriodStart,
    nextPeriodRangeStart,
    nextPeriodRangeEnd,
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

  if (prediction.isIrregular) {
    const rangeStartKey = toDateKey(prediction.nextPeriodRangeStart);
    const rangeEndKey = toDateKey(prediction.nextPeriodRangeEnd);
    if (dateKey >= rangeStartKey && dateKey <= rangeEndKey) return 'predicted';
  } else if (dateKey === toDateKey(prediction.nextPeriodStart)) {
    return 'predicted';
  }

  const fertileStartKey = toDateKey(prediction.fertileWindowStart);
  const fertileEndKey = toDateKey(prediction.fertileWindowEnd);
  if (dateKey >= fertileStartKey && dateKey <= fertileEndKey) return 'fertile';

  return null;
}
