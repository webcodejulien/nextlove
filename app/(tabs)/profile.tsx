import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { translations, Language } from '../../constants/translations';
import { currentUser } from '../../constants/mockData';
import AdBanner from '../../components/AdBanner';
import { getScoreLabel } from '../../services/questionnaireScore';
import PhotoPicker from '../../components/PhotoPicker';
import { UploadResult } from '../../services/photoUpload';
import { useConsent } from '../../contexts/ConsentContext';
import {
  activateBoost, getBoostStatus, getStreak, checkAndUpdateStreak,
  computeProfileCompletion, BOOST_DURATION_MS,
} from '../../services/boostService';

const LANGUAGES: { code: Language; flag: string; name: string }[] = [
  { code: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'PT', flag: '🇧🇷', name: 'Português' },
];

// Stats calculées dynamiquement dans le composant

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightEl,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={settingStyles.row} activeOpacity={0.7}>
      <View style={settingStyles.left}>
        <View style={settingStyles.iconBg}>
          <Ionicons name={icon as any} size={16} color={Colors.primary} />
        </View>
        <Text style={settingStyles.label}>{label}</Text>
      </View>
      <View style={settingStyles.right}>
        {value && <Text style={settingStyles.value}>{value}</Text>}
        {rightEl}
        {!rightEl && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,157,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.2)',
  },
  label: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { color: Colors.textMuted, fontSize: 14 },
});

