import AsyncStorage from '@react-native-async-storage/async-storage';

import { toDateKey } from '@/lib/habits';

const KEY = 'habit-tracker/mood-prompt-skipped-date';

/** Marks today as "skip this prompt" so it doesn't reappear until tomorrow. */
export async function skipMoodPromptToday(): Promise<void> {
  await AsyncStorage.setItem(KEY, toDateKey(new Date()));
}

export async function wasMoodPromptSkippedToday(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === toDateKey(new Date());
}
