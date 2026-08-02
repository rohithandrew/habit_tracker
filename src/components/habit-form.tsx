import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { MonthCalendar } from '@/components/month-calendar';
import { ScheduleTypePicker } from '@/components/schedule-type-picker';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { TimePicker } from '@/components/time-picker';
import { ToggleRow } from '@/components/toggle-row';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey, weekdayLabel } from '@/lib/habits';
import { HABIT_COLORS, HABIT_EMOJIS } from '@/lib/types';
import type { ScheduleData, ScheduleType, Weekday } from '@/lib/types';

export interface HabitFormValues {
  title: string;
  emoji: string;
  colorTag: string;
  scheduleType: ScheduleType;
  scheduleData: ScheduleData;
  reminderTime: string | null;
}

const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

function defaultScheduleData(type: ScheduleType, today: string): ScheduleData {
  switch (type) {
    case 'daily':
      return { type: 'daily' };
    case 'weekdays':
      return { type: 'weekdays', days: [1, 2, 3, 4, 5] };
    case 'x_per_week':
      return { type: 'x_per_week', timesPerWeek: 3 };
    case 'single_day':
      return { type: 'single_day', date: today };
    case 'date_range':
      return { type: 'date_range', startDate: today, endDate: today };
  }
}

export function HabitForm({
  initialValues,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<HabitFormValues>;
  submitLabel: string;
  onSubmit: (values: HabitFormValues) => void;
  submitting?: boolean;
}) {
  const theme = useTheme();
  const todayKey = toDateKey(new Date());

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [emoji, setEmoji] = useState(initialValues?.emoji ?? HABIT_EMOJIS[0]);
  const [colorTag, setColorTag] = useState(initialValues?.colorTag ?? HABIT_COLORS[0]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    initialValues?.scheduleType ?? 'daily'
  );
  const [scheduleData, setScheduleData] = useState<ScheduleData>(
    initialValues?.scheduleData ?? defaultScheduleData(scheduleType, todayKey)
  );
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(initialValues?.reminderTime));
  const [reminderTime, setReminderTime] = useState(initialValues?.reminderTime ?? '09:00');

  function changeScheduleType(type: ScheduleType) {
    setScheduleType(type);
    setScheduleData(defaultScheduleData(type, todayKey));
  }

  function toggleWeekday(day: Weekday) {
    if (scheduleData.type !== 'weekdays') return;
    const has = scheduleData.days.includes(day);
    const days = has ? scheduleData.days.filter((d) => d !== day) : [...scheduleData.days, day];
    setScheduleData({ type: 'weekdays', days });
  }

  const canSubmit =
    title.trim().length > 0 &&
    !(scheduleData.type === 'weekdays' && scheduleData.days.length === 0) &&
    !(
      scheduleData.type === 'date_range' &&
      scheduleData.startDate > scheduleData.endDate
    );

  return (
    <View style={styles.form}>
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Drink water" />

      <View>
        <ThemedText type="smallBold" style={styles.label}>
          Icon
        </ThemedText>
        <View style={styles.grid}>
          {HABIT_EMOJIS.map((e) => {
            const selected = e === emoji;
            return (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiCell,
                  { backgroundColor: selected ? theme.primary : theme.backgroundSelected },
                ]}>
                <ThemedText style={styles.emojiText}>{e}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <ThemedText type="smallBold" style={styles.label}>
          Color
        </ThemedText>
        <View style={styles.grid}>
          {HABIT_COLORS.map((color) => {
            const selected = color === colorTag;
            return (
              <Pressable
                key={color}
                onPress={() => setColorTag(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selected && { borderWidth: 3, borderColor: theme.text },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View>
        <ThemedText type="smallBold" style={styles.label}>
          Schedule
        </ThemedText>
        <ScheduleTypePicker value={scheduleType} onChange={changeScheduleType} />
      </View>

      {scheduleData.type === 'weekdays' && (
        <View style={styles.grid}>
          {ALL_WEEKDAYS.map((day) => {
            const selected = scheduleData.days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleWeekday(day)}
                style={[
                  styles.dayChip,
                  { backgroundColor: selected ? theme.primary : theme.backgroundSelected },
                ]}>
                <ThemedText type="small" style={selected ? { color: '#fff' } : undefined}>
                  {weekdayLabel(day)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}

      {scheduleData.type === 'x_per_week' && (
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}
            onPress={() =>
              setScheduleData({
                type: 'x_per_week',
                timesPerWeek: Math.max(1, scheduleData.timesPerWeek - 1),
              })
            }>
            <ThemedText type="smallBold">−</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.stepperValue}>
            {scheduleData.timesPerWeek}
          </ThemedText>
          <Pressable
            style={[styles.stepperButton, { backgroundColor: theme.backgroundSelected }]}
            onPress={() =>
              setScheduleData({
                type: 'x_per_week',
                timesPerWeek: Math.min(7, scheduleData.timesPerWeek + 1),
              })
            }>
            <ThemedText type="smallBold">+</ThemedText>
          </Pressable>
          <ThemedText themeColor="textSecondary">times a week</ThemedText>
        </View>
      )}

      {scheduleData.type === 'single_day' && (
        <MonthCalendar
          selectedDate={scheduleData.date}
          minDate={todayKey}
          onSelectDate={(date) => setScheduleData({ type: 'single_day', date })}
        />
      )}

      {scheduleData.type === 'date_range' && (
        <View style={{ gap: Spacing.three }}>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              Start date
            </ThemedText>
            <MonthCalendar
              selectedDate={scheduleData.startDate}
              minDate={todayKey}
              onSelectDate={(date) =>
                setScheduleData({
                  type: 'date_range',
                  startDate: date,
                  endDate: scheduleData.endDate < date ? date : scheduleData.endDate,
                })
              }
            />
          </View>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              End date
            </ThemedText>
            <MonthCalendar
              selectedDate={scheduleData.endDate}
              minDate={scheduleData.startDate}
              onSelectDate={(date) =>
                setScheduleData({ type: 'date_range', startDate: scheduleData.startDate, endDate: date })
              }
            />
          </View>
        </View>
      )}

      <View>
        <ThemedText type="smallBold" style={styles.label}>
          Reminder
        </ThemedText>
        <ToggleRow
          emoji="🔔"
          title="Daily reminder"
          description="A local notification at a time you pick."
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
        />
        {reminderEnabled && (
          <View style={{ marginTop: Spacing.two }}>
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </View>
        )}
      </View>

      <Button
        label={submitLabel}
        disabled={!canSubmit}
        loading={submitting}
        onPress={() =>
          onSubmit({
            title: title.trim(),
            emoji,
            colorTag,
            scheduleType,
            scheduleData,
            reminderTime: reminderEnabled ? reminderTime : null,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  label: { marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22 },
  colorSwatch: { width: 36, height: 36, borderRadius: Radius.pill },
  dayChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 24, minWidth: 40, textAlign: 'center' },
});
