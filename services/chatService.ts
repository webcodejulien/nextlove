import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reaction?: string | null;
  // Optimistic UI flag — true while waiting for server confirm
  pending?: boolean;
}

export type MessageListener = (msg: ChatMessage) => void;
export type ReadListener = (matchId: string) => void;

// ─── Fetch messages ───────────────────────────────────────────────────────────

export async function fetchMessages(
  matchId: string,
  limit = 60
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessage[];
}

// ─── Send message ─────────────────────────────────────────────────────────────

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Message vide');

  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content: trimmed })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ChatMessage;
}

// ─── React to message ────────────────────────────────────────────────────────

export async function reactToMessage(
  messageId: string,
  emoji: string | null
): Promise<void> {
  await supabase
    .from('messages')
    .update({ reaction: emoji })
    .eq('id', messageId);
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markMessagesRead(
  matchId: string,
  currentUserId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .neq('sender_id', currentUserId)
    .eq('is_read', false);
}

// ─── Supabase Realtime subscription ──────────────────────────────────────────

/**
 * Subscribes to new messages for a given match.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToMessages(
  matchId: string,
  onInsert: MessageListener
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`chat:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      payload => {
        onInsert(payload.new as ChatMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      payload => {
        // When messages are marked as read, broadcast back the updated row
        // so sent messages update their read status in real time
        onInsert(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Date / time helpers ──────────────────────────────────────────────────────

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return "Aujourd'hui";
  if (isSameDay(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Groups messages by day, injecting day-separator markers.
 */
export type MessageGroup =
  | { type: 'day'; label: string; key: string }
  | { type: 'message'; data: ChatMessage };

export function groupMessagesByDay(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let lastDay = '';

  for (const msg of messages) {
    const day = msg.created_at.slice(0, 10); // YYYY-MM-DD
    if (day !== lastDay) {
      groups.push({ type: 'day', label: formatDayLabel(msg.created_at), key: `day-${day}` });
      lastDay = day;
    }
    groups.push({ type: 'message', data: msg });
  }

  return groups;
}

// ─── Match preview (last message + unread) ───────────────────────────────────

export interface MatchPreview {
  matchId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  unreadCount: number;
}

/**
 * Fetches last message + unread count for a list of match IDs in one go.
 */
export async function fetchMatchPreviews(
  matchIds: string[],
  currentUserId: string
): Promise<Record<string, MatchPreview>> {
  if (matchIds.length === 0) return {};

  // Fetch last message per match
  const { data: messages, error } = await supabase
    .from('messages')
    .select('match_id, content, created_at, sender_id, is_read')
    .in('match_id', matchIds)
    .order('created_at', { ascending: false });

  if (error || !messages) return {};

  const result: Record<string, MatchPreview> = {};

  for (const matchId of matchIds) {
    const matchMessages = messages.filter(m => m.match_id === matchId);
    const last = matchMessages[0] ?? null;
    const unreadCount = matchMessages.filter(
      m => !m.is_read && m.sender_id !== currentUserId
    ).length;

    result[matchId] = {
      matchId,
      lastMessage: last?.content ?? null,
      lastMessageAt: last?.created_at ?? null,
      lastSenderId: last?.sender_id ?? null,
      unreadCount,
    };
  }

  return result;
}

// ─── Mock mode (no auth) ──────────────────────────────────────────────────────

/** Generates a fake UUID-like ID for optimistic messages */
export function tempId(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
