import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  cancelFriendRequest,
  fetchFriendships,
  fetchProfilesByIds,
  findUserByUsername,
  respondToFriendRequest,
  sendFriendRequest,
} from '@/lib/friends-api';
import type { Friendship, PublicProfile } from '@/lib/types';

export default function FriendsScreen() {
  const navigation = useNavigation();
  const { session, profile } = useAuth();

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PublicProfile | null | 'not_found'>(null);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const rows = await fetchFriendships(session.user.id);
      setFriendships(rows);
      const otherIds = Array.from(
        new Set(rows.map((f) => (f.requester_id === session.user.id ? f.addressee_id : f.requester_id)))
      );
      const relatedProfiles = await fetchProfilesByIds(otherIds);
      const map: Record<string, PublicProfile> = {};
      for (const p of relatedProfiles) map[p.id] = p;
      setProfiles(map);
    } catch (err) {
      Alert.alert('Could not load friends', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation, load]);

  async function handleSearch() {
    const username = searchQuery.trim().replace(/^@/, '');
    if (!username) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const result = await findUserByUsername(username);
      setSearchResult(result ?? 'not_found');
    } catch (err) {
      Alert.alert('Search failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(targetId: string) {
    setSendingRequest(true);
    try {
      await sendFriendRequest(targetId);
      setSearchQuery('');
      setSearchResult(null);
      await load();
    } catch (err) {
      Alert.alert('Could not send request', err instanceof Error ? err.message : String(err));
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleRespond(request: Friendship, accept: boolean) {
    try {
      await respondToFriendRequest(request.id, accept);
      await load();
    } catch (err) {
      Alert.alert('Could not respond', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCancelRequest(request: Friendship) {
    try {
      await cancelFriendRequest(request.id);
      await load();
    } catch (err) {
      Alert.alert('Could not cancel', err instanceof Error ? err.message : String(err));
    }
  }

  if (!session || !profile) return null;

  const incoming = friendships.filter((f) => f.status === 'pending' && f.addressee_id === session.user.id);
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.requester_id === session.user.id);
  const accepted = friendships.filter((f) => f.status === 'accepted');

  const existingStatusWithSearchResult =
    searchResult && searchResult !== 'not_found'
      ? friendships.find(
          (f) =>
            (f.requester_id === searchResult.id || f.addressee_id === searchResult.id) &&
            f.status !== 'declined'
        )
      : undefined;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Friends
          </ThemedText>

          <Card style={styles.card}>
            <ThemedText type="smallBold">Add a friend</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Search by exact username — there's no public directory.
            </ThemedText>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  placeholder="@username"
                  autoCapitalize="none"
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    setSearchResult(null);
                  }}
                  onSubmitEditing={handleSearch}
                />
              </View>
              <Button
                label="Search"
                fullWidth={false}
                loading={searching}
                onPress={handleSearch}
                disabled={!searchQuery.trim()}
              />
            </View>

            {searchResult === 'not_found' ? (
              <ThemedText type="small" themeColor="textSecondary">
                No user found with that username.
              </ThemedText>
            ) : searchResult ? (
              <View style={styles.resultRow}>
                <Avatar emoji={searchResult.avatar_emoji} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">{searchResult.display_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    @{searchResult.username}
                  </ThemedText>
                </View>
                {existingStatusWithSearchResult ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {existingStatusWithSearchResult.status === 'accepted'
                      ? 'Friends'
                      : existingStatusWithSearchResult.status === 'blocked'
                        ? 'Blocked'
                        : 'Pending'}
                  </ThemedText>
                ) : (
                  <Button
                    label="Add"
                    fullWidth={false}
                    loading={sendingRequest}
                    onPress={() => handleSendRequest(searchResult.id)}
                  />
                )}
              </View>
            ) : null}
          </Card>

          {loading ? (
            <ActivityIndicator style={{ marginTop: Spacing.four }} />
          ) : (
            <>
              {incoming.length > 0 ? (
                <>
                  <ThemedText type="smallBold" style={styles.sectionTitle}>
                    Requests
                  </ThemedText>
                  <Card style={styles.card}>
                    {incoming.map((request) => {
                      const p = profiles[request.requester_id];
                      return (
                        <View key={request.id} style={styles.requestRow}>
                          <Avatar emoji={p?.avatar_emoji ?? '🙂'} />
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{p?.display_name ?? 'Someone'}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              @{p?.username}
                            </ThemedText>
                          </View>
                          <View style={styles.requestActions}>
                            <Pressable onPress={() => handleRespond(request, true)}>
                              <ThemedText type="smallBold" themeColor="primary">
                                Accept
                              </ThemedText>
                            </Pressable>
                            <Pressable onPress={() => handleRespond(request, false)}>
                              <ThemedText type="small" themeColor="textSecondary">
                                Decline
                              </ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                </>
              ) : null}

              {outgoing.length > 0 ? (
                <>
                  <ThemedText type="smallBold" style={styles.sectionTitle}>
                    Sent
                  </ThemedText>
                  <Card style={styles.card}>
                    {outgoing.map((request) => {
                      const p = profiles[request.addressee_id];
                      return (
                        <View key={request.id} style={styles.requestRow}>
                          <Avatar emoji={p?.avatar_emoji ?? '🙂'} />
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{p?.display_name ?? 'Someone'}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              Pending
                            </ThemedText>
                          </View>
                          <Pressable onPress={() => handleCancelRequest(request)}>
                            <ThemedText type="small" themeColor="danger">
                              Cancel
                            </ThemedText>
                          </Pressable>
                        </View>
                      );
                    })}
                  </Card>
                </>
              ) : null}

              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Your friends {accepted.length > 0 ? `(${accepted.length})` : ''}
              </ThemedText>
              {accepted.length === 0 ? (
                <Card style={styles.card}>
                  <ThemedText themeColor="textSecondary">
                    No friends yet — search for a username above to send a request.
                  </ThemedText>
                </Card>
              ) : (
                <Card style={styles.card}>
                  {accepted.map((f) => {
                    const otherId = f.requester_id === session.user.id ? f.addressee_id : f.requester_id;
                    const p = profiles[otherId];
                    return (
                      <Pressable
                        key={f.id}
                        style={styles.requestRow}
                        onPress={() => router.push(`/friend/${otherId}`)}>
                        <Avatar emoji={p?.avatar_emoji ?? '🙂'} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold">{p?.display_name ?? 'Friend'}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            @{p?.username}
                          </ThemedText>
                        </View>
                        <ThemedText themeColor="textSecondary">›</ThemedText>
                      </Pressable>
                    );
                  })}
                </Card>
              )}
            </>
          )}
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
    paddingTop: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: { fontSize: 24 },
  card: { gap: Spacing.three },
  sectionTitle: { marginTop: Spacing.two },
  searchRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  requestActions: { alignItems: 'flex-end', gap: Spacing.two },
});
