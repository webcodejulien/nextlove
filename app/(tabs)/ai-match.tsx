import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { Profile } from '../../constants/mockData';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

// ─── ScrollPicker (tambour) ───────────────────────────────────────────────────

const ITEM_H = 40;
const VISIBLE = 3; // lignes visibles (la centrale = valeur sélectionnée)
const PICKER_H = ITEM_H * VISIBLE;

function ScrollPicker({
  min, max, value, onChange,
}: { min: number; max: number; value: number; onChange: (v: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const scrollToValue = useCallback((v: number, animated = true) => {
    const idx = v - min;
    ref.current?.scrollTo({ y: idx * ITEM_H, animated });
  }, [min]);

  // Initialisation
  React.useEffect(() => {
    setTimeout(() => scrollToValue(value, false), 50);
  }, []);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const newVal = values[clamped];
    onChange(newVal);
    // re-snap propre
    ref.current?.scrollTo({ y: clamped * ITEM_H, animated: true });
  };

  return (
    <View style={pickerStyles.wrap}>
      {/* Ligne centrale de sélection */}
      <View pointerEvents="none" style={pickerStyles.selector} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        style={{ height: PICKER_H }}
      >
        {values.map(v => (
          <View key={v} style={pickerStyles.item}>
            <Text style={[
              pickerStyles.itemText,
              v === value && pickerStyles.itemTextActive,
            ]}>
              {v}
            </Text>
          </View>
        ))}
      </ScrollView>
      {/* Fondu haut/bas */}
      <View pointerEvents="none" style={pickerStyles.fadeTop} />
      <View pointerEvents="none" style={pickerStyles.fadeBottom} />
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: {
    width: 80,
    height: PICKER_H,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  selector: {
    position: 'absolute',
    left: 0, right: 0,
    top: ITEM_H,
    height: ITEM_H,
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.primary,
    zIndex: 2,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 22,
    fontWeight: '500',
  },
  itemTextActive: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  fadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H,
    backgroundColor: 'rgba(15,5,30,0.6)',
    zIndex: 3,
  },
  fadeBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H,
    backgroundColor: 'rgba(15,5,30,0.6)',
    zIndex: 3,
  },
});

// ─── Types filtres ────────────────────────────────────────────────────────────

interface Filters {
  ageMin: number;
  ageMax: number;
  distance: number; // km, 999 = illimité
  // Gold
  children: string | null;   // 'no_children' | 'has_children' | 'wants_children' | 'no_want'
  education: string | null;
  smoking: string | null;
  drinking: string | null;
  relation: string | null;
  lifestyle: string | null;
}

const DEFAULT_FILTERS: Filters = {
  ageMin: 18, ageMax: 55, distance: 999,
  children: null, education: null, smoking: null,
  drinking: null, relation: null, lifestyle: null,
};

// ─── Données options Gold ─────────────────────────────────────────────────────

const CHILDREN_OPTIONS = [
  { value: 'no_children', label: 'Sans enfants' },
  { value: 'has_children', label: 'A des enfants' },
  { value: 'wants_children', label: 'Veut des enfants' },
  { value: 'no_want', label: 'Ne veut pas d\'enfants' },
];
const EDUCATION_OPTIONS = [
  { value: 'bac', label: 'Bac' },
  { value: 'bac3', label: 'Bac+3' },
  { value: 'bac5', label: 'Bac+5' },
  { value: 'phd', label: 'Doctorat' },
];
const SMOKING_OPTIONS = [
  { value: 'non_smoker', label: 'Non-fumeur(se)' },
  { value: 'smoker', label: 'Fumeur(se)' },
  { value: 'occasional', label: 'Occasionnel(le)' },
];
const DRINKING_OPTIONS = [
  { value: 'never', label: 'Jamais' },
  { value: 'occasional', label: 'Occasionnel' },
  { value: 'regular', label: 'Régulier' },
];
const RELATION_OPTIONS = [
  { value: 'serious', label: '💍 Sérieuse' },
  { value: 'casual', label: '✨ Casual' },
  { value: 'friendship', label: '🤝 Amitié' },
  { value: 'open', label: '🌍 Ouvert à tout' },
];
const LIFESTYLE_OPTIONS = [
  { value: 'sport', label: '🏃 Sportif(ve)' },
  { value: 'creative', label: '🎨 Créatif(ve)' },
  { value: 'intellectual', label: '📚 Intellectuel(le)' },
  { value: 'traveler', label: '✈️ Voyageur(se)' },
  { value: 'homebody', label: '🏠 Homebody' },
  { value: 'ambitious', label: '🚀 Ambitieux(se)' },
];

