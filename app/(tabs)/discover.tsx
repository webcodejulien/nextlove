import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { translations } from '../../constants/translations';
import SwipeCard from '../../components/SwipeCard';
import AdBanner from '../../components/AdBanner';
import SwipeTutorial from '../../components/SwipeTutorial';
import { router } from 'expo-router';
import { Profile } from '../../constants/mockData';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';


const { width, height: SCREEN_H } = Dimensions.get('window');
const CARD_H_PREMIUM = SCREEN_H * 0.60;   // sans bannière
const CARD_H_FREE    = SCREEN_H * 0.55;   // avec bannière pub

// ─── Types filtres ────────────────────────────────────────────────────────────

interface Filters {
  ageMin: number;
  ageMax: number;
  maxDistance: number;       // km, 0 = pas de limite
  relationTypes: string[];
  education: string[];
  lifestyle: string[];
  smokingOk: boolean;        // true = tous, false = non-fumeurs seulement
}

const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 55,
  maxDistance: 0,
  relationTypes: [],
  education: [],
  lifestyle: [],
  smokingOk: true,
};

const RELATION_OPTIONS = [
  { value: 'serious', label: 'Sérieuse', emoji: '💍' },
  { value: 'casual', label: 'Casual', emoji: '✨' },
  { value: 'friendship', label: 'Amitié', emoji: '🤝' },
  { value: 'open', label: 'Ouvert', emoji: '🌈' },
];


const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'Bac', emoji: '📜' },
  { value: 'bachelors', label: 'Bac+3', emoji: '🎓' },
  { value: 'masters', label: 'Bac+5', emoji: '🎓' },
  { value: 'phd', label: 'Doctorat', emoji: '🏅' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'Actif', label: 'Actif(ve)', emoji: '🏃' },
  { value: 'Casanier', label: 'Casanier(ère)', emoji: '🏠' },
  { value: 'Équilibré', label: 'Équilibré(e)', emoji: '⚖️' },
];

const DISTANCE_STEPS = [10, 25, 50, 100, 200, 500];

// ─── Helpers distance (Haversine) ─────────────────────────────────────────────

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── StepSlider (générique) ───────────────────────────────────────────────────

