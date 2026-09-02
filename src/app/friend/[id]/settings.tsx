import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { DotsLoader } from '@/components/dots-loader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleRow } from '@/components/toggle-row';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { blockUser, fetchPermissionFor, fetchProfilesByIds, unfriend, updatePermission } from '@/lib/friends-api';
import type { FriendPermission, PublicProfile } from '@/lib/types';

export default function FriendSettingsScreen() {
  const navigation = useNavigation();
  const { session, profile } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [friendProfile, setFriendProfile] = useState<PublicProfile | null>(null);
  const [grantedByMe, setGrantedByMe] = useState<FriendPermission | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    try {
      const [profiles, myGrant] = await Promise.all([
        fetchProfilesByIds([id]),
        fetchPermissionFor(session.user.id, id),
      ]);
      setFriendProfile(profiles[0] ?? null);
      setGrantedByMe(myGrant);
      navigation.setOptions({ title: 'Sharing settings' });
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
    key: keyof Pick<
      FriendPermission,
      'can_view_habits' | 'can_view_timer' | 'can_view_todo' | 'can_view_mood' | 'can_view_period'
    >,
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
            router.replace('/(tabs)/friends');
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
              router.replace('/(tabs)/friends');
            } catch (err) {
              Alert.alert('Could not block', err instanceof Error ? err.message : String(err));
            }
          },
        },
      ]
    );
  }

  if (loading || !grantedByMe || !friendProfile) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <DotsLoader />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="sectionTitle">What {friendProfile.display_name} can see of yours</ThemedText>
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
              emoji="📝"
              title="Todo list"
              value={grantedByMe.can_view_todo}
              onValueChange={(v) => togglePermission('can_view_todo', v)}
            />
            <ToggleRow
              emoji="🙂"
              title="Mood"
              value={grantedByMe.can_view_mood}
              onValueChange={(v) => togglePermission('can_view_mood', v)}
            />
            {profile?.gender === 'female' ? (
              <ToggleRow
                emoji="🌙"
                title="Period tracker"
                description="Off by default — only turn this on for friends you want to see it."
                value={grantedByMe.can_view_period}
                onValueChange={(v) => togglePermission('can_view_period', v)}
              />
            ) : null}
          </Card>

          {profile?.gender !== 'female' ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
              Period cycle data is never shared with any friend, under any setting.
            </ThemedText>
          ) : null}

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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: Spacing.six, gap: Spacing.three },
  card: { gap: Spacing.two },
  dangerZone: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.four, justifyContent: 'center' },
  dangerButton: { paddingVertical: Spacing.two },
});
