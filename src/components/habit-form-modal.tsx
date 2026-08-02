import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitForm, type HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export function HabitFormModal({
  visible,
  title,
  initialValues,
  submitLabel,
  submitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  initialValues?: Partial<HabitFormValues>;
  submitLabel: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: HabitFormValues) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Close
              </ThemedText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <HabitForm
              initialValues={initialValues}
              submitLabel={submitLabel}
              submitting={submitting}
              onSubmit={onSubmit}
            />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  title: { fontSize: 20 },
  scroll: { paddingBottom: Spacing.six },
});
