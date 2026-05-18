import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { userService, User, UserLocation, blockService, reportService, profileViewService } from '../../services/supabase';
import PhotoViewer from '../../components/PhotoViewer';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatLastSeen } from '../../utils/time';
import { PROMPTS } from '../../constants/prompts';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Dictionnaire valeurs brutes → labels français ───────────────────────────

const DEALBREAKER_LABELS: Record<string, string> = {
  smoker: 'Fumeur(se)',
  has_children: 'Déjà des enfants',
  wants_children: 'Veut des enfants',
  no_children: 'Ne veut pas d\'enfants',
  heavy_drinker: 'Alcool fréquent',
  long_distance: 'Trop grande distance',
  different_values: 'Valeurs différentes',
  no_sport: 'Sédentaire',
  infidelity: 'Infidélité passée',
  casual_only: 'Relation non sérieuse',
  no_marriage: 'Pas de mariage',
  religion_clash: 'Religion incompatible',
  jealousy: 'Jalousie excessive',
  no_ambition: 'Pas d\'ambition',
  manipulative: 'Manipulateur(trice)',
  possessive: 'Trop possessif(ve)',
  inactive: 'Pas de sport',
  verbal_violence: 'Violence verbale',
  narcissism: 'Narcissisme',
  sexual_incomp: 'Incompatibilité sexuelle',
  no_project: 'Pas de projet commun',
  age_gap: 'Différence d\'âge',
  financial_issues: 'Problèmes financiers',
  hygiene: 'Hygiène insuffisante',
};

function educationLabel(v?: string) {
  const map: Record<string, string> = {
    high_school: 'Bac', bachelors: 'Bac+3', masters: 'Bac+5', phd: 'Doctorat', other: 'Autre',
    bac: 'Bac', bac2: 'Bac+2', bac3: 'Bac+3', bac5: 'Bac+5', doctorate: 'Doctorat',
  };
  return v ? (map[v] ?? v) : null;
}

function smokeLabel(v?: string) {
  const m: Record<string, string> = { never: 'Non fumeur', sometimes: 'Fumeur occasionnel', regularly: 'Fumeur', none: 'Non fumeur', occasional: 'Fumeur occasionnel', smoker: 'Fumeur' };
  return v ? m[v] ?? null : null;
}

function drinkLabel(v?: string) {
  const m: Record<string, string> = { never: 'Sans alcool', socially: 'Alcool occasionnel', regularly: 'Boit régulièrement', none: 'Sans alcool', occasional: 'Alcool occasionnel', moderate: 'Modéré', regular: 'Boit régulièrement' };
  return v ? m[v] ?? null : null;
}

function kidsLabel(v?: string) {
  const m: Record<string, string> = { want: 'Veut des enfants', dont_want: 'Sans enfants', have: 'Déjà des enfants', open: 'Ouvert', yes: 'Veut des enfants', no: 'Sans enfants', already_have: 'Déjà des enfants' };
  return v ? m[v] ?? null : null;
}

function relationLabel(v?: string) {
  const m: Record<string, string> = { serious: 'Relation sérieuse', casual: 'Casual', friendship: 'Amitié', open: 'Ouvert à tout' };
  return v ? m[v] ?? null : null;
}

function loveLangLabel(v?: string) {
  const m: Record<string, string> = { words: 'Mots doux 💬', acts: 'Actes de soin 🤲', gifts: 'Cadeaux 🎁', time: 'Temps de qualité ⏰', touch: 'Toucher 🤗' };
  return v ? m[v] ?? null : null;
}

function attachmentLabel(v?: string) {
  const m: Record<string, string> = { secure: 'Attachement sécure 🏠', anxious: 'Attachement anxieux 💭', avoidant: 'Attachement évitant 🚪' };
  return v ? m[v] ?? null : null;
}

function wantsChildrenLabel(v?: string) {
  const m: Record<string, string> = { yes: '👶 Veut des enfants', no: '🚫 Sans enfants', already_have: '👨‍👧 Déjà des enfants', open: '🤷 Ouvert' };
  return v ? m[v] ?? null : null;
}

function marriageLabel(v?: string) {
  const m: Record<string, string> = { yes: '💍 Veut se marier', no: '🚫 Sans mariage', maybe: '🤔 Pourquoi pas', already: '💒 Déjà marié(e)' };
  return v ? m[v] ?? null : null;
}

// ─── Composants UI ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionS.card}>
      <Text style={sectionS.title}>{title}</Text>
      <View style={sectionS.content}>{children}</View>
    </View>
  );
}

