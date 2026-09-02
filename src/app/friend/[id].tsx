import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { HomeView } from '@/components/screens/home-view';
import { MoodView } from '@/components/screens/mood-view';
import { TimerView } from '@/components/screens/timer-view';
import { TodoView } from '@/components/screens/todo-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { fetchPermissionFor, fetchProfilesByIds } from '@/lib/friends-api';
import type { FriendPermission, PublicProfile } from '@/lib/types';

type PageKey = 'home' | 'timer' | 'todo' | 'mood';

const PAGES: {
  key: PageKey;
  label: string;
  permission: keyof Pick<FriendPermission, 'can_view_habits' | 'can_view_timer' | 'can_view_todo' | 'can_view_mood'>;
}[] = [
  { key: 'home', label: 'Home', permission: 'can_view_habits' },
  { key: 'timer', label: 'Timer', permission: 'can_view_timer' },
  { key: 'todo', label: 'Todo', permission: 'can_view_todo' },
  { key: 'mood', label: 'Mood', permission: 'can_view_mood' },
];

export default function FriendDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [friendProfile, setFriendProfile] = useState<PublicProfile | null>(null);
  const [grantedToMe, setGrantedToMe] = useState<FriendPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageKey | null>(null);

  const load = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    try {
      const [profiles, theirGrant] = await Promise.all([
        fetchProfilesByIds([id]),
        fetchPermissionFor(id, session.user.id),
      ]);
      setFriendProfile(profiles[0] ?? null);
      setGrantedToMe(theirGrant);
      navigation.setOptions({ title: profiles[0]?.display_name ?? 'Friend' });
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session, id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!grantedToMe) return;
    setActivePage((prev) => {
      if (prev && grantedToMe[PAGES.find((p) => p.key === prev)!.permission]) return prev;
      return PAGES.find((p) => grantedToMe[p.permission])?.key ?? null;
    });
  }, [grantedToMe]);

  if (loading || !friendProfile || !session || !id) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <DotsLoader />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const visiblePages = PAGES.filter((p) => grantedToMe?.[p.permission]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.headerRow}>
          <Avatar avatarKey={friendProfile.avatar_emoji} size={48} />
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText type="subtitle" style={styles.title}>
              {friendProfile.display_name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              @{friendProfile.username}
            </ThemedText>
          </View>
          <Pressable onPress={() => router.push(`/friend/${id}/settings`)} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
          </Pressable>
        </View>

        {visiblePages.length === 0 ? (
          <Card style={styles.card}>
            <ThemedText themeColor="textSecondary">
              {friendProfile.display_name} hasn't shared anything with you yet.
            </ThemedText>
          </Card>
        ) : (
          <>
            <View style={styles.segmented}>
              {visiblePages.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => setActivePage(p.key)}
                  style={[
                    styles.segment,
                    { backgroundColor: activePage === p.key ? theme.primary : theme.backgroundSelected },
                  ]}>
                  <ThemedText
                    type="small"
                    style={activePage === p.key ? { color: theme.onPrimary } : undefined}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={{ flex: 1 }}>
              {activePage === 'home' ? <HomeView userId={id} readOnly /> : null}
              {activePage === 'timer' ? <TimerView userId={id} readOnly /> : null}
              {activePage === 'todo' ? <TodoView userId={id} readOnly /> : null}
              {activePage === 'mood' ? (
                <MoodView userId={id} readOnly showPeriodLink={Boolean(grantedToMe?.can_view_period)} />
              ) : null}
            </View>
          </>
        )}
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
    gap: Spacing.three,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  title: { fontSize: 20 },
  card: { gap: Spacing.two },
  segmented: { flexDirection: 'row', gap: Spacing.two },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
});