// ─── Composants UI ────────────────────────────────────────────────────────────

function SectionTitle({ title, locked }: { title: string; locked?: boolean }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {locked && (
        <View style={styles.goldBadge}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={styles.goldText}>Gold</Text>
        </View>
      )}
    </View>
  );
}

function OptionChip({ label, active, onPress, locked }: {
  label: string; active: boolean; onPress: () => void; locked?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, active && styles.chipActive, locked && styles.chipLocked]}
    >
      {locked && <Ionicons name="lock-closed" size={10} color="#FFD700" style={{ marginRight: 3 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive, locked && styles.chipTextLocked]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProfileCard({
  profile,
  isLiked,
  onLike,
}: {
  profile: Profile;
  isLiked: boolean;
  onLike: (profile: Profile) => void;
}) {
  const score = profile.compatibilityScore ?? 75;
  const scoreColor = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.danger;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    // Animation rapide du cœur
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
    onLike(profile);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({
        pathname: '/profile/[userId]',
        params: {
          userId: profile.id,
          name: profile.name,
          photo: profile.photo,
          score: String(score),
          bio: profile.bio ?? '',
          job: profile.job ?? '',
          education: profile.education ?? '',
          location: profile.location ?? '',
        },
      })}
    >
      <Image source={{ uri: profile.photo }} style={styles.cardImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={styles.cardGradient} />

      {/* Score badge */}
      <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
        <Ionicons name="sparkles" size={9} color={scoreColor} />
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
      </View>

      {/* Bouton like */}
      <TouchableOpacity
        style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
        onPress={handleLike}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? '#FFF' : Colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{profile.name}, {profile.age}</Text>
        {profile.location ? (
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.cardLocationText} numberOfLines={1}>{profile.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const { profiles, likedIds, isPremium, myLookingFor, addLike, remainingLikes, loadingProfiles, refreshProfiles } = useApp();

  // Recharge les profils au focus si vides (ex: après hot reload)
  useFocusEffect(useCallback(() => {
    if (profiles.length === 0 || profiles.every(p => p.id.length <= 2)) {
      refreshProfiles();
    }
  }, [profiles.length]));
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [matchModal, setMatchModal] = useState<Profile | null>(null);
  const matchAnim = useRef(new Animated.Value(0)).current;

  const set = (key: keyof Filters, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const toggle = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));

  const handleLike = useCallback(async (profile: Profile) => {
    if (likedIds.includes(profile.id)) return; // déjà liké — cœur déjà plein
    if (!isPremium && remainingLikes <= 0) {
      Alert.alert(
        '💔 Likes épuisés',
        'Tu as utilisé tous tes likes gratuits du jour. Reviens demain ou passe Premium !',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: '⭐ Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    const matched = await addLike(profile.id);
    if (matched) {
      setMatchModal({ ...matched, compatibilityScore: profile.compatibilityScore });
      Animated.spring(matchAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [likedIds, isPremium, remainingLikes, addLike, matchAnim]);

  const closeMatchModal = () => {
    Animated.timing(matchAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setMatchModal(null));
  };

  const hasActiveFilters = filters.ageMin !== 18 || filters.ageMax !== 55 ||
    filters.distance !== 999 || !!filters.children || !!filters.education ||
    !!filters.smoking || !!filters.drinking || !!filters.relation || !!filters.lifestyle;

  const filtered = useMemo(() => {
    let list = [...profiles];

    // Filtre automatique basé sur looking_for du profil actuel
    if (myLookingFor && myLookingFor !== 'everyone') {
      list = list.filter(p => p.gender === myLookingFor);
    }

    // Âge
    list = list.filter(p => p.age >= filters.ageMin && p.age <= filters.ageMax);

    // Gold filters (seulement si premium)
    if (isPremium) {
      if (filters.relation) {
        list = list.filter(p => {
          const interests = p.interests.join(' ').toLowerCase();
          const map: Record<string, string[]> = {
            serious: ['sérieuse', 'serious', 'relation sérieuse'],
            casual: ['casual', 'sans engagement'],
            friendship: ['amitié', 'friendship'],
            open: ['ouvert', 'open'],
          };
          return map[filters.relation!]?.some(k => interests.includes(k)) ?? true;
        });
      }
      if (filters.education) {
        list = list.filter(p => {
          const edu = (p.education ?? '').toLowerCase();
          return edu.includes(filters.education!.toLowerCase());
        });
      }
    }

    return [...list].sort((a, b) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0));
  }, [profiles, likedIds, filters, isPremium, myLookingFor]);

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recherche</Text>
          <View style={styles.headerBtns}>
            {hasActiveFilters && (
              <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)} style={styles.resetBtn}>
                <Text style={styles.resetText}>Réinitialiser</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.toggleBtn}>
              <Ionicons name={showFilters ? 'chevron-up' : 'options'} size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {showFilters && (
            <View style={styles.filtersPanel}>

              {/* ── Gratuit : Âge ─────────────────────────────── */}
              <SectionTitle title="Âge" />
              <View style={styles.pickersRow}>
                <View style={styles.pickerBox}>
                  <Text style={styles.pickerLabel}>Min</Text>
                  <ScrollPicker
                    min={18} max={filters.ageMax - 1}
                    value={filters.ageMin}
                    onChange={v => set('ageMin', v)}
                  />
                </View>
                <Text style={styles.pickerSep}>–</Text>
                <View style={styles.pickerBox}>
                  <Text style={styles.pickerLabel}>Max</Text>
                  <ScrollPicker
                    min={filters.ageMin + 1} max={70}
                    value={filters.ageMax}
                    onChange={v => set('ageMax', v)}
                  />
                </View>
              </View>

              {/* ── Gratuit : Distance ────────────────────────── */}
              <SectionTitle title="Distance" />
              <View style={styles.distanceRow}>
                {[10, 25, 50, 100, 999].map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => set('distance', d)}
                    style={[styles.distChip, filters.distance === d && styles.distChipActive]}
                  >
                    <Text style={[styles.distChipText, filters.distance === d && styles.distChipTextActive]}>
                      {d >= 999 ? '∞' : `${d} km`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Gold : Relation ───────────────────────────── */}
              <SectionTitle title="Type de relation" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {RELATION_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.relation === o.value}
                    onPress={() => isPremium ? toggle('relation', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {/* ── Gold : Enfants ────────────────────────────── */}
              <SectionTitle title="Enfants" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {CHILDREN_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.children === o.value}
                    onPress={() => isPremium ? toggle('children', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {/* ── Gold : Éducation ──────────────────────────── */}
              <SectionTitle title="Niveau d'études" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {EDUCATION_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.education === o.value}
                    onPress={() => isPremium ? toggle('education', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {/* ── Gold : Tabac ──────────────────────────────── */}
              <SectionTitle title="Tabac" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {SMOKING_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.smoking === o.value}
                    onPress={() => isPremium ? toggle('smoking', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {/* ── Gold : Alcool ─────────────────────────────── */}
              <SectionTitle title="Alcool" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {DRINKING_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.drinking === o.value}
                    onPress={() => isPremium ? toggle('drinking', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {/* ── Gold : Style de vie ───────────────────────── */}
              <SectionTitle title="Style de vie" locked={!isPremium} />
              <View style={styles.chipsWrap}>
                {LIFESTYLE_OPTIONS.map(o => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    active={filters.lifestyle === o.value}
                    onPress={() => isPremium ? toggle('lifestyle', o.value) : null}
                    locked={!isPremium}
                  />
                ))}
              </View>

              {!isPremium && (
                <TouchableOpacity
                  style={styles.premiumBanner}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FFB800', '#FF8C00']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.premiumBannerInner}
                  >
                    <Ionicons name="star" size={18} color="#FFF" />
                    <View>
                      <Text style={styles.premiumBannerTitle}>Débloquer les filtres Gold</Text>
                      <Text style={styles.premiumBannerSub}>Premium 9,99€/mois · Matchs illimités</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />
            </View>
          )}

          {/* ── Grille résultats ───────────────────────────── */}
          {loadingProfiles ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Chargement des profils...</Text>
            </View>
          ) : null}
          <View style={styles.grid}>
            {filtered.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                isLiked={likedIds.includes(p.id)}
                onLike={handleLike}
              />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucun profil</Text>
                <Text style={styles.emptySubText}>Élargis tes filtres</Text>
              </View>
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Compteur likes restants (non premium) */}
        {!isPremium && (
          <View style={[styles.likesBar, remainingLikes <= 3 && styles.likesBarLow]}>
            <Ionicons name="heart" size={13} color={remainingLikes <= 3 ? Colors.danger : Colors.primary} />
            <Text style={[styles.likesBarText, remainingLikes <= 3 && styles.likesBarTextLow]}>
              {remainingLikes} like{remainingLikes !== 1 ? 's' : ''} restant{remainingLikes !== 1 ? 's' : ''} aujourd'hui
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Modal match */}
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
            <LinearGradient colors={Colors.gradientPrimary} style={styles.modalIcon}>
              <Ionicons name="heart" size={32} color="#FFF" />
            </LinearGradient>
            <Text style={styles.modalTitle}>C'est un Match ! 🎉</Text>
            <Text style={styles.modalSub}>
              Vous et {matchModal?.name} vous plaisez mutuellement !
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={closeMatchModal} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>Continuer</Text>
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
                <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalPrimary}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                  <Text style={styles.modalPrimaryText}>Envoyer un message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: '800' },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resetBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.primary,
  },
  resetText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  toggleBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  filtersPanel: { paddingHorizontal: 20, gap: 10 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 4 },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  goldBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  goldText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },

  pickersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  pickerBox: { alignItems: 'center', gap: 8 },
  pickerLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  pickerSep: { color: Colors.textSecondary, fontSize: 28, fontWeight: '300', marginTop: 20 },
  distanceRow: { flexDirection: 'row', gap: 8 },
  distChip: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  distChipActive: { backgroundColor: 'rgba(255,107,157,0.2)', borderColor: Colors.primary },
  distChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  distChipTextActive: { color: Colors.primary },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  chipActive: { backgroundColor: 'rgba(255,107,157,0.2)', borderColor: Colors.primary },
  chipLocked: { opacity: 0.55 },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  chipTextLocked: { color: Colors.textMuted },

  premiumBanner: { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  premiumBannerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
  },
  premiumBannerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  premiumBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.cardBorder, marginTop: 16 },

  gridHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  gridTitle: { color: Colors.textSecondary, fontSize: 13 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16,
  },

  card: {
    width: CARD_W, height: CARD_W * 1.35,
    borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.card,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  scoreBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(20,8,40,0.85)',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  scoreText: { fontSize: 11, fontWeight: '700' },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, gap: 2 },
  cardName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  likeBtn: {
    position: 'absolute',
    bottom: 36,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    zIndex: 5,
  },
  likeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  likesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  likesBarLow: { backgroundColor: 'rgba(255,82,82,0.06)' },
  likesBarText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  likesBarTextLow: { color: Colors.danger },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', borderRadius: 28, padding: 32,
    alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  modalIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: Colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  modalSub: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  modalBtns: { width: '100%', gap: 12, marginTop: 8 },
  modalSecondary: { alignItems: 'center', paddingVertical: 12 },
  modalSecondaryText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  modalPrimaryWrapper: { borderRadius: 14, overflow: 'hidden' },
  modalPrimary: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 15,
  },
  modalPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cardLocationText: { color: Colors.textSecondary, fontSize: 11 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  empty: { width: '100%', alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptySubText: { color: Colors.textSecondary, fontSize: 14 },
});
