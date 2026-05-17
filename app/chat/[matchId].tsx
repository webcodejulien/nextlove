import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatMessage,
  MessageGroup,
  fetchMessages,
  sendMessage,
  markMessagesRead,
  subscribeToMessages,
  groupMessagesByDay,
  formatTime,
  tempId,
} from '../../services/chatService';
import {
  sendLocalNotification,
  buildNotificationPayload,
} from '../../services/notificationService';
import { reactToMessage } from '../../services/chatService';
import { userService } from '../../services/supabase';
import { formatLastSeen } from '../../utils/time';
import { generateCompatibilitySummary, CompatibilitySummary } from '../../services/compatibilitySummary';
import { QuestionnaireAnswers } from '../../constants/questionnaire';
import { useApp } from '../../contexts/AppContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_SENDER_ID = 'me';
const TYPING_TIMEOUT = 2500;

// ─── Day separator ────────────────────────────────────────────────────────────

function DaySeparator({ label }: { label: string }) {
  return (
    <View style={dayStyles.row}>
      <View style={dayStyles.line} />
      <Text style={dayStyles.label}>{label}</Text>
      <View style={dayStyles.line} />
    </View>
  );
}

const dayStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 16 },
  line: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 10,
    textTransform: 'capitalize',
  },
});

// ─── Read receipt ─────────────────────────────────────────────────────────────

function ReadReceipt({ isRead, pending }: { isRead: boolean; pending?: boolean }) {
  if (pending) {
    return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.4)" />;
  }
  return (
    <Ionicons
      name={isRead ? 'checkmark-done' : 'checkmark'}
      size={13}
      color={isRead ? Colors.primary : 'rgba(255,255,255,0.5)'}
    />
  );
}

// ─── Emoji Reaction Picker ────────────────────────────────────────────────────

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '😢'];

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string | null) => void;
  onClose: () => void;
  currentReaction?: string | null;
}

function ReactionPicker({ visible, onSelect, onClose, currentReaction }: ReactionPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={reactionStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={reactionStyles.picker}>
          {REACTION_EMOJIS.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={[reactionStyles.emojiBtn, currentReaction === emoji && reactionStyles.emojiBtnActive]}
              onPress={() => onSelect(currentReaction === emoji ? null : emoji)}
            >
              <Text style={reactionStyles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const reactionStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(255,107,157,0.2)',
  },
  emoji: { fontSize: 26 },
});

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  partnerPhoto?: string;
  onReact: (msgId: string, emoji: string | null) => void;
}

function Bubble({ msg, isMine, showAvatar, partnerPhoto, onReact }: BubbleProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 9 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLongPress = () => {
    setShowPicker(true);
  };

  const handleReactionSelect = (emoji: string | null) => {
    setShowPicker(false);
    onReact(msg.id, emoji);
  };

  return (
    <>
      <ReactionPicker
        visible={showPicker}
        onSelect={handleReactionSelect}
        onClose={() => setShowPicker(false)}
        currentReaction={msg.reaction}
      />

      <Animated.View
        style={[
          bubbleStyles.row,
          isMine ? bubbleStyles.rowRight : bubbleStyles.rowLeft,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Partner avatar — shown for received messages */}
        {!isMine && (
          <View style={bubbleStyles.avatarSlot}>
            {showAvatar ? (
              <Image
                source={{ uri: partnerPhoto ?? 'https://randomuser.me/api/portraits/women/1.jpg' }}
                style={bubbleStyles.avatar}
              />
            ) : (
              <View style={bubbleStyles.avatarSpacer} />
            )}
          </View>
        )}

        <View style={[bubbleStyles.wrapper, isMine ? bubbleStyles.wrapperRight : bubbleStyles.wrapperLeft]}>
          {/* Bubble */}
          <TouchableOpacity
            onLongPress={handleLongPress}
            delayLongPress={350}
            activeOpacity={0.85}
          >
            {isMine ? (
              <LinearGradient
                colors={msg.pending ? ['#555', '#444'] : Colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[bubbleStyles.bubble, bubbleStyles.bubbleMine]}
              >
                <Text style={bubbleStyles.textMine}>{msg.content}</Text>
              </LinearGradient>
            ) : (
              <View style={[bubbleStyles.bubble, bubbleStyles.bubbleTheirs]}>
                <Text style={bubbleStyles.textTheirs}>{msg.content}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Reaction badge */}
          {msg.reaction && (
            <TouchableOpacity
              style={[bubbleStyles.reactionBadge, isMine ? bubbleStyles.reactionRight : bubbleStyles.reactionLeft]}
              onPress={() => onReact(msg.id, null)}
            >
              <Text style={bubbleStyles.reactionEmoji}>{msg.reaction}</Text>
            </TouchableOpacity>
          )}

          {/* Meta: time + read receipt */}
          <View style={[bubbleStyles.meta, isMine ? bubbleStyles.metaRight : bubbleStyles.metaLeft]}>
            <Text style={bubbleStyles.time}>{formatTime(msg.created_at)}</Text>
            {isMine && <ReadReceipt isRead={msg.is_read} pending={msg.pending} />}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarSlot: { width: 32, marginRight: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarSpacer: { width: 32 },
  wrapper: { maxWidth: '72%' },
  wrapperLeft: { alignItems: 'flex-start' },
  wrapperRight: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomLeftRadius: 6,
  },
  textMine: { color: '#FFF', fontSize: 15, lineHeight: 21 },
  textTheirs: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaLeft: { justifyContent: 'flex-start', paddingLeft: 4 },
  metaRight: { justifyContent: 'flex-end', paddingRight: 4 },
  time: { color: Colors.textMuted, fontSize: 10 },
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    zIndex: 3,
  },
  reactionLeft: { left: 8 },
  reactionRight: { right: 8 },
  reactionEmoji: { fontSize: 14 },
});

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ partnerPhoto }: { partnerPhoto?: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 160);
    const a3 = anim(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={typingStyles.row}>
      <Image
        source={{ uri: partnerPhoto ?? 'https://randomuser.me/api/portraits/women/1.jpg' }}
        style={typingStyles.avatar}
      />
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[typingStyles.dot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textMuted },
});