const sectionS = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  title: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  content: { gap: 10 },
});

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={chipS.chip}>
      <Ionicons name={icon as any} size={13} color={Colors.primary} />
      <Text style={chipS.label}>{label}</Text>
    </View>
  );
}

const chipS = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
});

function TagBadge({ label, color = Colors.surface }: { label: string; color?: string }) {
  return (
    <View style={[tagS.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[tagS.label, { color }]}>{label}</Text>
    </View>
  );
}

const tagS = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '600' },
});

function TraitBar({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <View style={traitS.row}>
      <Text style={traitS.emoji}>{emoji}</Text>
      <View style={traitS.content}>
        <View style={traitS.labelRow}>
          <Text style={traitS.label}>{label}</Text>
          <Text style={traitS.value}>{value}/10</Text>
        </View>
        <View style={traitS.track}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[traitS.fill, { width: `${value * 10}%` as any }]}
          />
        </View>
      </View>
    </View>
  );
}

const traitS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 18, width: 28 },
  content: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: Colors.textSecondary, fontSize: 13 },
  value: { color: Colors.textMuted, fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.surface, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileDetailScreen() {
  const { userId, matchId, name, photo, bio: paramBio, job: paramJob, education: paramEducation, location: paramLocation } = useLocalSearchParams<{
    userId: string; matchId?: string; name?: string; photo?: string;
    bio?: string; job?: string; education?: string; location?: string;
  }>();

  const { questionnaire } = useApp();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!userId) return;
    userService.getById(userId).then(u => {
      setUser(u);
    }).catch(() => setUser(null)).finally(() => setLoading(false));

    // Enregistre la vue de profil (best effort, silencieux)
    if (authUser?.id && userId && authUser.id !== userId) {
      profileViewService.recordView(authUser.id, userId).catch(() => {});
    }
  }, [userId]);

  const allPhotos = (user?.photos && user.photos.length > 1) ? user.photos : (photo ? [photo] : []);
  const displayPhoto = allPhotos[0] ?? photo;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const displayName = user?.name ?? name ?? '';
  const city = (user?.location as UserLocation | undefined)?.city ?? paramLocation ?? '';
  const q = user?.questionnaire_data;
  // Fallbacks depuis les params de navigation quand user n'est pas encore chargé
  const displayBio = user?.about ?? paramBio ?? '';
  const displayJob = (q as any)?.job ?? user?.lifestyle ?? paramJob ?? '';
  const displayEducation = user?.education ?? paramEducation ?? '';

  const handleChat = () => {
    if (!matchId) return;
    router.push({
      pathname: '/chat/[matchId]',
      params: { matchId, name: displayName, photo: displayPhoto ?? '', online: 'false' },
    });
  };

  const handleMoreOptions = () => {
    Alert.alert(
      displayName,
      'Que voulez-vous faire ?',
      [
        {
          text: isBlocked ? '✅ Débloquer' : '🚫 Bloquer',
          onPress: async () => {
            if (!authUser?.id || !userId) return;
            try {
              if (isBlocked) {
                await blockService.unblock(authUser.id, userId);
                setIsBlocked(false);
                Alert.alert('Débloqué', `${displayName} a été débloqué.`);
              } else {
                await blockService.block(authUser.id, userId, 'user_request');
                setIsBlocked(true);
                Alert.alert('Bloqué', `${displayName} ne pourra plus vous contacter.`);
                router.back();
              }
            } catch {}
          },
        },
        {
          text: '⚠️ Signaler',
          onPress: () => {
            Alert.alert(
              'Signaler ce profil',
              'Choisissez une raison :',
              [
                { text: 'Faux profil', onPress: () => submitReport('fake') },
                { text: 'Comportement inapproprié', onPress: () => submitReport('inappropriate') },
                { text: 'Harcèlement', onPress: () => submitReport('harassment') },
                { text: 'Spam', onPress: () => submitReport('spam') },
                { text: 'Autre', onPress: () => submitReport('other') },
                { text: 'Annuler', style: 'cancel' },
              ]
            );
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (reason: 'fake' | 'inappropriate' | 'harassment' | 'spam' | 'other') => {
    if (!authUser?.id || !userId) return;
    try {
      await reportService.report(authUser.id, userId, reason);
      Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner ce profil.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradientDark} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity onPress={handleMoreOptions} style={styles.backBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero photo — carousel */}
          <View style={styles.heroSection}>
            {allPhotos.length > 0 ? (
              <TouchableOpacity activeOpacity={0.95} onPress={() => setPhotoViewerOpen(true)}>
                <Image source={{ uri: allPhotos[photoIndex] ?? displayPhoto }} style={styles.photo} />
              </TouchableOpacity>
            ) : (
              <LinearGradient colors={Colors.gradientPrimary} style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={60} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            )}

            {/* Zones de tap gauche / droite */}
            {allPhotos.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.photoTapLeft}
                  onPress={() => setPhotoIndex(i => Math.max(i - 1, 0))}
                  activeOpacity={1}
                />
                <TouchableOpacity
                  style={styles.photoTapRight}
                  onPress={() => setPhotoIndex(i => Math.min(i + 1, allPhotos.length - 1))}
                  activeOpacity={1}
                />
              </>
            )}

            {/* Dots indicateurs */}
            {allPhotos.length > 1 && (
              <View style={styles.photoDots}>
                {allPhotos.map((_, i) => (
                  <View key={i} style={[styles.photoDot, i === photoIndex && styles.photoDotActive]} />
                ))}
              </View>
            )}

            <LinearGradient colors={['transparent', 'rgba(15,5,32,0.97)']} style={styles.photoGradient} />
            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{displayName}{user?.age ? `, ${user.age}` : ''}</Text>
                {(() => {
                  const ls = formatLastSeen(user?.last_seen);
                  if (!ls) return null;
                  return (
                    <View style={[styles.heroOnlineBadge, ls.isOnline && styles.heroOnlineBadgeGreen]}>
                      <View style={[styles.heroOnlineDot, { backgroundColor: ls.isOnline ? '#00E676' : '#FF9800' }]} />
                      <Text style={[styles.heroOnlineText, { color: ls.isOnline ? '#00E676' : '#FF9800' }]}>
                        {ls.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              {city ? (
                <View style={styles.heroLocation}>
                  <Ionicons name="location" size={14} color={Colors.textMuted} />
                  <Text style={styles.heroCity}>{city}</Text>
                </View>
              ) : null}
              {q?.job && (
                <View style={styles.heroLocation}>
                  <Ionicons name="briefcase-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.heroCity}>{q.job}</Text>
                </View>
              )}
            </View>
          </View>


          {/* Prompts de profil */}
          {user?.profile_prompts && (user.profile_prompts as any[]).length > 0 && (
            (user.profile_prompts as { promptId: string; answer: string }[]).map((pp, i) => {
              const def = PROMPTS.find(p => p.id === pp.promptId);
              if (!def) return null;
              return (
                <View key={i} style={styles.promptCard}>
                  <View style={styles.promptHeader}>
                    <Text style={styles.promptEmoji}>{def.emoji}</Text>
                    <Text style={styles.promptQuestion}>{def.question}</Text>
                  </View>
                  <Text style={styles.promptAnswer}>{pp.answer}</Text>
                  {matchId && (
                    <TouchableOpacity
                      style={styles.promptReply}
                      onPress={() => router.push({
                        pathname: '/chat/[matchId]',
                        params: { matchId, name: displayName, photo: displayPhoto ?? '', online: 'false' },
                      })}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
                      <Text style={styles.promptReplyText}>Répondre à cette question</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {/* Bio */}
          {displayBio ? (
            <SectionCard title="À propos">
              <Text style={styles.bio}>{displayBio}</Text>
            </SectionCard>
          ) : null}

          {/* Personnalité amoureuse */}
          {(q?.loveLanguage || q?.attachment || q?.personality || q?.lovePersonality) && (
            <SectionCard title="💑 Façon d'aimer">
              <View style={styles.chipsWrap}>
                {q?.loveLanguage && <InfoChip icon="heart" label={loveLangLabel(q.loveLanguage) ?? q.loveLanguage} />}
                {q?.attachment && <InfoChip icon="shield-checkmark-outline" label={attachmentLabel(q.attachment) ?? q.attachment} />}
                {q?.personality && <InfoChip icon="person-outline" label={
                  q.personality === 'introvert' ? '🌙 Introverti(e)' :
                  q.personality === 'extravert' ? '☀️ Extraverti(e)' : '⚖️ Ambiverti(e)'
                } />}
                {q?.conflictStyle && <InfoChip icon="chatbubbles-outline" label={
                  q.conflictStyle === 'talk_asap' ? '🗣️ Parle tout de suite' :
                  q.conflictStyle === 'cool_down' ? '🧘 Se calme d\'abord' :
                  q.conflictStyle === 'write' ? '✉️ Préfère écrire' : '🙈 Évite le conflit'
                } />}
              </View>
              {q?.humorType && <InfoChip icon="happy-outline" label={(() => {
                const m: Record<string,string> = {
                  first_degree: '😊 1er degré', second_degree: '😏 2ème degré',
                  dark: '🖤 Humour noir', absurd: '🤪 Absurde',
                  sarcastic: '😈 Piquant', dad_jokes: '🧔 Blagues de papa',
                  serious: '🧐 Peu d\'humour',
                };
                return m[q.humorType] ?? q.humorType;
              })()} />}
              {q?.affectionLevel && <TraitBar label="Affection" value={q.affectionLevel} emoji="🤗" />}
            </SectionCard>
          )}

          {/* En bref */}
          {(() => {
            const eduLabel = educationLabel(displayEducation) ?? (displayEducation || null);
            const smokeL = smokeLabel(user?.smoke);
            const drinkL = drinkLabel(user?.drink);
            const relL = q?.relationType ? relationLabel(q.relationType) : (user?.relation_type ? relationLabel(user.relation_type) : null);
            const jobL = displayJob || null;
            const travelL = q?.travelFrequency && q.travelFrequency !== 'never' ? (
              q.travelFrequency === 'rarely' ? '🗺️ Voyage rarement' :
              q.travelFrequency === 'sometimes' ? '✈️ Voyage parfois' :
              q.travelFrequency === 'often' ? '🌍 Voyage souvent' : '🧳 Toujours en voyage'
            ) : null;
            const wakeL = q?.wakeUpTime ? (
              q.wakeUpTime === 'early_bird' ? '🌅 Lève-tôt' :
              q.wakeUpTime === 'night_owl' ? '🦉 Couche-tard' : '😊 Rythme flexible'
            ) : null;
            const hasContent = eduLabel || jobL || smokeL || drinkL || relL || travelL || wakeL || user?.lifestyle;
            if (!hasContent) return null;
            return (
              <SectionCard title="En bref">
                <View style={styles.chipsWrap}>
                  {jobL && <InfoChip icon="briefcase-outline" label={jobL} />}
                  {eduLabel && <InfoChip icon="school-outline" label={eduLabel} />}
                  {user?.lifestyle && <InfoChip icon="sunny-outline" label={user.lifestyle} />}
                  {relL && <InfoChip icon="heart-outline" label={relL} />}
                  {smokeL && <InfoChip icon="flame-outline" label={smokeL} />}
                  {drinkL && <InfoChip icon="wine-outline" label={drinkL} />}
                  {travelL && <InfoChip icon="airplane-outline" label={travelL} />}
                  {wakeL && <InfoChip icon="time-outline" label={wakeL} />}
                </View>
              </SectionCard>
            );
          })()}

          {/* Avenir */}
          {(q?.wantsChildren || q?.marriageView || q?.whereToLive) && (
            <SectionCard title="🏡 Avenir & Famille">
              <View style={styles.chipsWrap}>
                {q?.wantsChildren && wantsChildrenLabel(q.wantsChildren) && (
                  <TagBadge label={wantsChildrenLabel(q.wantsChildren)!} color={Colors.primary} />
                )}
                {q?.marriageView && marriageLabel(q.marriageView) && (
                  <TagBadge label={marriageLabel(q.marriageView)!} color="#9B59B6" />
                )}
                {q?.whereToLive && (
                  <TagBadge label={
                    q.whereToLive === 'city' ? '🏙️ Grande ville' :
                    q.whereToLive === 'countryside' ? '🌾 Campagne' :
                    q.whereToLive === 'abroad' ? '🌍 À l\'étranger' : '🏡 Flexible'
                  } color={Colors.success} />
                )}
                {q?.financialGoals && (
                  <TagBadge label={
                    q.financialGoals === 'stability' ? '⚓ Stabilité' :
                    q.financialGoals === 'growth' ? '📈 Croissance' :
                    q.financialGoals === 'freedom' ? '🦋 Liberté' : '💎 Luxe'
                  } color="#FFC107" />
                )}
              </View>
              {q?.ambitionLevel && <TraitBar label="Ambition" value={q.ambitionLevel} emoji="🚀" />}
            </SectionCard>
          )}

          {/* Valeurs fondamentales */}
          {q?.coreValues && q.coreValues.length > 0 && (
            <SectionCard title="💎 Valeurs fondamentales">
              <View style={styles.chipsWrap}>
                {q.coreValues.map((v, i) => {
                  const labels: Record<string, string> = {
                    family: '👨‍👩‍👧 Famille', freedom: '🦋 Liberté', success: '🏆 Succès',
                    love: '❤️ Amour', health: '💪 Santé', creativity: '🎨 Créativité',
                    justice: '⚖️ Justice', adventure: '🌍 Aventure', security: '🛡️ Sécurité',
                    spirituality: '🌟 Spiritualité',
                  };
                  return <TagBadge key={i} label={labels[v] ?? v} color={Colors.secondary} />;
                })}
              </View>
            </SectionCard>
          )}

          {/* Loisirs */}
          {(q?.hobbies?.length || q?.musicGenres?.length || q?.filmGenres?.length) ? (
            <SectionCard title="🎨 Loisirs & Passions">
              {q?.hobbies?.length > 0 && (
                <View>
                  <Text style={styles.subLabel}>Hobbies</Text>
                  <View style={styles.chipsWrap}>
                    {q.hobbies.slice(0, 8).map((h, i) => (
                      <TagBadge key={i} label={h} color={Colors.primary} />
                    ))}
                  </View>
                </View>
              )}
              {q?.musicGenres?.length > 0 && (
                <View>
                  <Text style={styles.subLabel}>🎵 Musique</Text>
                  <Text style={styles.tagsInline}>{q.musicGenres.slice(0, 5).join(' · ')}</Text>
                </View>
              )}
              {q?.filmGenres?.length > 0 && (
                <View>
                  <Text style={styles.subLabel}>🎬 Films</Text>
                  <Text style={styles.tagsInline}>{q.filmGenres.slice(0, 5).join(' · ')}</Text>
                </View>
              )}
            </SectionCard>
          ) : null}

          {/* Traits personnalité */}
          {q && (
            <SectionCard title="📊 Profil psychologique">
              {q.familyImportance && <TraitBar label="Importance famille" value={q.familyImportance} emoji="👨‍👩‍👧" />}
              {q.honestyLevel && <TraitBar label="Honnêteté" value={q.honestyLevel} emoji="💎" />}
              {q.loyaltyLevel && <TraitBar label="Loyauté" value={q.loyaltyLevel} emoji="🔒" />}
              {q.openMindedness && <TraitBar label="Ouverture d'esprit" value={q.openMindedness} emoji="🌍" />}
              {q.jealousyLevel && <TraitBar label="Jalousie (faible = bien)" value={11 - q.jealousyLevel} emoji="🧘" />}
              {q.independenceLevel && <TraitBar label="Indépendance" value={q.independenceLevel} emoji="🦋" />}
            </SectionCard>
          )}


          {/* Red flags */}
          {q?.dealBreakers && q.dealBreakers.length > 0 && (
            <SectionCard title="🚩 Ce qu'il/elle ne tolère pas">
              <View style={styles.chipsWrap}>
                {q.dealBreakers.map((v, i) => (
                  <View key={i} style={styles.dealChip}>
                    <Text style={styles.dealChipText}>🚫 {DEALBREAKER_LABELS[v] ?? v}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* CTA Chat */}
        {matchId && (
          <View style={styles.ctaContainer}>
            <TouchableOpacity onPress={handleChat} style={styles.ctaWrapper} activeOpacity={0.85}>
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                <Text style={styles.ctaText}>Envoyer un message</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Photo viewer plein écran */}
      <PhotoViewer
        photos={allPhotos.length > 0 ? allPhotos : (displayPhoto ? [displayPhoto] : [])}
        initialIndex={photoIndex}
        visible={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        name={displayName}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  scroll: { paddingBottom: 16 },
  heroSection: { height: width * 1.1, marginBottom: 16, position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  photoTapLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '35%',
    height: '85%',
    zIndex: 5,
  },
  photoTapRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '65%',
    height: '85%',
    zIndex: 5,
  },
  photoDots: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  photoDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  photoDotActive: {
    backgroundColor: '#FFF',
  },
  heroInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, gap: 6 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heroName: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  heroOnlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,160,0,0.2)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,160,0,0.3)',
  },
  heroOnlineBadgeGreen: {
    backgroundColor: 'rgba(0,230,118,0.2)',
    borderColor: 'rgba(0,230,118,0.3)',
  },
  heroOnlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  heroOnlineText: { fontSize: 11, fontWeight: '700' },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroCity: { color: Colors.textMuted, fontSize: 13 },
  positiveChip: {
    backgroundColor: 'rgba(0,230,118,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.25)',
  },
  positiveChipText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
  promptCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: 10,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  promptEmoji: { fontSize: 18, marginTop: 1 },
  promptQuestion: { flex: 1, color: Colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  promptAnswer: { color: Colors.text, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  promptReply: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,157,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,107,157,0.25)',
  },
  promptReplyText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  tagsInline: { color: Colors.textSecondary, fontSize: 13 },
  dealChip: {
    backgroundColor: 'rgba(255,82,82,0.08)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)',
  },
  dealChipText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  ctaContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32,
    backgroundColor: 'rgba(15,5,32,0.95)',
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  ctaWrapper: { borderRadius: 16, overflow: 'hidden' },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
