import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { HomeView } from '@/components/screens/home-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { session, profile } = useAuth();

  if (!session) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const today = new Date();
  const dateLabel = `${today.toLocaleDateString(undefined, { weekday: 'long' })}, ${today.getDate()} ${today.toLocaleDateString(undefined, { month: 'long' })}, ${today.getFullYear()}`;
  const firstName = (profile?.display_name ?? '').split(' ')[0] || 'there';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <HomeView
          userId={session.user.id}
          headerSlot={
            <View style={styles.header}>
              <View style={{ flexShrink: 1, gap: Spacing.one }}>
                <ThemedText type="title" style={styles.headerTitle}>
                  {greeting}, {firstName}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.dateLabel}>
                  {dateLabel}
                </ThemedText>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/profile')}>
                <Avatar avatarKey={profile?.avatar_emoji} size={52} />
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
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
  },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  dateLabel: { fontWeight: '400', fontSize: 15 },
});
