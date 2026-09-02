import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PeriodView } from '@/components/screens/period-view';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function FriendPeriodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <PeriodView userId={id} readOnly />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});
