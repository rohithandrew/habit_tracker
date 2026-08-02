import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { ContributionGrid, ContributionLegend } from '@/components/contribution-grid';
import { MoodHistoryStrip } from '@/components/mood-history-strip';
import { StickyNotesCanvas } from '@/components/sticky-notes-canvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  blockUser,
  fetchPermissionFor,
  fetchProfilesByIds,
  unfriend,
  updatePermission,
} from '@/lib/friends-api';
import { fetchHabitLogs } from '@/lib/habits-api';
import { fetchFriendMoodHistory } from '@/lib/mood-api';
import { fetchStickyNotes } from '@/lib/sticky-notes-api';
import { fetchFriendActiveSession } from '@/lib/timer-api';
import type { FriendPermission, HabitLog, MoodEntry, PublicProfile, StickyNote, TimerSession } from '@/lib/types';

export default function FriendDetailScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [friendProfile, setFriendProfile] = useState<PublicProfile | null>(null);
  const [grantedByMe, setGrantedByMe] = useState<FriendPermission | null>(null);
  const [grantedToMe, setGrantedToMe] = useState<FriendPermission | null>(null);
  const [loading, setLoading] = useState(true);

  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [activeSession, setActiveSession] = useState<TimerSession | null>(null);
  const [moodHistory, setMoodHistory] = useState<Omit<MoodEntry, 'note'>[]>([]);

  const load = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    try {
      const [profiles, myGrant, theirGrant] = await Promise.all([
        fetchProfilesByIds([id]),
        fetchPermissionFor(session.user.id, id),
        fetchPermissionFor(id, session.user.id),
      ]);
      setFriendProfile(profiles[0] ?? null);
      setGrantedByMe(myGrant);
      setGrantedToMe(theirGrant);
      navigation.setOptions({ title: profiles[0]?.display_name ?? 'Friend' });

      const since = new Date();
      since.setDate(since.getDate() - 14 * 7);

      if (theirGrant?.can_view_habits) {
        const [logs, notes] = await Promise.all([
          fetchHabitLogs(id, since),
          fetchStickyNotes(id, 'habit_grid'),
        ]);
        setHabitLogs(logs);
        setStickyNotes(notes);
      }
      if (theirGrant?.can_view_timer) {
        setActiveSession(await fetchFriendActiveSession(id));
      }
      if (theirGrant?.can_view_mood) {
        setMoodHistory(await fetchFriendMoodHistory(id, since));
      }
    } catch (err) {
      Alert.alert('Could not load', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session, id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePermission(
    key: keyof Pick<FriendPermission, 'can_view_habits' | 'can_view_timer' | 'can_view_mood' | 'can_comment'>,
    value: boolean
  ) {
    if (!session || !id || !grantedByMe) return;
    const previous = grantedByMe;
    setGrantedByMe({ ...grantedByMe, [key]: value });
    try {
      await updatePermission(session.user.id, id, { [key]: value });
    } catch (err) {
      setGrantedByMe(previous);
      Alert.alert('Could not update', err instanceof Error ? err.message : String(err));
    }
  }

  function confirmUnfriend() {
    if (!id) return;
    Alert.alert('Unfriend?', `You'll stop sharing data with ${friendProfile?.display_name ?? 'this person'}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfriend',
        style: 'destructive',
        onPress: async () => {
          try {
            await unfriend(id);
            router.back();
          } catch (err) {
            Alert.alert('Could not unfriend', err instanceof Error ? err.message : String(err));
          }
        },
      },
    ]);
  }

  function confirmBlock() {
    if (!id) return;
    Alert.alert(
      'Block this person?',
      'They will no longer be able to send you friend requests, and your data will no longer be shared with them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(id);
              router.back();
            } catch (err) {
              Alert.alert('Could not block', err instanceof Error ? err.message : String(err));
            }
          },
        },
      ]
    );
  }

  if (loading || !grantedByMe || !friendProfile || !session) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary">Loading…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const sharesAnything = grantedToMe?.can_view_habits || grantedToMe?.can_view_timer || grantedToMe?.can_view_mood;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Avatar emoji={friendProfile.avatar_emoji} size={56} />
            <View>
              <ThemedText type="subtitle" style={styles.title}>
                {friendProfile.display_name}
              </ThemedText>
              <ThemedText themeColor="textSecondary">@{friendProfile.username}</ThemedText>
            </View>
          </View>

          {grantedToMe?.can_view_habits ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold">Activity</ThemedText>
              <StickyNotesCanvas
                notes={stickyNotes}
                currentUserId={session.user.id}
                ownerId={id}
                targetType="habit_grid"
                canAuthorNote={Boolean(grantedToMe?.can_comment)}
                onNotesChange={setStickyNotes}>
                <ContributionGrid logs={habitLogs} onSelectDate={() => {}} />
              </StickyNotesCanvas>
              <ContributionLegend />
            </Card>
          ) : null}

          {grantedToMe?.can_view_timer ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold">Focus</ThemedText>
              {activeSession ? (
                <ThemedText themeColor="textSecondary">
                  Working on: {activeSession.task_description}
                </ThemedText>
              ) : (
                <ThemedText themeColor="textSecondary">Not currently focusing.</ThemedText>
              )}
            </Card>
          ) : null}

          {grantedToMe?.can_view_mood ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold">Mood (last 30 days)</ThemedText>
              <MoodHistoryStrip days={30} entries={moodHistory} />
            </Card>
          ) : null}

          {!sharesAnything ? (
            <Card style={styles.card}>
              <ThemedText themeColor="textSecondary">
                {friendProfile.display_name} hasn't shared anything with you yet.
              </ThemedText>
            </Card>
          ) : null}

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            What {friendProfile.display_name} can see of yours
          </ThemedText>
          <Card style={styles.card}>
            <ToggleRow
              emoji="📈"
              title="Habits & contribution grid"
              value={grantedByMe.can_view_habits}
              onValueChange={(v) => togglePermission('can_view_habits', v)}
            />
            <ToggleRow
              emoji="⏱️"
              title="Timer sessions"
              value={grantedByMe.can_view_timer}
              onValueChange={(v) => togglePermission('can_view_timer', v)}
            />
            <ToggleRow
              emoji="🙂"
              title="Mood"
              value={grantedByMe.can_view_mood}
              onValueChange={(v) => togglePermission('can_view_mood', v)}
            />
            <ToggleRow
              emoji="📝"
              title="Sticky notes"
              description="Allow them to leave notes on modules you've shared."
              value={grantedByMe.can_comment}
              onValueChange={(v) => togglePermission('can_comment', v)}
            />
          </Card>

          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
            Period cycle data is never shared with any friend, under any setting.
          </ThemedText>

          <View style={styles.dangerZone}>
            <Pressable onPress={confirmUnfriend} style={styles.dangerButton}>
              <ThemedText themeColor="danger" type="smallBold">
                Unfriend
              </ThemedText>
            </Pressable>
            <Pressable onPress={confirmBlock} style={styles.dangerButton}>
              <ThemedText themeColor="danger" type="smallBold">
                Block
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
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
  scroll: { paddingBottom: Spacing.six, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  title: { fontSize: 22 },
  sectionTitle: { marginTop: Spacing.two },
  card: { gap: Spacing.two },
  dangerZone: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.four, justifyContent: 'center' },
  dangerButton: { paddingVertical: Spacing.two },
});