function StepSlider({
  label,
  value,
  steps,
  format,
  onChange,
}: {
  label: string;
  value: number;
  steps: number[];
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const idx = steps.indexOf(value);
  const pct = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 0;

  return (
    <View style={sliderS.container}>
      <View style={sliderS.header}>
        <Text style={sliderS.label}>{label}</Text>
        <View style={sliderS.badge}>
          <Text style={sliderS.badgeText}>{format(value)}</Text>
        </View>
      </View>
      {/* Track visuel */}
      <View style={sliderS.track}>
        <View style={[sliderS.fill, { width: `${pct}%` as any }]}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      {/* Boutons steps */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={sliderS.dots}>
          {steps.map(step => {
            const active = step === value;
            const before = step <= value;
            return (
              <TouchableOpacity
                key={step}
                onPress={() => onChange(step)}
                style={[sliderS.dot, active && sliderS.dotActive, before && !active && sliderS.dotBefore]}
                activeOpacity={0.7}
              >
                {active && (
                  <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} />
                )}
                <Text style={[sliderS.dotLabel, (active || before) && sliderS.dotLabelActive]}>
                  {format(step).replace(' km', '').replace(' ans', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const sliderS = StyleSheet.create({
  container: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  badge: {
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  badgeText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  dot: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  dotBefore: { borderColor: 'rgba(255,107,157,0.25)', backgroundColor: 'rgba(255,107,157,0.08)' },
  dotActive: { borderColor: Colors.primary },
  dotLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  dotLabelActive: { color: Colors.primary, fontWeight: '700' },
});

// ─── Chips ────────────────────────────────────────────────────────────────────

function Chips({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: { value: string; label: string; emoji: string }[];
  selected: string | string[];
  onSelect: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <View style={chipS.wrap}>
      {options.map(opt => {
        const active = isActive(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[chipS.chip, active && chipS.active]}
            activeOpacity={0.75}
          >
            {active && (
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Text style={chipS.emoji}>{opt.emoji}</Text>
            <Text style={[chipS.label, active && chipS.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipS = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  active: { borderColor: Colors.primary },
  emoji: { fontSize: 14 },
  label: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  labelActive: { color: '#FFF' },
});

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function FilterToggle({
  label,
  icon,
  value,
  onToggle,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[toggleS.row, value && toggleS.rowActive]}
      activeOpacity={0.75}
    >
      {value && <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
      <Ionicons name={icon as any} size={16} color={value ? '#FFF' : Colors.textMuted} />
      <Text style={[toggleS.label, value && toggleS.labelActive]}>{label}</Text>
      {value && <Ionicons name="checkmark" size={14} color="#FFF" />}
    </TouchableOpacity>
  );
}

const toggleS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  rowActive: { borderColor: Colors.primary },
  label: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', flex: 1 },
  labelActive: { color: '#FFF' },
});

// ─── Section ──────────────────────────────────────────────────────────────────

function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={fsectionS.box}>
      <Text style={fsectionS.title}>{title}</Text>
      {children}
    </View>
  );
}

const fsectionS = StyleSheet.create({
  box: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  title: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

// ─── Modal filtres ────────────────────────────────────────────────────────────

const AGE_STEPS = Array.from({ length: 43 }, (_, i) => i + 18);
const DIST_STEPS = [0, 10, 25, 50, 100, 200, 500];

function FilterModal({
  visible,
  filters,
  onApply,
  onClose,
  onLocationSet,
}: {
  visible: boolean;
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
  onLocationSet: (coords: { lat: number; lng: number }) => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  const [locating, setLocating] = useState(false);

  useEffect(() => { if (visible) setLocal(filters); }, [visible]);

  const update = (key: keyof Filters, value: any) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const toggle = <T extends string>(key: keyof Filters, v: T) => {
    const arr = local[key] as T[];
    update(key, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const activeCount = [
    local.ageMin > 18 || local.ageMax < 55,
    local.maxDistance > 0,
  ].filter(Boolean).length;

  const requestLocation = async () => {
    setLocating(true);
    try {
      const { requestForegroundPermissionsAsync, getCurrentPositionAsync } =
        await import('expo-location');
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation pour filtrer par distance.');
        return;
      }
      const pos = await getCurrentPositionAsync({});
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      onLocationSet(coords);
      Alert.alert('📍 Localisation activée', 'Le filtre distance utilisera votre position actuelle.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={filterS.backdrop}>
        <LinearGradient colors={['#2A1050', '#1A0A35']} style={filterS.sheet}>
          <View style={filterS.handle} />

          {/* Header */}
          <View style={filterS.header}>
            <Text style={filterS.title}>Filtrer les profils</Text>
            <TouchableOpacity onPress={() => setLocal(DEFAULT_FILTERS)} style={filterS.resetBtn}>
              <Ionicons name="refresh" size={14} color={Colors.textMuted} />
              <Text style={filterS.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Âge */}
            <FSection title="🎂 Tranche d'âge">
              <StepSlider
                label={`De ${local.ageMin} ans`}
                value={local.ageMin}
                steps={AGE_STEPS}
                format={v => `${v} ans`}
                onChange={v => update('ageMin', Math.min(v, local.ageMax - 1))}
              />
              <StepSlider
                label={`À ${local.ageMax} ans`}
                value={local.ageMax}
                steps={AGE_STEPS}
                format={v => `${v} ans`}
                onChange={v => update('ageMax', Math.max(v, local.ageMin + 1))}
              />
            </FSection>

            {/* Distance */}
            <FSection title="📍 Distance maximale">
              <StepSlider
                label={local.maxDistance === 0 ? 'Sans limite' : `≤ ${local.maxDistance} km`}
                value={local.maxDistance}
                steps={DIST_STEPS}
                format={v => v === 0 ? 'Illimité' : `${v} km`}
                onChange={v => update('maxDistance', v)}
              />
              {local.maxDistance > 0 && (
                <TouchableOpacity
                  style={filterS.locateBtn}
                  onPress={requestLocation}
                  disabled={locating}
                  activeOpacity={0.8}
                >
                  <Ionicons name="locate" size={15} color={Colors.primary} />
                  <Text style={filterS.locateBtnText}>
                    {locating ? 'Localisation...' : 'Utiliser ma position GPS'}
                  </Text>
                  {locating && <ActivityIndicator size="small" color={Colors.primary} />}
                </TouchableOpacity>
              )}
            </FSection>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bouton appliquer */}
          <TouchableOpacity
            onPress={() => { onApply(local); onClose(); }}
            style={filterS.applyWrapper}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={filterS.applyBtn}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={filterS.applyText}>
                Appliquer{activeCount > 0 ? ` · ${activeCount} filtre${activeCount > 1 ? 's' : ''}` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const filterS = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.cardBorder,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.cardBorder,
    alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  resetText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  locateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: 'rgba(255,107,157,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)',
  },
  locateBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600', flex: 1 },
  applyWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 16,
  },
  applyText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { language, isPremium, profiles, loadingProfiles, likedIds, skippedIds, addLike, addSkip, undoSkip, resetSwipes, remainingLikes, setRemainingLikes, questionnaireCompleted, myLookingFor } =
    useApp();
  const t = translations[language];

  const [matchModal, setMatchModal] = useState<Profile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [lastSkipped, setLastSkipped] = useState<Profile | null>(null);
  const [superLikeAnim] = useState(new Animated.Value(0));
  const matchAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showWelcome, setShowWelcome] = useState(false);

  // Affiche le welcome modal uniquement la première fois (flag persisté dans AsyncStorage)
  React.useEffect(() => {
    if (!questionnaireCompleted || loadingProfiles) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem('welcome_shown').then((val: string | null) => {
      if (!val) {
        setShowWelcome(true);
        timer = setTimeout(() => setShowWelcome(false), 3500);
        AsyncStorage.setItem('welcome_shown', '1');
      }
    });
    return () => { if (timer) clearTimeout(timer); };
  }, [questionnaireCompleted, loadingProfiles]);

  const likesExhausted = !isPremium && remainingLikes <= 0;

  const handleWatchAd = async () => {
    setWatchingAd(true);
    try {
      const { showRewardedAd, addBonusLikes, LIKES_PER_VIDEO } = await import('../../services/adService');
      const rewarded = await showRewardedAd();
      if (rewarded) {
        const newTotal = await addBonusLikes();
        setRemainingLikes(newTotal);
      }
    } catch {}
    setWatchingAd(false);
  };

  // Nombre de filtres actifs pour le badge
  const activeFilterCount = [
    filters.ageMin > 18 || filters.ageMax < 55,
    filters.maxDistance > 0,
  ].filter(Boolean).length;

  const available = profiles.filter(p => {
    if (likedIds.includes(p.id) || skippedIds.includes(p.id)) return false;
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    // Filtre automatique basé sur les préférences du profil actuel
    if (myLookingFor && myLookingFor !== 'everyone' && p.gender !== myLookingFor) return false;
    // ✅ Filtre distance — applique la formule Haversine si coordonnées disponibles
    if (filters.maxDistance > 0) {
      if (!userCoords) return true; // GPS pas encore demandé → ne pas bloquer
      if (!p.coords?.lat || !p.coords?.lng) return true; // profil sans coords → inclure quand même
      const dist = haversineKm(userCoords.lat, userCoords.lng, p.coords.lat, p.coords.lng);
      if (dist > filters.maxDistance) return false;
    }
    return true;
  });

  const showMatchModal = (profile: Profile) => {
    setMatchModal(profile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(matchAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const closeMatchModal = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    Animated.timing(matchAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setMatchModal(null));
  };

  const handleLike = async (profile: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const matched = await addLike(profile.id);
    if (matched) showMatchModal({ ...matched, compatibilityScore: profile.compatibilityScore });
  };

  const handleSuperLike = async (profile: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Animation étoile
    superLikeAnim.setValue(0);
    Animated.sequence([
      Animated.spring(superLikeAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(superLikeAnim, { toValue: 0, duration: 600, delay: 500, useNativeDriver: true }),
    ]).start();
    const matched = await addLike(profile.id);
    if (matched) showMatchModal({ ...matched, compatibilityScore: profile.compatibilityScore });
  };

  const handleSkip = (profile: Profile) => {
    setLastSkipped(profile);
    addSkip(profile.id);
  };

  const handleUndo = () => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    if (!lastSkipped) return;
    undoSkip(lastSkipped.id);
    setLastSkipped(null);
  };

  const topProfile = available[0];
  const nextProfile = available[1];

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NextLove</Text>
          <View style={styles.headerRight}>
            {/* Compteur de likes */}
            {!isPremium && (
              <View style={[styles.likesCounter, remainingLikes <= 3 && styles.likesCounterLow]}>
                <Ionicons name="heart" size={13} color={remainingLikes <= 3 ? Colors.danger : Colors.primary} />
                <Text style={[styles.likesCounterText, remainingLikes <= 3 && styles.likesCounterLowText]}>
                  {remainingLikes}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setShowFilters(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={22} color={activeFilterCount > 0 ? Colors.primary : Colors.textSecondary} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!isPremium && (
          <View style={{ zIndex: 20 }}>
            <AdBanner onPremiumPress={() => router.push('/(tabs)/profile')} />
          </View>
        )}

        {/* Cards area */}
        <View style={styles.cardsArea}>
          {loadingProfiles ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Chargement des profils...</Text>
            </View>
          ) : likesExhausted ? (
            <View style={styles.exhaustedState}>
              <LinearGradient colors={['rgba(255,82,82,0.15)', 'rgba(255,82,82,0.05)']} style={styles.exhaustedCard}>
                <Text style={styles.exhaustedEmoji}>💔</Text>
                <Text style={styles.exhaustedTitle}>Likes épuisés !</Text>
                <Text style={styles.exhaustedSub}>
                  Vous avez utilisé vos {10} likes gratuits du jour.{'\n'}
                  Revenez demain ou regardez une vidéo.
                </Text>

                {/* Bouton vidéo rewarded */}
                <TouchableOpacity
                  onPress={handleWatchAd}
                  disabled={watchingAd}
                  style={styles.watchAdWrapper}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FF6B35', '#FF9500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.watchAdBtn}
                  >
                    {watchingAd ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={22} color="#FFF" />
                        <Text style={styles.watchAdText}>Regarder 1 vidéo → +5 likes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Bouton premium */}
                <TouchableOpacity
                  onPress={() => router.push('/premium')}
                  style={styles.premiumAdBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={16} color={Colors.premium} />
                  <Text style={styles.premiumAdText}>Passer Premium — likes illimités</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : available.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={48} color="#FFF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>{t.noMoreProfiles}</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilterCount > 0
                  ? 'Aucun profil ne correspond à vos filtres'
                  : 'Vous avez vu tous les profils disponibles'}
              </Text>
              {activeFilterCount > 0 ? (
                <TouchableOpacity
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                  style={styles.refreshBtn}
                >
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.refreshBtnInner}
                  >
                    <Ionicons name="options-outline" size={18} color="#FFF" />
                    <Text style={styles.refreshBtnText}>Réinitialiser les filtres</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={resetSwipes} style={styles.refreshBtn}>
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.refreshBtnInner}
                  >
                    <Ionicons name="refresh" size={18} color="#FFF" />
                    <Text style={styles.refreshBtnText}>{t.refreshProfiles}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {nextProfile && (
                <SwipeCard
                  key={`bg-${nextProfile.id}`}
                  profile={nextProfile}
                  onSwipeLeft={() => {}}
                  onSwipeRight={() => {}}
                  isTop={false}
                  cardHeight={isPremium ? CARD_H_PREMIUM : CARD_H_FREE}
                />
              )}
              {topProfile && (
                <SwipeCard
                  key={topProfile.id}
                  profile={topProfile}
                  onSwipeLeft={() => handleSkip(topProfile)}
                  onSwipeRight={() => handleLike(topProfile)}
                  isTop
                  cardHeight={isPremium ? CARD_H_PREMIUM : CARD_H_FREE}
                />
              )}
            </>
          )}
        </View>

        {/* Action buttons */}
        {!loadingProfiles && topProfile && (
          <View style={styles.actions}>
            {/* Undo — premium only */}
            <TouchableOpacity
              onPress={handleUndo}
              style={[styles.actionBtn, styles.undoBtn, !lastSkipped && styles.actionBtnDisabled]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-undo" size={22} color={isPremium && lastSkipped ? Colors.warning : Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSkip(topProfile)}
              style={[styles.actionBtn, styles.skipBtn]}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={30} color={Colors.skipColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLike(topProfile)}
              style={[styles.actionBtn, styles.likeBtn]}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={30} color={Colors.likeColor} />
            </TouchableOpacity>

            {/* Super Like — premium only */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.superLikeBtn]}
              activeOpacity={0.8}
              onPress={() => isPremium ? handleSuperLike(topProfile) : router.push('/premium')}
            >
              <Animated.View style={{
                transform: [{ scale: superLikeAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] }) }]
              }}>
                <Ionicons name="star" size={22} color={isPremium ? Colors.premium : Colors.textMuted} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>

      {/* Match Modal */}
      <Modal visible={!!matchModal} transparent animationType="none">
        <Animated.View
          style={[
            styles.modalBackdrop,
            {
              opacity: matchAnim,
              transform: [{ scale: matchAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
          ]}
        >
          <LinearGradient colors={['#1E0840', '#2A1050']} style={styles.modalCard}>
            {/* Photos côte à côte */}
            <View style={styles.modalPhotos}>
              {/* Photo de l'utilisateur courant (placeholder) */}
              <View style={styles.modalPhotoWrap}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.modalPhotoGrad}>
                  <Ionicons name="person" size={30} color="#FFF" />
                </LinearGradient>
                <View style={styles.modalHeartBadge}>
                  <Ionicons name="heart" size={14} color="#FFF" />
                </View>
              </View>

              {/* Icône cœur central */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.modalCenterHeart}>
                  <Ionicons name="heart" size={24} color="#FFF" />
                </LinearGradient>
              </Animated.View>

              {/* Photo du match */}
              <View style={styles.modalPhotoWrap}>
                {matchModal?.photo ? (
                  <Image source={{ uri: matchModal.photo }} style={styles.modalMatchPhoto} />
                ) : (
                  <LinearGradient colors={Colors.gradientAccent} style={styles.modalPhotoGrad}>
                    <Ionicons name="person" size={30} color="#FFF" />
                  </LinearGradient>
                )}
                <View style={styles.modalHeartBadge}>
                  <Ionicons name="heart" size={14} color="#FFF" />
                </View>
              </View>
            </View>

            <Text style={styles.modalTitle}>C'est un Match ! 🎉</Text>
            <Text style={styles.modalName}>
              Vous et {matchModal?.name} vous plaisez mutuellement !
            </Text>
            {matchModal?.compatibilityScore && (
              <View style={styles.modalScore}>
                <Ionicons name="sparkles" size={16} color={Colors.premium} />
                <Text style={styles.modalScoreText}>
                  {matchModal.compatibilityScore}% de compatibilité
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeMatchModal} style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryText}>Continuer à swiper</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  closeMatchModal();
                  if (matchModal) {
                    router.push({
                      pathname: '/chat/[matchId]',
                      params: {
                        matchId: matchModal.matchId ?? matchModal.id,
                        userId: matchModal.id,
                        name: matchModal.name,
                        photo: matchModal.photo,
                        online: 'true',
                      },
                    });
                  }
                }}
                style={styles.modalPrimaryWrapper}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalPrimaryBtn}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                  <Text style={styles.modalPrimaryText}>Envoyer un message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
        onLocationSet={setUserCoords}
      />

      {/* Welcome modal après questionnaire */}
      <Modal visible={showWelcome} transparent animationType="fade">
        <View style={styles.welcomeOverlay}>
          <Animated.View style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <Text style={styles.welcomeTitle}>Profil complété !</Text>
            <Text style={styles.welcomeSub}>
              Votre score est prêt.{'\n'}Découvrez vos matchs compatibles 💫
            </Text>
          </Animated.View>
        </View>
      </Modal>

      <SwipeTutorial />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  // Welcome modal
  welcomeOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  welcomeCard: {
    backgroundColor: '#1A0535',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  welcomeEmoji: { fontSize: 52 },
  welcomeTitle: {
    color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center',
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 15,
    textAlign: 'center', lineHeight: 22,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: '900' },
  headerSub: { color: Colors.textMuted, fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  likesCounterLow: { borderColor: Colors.danger, backgroundColor: 'rgba(255,82,82,0.1)' },
  likesCounterText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  likesCounterLowText: { color: Colors.danger },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  cardsArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  loadingState: { alignItems: 'center', gap: 16 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  exhaustedState: { width: '100%', paddingHorizontal: 16 },
  exhaustedCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  exhaustedEmoji: { fontSize: 48 },
  exhaustedTitle: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  exhaustedSub: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  watchAdWrapper: { borderRadius: 14, overflow: 'hidden', width: '100%', marginTop: 8 },
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  watchAdText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  premiumAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  premiumAdText: { color: Colors.premium, fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', gap: 14 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  refreshBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  refreshBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  refreshBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  skipBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.skipColor,
  },
  likeBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.likeColor,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  superLikeBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.premium,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  undoBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.warning,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  actionBtnDisabled: {
    borderColor: Colors.cardBorder,
    opacity: 0.4,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 4,
  },
  modalPhotoWrap: {
    position: 'relative',
  },
  modalPhotoGrad: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  modalMatchPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  modalCenterHeart: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginHorizontal: -8,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  modalHeartBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  modalTitle: { color: Colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  modalName: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  modalScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  modalScoreText: { color: Colors.premium, fontSize: 13, fontWeight: '700' },
  modalButtons: { width: '100%', gap: 12, marginTop: 8 },
  modalSecondaryBtn: { alignItems: 'center', paddingVertical: 14 },
  modalSecondaryText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  modalPrimaryWrapper: { borderRadius: 14, overflow: 'hidden' },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  modalPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
