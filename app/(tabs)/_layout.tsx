import { Tabs, router, usePathname } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { translations } from '../../constants/translations';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/supabase';
import { useNotifications } from '../../contexts/NotificationContext';

function TabBarBackground() {
  return (
    <LinearGradient
      colors={['rgba(15,5,32,0.98)', 'rgba(26,10,53,0.99)']}
      style={StyleSheet.absoluteFill}
    />
  );
}

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  text: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});

export default function TabsLayout() {
  const { language } = useApp();
  const { session } = useAuth();
  const { unreadCount, resetUnread } = useNotifications();
  const t = translations[language];
  const profileChecked = useRef<string | null>(null);
  const pathname = usePathname();

  // Redirect to edit-profile if user has no profile yet
  // Track by user ID so re-login from a different account re-checks
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid || profileChecked.current === uid) return;
    profileChecked.current = uid;
    profileService.hasProfile(uid).then((has) => {
      if (!has) router.replace('/edit-profile');
    });
  }, [session?.user.id]);

  // Clear badge when user opens the matches tab
  useEffect(() => {
    if (pathname === '/(tabs)/matches') {
      resetUnread();
    }
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t.discover,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-match"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t.matches,
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="heart" size={size} color={color} />
              <NotifBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