export default function ProfileScreen() {
  const { language, setLanguage, isPremium, setPremium, questionnaireCompleted, aiScore, matches, likedIds } = useApp();
  const { user, signOut } = useAuth();
  const t = translations[language];
  const { resetConsent } = useConsent();
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(aiScore);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);
  const [profileName, setProfileName] = useState<string>('');
  const [profileAge, setProfileAge] = useState<number>(0);
  const [profileCity, setProfileCity] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [streak, setStreak] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [boostRemainingMs, setBoostRemainingMs] = useState(0);
  const [boostUsedToday, setBoostUsedToday] = useState(false);
  const [completion, setCompletion] = useState(0);
  const completionAnim = useRef(new Animated.Value(0)).current;
  const boostTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);

  // Charge (et recharge à chaque focus) le profil depuis Supabase
  const loadProfile = React.useCallback(() => {
    if (!user) {
      setProfilePhoto(currentUser.photo);
      setProfileName(currentUser.name);
      setProfileAge(currentUser.age);
      return;
    }
    import('../../services/supabase').then(({ profileService }) => {
      profileService.getProfile(user.id).then(profile => {
        if (profile) {
          setProfilePhoto(profile.photos?.[0]);
          setProfileName(profile.name);
          setProfileAge(profile.age ?? 0);
          setProfileCity((profile.location as any)?.city ?? '');
          const { percent } = computeProfileCompletion({
            name: profile.name,
            age: profile.age,
            photos: profile.photos,
            bio: profile.about,
            job: (profile.questionnaire_data as any)?.job,
            location: profile.location,
            questionnaire_data: profile.questionnaire_data as unknown as Record<string, unknown>,
          });
          setCompletion(percent);
          Animated.timing(completionAnim, { toValue: percent / 100, duration: 900, useNativeDriver: false }).start();
        } else {
          setProfileName(user.user_metadata?.name ?? user.email?.split('@')[0] ?? '');
        }
      }).catch(() => {});
    });
  }, [user]);

  useFocusEffect(React.useCallback(() => { loadProfile(); }, [loadProfile]));

  // Streak + boost au montage
  useEffect(() => {
    checkAndUpdateStreak().then(({ streak: s }) => setStreak(s));
    getBoostStatus().then(({ active, remainingMs }) => {
      setBoostActive(active);
      setBoostRemainingMs(remainingMs);
      if (active) startBoostTimer();
    });
    // Cleanup interval on unmount
    return () => {
      if (boostTimerRef.current) {
        clearInterval(boostTimerRef.current);
        boostTimerRef.current = null;
      }
    };
  }, []);

  // Charge les vues de profil
  useEffect(() => {
    if (!user?.id) return;
    setLoadingViews(true);
    import('../../services/supabase').then(({ profileViewService }) => {
      Promise.all([
        profileViewService.getViewCount(user.id),
        isPremium ? profileViewService.getViewers(user.id, 8) : Promise.resolve([]),
      ]).then(([count, viewerList]) => {
        setViewCount(count);
        setViewers(viewerList);
      }).catch(() => {}).finally(() => setLoadingViews(false));
    });
  }, [user?.id, isPremium]);

  const startBoostTimer = () => {
    if (boostTimerRef.current) clearInterval(boostTimerRef.current);
    boostTimerRef.current = setInterval(async () => {
      const { active, remainingMs } = await getBoostStatus();
      setBoostActive(active);
      setBoostRemainingMs(remainingMs);
      if (!active && boostTimerRef.current) {
        clearInterval(boostTimerRef.current);
        boostTimerRef.current = null;
      }
    }, 1000);
  };

  const handleBoost = async () => {
    if (!isPremium) { router.push('/premium'); return; }
    const { success, alreadyUsed } = await activateBoost();
    if (alreadyUsed) {
      Alert.alert('Boost déjà utilisé', 'Vous avez déjà utilisé votre boost aujourd\'hui. Revenez demain !');
      return;
    }
    if (success) {
      const { remainingMs } = await getBoostStatus();
      setBoostActive(true);
      setBoostRemainingMs(remainingMs);
      setBoostUsedToday(true);
      startBoostTimer();
      Alert.alert('🚀 Boost activé !', 'Votre profil est mis en avant pour 30 minutes. Vous allez recevoir beaucoup plus de vues !');
    }
  };

  const formatBoostTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePhotoSuccess = (result: UploadResult) => {
    setProfilePhoto(result.publicUrl);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); } catch {}
    setLoggingOut(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '🗑️ Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données, matchs et messages seront supprimés définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              const { userService } = await import('../../services/supabase');
              await userService.deactivate(user.id);
              await signOut();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte. Contactez support@nextlove.app');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.yourProfile}</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {!isPremium && (
            <AdBanner />
          )}

          {/* Profile card */}
          <View style={styles.profileCard}>
            <LinearGradient colors={Colors.gradientCard} style={styles.profileCardInner}>
              {/* Avatar with PhotoPicker */}
              <View style={styles.avatarWrapper}>
                <PhotoPicker
                  userId={user?.id ?? currentUser.id}
                  currentPhotoUrl={profilePhoto}
                  size={88}
                  onSuccess={handlePhotoSuccess}
                />
                <LinearGradient colors={Colors.gradientPrimary} style={styles.onlineDot} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profileName || user?.user_metadata?.name || currentUser.name}
                </Text>
                <Text style={styles.profileAge}>
                  {(profileAge || currentUser.age) ? `${profileAge || currentUser.age} ans` : 'Âge non renseigné'}{profileCity ? ` · ${profileCity}` : ''}
                </Text>

                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={12} color="#000" />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>

              {/* Stats dynamiques */}
              <View style={styles.statsRow}>
                {[
                  { icon: 'heart', value: String(matches.length), label: 'Matchs' },
                  { icon: 'thumbs-up', value: String(likedIds.length), label: 'Likes' },
                  { icon: 'sparkles', value: aiScore > 0 ? String(aiScore) : '—', label: 'Score de compatibilité' },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Ionicons name={stat.icon as any} size={16} color={Colors.primary} />
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Streak + Complétion */}
          <View style={styles.streakRow}>
            {/* Streak */}
            <LinearGradient colors={['rgba(255,160,0,0.12)', 'rgba(255,100,0,0.08)']} style={styles.streakCard}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>Jours</Text>
            </LinearGradient>

            {/* Complétion de profil */}
            <TouchableOpacity style={styles.completionCard} onPress={() => router.push('/edit-profile')} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientCard} style={styles.completionInner}>
                <View style={styles.completionHeader}>
                  <Text style={styles.completionLabel}>Profil complété</Text>
                  <Text style={styles.completionPercent}>{completion}%</Text>
                </View>
                <View style={styles.completionTrack}>
                  <Animated.View style={[
                    styles.completionFill,
                    { width: completionAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any }
                  ]} />
                </View>
                {completion < 100 && (
                  <Text style={styles.completionHint}>Complétez pour +50% de matchs</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Boost card */}
          <TouchableOpacity onPress={handleBoost} activeOpacity={0.85} style={styles.boostCardWrapper}>
            <LinearGradient
              colors={boostActive
                ? ['rgba(255,107,157,0.25)', 'rgba(196,77,255,0.2)']
                : ['rgba(106,53,217,0.15)', 'rgba(255,107,157,0.1)']}
              style={styles.boostCard}
            >
              <View style={styles.boostLeft}>
                <LinearGradient
                  colors={boostActive ? Colors.gradientPrimary : ['rgba(255,107,157,0.2)', 'rgba(196,77,255,0.2)']}
                  style={styles.boostIcon}
                >
                  <Ionicons name="rocket" size={20} color={boostActive ? '#FFF' : Colors.primary} />
                </LinearGradient>
                <View>
                  <Text style={styles.boostTitle}>
                    {boostActive ? `🚀 ${t.boostActive}` : `🚀 ${t.boostTitle}`}
                  </Text>
                  <Text style={styles.boostSub}>
                    {boostActive
                      ? `${t.boostActive} — ${formatBoostTime(boostRemainingMs)}`
                      : isPremium ? t.boostSub : `Premium · 30 min`}
                  </Text>
                </View>
              </View>
              {boostActive ? (
                <View style={styles.boostLive}>
                  <View style={styles.boostDot} />
                  <Text style={styles.boostLiveText}>LIVE</Text>
                </View>
              ) : (
                <Ionicons name={isPremium ? 'arrow-forward-circle' : 'lock-closed'} size={22} color={Colors.primary} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Qui a vu votre profil */}
          <TouchableOpacity
            onPress={() => !isPremium && router.push('/premium')}
            activeOpacity={isPremium ? 1 : 0.85}
            style={styles.viewsCard}
          >
            <LinearGradient
              colors={['rgba(123,47,255,0.12)', 'rgba(196,77,255,0.08)']}
              style={styles.viewsCardInner}
            >
              <View style={styles.viewsHeader}>
                <View style={styles.viewsIconWrap}>
                  <Ionicons name="eye" size={18} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.viewsTitle}>Vues du profil</Text>
                  <Text style={styles.viewsSub}>Cette semaine</Text>
                </View>
                <Text style={styles.viewsCount}>
                  {loadingViews ? '—' : viewCount}
                </Text>
              </View>

              {/* Viewers (premium) ou blurred (free) */}
              {viewers.length > 0 ? (
                <View style={styles.viewersRow}>
                  {viewers.slice(0, 6).map((v, i) => (
                    <Image
                      key={v.id ?? i}
                      source={{ uri: v.photos?.[0] ?? `https://randomuser.me/api/portraits/women/${i + 10}.jpg` }}
                      style={[styles.viewerAvatar, { marginLeft: i > 0 ? -10 : 0 }]}
                    />
                  ))}
                  {viewCount > 6 && (
                    <View style={[styles.viewerAvatar, styles.viewerMore, { marginLeft: -10 }]}>
                      <Text style={styles.viewerMoreText}>+{viewCount - 6}</Text>
                    </View>
                  )}
                </View>
              ) : !isPremium && viewCount > 0 ? (
                <View style={styles.viewsBlurRow}>
                  {[...Array(Math.min(viewCount, 5))].map((_, i) => (
                    <View key={i} style={[styles.viewerAvatar, styles.viewerBlurred, { marginLeft: i > 0 ? -10 : 0 }]}>
                      <Ionicons name="person" size={16} color="rgba(255,255,255,0.3)" />
                    </View>
                  ))}
                  <View style={styles.viewsLockOverlay}>
                    <Ionicons name="lock-closed" size={14} color={Colors.secondary} />
                    <Text style={styles.viewsLockText}>Premium pour voir qui</Text>
                  </View>
                </View>
              ) : viewCount === 0 ? (
                <Text style={styles.viewsEmpty}>
                  Complétez votre profil pour attirer plus de vues
                </Text>
              ) : null}
            </LinearGradient>
          </TouchableOpacity>

          {/* Questionnaire card */}
          <TouchableOpacity
            onPress={() => router.push('/questionnaire')}
            activeOpacity={0.85}
            style={styles.questionnaireCard}
          >
            <LinearGradient
              colors={questionnaireCompleted
                ? ['rgba(0,230,118,0.12)', 'rgba(0,230,118,0.05)']
                : ['rgba(106,53,217,0.2)', 'rgba(255,107,157,0.1)']}
              style={styles.questionnaireCardInner}
            >
              <View style={styles.questionnaireLeft}>
                <View style={[styles.questionnaireIcon, { borderColor: questionnaireCompleted ? Colors.success : Colors.primary }]}>
                  <Ionicons
                    name={questionnaireCompleted ? 'checkmark-circle' : 'clipboard-outline'}
                    size={22}
                    color={questionnaireCompleted ? Colors.success : Colors.primary}
                  />
                </View>
                <View style={styles.questionnaireText}>
                  <Text style={styles.questionnaireTitle}>
                    {questionnaireCompleted ? 'Profil complété ✨' : 'Compléter mon profil'}
                  </Text>
                  <Text style={styles.questionnaireSub}>
                    {questionnaireCompleted
                      ? `Score : ${aiScore}/100 · ${scoreLabel}`
                      : '6 étapes · Améliore vos matchs'}
                  </Text>
                </View>
              </View>
              {questionnaireCompleted ? (
                <Text style={[styles.questionnaireScore, { color: scoreColor }]}>{aiScore}</Text>
              ) : (
                <Ionicons name="arrow-forward-circle" size={26} color={Colors.primary} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Premium upgrade (if not premium) */}
          {!isPremium && (
            <View style={styles.premiumCard}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,160,0,0.08)']}
                style={styles.premiumCardInner}
              >
                <View style={styles.premiumHeader}>
                  <Ionicons name="star" size={24} color={Colors.premium} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumTitle}>{t.premiumTitle}</Text>
                    <Text style={styles.premiumSubtitle}>{t.premiumSubtitle}</Text>
                  </View>
                </View>

                <View style={styles.premiumFeatures}>
                  {[
                    '✅ Matchs illimités',
                    '⭐ Super Likes',
                    '👁 Voir qui vous a liké',
                    '🚫 Sans publicité',
                    '🤖 Analyse approfondie',
                  ].map((f, i) => (
                    <Text key={i} style={styles.premiumFeatureText}>{f}</Text>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/premium')}
                  style={styles.premiumBtn}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Colors.premiumGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumBtnGradient}
                  >
                    <Ionicons name="star" size={18} color="#000" />
                    <Text style={styles.premiumBtnText}>{t.premiumButton}</Text>
                    <Text style={styles.premiumPrice}>9,99€/mois</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Settings sections */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Préférences</Text>
            <LinearGradient colors={Colors.gradientCard} style={styles.settingsCard}>
              <SettingRow
                icon="notifications-outline"
                label={t.notifications}
                onPress={() => Linking.openSettings()}
              />
              <SettingRow
                icon="location-outline"
                label="Ma localisation"
                value={profileCity || 'Non définie'}
                onPress={() => router.push('/edit-profile')}
              />
              <SettingRow
                icon="star-outline"
                label={isPremium ? t.premiumActive : t.premiumButton}
                rightEl={
                  isPremium ? (
                    <Switch
                      value={isPremium}
                      onValueChange={setPremium}
                      trackColor={{ true: Colors.premium }}
                    />
                  ) : undefined
                }
                onPress={!isPremium ? () => router.push('/premium') : undefined}
              />
            </LinearGradient>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Compte</Text>
            <LinearGradient colors={Colors.gradientCard} style={styles.settingsCard}>
              <SettingRow
                icon="person-outline"
                label="Modifier le profil"
                onPress={() => router.push('/edit-profile')}
              />
              <SettingRow
                icon="settings-outline"
                label="Paramètres du compte"
                onPress={() => router.push('/settings')}
              />
              <SettingRow
                icon="help-circle-outline"
                label={t.help}
                onPress={() => Linking.openURL('mailto:support@nextlove.app')}
              />
              <SettingRow icon="information-circle-outline" label="Version" value="v1.0.0" />
            </LinearGradient>
          </View>

          {/* Section légale */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Légal & Confidentialité</Text>
            <LinearGradient colors={Colors.gradientCard} style={styles.settingsCard}>
              <SettingRow
                icon="document-text-outline"
                label="Conditions d'utilisation"
                onPress={() => router.push('/legal/cgu')}
              />
              <SettingRow
                icon="lock-closed-outline"
                label="Politique de confidentialité"
                onPress={() => router.push('/legal/privacy')}
              />
              <SettingRow
                icon="options-outline"
                label="Gérer mes cookies"
                onPress={resetConsent}
              />
              <SettingRow
                icon="mail-outline"
                label="Contacter le DPO"
                value="dpo@nextlove.app"
              />
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            {loggingOut
              ? <ActivityIndicator size="small" color={Colors.danger} />
              : <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            }
            <Text style={styles.logoutText}>
              {loggingOut ? `${t.loading}` : t.logout}
            </Text>
          </TouchableOpacity>

          {/* Supprimer le compte */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.deleteBtnText}>{t.deleteAccount}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontWeight: '900' },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  profileCardInner: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  avatarWrapper: { position: 'relative', alignItems: 'center' },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileInfo: { alignItems: 'center', gap: 4 },
  profileName: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  profileAge: { color: Colors.textMuted, fontSize: 14 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.premium,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  premiumBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    gap: 0,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
  },
  statValue: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 11 },
  premiumCard: { marginHorizontal: 16, marginBottom: 16 },
  premiumCardInner: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  premiumHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  premiumTitle: { color: Colors.premium, fontSize: 17, fontWeight: '800' },
  premiumSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  premiumFeatures: { gap: 6 },
  premiumFeatureText: { color: Colors.textSecondary, fontSize: 13 },
  premiumBtn: { borderRadius: 14, overflow: 'hidden' },
  premiumBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  premiumBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  premiumPrice: { color: 'rgba(0,0,0,0.6)', fontSize: 13 },
  settingsSection: { marginHorizontal: 16, marginBottom: 16, gap: 8 },
  sectionLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  settingsCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  langSection: {},
  langScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  langChipActive: {
    borderColor: Colors.primary,
  },
  langFlag: { fontSize: 18 },
  langName: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  langNameActive: { color: '#FFF' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
    backgroundColor: 'rgba(255,82,82,0.08)',
  },
  logoutText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, marginHorizontal: 16, marginTop: 8,
  },
  deleteBtnText: { color: Colors.textMuted, fontSize: 13 },
  // ── Vues profil ────────────────────────────────────────────────────────────
  viewsCard: { marginHorizontal: 16, marginBottom: 12 },
  viewsCardInner: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(123,47,255,0.25)',
    gap: 12,
  },
  viewsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(123,47,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(123,47,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewsTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  viewsSub: { color: Colors.textMuted, fontSize: 12 },
  viewsCount: { color: Colors.secondary, fontSize: 28, fontWeight: '900' },
  viewersRow: { flexDirection: 'row', alignItems: 'center' },
  viewerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 2, borderColor: Colors.background,
    overflow: 'hidden',
  },
  viewerMore: {
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  viewerMoreText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  viewsBlurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerBlurred: {
    backgroundColor: 'rgba(123,47,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewsLockOverlay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewsLockText: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  viewsEmpty: { color: Colors.textMuted, fontSize: 12, lineHeight: 17 },

  questionnaireCard: { marginHorizontal: 16, marginBottom: 16 },
  questionnaireCardInner: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  questionnaireLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  questionnaireIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,157,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  questionnaireText: { flex: 1, gap: 3 },
  questionnaireTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  questionnaireSub: { color: Colors.textMuted, fontSize: 12 },
  questionnaireScore: { fontSize: 28, fontWeight: '900' },

  // Streak + Complétion
  streakRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  streakCard: {
    width: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,160,0,0.25)',
    gap: 2,
  },
  streakEmoji: { fontSize: 22 },
  streakNumber: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  streakLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  completionCard: { flex: 1 },
  completionInner: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  completionPercent: { color: Colors.primary, fontSize: 15, fontWeight: '800' },
  completionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  completionHint: { color: Colors.textMuted, fontSize: 10 },

  // Boost
  boostCardWrapper: { marginHorizontal: 16, marginBottom: 16 },
  boostCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  boostLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  boostIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  boostSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2, maxWidth: 200 },
  boostLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,157,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  boostDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  boostLiveText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
});
