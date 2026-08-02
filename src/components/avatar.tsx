import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Avatar({ emoji, size = 44 }: { emoji: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: Radius.pill, backgroundColor: theme.primarySoft },
      ]}>
      <ThemedText style={{ fontSize: size * 0.5 }}>{emoji}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
