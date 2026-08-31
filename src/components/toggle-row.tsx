import { StyleSheet, Switch, View, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToggleRowProps = {
  emoji?: string;
  title: string;
  titleStyle?: TextStyle;
  description?: string;
  descriptionStyle?: TextStyle;
  /** Short pill label next to the title, e.g. "Coming soon". */
  badge?: string;
  disabled?: boolean;
  /** Omit both to render the row without a switch, e.g. for a "coming soon" entry. */
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export function ToggleRow({
  emoji,
  title,
  titleStyle,
  description,
  descriptionStyle,
  badge,
  disabled,
  value,
  onValueChange,
}: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      {emoji ? <ThemedText style={styles.emoji}>{emoji}</ThemedText> : null}
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" style={titleStyle}>
            {title}
          </ThemedText>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.badgeText}>
                {badge}
              </ThemedText>
            </View>
          ) : null}
        </View>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary" style={descriptionStyle}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {onValueChange ? (
        <Switch
          value={value ?? false}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
          thumbColor="#FFFFFF"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  disabled: { opacity: 0.5 },
  emoji: { fontSize: 24 },
  text: { flex: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill },
  badgeText: { fontSize: 11 },
});
