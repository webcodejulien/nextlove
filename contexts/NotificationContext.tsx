import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuth } from './AuthContext';
import {
  setupNotificationHandler,
  setupAndroidChannel,
  hasAskedPermission,
  requestNotificationPermissions,
  registerForPushNotifications,
  getRouteFromNotification,
  clearBadge,
  NotificationData,
} from '../services/notificationService';

// ─── Context type ─────────────────────────────────────────────────────────────

interface NotificationContextType {
  pushToken: string | null;
  permissionGranted: boolean;
  unreadCount: number;
  incrementUnread: () => void;
  resetUnread: () => void;
  sendMatchNotification: (name: string, matchId: string) => Promise<void>;
  sendMessageNotification: (name: string, matchId: string, preview: string) => Promise<void>;
  sendLikeNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ─── Permission Modal ─────────────────────────────────────────────────────────

interface PermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

function PermissionModal({ visible, onAllow, onSkip }: PermissionModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const PERKS = [
    { icon: 'heart', text: 'Soyez alerté de vos nouveaux matchs en temps réel', color: Colors.primary },
    { icon: 'chatbubble-ellipses', text: 'Ne ratez aucun message de vos matchs', color: Colors.secondary },
    { icon: 'star', text: 'Sachez quand quelqu\'un a aimé votre profil', color: Colors.premium },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[modalStyles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            modalStyles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient colors={['#1E0A38', '#2A1050']} style={modalStyles.inner}>
            {/* Icon */}
            <LinearGradient colors={Colors.gradientPrimary} style={modalStyles.icon}>
              <Ionicons name="notifications" size={34} color="#FFF" />
            </LinearGradient>

            {/* Text */}
            <Text style={modalStyles.title}>Activez les notifications</Text>
            <Text style={modalStyles.subtitle}>
              Ne manquez aucun moment important sur NextLove
            </Text>

            {/* Perks */}
            <View style={modalStyles.perks}>
              {PERKS.map((p, i) => (
                <View key={i} style={modalStyles.perkRow}>
                  <View style={[modalStyles.perkIcon, { borderColor: p.color + '40', backgroundColor: p.color + '15' }]}>
                    <Ionicons name={p.icon as any} size={16} color={p.color} />
                  </View>
                  <Text style={modalStyles.perkText}>{p.text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity onPress={onAllow} activeOpacity={0.85} style={modalStyles.allowWrapper}>
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={modalStyles.allowBtn}
              >
                <Ionicons name="notifications" size={18} color="#FFF" />
                <Text style={modalStyles.allowText}>Activer les notifications</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSkip} style={modalStyles.skipBtn} activeOpacity={0.7}>
              <Text style={modalStyles.skipText}>Pas maintenant</Text>
            </TouchableOpacity>

            <Text style={modalStyles.legal}>
              Vous pouvez modifier ce choix à tout moment dans les réglages.
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: { marginHorizontal: 8, marginBottom: 8 },
  inner: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  perks: { width: '100%', gap: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  perkText: { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  allowWrapper: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  allowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  allowText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: 8 },
  skipText: { color: Colors.textMuted, fontSize: 14 },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
});

// ─── In-app notification toast ────────────────────────────────────────────────

interface ToastData {
  title: string;
  body: string;
  icon: string;
  color: string;
  route: string;
}

function NotificationToast({
  toast,
  onPress,
  onDismiss,
}: {
  toast: ToastData;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 280,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        toastStyles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={toastStyles.inner}>
        <LinearGradient
          colors={['rgba(42,16,80,0.97)', 'rgba(26,10,53,0.97)']}
          style={toastStyles.gradient}
        >
          <View style={[toastStyles.iconWrap, { backgroundColor: toast.color + '22', borderColor: toast.color + '44' }]}>
            <Ionicons name={toast.icon as any} size={20} color={toast.color} />
          </View>
          <View style={toastStyles.text}>
            <Text style={toastStyles.title} numberOfLines={1}>{toast.title}</Text>
            <Text style={toastStyles.body} numberOfLines={1}>{toast.body}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 12,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  inner: { borderRadius: 16, overflow: 'hidden', elevation: 12 },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { flex: 1 },
  title: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  body: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
});

const TOAST_ICONS: Record<string, { icon: string; color: string }> = {
  new_match: { icon: 'heart', color: Colors.primary },
  new_message: { icon: 'chatbubble-ellipses', color: Colors.secondary },
  new_like: { icon: 'star', color: Colors.premium },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── Setup on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    setupNotificationHandler();
    setupAndroidChannel();
  }, []);

  // ── Ask permission after login ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const checkAndPrompt = async () => {
      const alreadyAsked = await hasAskedPermission();
      if (!alreadyAsked) {
        // Short delay so the app settles before showing modal
        setTimeout(() => setShowPermModal(true), 1500);
      } else {
        // Already asked: just (re)register silently
        const token = await registerForPushNotifications(user.id);
        if (token) {
          setPushToken(token);
          setPermissionGranted(true);
        }
      }
    };

    checkAndPrompt();
  }, [user?.id]);

  // ── Notification listeners ─────────────────────────────────────────────────

  useEffect(() => {
    // Foreground notification received → show in-app toast
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as unknown as NotificationData;
      const meta = TOAST_ICONS[data?.type] ?? { icon: 'notifications', color: Colors.primary };
      setActiveToast({
        title: notification.request.content.title ?? 'NextLove',
        body: notification.request.content.body ?? '',
        icon: meta.icon,
        color: meta.color,
        route: getRouteFromNotification(data),
      });
      setUnreadCount(c => c + 1);
    });

    // User tapped a notification → navigate
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as unknown as NotificationData;
      const route = getRouteFromNotification(data);
      clearBadge();
      router.push(route as any);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAllow = useCallback(async () => {
    setShowPermModal(false);
    if (!user) return;
    const token = await registerForPushNotifications(user.id);
    if (token) {
      setPushToken(token);
      setPermissionGranted(true);
    }
  }, [user]);

  const handleSkip = useCallback(() => {
    setShowPermModal(false);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (require('../services/notificationService') as typeof import('../services/notificationService'))
      .markPermissionAsked();
  }, []);

  const incrementUnread = useCallback(() => setUnreadCount(c => c + 1), []);
  const resetUnread = useCallback(() => {
    setUnreadCount(0);
    clearBadge();
  }, []);

  // ── Notification helpers (called from app events) ──────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const notifSvc = require('../services/notificationService') as typeof import('../services/notificationService');
  const { sendLocalNotification, buildNotificationPayload } = notifSvc;

  const sendMatchNotification = useCallback(async (name: string, matchId: string) => {
    const payload = buildNotificationPayload('new_match', { name, matchId });
    await sendLocalNotification(payload);
    setUnreadCount(c => c + 1);
  }, []);

  const sendMessageNotification = useCallback(
    async (name: string, matchId: string, preview: string) => {
      const payload = buildNotificationPayload('new_message', { name, matchId, messagePreview: preview });
      await sendLocalNotification(payload);
      setUnreadCount(c => c + 1);
    },
    []
  );

  const sendLikeNotification = useCallback(async () => {
    const payload = buildNotificationPayload('new_like');
    await sendLocalNotification(payload);
    setUnreadCount(c => c + 1);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        permissionGranted,
        unreadCount,
        incrementUnread,
        resetUnread,
        sendMatchNotification,
        sendMessageNotification,
        sendLikeNotification,
      }}
    >
      {children}

      {/* Permission Modal */}
      <PermissionModal
        visible={showPermModal}
        onAllow={handleAllow}
        onSkip={handleSkip}
      />

      {/* In-app toast */}
      {activeToast && (
        <NotificationToast
          toast={activeToast}
          onPress={() => {
            router.push(activeToast.route as any);
            setActiveToast(null);
          }}
          onDismiss={() => setActiveToast(null)}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
