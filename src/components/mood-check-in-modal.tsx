import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOOD_EMOJIS, MOOD_LABELS } from '@/lib/types';

export function MoodCheckInModal({
  visible,
  onSelect,
  onSkip,
}: {
  visible: boolean;
  onSelect: (mood: 1 | 2 | 3 | 4 | 5) => void;
  onSkip: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle" style={styles.title}>
              How are you feeling today?
            </ThemedText>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map((m) => (
                <Pressable key={m} onPress={() => onSelect(m)} style={styles.moodButton}>
                  <ThemedText style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {MOOD_LABELS[m]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={onSkip} style={styles.skipButton}>
              <ThemedText type="small" themeColor="textSecondary">
                Skip today
              </ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center' },
  safeArea: { paddingHorizontal: Spacing.four, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  card: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.four },
  title: { fontSize: 20, textAlign: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: { alignItems: 'center', gap: Spacing.one, flex: 1 },
  moodEmoji: { fontSize: 32 },
  skipButton: { alignItems: 'center', paddingVertical: Spacing.two },
});
