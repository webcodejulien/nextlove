import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const PUSH_TOKEN_KEY = '@nextlove:push_token';
const PERMISSION_ASKED_KEY = '@nextlove:notif_permission_asked';
export const EXPO_PROJECT_ID = ''; // Renseigner après `eas init` → visible dans app.json

// ─── Notification types ───────────────────────────────────────────────────────

export type NotificationType = 'new_match' | 'new_message' | 'new_like';

export interface NotificationData {
  type: NotificationType;
  matchId?: string;
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
  [key: string]: unknown;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data: NotificationData;
  badge?: number;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function buildNotificationPayload(
  type: NotificationType,
  params: {
    name?: string;
    matchId?: string;
    messagePreview?: string;
  } = {}
): NotificationPayload {
  const { name = 'Quelqu\'un', matchId, messagePreview } = params;

  switch (type) {
    case 'new_match':
      return {
        title: '❤️ Nouveau match !',
        body: `Vous et ${name} avez matché. Dites-lui bonjour !`,
        data: { type, matchId },
        badge: 1,
      };
    case 'new_message':
      return {
        title: `💬 ${name}`,
        body: messagePreview
          ? messagePreview.length > 60
            ? messagePreview.slice(0, 57) + '…'
            : messagePreview
          : 'Vous avez reçu un message.',
        data: { type, matchId, senderName: name, messagePreview },
        badge: 1,
      };
    case 'new_like':
      return {
        title: '👀 Vous avez un admirateur !',
        body: 'Quelqu\'un a aimé votre profil. Activez Premium pour le voir.',
        data: { type },
        badge: 1,
      };
  }
}

// ─── Configure foreground handler (must be called at app root) ────────────────

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Android channel setup ────────────────────────────────────────────────────

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('nextlove-default', {
    name: 'NextLove',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B9D',
    sound: null,
  });
  await Notifications.setNotificationChannelAsync('nextlove-messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 150, 100, 150],
    lightColor: '#9B59B6',
    sound: null,
  });
  await Notifications.setNotificationChannelAsync('nextlove-matches', {
    name: 'Matchs',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 400],
    lightColor: '#FF6B9D',
    sound: null,
  });
}

// ─── Permission request ───────────────────────────────────────────────────────

export async function hasAskedPermission(): Promise<boolean> {
  const val = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
  return val === 'true';
}

export async function markPermissionAsked(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Requests notification permissions from the OS.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulators don't support push — but local notifications work
    console.log('Push not available on simulator');
    return true; // Allow local notifications
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  if (existing === 'denied') return false; // Can't ask again on iOS

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  await markPermissionAsked();
  return status === 'granted';
}

// ─── Push token registration ──────────────────────────────────────────────────

/**
 * Gets the Expo Push Token for this device.
 * Must be called after permission is granted.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (cached) return cached;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID || undefined,
    });

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
    return token.data;
  } catch (err) {
    console.warn('Could not get push token:', err);
    return null;
  }
}

/**
 * Saves the push token to the user's row in Supabase.
 */
export async function savePushTokenToSupabase(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) console.warn('Could not save push token:', error.message);
}

/**
 * Full registration flow: request permission → get token → save to DB.
 * Returns the token or null.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  await setupAndroidChannel();

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const token = await getExpoPushToken();
  if (token && userId) {
    await savePushTokenToSupabase(userId, token);
  }

  return token;
}

// ─── Local notifications ──────────────────────────────────────────────────────

/**
 * Schedules an immediate local notification.
 * Used for in-app events (match, message received).
 */
export async function sendLocalNotification(
  payload: NotificationPayload
): Promise<string> {
  const channelId =
    payload.data.type === 'new_message'
      ? 'nextlove-messages'
      : 'nextlove-matches';

  return Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      sound: true,
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null, // immediate
  });
}

// ─── Badge management ─────────────────────────────────────────────────────────

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ─── Notification → route mapping ─────────────────────────────────────────────

export function getRouteFromNotification(data: NotificationData): string {
  switch (data.type) {
    case 'new_match':
      return '/(tabs)/matches';
    case 'new_message':
      return data.matchId ? `/chat/${data.matchId}` : '/(tabs)/matches';
    case 'new_like':
      return '/(tabs)/matches';
    default:
      return '/(tabs)/discover';
  }
}
