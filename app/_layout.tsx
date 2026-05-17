import { useEffect } from 'react';
import { Stack, useSegments, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ConsentProvider } from '../contexts/ConsentContext';
import ConsentBanner from '../components/ConsentBanner';
import { setupNotificationHandler } from '../services/notificationService';

// Configure notification display behaviour as early as possible
setupNotificationHandler();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';
    const inTabsGroup = seg[0] === '(tabs)';
    const inQuestionnaire = seg[0] === 'questionnaire';
    const isWelcome = seg.length === 0;

    if (session) {
      // Logged in: redirect away from auth/welcome screens
      if (inAuthGroup || isWelcome) {
        router.replace('/(tabs)/discover');
      }
    } else {
      // Not logged in: protect app screens
      if (inTabsGroup || inQuestionnaire) {
        router.replace('/');
      }
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="questionnaire" />
      <Stack.Screen
        name="chat/[matchId]"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      <Stack.Screen
        name="premium"
        options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/[userId]"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      <Stack.Screen
        name="settings"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      <Stack.Screen
        name="legal/cgu"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ConsentProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
              {/* Bannière RGPD — visible au premier lancement */}
              <ConsentBanner />
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </ConsentProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0520' },
});
