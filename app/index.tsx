import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

const { width, height } = Dimensions.get('window');

// ─── Slides onboarding ────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: 'sparkles',
    gradient: ['#FF6B9D', '#C44DFF'] as [string, string],
    title: 'Matching scientifique',
    subtitle: 'Notre algorithme analyse\n7 thèmes basés sur la psychologie\npour trouver votre âme sœur',
    bg: 'rgba(255,107,157,0.08)',
  },
  {
    icon: 'heart',
    gradient: ['#C44DFF', '#7B2FFF'] as [string, string],
    title: 'Swipe & Match',
    subtitle: "Parcourez des profils\nattachants. Un like mutuel\net c'est un match !",
    bg: 'rgba(196,77,255,0.08)',
  },
  {
    icon: 'chatbubble-ellipses',
    gradient: ['#7B2FFF', '#FF6B9D'] as [string, string],
    title: 'Chat & Rencontre',
    subtitle: 'Discutez en temps réel\navec vos matchs et\nfaites le premier pas',
    bg: 'rgba(123,47,255,0.08)',
  },
];

// ─── Loading splash ───────────────────────────────────────────────────────────

function Splash() {
  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.splash}>
      <LinearGradient colors={Colors.gradientAccent} style={styles.splashLogo}>
        <Ionicons name="heart" size={36} color="#FFF" />
      </LinearGradient>
      <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 24 }} />
    </LinearGradient>
  );
}

// ─── Slide ────────────────────────────────────────────────────────────────────

function Slide({ icon, gradient, title, subtitle, bg }: (typeof SLIDES)[0]) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Icône centrale */}
        <View style={[styles.iconOuter, { backgroundColor: bg }]}>
          <LinearGradient colors={gradient} style={styles.iconInner}>
            <Ionicons name={icon as any} size={52} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideSub}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const { session, loading } = useAuth();
  const { questionnaireCompleted, loadingProfiles } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [loading]);

  // Redirige selon l'état du questionnaire
  useEffect(() => {
    if (!loading && session && !loadingProfiles) {
      if (questionnaireCompleted) {
        router.replace('/(tabs)/discover');
      } else {
        // Nouvel utilisateur → questionnaire obligatoire
        router.replace('/questionnaire');
      }
    }
  }, [session, loading, questionnaireCompleted, loadingProfiles]);

  if (loading || (session && loadingProfiles)) return <Splash />;
  if (session) return <Splash />;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(p);
  };

  const goNext = () => {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }
  };

  const isLast = page === SLIDES.length - 1;

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      {/* Blobs déco */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>

          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient colors={Colors.gradientAccent} style={styles.logoIcon}>
              <Ionicons name="heart" size={20} color="#FFF" />
            </LinearGradient>
            <Text style={styles.logoText}>
              <Text style={{ color: '#FFF' }}>Next</Text>
              <Text style={{ color: Colors.primary }}>Love</Text>
            </Text>
            <View style={styles.aiPill}>
              <Ionicons name="sparkles" size={10} color={Colors.premium} />
              <Text style={styles.aiPillText}>Science</Text>
            </View>
          </View>

          {/* Slides */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.slider}
            scrollEventThrottle={16}
          >
            {SLIDES.map((s, i) => <Slide key={i} {...s} />)}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          {/* Boutons */}
          <View style={styles.buttons}>
            {isLast ? (
              <>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-up')}
                  activeOpacity={0.85}
                  style={styles.primaryWrapper}
                >
                  <LinearGradient
                    colors={Colors.gradientAccent}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryText}>Créer mon compte</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-in')}
                  activeOpacity={0.85}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryText}>J'ai déjà un compte</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={goNext}
                  activeOpacity={0.85}
                  style={styles.primaryWrapper}
                >
                  <LinearGradient
                    colors={Colors.gradientAccent}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryText}>Suivant</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-up')}
                  activeOpacity={0.85}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryText}>Passer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.disclaimer}>
            En continuant, vous acceptez nos CGU et notre politique de confidentialité
          </Text>

        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 15,
  },
  container: { flex: 1 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  blob1: { width: width * 0.9, height: width * 0.9, backgroundColor: Colors.primary, top: -width * 0.3, right: -width * 0.25 },
  blob2: { width: width * 0.7, height: width * 0.7, backgroundColor: Colors.accent, bottom: -width * 0.2, left: -width * 0.2 },
  safe: { flex: 1 },
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  logoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  aiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  aiPillText: { color: Colors.premium, fontSize: 10, fontWeight: '700' },

  // Slider
  slider: { width, flexGrow: 0 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  slideContent: { alignItems: 'center', gap: 24 },
  iconOuter: {
    width: 140, height: 140, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  iconInner: {
    width: 110, height: 110, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
  },
  slideTitle: { color: Colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  slideSub: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', lineHeight: 26 },

  // Dots
  dotsRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  dotActive: { width: 24, backgroundColor: Colors.primary },

  // Buttons
  buttons: { width: '100%', paddingHorizontal: 28, gap: 12 },
  primaryWrapper: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    alignItems: 'center', paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    backgroundColor: 'rgba(42,16,80,0.5)',
  },
  secondaryText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },

  // Disclaimer
  disclaimer: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', paddingHorizontal: 32 },
});
