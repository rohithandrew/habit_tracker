import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToggleRowProps = {
  emoji?: string;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ emoji, title, description, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {emoji ? <ThemedText style={styles.emoji}>{emoji}</ThemedText> : null}
      <View style={styles.text}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  emoji: { fontSize: 24 },
  text: { flex: 1, gap: 2 },
});
