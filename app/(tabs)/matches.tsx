import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../constants/translations';
import { Profile } from '../../constants/mockData';
import AdBanner from '../../components/AdBanner';
import { router } from 'expo-router';
import { likeService, userService } from '../../services/supabase';
import { fetchMatchPreviews, MatchPreview } from '../../services/chatService';
import { supabase, matchService } from '../../services/supabase';
import { formatLastSeen } from '../../utils/time';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── New Match Bubble ─────────────────────────────────────────────────────────

function NewMatchBubble({ profile, onUnmatch }: { profile: Profile; onUnmatch: (p: Profile) => void }) {
  const handlePress = () => {
    router.push({
      pathname: '/chat/[matchId]',
      params: {
        matchId: profile.matchId ?? profile.id,
        userId: profile.id,
        name: profile.name,
        photo: profile.photo,
        online: 'false',
      },
    });
  };

  return (
    <TouchableOpacity
      style={bubbleStyles.container}
      activeOpacity={0.85}
      onPress={handlePress}
      onLongPress={() => onUnmatch(profile)}
      delayLongPress={500}
    >
      <View style={bubbleStyles.avatarWrap}>
        <Image source={{ uri: profile.photo }} style={bubbleStyles.avatar} />
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={bubbleStyles.newDot}
        >
          <Ionicons name="heart" size={8} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={bubbleStyles.name} numberOfLines={1}>
        {profile.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

const bubbleStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, width: 68 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  newDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  name: { color: Colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});

// ─── Conversation Row ─────────────────────────────────────────────────────────

interface ConvRowProps {
  profile: Profile;
  preview: MatchPreview;
  myId: string;
  onUnmatch: (profile: Profile) => void;
  onClearUnread: (matchId: string) => void;
}

function ConvRow({ profile, preview, myId, onUnmatch, onClearUnread }: ConvRowProps) {
  const unread = preview.unreadCount;
  const isMe = preview.lastSenderId === myId;

  const handlePress = () => {
    // Efface le badge localement dès le tap (avant même d'ouvrir le chat)
    const mid = profile.matchId ?? profile.id;
    onClearUnread(mid);
    router.push({
      pathname: '/chat/[matchId]',
      params: {
        matchId: mid,
        userId: profile.id,
        name: profile.name,
        photo: profile.photo,
        online: 'false',
      },
    });
  };

  const handleProfilePress = () => {
    router.push({
      pathname: '/profile/[userId]',
      params: {
        userId: profile.id,
        matchId: profile.matchId ?? profile.id,
        name: profile.name,
        photo: profile.photo,
        score: String(profile.compatibilityScore ?? 75),
      },
    });
  };

  const lastSeenInfo = formatLastSeen(profile.lastSeen);

  return (
    <TouchableOpacity
      style={convStyles.row}
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={() => onUnmatch(profile)}
      delayLongPress={500}
    >
      {/* Avatar */}
      <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.9} style={convStyles.avatarWrap}>
        <Image source={{ uri: profile.photo }} style={convStyles.avatar} />
        {lastSeenInfo?.isOnline && <View style={convStyles.onlineDot} />}
      </TouchableOpacity>

      {/* Content */}
      <View style={convStyles.content}>
        <View style={convStyles.topRow}>
          <Text style={[convStyles.name, unread > 0 && convStyles.nameUnread]}>
            {profile.name}
          </Text>
          <Text style={[convStyles.time, unread > 0 && convStyles.timeUnread]}>
            {formatRelativeTime(preview.lastMessageAt)}
          </Text>
        </View>

        <View style={convStyles.bottomRow}>
          <Text
            style={[convStyles.preview, unread > 0 && convStyles.previewUnread]}
            numberOfLines={1}
          >
            {isMe ? `Vous : ${preview.lastMessage}` : preview.lastMessage ?? ''}
          </Text>

          {unread > 0 && (
            <View style={convStyles.badge}>
              <Text style={convStyles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const convStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  nameUnread: { color: Colors.text, fontWeight: '800' },
  time: { color: Colors.textMuted, fontSize: 12 },
  timeUnread: { color: Colors.primary, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1, color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  previewUnread: { color: Colors.textSecondary, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
});

// ─── "Qui m'a liké" ───────────────────────────────────────────────────────────

interface LikerProfile { id: string; name: string; photo: string; age: number; }

function WhoLikedSection({ isPremium }: { isPremium: boolean }) {
  const { user } = useAuth();
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    likeService.getWhoLikedMe(user.id)
      .then(async ids => {
        if (ids.length === 0) { setLikers([]); return; }
        const profiles = await Promise.all(
          ids.slice(0, 6).map(id => userService.getById(id).catch(() => null))
        );
        setLikers(
          profiles
            .filter(Boolean)
            .map(u => ({
              id: u!.id,
              name: u!.name,
              photo: u!.photos?.[0] ?? 'https://randomuser.me/api/portraits/lego/1.jpg',
              age: u!.age ?? 25,
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (likers.length === 0 && !loading) return null;

  return (
    <LinearGradient colors={['rgba(255,215,0,0.08)', 'rgba(255,160,0,0.06)']} style={goldStyles.card}>
      <View style={goldStyles.header}>
        <Ionicons name="star" size={18} color={Colors.premium} />
        <Text style={goldStyles.title}>Qui vous a liké ?</Text>
        {likers.length > 0 && (
          <View style={goldStyles.countBadge}>
            <Text style={goldStyles.countText}>{likers.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.premium} style={{ paddingVertical: 12 }} />
      ) : (
        <View style={goldStyles.blurRow}>
          {likers.map(liker => (
            <TouchableOpacity
              key={liker.id}
              style={goldStyles.likerItem}
              activeOpacity={0.8}
              onPress={() => isPremium
                ? router.push({ pathname: '/profile/[userId]', params: { userId: liker.id, name: liker.name, photo: liker.photo } })
                : router.push('/premium')
              }
            >
              <Image source={{ uri: liker.photo }} style={goldStyles.likerPhoto} blurRadius={isPremium ? 0 : 10} />
              {!isPremium && (
                <View style={goldStyles.lockOverlay}>
                  <Ionicons name="lock-closed" size={16} color="#FFF" />
                </View>
              )}
              {isPremium && (
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={goldStyles.likerGrad}>
                  <Text style={goldStyles.likerName}>{liker.name}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isPremium && (
        <TouchableOpacity onPress={() => router.push('/premium')} style={goldStyles.unlockBtn}>
          <LinearGradient colors={Colors.premiumGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={goldStyles.unlockGrad}>
            <Ionicons name="star" size={14} color="#000" />
            <Text style={goldStyles.unlockText}>Voir qui vous a liké — Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const goldStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: Colors.premium, fontSize: 15, fontWeight: '700', flex: 1 },
  countBadge: { backgroundColor: Colors.premium, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { color: '#000', fontSize: 12, fontWeight: '700' },
  blurRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  likerItem: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  likerPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  likerGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', paddingHorizontal: 4, paddingBottom: 4 },
  likerName: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  unlockBtn: { borderRadius: 12, overflow: 'hidden' },
  unlockGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  unlockText: { color: '#000', fontSize: 13, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchesScreen() {
  const { language, isPremium, matches, refreshMatches } = useApp();
  const { user } = useAuth();
  const t = translations[language];
  const myId = user?.id ?? '';

  const [previews, setPreviews] = useState<Record<string, MatchPreview>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Recharge les matchs à chaque fois qu'on revient sur cet onglet
  useFocusEffect(useCallback(() => {
    if (myId) refreshMatches();
  }, [myId, refreshMatches]));

  const loadPreviews = useCallback(async () => {
    if (!myId || matches.length === 0) return;
    const matchIds = matches.map(m => m.matchId ?? m.id).filter(Boolean) as string[];
    try {
      const data = await fetchMatchPreviews(matchIds, myId);
      setPreviews(data);
    } catch {}
  }, [myId, matches]);

  useEffect(() => {
    setLoading(true);
    loadPreviews().finally(() => setLoading(false));
  }, [loadPreviews]);

  // Realtime: écoute INSERT (nouveaux messages) + UPDATE (marqués comme lus)
  useEffect(() => {
    if (!myId || matches.length === 0) return;
    const matchIds = matches.map(m => m.matchId ?? m.id).filter(Boolean) as string[];
    if (matchIds.length === 0) return;

    const channel = supabase
      .channel('matches-inbox')
      // Nouveau message reçu → incrémente le badge
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as { match_id: string; content: string; created_at: string; sender_id: string; is_read: boolean };
          if (!matchIds.includes(msg.match_id)) return;
          setPreviews(prev => {
            const existing = prev[msg.match_id];
            const unreadDelta = msg.sender_id !== myId && !msg.is_read ? 1 : 0;
            return {
              ...prev,
              [msg.match_id]: {
                matchId: msg.match_id,
                lastMessage: msg.content,
                lastMessageAt: msg.created_at,
                lastSenderId: msg.sender_id,
                unreadCount: (existing?.unreadCount ?? 0) + unreadDelta,
              },
            };
          });
        }
      )
      // Message marqué comme lu → remet le badge à 0 pour ce match
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as { match_id: string; is_read: boolean; sender_id: string };
          if (!matchIds.includes(msg.match_id)) return;
          // Si les messages de l'autre sont passés à is_read=true → badge à 0
          if (msg.is_read && msg.sender_id !== myId) {
            setPreviews(prev => {
              if (!prev[msg.match_id] || prev[msg.match_id].unreadCount === 0) return prev;
              return {
                ...prev,
                [msg.match_id]: { ...prev[msg.match_id], unreadCount: 0 },
              };
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, matches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPreviews();
    setRefreshing(false);
  };

  // Efface le badge d'un match immédiatement côté client
  const handleClearUnread = useCallback((matchId: string) => {
    setPreviews(prev => {
      if (!prev[matchId] || prev[matchId].unreadCount === 0) return prev;
      return {
        ...prev,
        [matchId]: { ...prev[matchId], unreadCount: 0 },
      };
    });
  }, []);

  const handleUnmatch = useCallback((profile: Profile) => {
    Alert.alert(
      `Dématcher ${profile.name} ?`,
      'Vous perdrez votre conversation et ne pourrez plus vous contacter.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dématcher',
          style: 'destructive',
          onPress: async () => {
            const matchId = profile.matchId ?? profile.id;
            try {
              await matchService.delete(matchId);
              // Reload matches from AppContext (removes from global state)
              refreshMatches();
              loadPreviews();
              // Remove from previews
              setPreviews(prev => {
                const next = { ...prev };
                delete next[matchId];
                return next;
              });
            } catch {
              Alert.alert('Erreur', 'Impossible de dématcher. Réessayez.');
            }
          },
        },
      ]
    );
  }, [refreshMatches]);

  // Split matches into "new" (no messages) and "conversations" (have messages)
  const newMatches = matches.filter(m => {
    const mid = m.matchId ?? m.id;
    const p = previews[mid];
    return !p || !p.lastMessage;
  });

  const conversations = matches
    .filter(m => {
      const mid = m.matchId ?? m.id;
      const p = previews[mid];
      return p && p.lastMessage;
    })
    .sort((a, b) => {
      const pa = previews[a.matchId ?? a.id];
      const pb = previews[b.matchId ?? b.id];
      const ta = pa?.lastMessageAt ?? '';
      const tb = pb?.lastMessageAt ?? '';
      return tb.localeCompare(ta);
    });

  const totalUnread = Object.values(previews).reduce((s, p) => s + p.unreadCount, 0);

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t.matches}</Text>
            <Text style={styles.headerSub}>
              {matches.length} match{matches.length !== 1 ? 's' : ''}
              {totalUnread > 0 ? ` · ${totalUnread} non lu${totalUnread > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.heartBadge}>
            <Ionicons name="heart" size={18} color="#FFF" />
            <Text style={styles.heartBadgeText}>{matches.length}</Text>
          </LinearGradient>
        </View>

        {!isPremium && (
          <AdBanner onPremiumPress={() => router.push('/(tabs)/profile')} />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Qui m'a liké */}
          <WhoLikedSection isPremium={isPremium} />

          {matches.length === 0 ? (
            /* Empty state */
            <View style={styles.emptyState}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={44} color="#FFF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>{t.noMatchesYet}</Text>
              <Text style={styles.emptySubtitle}>{t.noMatchesSubtitle}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/discover')} style={styles.goSwipeWrapper}>
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.goSwipeBtn}
                >
                  <Ionicons name="compass" size={18} color="#FFF" />
                  <Text style={styles.goSwipeText}>{t.startSwiping}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Nouveaux matchs — horizontal scroll */}
              {newMatches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>NOUVEAUX MATCHS</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.bubblesRow}
                  >
                    {newMatches.map(p => (
                      <NewMatchBubble key={p.id} profile={p} onUnmatch={handleUnmatch} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Divider */}
              {newMatches.length > 0 && conversations.length > 0 && (
                <View style={styles.divider} />
              )}

              {/* Conversations */}
              {conversations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>MESSAGES</Text>
                  {loading && conversations.length === 0 ? (
                    <ActivityIndicator color={Colors.primary} style={{ padding: 24 }} />
                  ) : (
                    conversations.map(profile => {
                      const mid = profile.matchId ?? profile.id;
                      const preview = previews[mid] ?? {
                        matchId: mid,
                        lastMessage: null,
                        lastMessageAt: null,
                        lastSenderId: null,
                        unreadCount: 0,
                      };
                      return (
                        <ConvRow
                          key={profile.id}
                          profile={profile}
                          preview={preview}
                          myId={myId}
                          onUnmatch={handleUnmatch}
                          onClearUnread={handleClearUnread}
                        />
                      );
                    })
                  )}
                </View>
              )}

              {/* If only new matches and no conversations */}
              {conversations.length === 0 && newMatches.length > 0 && (
                <View style={styles.nudge}>
                  <Ionicons name="chatbubble-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.nudgeText}>Commencez la conversation !</Text>
                  <Text style={styles.nudgeSub}>
                    Vous avez {newMatches.length} match{newMatches.length > 1 ? 's' : ''} qui attend{newMatches.length > 1 ? 'ent' : ''} votre premier message
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: '900' },
  headerSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heartBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  section: { paddingTop: 12 },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bubblesRow: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 4,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 16,
    marginVertical: 8,
  },

  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32, gap: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  goSwipeWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  goSwipeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  goSwipeText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  nudge: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 10,
  },
  nudgeText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  nudgeSub: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