// ─── Input Bar ────────────────────────────────────────────────────────────────

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}

function InputBar({ value, onChange, onSend, sending }: InputBarProps) {
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={inputStyles.container}>
      <View style={inputStyles.field}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Écrire un message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => { if (canSend) onSend(); }}
        />
      </View>

      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.8}
        style={inputStyles.sendWrapper}
      >
        <LinearGradient
          colors={canSend ? Colors.gradientPrimary : ['#333', '#333']}
          style={inputStyles.sendBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color={canSend ? '#FFF' : Colors.textMuted} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  field: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  sendWrapper: { marginBottom: 2 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Header ───────────────────────────────────────────────────────────────────

interface ChatHeaderProps {
  name: string;
  photo: string;
  online: boolean;
  statusLabel?: string;
  userId?: string;
  onBack: () => void;
  onMore: () => void;
}

function ChatHeader({ name, photo, online, statusLabel, userId, onBack, onMore }: ChatHeaderProps) {
  const handleProfilePress = () => {
    if (!userId) return;
    router.push({
      pathname: '/profile/[userId]',
      params: { userId, name, photo },
    });
  };

  return (
    <LinearGradient
      colors={['rgba(15,5,32,0.98)', 'rgba(26,10,53,0.95)']}
      style={headerStyles.container}
    >
      <TouchableOpacity onPress={onBack} style={headerStyles.back} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <TouchableOpacity style={headerStyles.center} activeOpacity={0.85} onPress={handleProfilePress}>
        <View style={headerStyles.avatarWrap}>
          <Image source={{ uri: photo }} style={headerStyles.avatar} />
          {online && <View style={headerStyles.onlineDot} />}
        </View>
        <View style={headerStyles.info}>
          <Text style={headerStyles.name}>{name}</Text>
          <Text style={headerStyles.status}>
            {online ? '🟢 En ligne' : statusLabel ?? '💬 Match'}
          </Text>
        </View>
        {userId && <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 2 }} />}
      </TouchableOpacity>

      <TouchableOpacity style={headerStyles.moreBtn} activeOpacity={0.7} onPress={onMore}>
        <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  info: { gap: 2 },
  name: { color: Colors.text, fontSize: 16, fontWeight: '800' },
  status: { color: Colors.textMuted, fontSize: 12 },
  moreBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Compatibility Card ───────────────────────────────────────────────────────

function CompatibilityCard({ summary }: { summary: CompatibilitySummary }) {
  const strengthColors: Record<string, string> = {
    strong: Colors.primary,
    good: Colors.secondary,
    note: Colors.textMuted,
  };

  return (
    <View style={compatStyles.wrapper}>
      <LinearGradient
        colors={['rgba(255,107,157,0.10)', 'rgba(107,53,217,0.14)']}
        style={compatStyles.card}
      >
        <View style={compatStyles.headerRow}>
          <Ionicons name="sparkles" size={15} color={Colors.primary} />
          <Text style={compatStyles.headline}>{summary.headline}</Text>
        </View>

        {summary.points.map((point, i) => (
          <View key={i} style={compatStyles.point}>
            <View style={[compatStyles.strengthDot, { backgroundColor: strengthColors[point.strength] }]} />
            <View style={compatStyles.pointBody}>
              <Text style={compatStyles.pointTitle}>{point.emoji} {point.title}</Text>
              <Text style={compatStyles.pointDesc}>{point.description}</Text>
            </View>
          </View>
        ))}

        {summary.sharedValues.length > 0 && (
          <View style={compatStyles.tagsRow}>
            {summary.sharedValues.slice(0, 4).map((v, i) => (
              <View key={i} style={compatStyles.tag}>
                <Text style={compatStyles.tagText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const compatStyles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: 4 },
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  headline: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    lineHeight: 20,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  pointBody: { flex: 1, gap: 2 },
  pointTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pointDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  tagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Empty state + Icebreakers ────────────────────────────────────────────────

const ICEBREAKERS = [
  "Quel est le dernier voyage qui t'a vraiment marqué(e) ? ✈️",
  "Si tu pouvais dîner avec n'importe qui dans le monde, ce serait qui ? 🍽️",
  "C'est quoi ton truc secret pour te sentir bien quand tu as une mauvaise journée ? ☀️",
  "Tu es plutôt mer ou montagne ? Et pourquoi ? 🏔️🌊",
  "Quel film ou série tu conseilles absolument en ce moment ? 🎬",
  "C'est quoi la chose qui te fait le plus sourire en ce moment ? 😊",
  "Tu as un talent caché que peu de gens connaissent ? 🎭",
  "Si tu avais une journée entière sans rien à faire, tu ferais quoi ? 🌟",
];

interface EmptyChatProps {
  name: string;
  onSendIcebreaker: (text: string) => void;
  compatibility?: CompatibilitySummary;
  personalizedPicks?: string[]; // icebreakers personnalisés
}

function EmptyChat({ name, onSendIcebreaker, compatibility, personalizedPicks }: EmptyChatProps) {
  // Use personalized picks if provided, otherwise fallback to generic icebreakers
  const picks = personalizedPicks ?? ICEBREAKERS.slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={emptyStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={Colors.gradientAccent} style={emptyStyles.icon}>
        <Ionicons name="heart-circle" size={32} color="#FFF" />
      </LinearGradient>
      <Text style={emptyStyles.title}>C'est un match ! 🎉</Text>
      <Text style={emptyStyles.sub}>
        Vous et {name} avez matché.{'\n'}Lancez la conversation !
      </Text>

      {compatibility && (
        <View style={emptyStyles.compatSection}>
          <Text style={emptyStyles.sectionLabel}>💡 Pourquoi vous matchez</Text>
          <CompatibilityCard summary={compatibility} />
        </View>
      )}

      <View style={emptyStyles.icebreakersSection}>
        <Text style={emptyStyles.icebreakersTitle}>💬 Brise la glace</Text>
        {picks.map((text, i) => (
          <TouchableOpacity
            key={i}
            style={emptyStyles.icebreakerBtn}
            activeOpacity={0.8}
            onPress={() => onSendIcebreaker(text)}
          >
            <Text style={emptyStyles.icebreakerText}>{text}</Text>
            <Ionicons name="send" size={14} color={Colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 28,
    paddingBottom: 40,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  sub: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  icebreakersSection: { width: '100%', gap: 10, marginTop: 8 },
  icebreakersTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  icebreakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  icebreakerText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  compatSection: { width: '100%', gap: 8 },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { matchId, name, photo, online, userId } = useLocalSearchParams<{
    matchId: string;
    name: string;
    photo: string;
    online?: string;
    userId?: string;
  }>();

  const { user } = useAuth();
  const { questionnaire } = useApp();
  const myId = user?.id ?? MOCK_SENDER_ID;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const handleMore = () => {
    const { Alert } = require('react-native');
    Alert.alert(partnerName, 'Que souhaitez-vous faire ?', [
      { text: '🚫 Signaler', onPress: () => Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner ce profil.') },
      {
        text: '❌ Supprimer le match',
        style: 'destructive',
        onPress: async () => {
          if (matchId) {
            const { matchService: ms } = await import('../../services/supabase');
            ms.delete(matchId).catch(() => {});
          }
          router.back();
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null | undefined>(
    online === 'true' ? new Date().toISOString() : undefined
  );
  const [partnerQ, setPartnerQ] = useState<QuestionnaireAnswers | undefined>(undefined);

  // Charge le last_seen + questionnaire du partenaire
  useEffect(() => {
    const partnerId = userId ?? matchId;
    if (!partnerId) return;
    userService.getById(partnerId)
      .then(u => {
        if (u?.last_seen) setPartnerLastSeen(u.last_seen);
        if (u?.questionnaire_data) setPartnerQ(u.questionnaire_data as QuestionnaireAnswers);
      })
      .catch(() => {});
  }, [userId, matchId]);

  const lastSeenInfo = formatLastSeen(partnerLastSeen);
  const isOnline = lastSeenInfo?.isOnline ?? online === 'true';
  const partnerName = name ?? 'Match';
  const partnerPhoto = photo ?? 'https://randomuser.me/api/portraits/women/1.jpg';

  const compatSummary = useMemo(
    () => generateCompatibilitySummary(questionnaire, partnerQ, partnerName),
    [questionnaire, partnerQ, partnerName]
  );

  const personalizedIcebreakers = useMemo(() => {
    const custom: string[] = [];
    if (partnerQ) {
      if ((partnerQ as any).travelFrequency === 'often' || (partnerQ as any).dominantTrait === 'adventurer')
        custom.push(`Tu sembles aimer les voyages — quelle destination t'a le plus marqué(e) ? ✈️`);
      if ((partnerQ as any).sports && (partnerQ as any).sports !== 'never')
        custom.push(`Tu fais du sport ? C'est quoi ta pratique en ce moment ? 💪`);
      if ((partnerQ as any).musicGenres?.length > 0)
        custom.push(`Quel artiste tu écoutes en boucle ces derniers temps ? 🎵`);
      if ((partnerQ as any).hobbies?.length > 0)
        custom.push(`C'est quoi ta passion qui te fait vraiment vibrer ? 🌟`);
      if ((partnerQ as any).weekendStyle)
        custom.push(`Week-end idéal pour toi — c'est plutôt aventure ou détente ? 🌿`);
      if ((partnerQ as any).wantsChildren === 'yes' || (partnerQ as any).wantsChildren === 'no')
        custom.push(`Comment tu imagines ta vie dans 5 ans ? 🏡`);
    }
    // Mix custom avec les génériques, prend les 3 premiers
    const base = [
      "Quel est le dernier voyage qui t'a vraiment marqué(e) ? ✈️",
      "Si tu pouvais dîner avec n'importe qui dans le monde, ce serait qui ? 🍽️",
      "C'est quoi ton truc secret pour te sentir bien quand tu as une mauvaise journée ? ☀️",
      "Tu es plutôt mer ou montagne ? Et pourquoi ? 🏔️🌊",
      "Quel film ou série tu conseilles absolument en ce moment ? 🎬",
    ];
    return [...custom, ...base].slice(0, 3);
  }, [partnerQ]);

  // ── Load initial messages ──────────────────────────────────────────────────

  useEffect(() => {
    if (!matchId) return;

    setLoading(true);
    fetchMessages(matchId)
      .then(msgs => {
        setMessages(msgs);
        setLoading(false);
        // Mark received messages as read
        if (user) markMessagesRead(matchId, myId).catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  // ── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = subscribeToMessages(matchId, incoming => {
      setMessages(prev => {
        // If it's an UPDATE to an existing message (e.g. is_read changed), replace it
        const idx = prev.findIndex(m => m.id === incoming.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...incoming, pending: false };
          return updated;
        }
        // It's a new INSERT — don't duplicate optimistic messages
        if (prev.find(m => m.id === incoming.id)) return prev;
        // Received from partner: mark as read + local notification (only if app not active in this chat)
        if (incoming.sender_id !== myId) {
          if (user) markMessagesRead(matchId, myId).catch(() => {});
          // Only fire notification if app is in background (user not currently reading this chat)
          const { AppState } = require('react-native');
          if (AppState.currentState !== 'active') {
            const payload = buildNotificationPayload('new_message', {
              name: partnerName,
              matchId,
              messagePreview: incoming.content,
            });
            sendLocalNotification(payload).catch(() => {});
          }
        }
        return [...prev, { ...incoming, pending: false }];
      });

      // Scroll to bottom on new message
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    });

    return unsubscribe;
  }, [matchId, myId]);

  // ── Scroll to bottom on load ──────────────────────────────────────────────

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic message
    const optimistic: ChatMessage = {
      id: tempId(),
      match_id: matchId ?? '',
      sender_id: myId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      if (user && matchId) {
        const confirmed = await sendMessage(matchId, myId, text);
        // Replace optimistic with confirmed
        setMessages(prev =>
          prev.map(m => (m.id === optimistic.id ? { ...confirmed, pending: false } : m))
        );
      }
      // In mock mode (no user) the optimistic bubble stays
    } catch {
      // Mark optimistic as failed (keep visible, show error state)
      setMessages(prev =>
        prev.map(m =>
          m.id === optimistic.id ? { ...m, pending: false, content: `${m.content} ⚠️` } : m
        )
      );
    } finally {
      setSending(false);
    }
  }, [inputText, sending, matchId, myId, user]);

  // ── React to message ─────────────────────────────────────────────────────

  const handleReact = useCallback(async (msgId: string, emoji: string | null) => {
    // Optimistic update
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m)
    );
    // Persist to DB (best effort)
    if (!msgId.startsWith('tmp-')) {
      reactToMessage(msgId, emoji).catch(() => {});
    }
  }, []);

  // ── Grouped items ─────────────────────────────────────────────────────────

  const grouped = useMemo(() => groupMessagesByDay(messages), [messages]);

  // ── Render item ───────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item, index }: { item: MessageGroup; index: number }) => {
      if (item.type === 'day') {
        return <DaySeparator key={item.key} label={item.label} />;
      }

      const msg = item.data;
      const isMine = msg.sender_id === myId;

      // Show avatar only on last consecutive message from partner
      const nextItem = grouped[index + 1];
      const isLastInGroup =
        !nextItem ||
        nextItem.type === 'day' ||
        (nextItem.type === 'message' && nextItem.data.sender_id !== msg.sender_id);

      return (
        <Bubble
          key={msg.id}
          msg={msg}
          isMine={isMine}
          showAvatar={!isMine && isLastInGroup}
          partnerPhoto={partnerPhoto}
          onReact={handleReact}
        />
      );
    },
    [grouped, myId, partnerPhoto, handleReact]
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ChatHeader
          name={partnerName}
          photo={partnerPhoto}
          online={isOnline}
          statusLabel={lastSeenInfo && !lastSeenInfo.isOnline ? lastSeenInfo.label : undefined}
          userId={userId ?? matchId}
          onBack={() => router.back()}
          onMore={handleMore}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Chargement des messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={grouped}
              keyExtractor={(item, i) =>
                item.type === 'day' ? item.key : item.data.id
              }
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyChat
                  name={partnerName}
                  compatibility={compatSummary}
                  personalizedPicks={personalizedIcebreakers}
                  onSendIcebreaker={(text) => {
                    if (sending) return; // évite les envois simultanés
                    setInputText(text);
                    // Auto-send after a tiny delay so user sees it in input first
                    setTimeout(() => {
                      setInputText('');
                      setSending(true);
                      const optimistic: ChatMessage = {
                        id: tempId(),
                        match_id: matchId ?? '',
                        sender_id: myId,
                        content: text,
                        is_read: false,
                        created_at: new Date().toISOString(),
                        pending: true,
                      };
                      setMessages(prev => [...prev, optimistic]);
                      if (user && matchId) {
                        sendMessage(matchId, myId, text)
                          .then(confirmed => {
                            setMessages(prev =>
                              prev.map(m => m.id === optimistic.id
                                ? { ...confirmed, pending: false }
                                : m
                              )
                            );
                          })
                          .catch(() => {
                            setMessages(prev =>
                              prev.map(m => m.id === optimistic.id
                                ? { ...m, pending: false, content: `${m.content} ⚠️` }
                                : m
                              )
                            );
                          })
                          .finally(() => setSending(false));
                      } else {
                        setSending(false);
                      }
                    }, 120);
                  }}
                />
              }
              ListFooterComponent={
                partnerTyping ? (
                  <TypingIndicator partnerPhoto={partnerPhoto} />
                ) : null
              }
              onContentSizeChange={() =>
                flatRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}

          <InputBar
            value={inputText}
            onChange={setInputText}
            onSend={handleSend}
            sending={sending}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  listContent: {
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
});
