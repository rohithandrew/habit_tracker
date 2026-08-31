import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TodoView } from '@/components/screens/todo-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TodoScreen() {
  const { session, profile } = useAuth();

  if (!session || !profile) return null;

  if (!profile.todo_enabled) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ThemedText style={{ fontSize: 48 }}>📝</ThemedText>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.three }}>
            Todo list is off
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Turn it on from Profile → Health to start adding tasks.
          </ThemedText>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ marginTop: Spacing.four }}>
            <ThemedText themeColor="accent" type="smallBold">
              Go to Profile
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TodoView userId={session.user.id} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
});
