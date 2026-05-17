import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { userService, UserLocation } from '../services/supabase';
import MultiPhotoGrid from '../components/MultiPhotoGrid';
import PromptEditor from '../components/PromptEditor';
import { ProfilePrompt } from '../constants/prompts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = 'man' | 'woman' | 'non_binary' | 'other';
type LookingFor = 'man' | 'woman' | 'everyone';
type RelationType = 'serious' | 'casual' | 'friendship' | 'open';

interface CityResult {
  display_name: string;
  city: string;
  country: string;
}

// ─── Liste complète de métiers ────────────────────────────────────────────────

const JOBS_BY_CATEGORY: { category: string; emoji: string; jobs: string[] }[] = [
  {
    category: 'Santé & Médecine', emoji: '🏥',
    jobs: ['Médecin généraliste', 'Médecin spécialiste', 'Chirurgien', 'Infirmier(e)', 'Aide-soignant(e)',
      'Kinésithérapeute', 'Ostéopathe', 'Dentiste', 'Orthodontiste', 'Pharmacien(ne)',
      'Psychologue', 'Psychiatre', 'Sage-femme', 'Vétérinaire', 'Opticien(ne)',
      'Ergothérapeute', 'Orthophoniste', 'Radiologue', 'Cardiologue', 'Dermatologue'],
  },
  {
    category: 'Tech & Numérique', emoji: '💻',
    jobs: ['Développeur(se) web', 'Développeur(se) mobile', 'Ingénieur(e) logiciel',
      'Data scientist', 'Data analyst', 'DevOps', 'Cybersécurité', 'Product Manager',
      'Designer UX/UI', 'Architecte système', 'Ingénieur(e) IA', 'CTO', 'CEO startup',
      'Growth hacker', 'Community manager', 'Chef de projet digital', 'SEO/SEA',
      'Développeur(se) fullstack', 'Ingénieur(e) cloud', 'QA Engineer'],
  },
  {
    category: 'Droit & Finance', emoji: '⚖️',
    jobs: ['Avocat(e)', 'Notaire', 'Huissier de justice', 'Magistrat(e)', 'Juriste',
      'Comptable', 'Expert-comptable', 'Auditeur(trice)', 'Contrôleur de gestion',
      'Analyste financier', 'Trader', 'Gestionnaire de patrimoine', 'Banquier(ère)',
      'Conseiller(ère) fiscal', 'Directeur(trice) financier', 'Actuaire', 'Risk manager'],
  },
  {
    category: 'Enseignement & Recherche', emoji: '🎓',
    jobs: ['Professeur(e) des écoles', 'Professeur(e) collège/lycée', 'Professeur(e) université',
      'Chercheur(se)', 'Doctorant(e)', 'Formateur(trice)', 'Éducateur(trice) spécialisé(e)',
      'Conseiller(ère) d\'orientation', 'CPE', 'Directeur(trice) d\'école', 'Bibliothécaire',
      'Coach', 'Tuteur(trice)', 'Orthopédagogue'],
  },
  {
    category: 'Ingénierie & BTP', emoji: '🔧',
    jobs: ['Ingénieur(e) civil', 'Ingénieur(e) mécanique', 'Ingénieur(e) électrique',
      'Architecte', 'Chef de chantier', 'Conducteur(trice) de travaux', 'Maçon(ne)',
      'Électricien(ne)', 'Plombier(ère)', 'Menuisier(ère)', 'Charpentier(ère)',
      'Peintre en bâtiment', 'Géomètre', 'Topographe', 'Urbaniste', 'Paysagiste'],
  },
  {
    category: 'Commerce & Marketing', emoji: '📊',
    jobs: ['Commercial(e)', 'Responsable des ventes', 'Directeur(trice) commercial',
      'Chef de produit', 'Responsable marketing', 'Brand manager', 'Chargé(e) de communication',
      'Attaché(e) de presse', 'Relations publiques', 'Acheteur(se)', 'Category manager',
      'Trade marketing', 'Responsable e-commerce', 'Key account manager', 'Responsable export'],
  },
  {
    category: 'Création & Art', emoji: '🎨',
    jobs: ['Designer graphique', 'Photographe', 'Vidéaste', 'Directeur(trice) artistique',
      'Illustrateur(trice)', 'Animateur(trice) 3D', 'Réalisateur(trice)', 'Acteur(trice)',
      'Musicien(ne)', 'Chanteur(se)', 'Écrivain(e)', 'Journaliste', 'Rédacteur(trice)',
      'Architecte d\'intérieur', 'Styliste', 'Maquilleur(se)', 'Tatoueur(se)', 'Artiste'],
  },
  {
    category: 'Gastronomie & Hôtellerie', emoji: '👨‍🍳',
    jobs: ['Chef cuisinier(ère)', 'Sous-chef', 'Pâtissier(ère)', 'Boulanger(ère)',
      'Barman / Barmaid', 'Serveur(se)', 'Maître d\'hôtel', 'Sommelier(ère)',
      'Gérant(e) de restaurant', 'Hôtelier(ère)', 'Réceptionniste', 'Concierge',
      'Guide touristique', 'Agent(e) de voyage', 'Steward / Hôtesse de l\'air'],
  },
  {
    category: 'Sport & Bien-être', emoji: '🏃',
    jobs: ['Coach sportif', 'Professeur(e) de sport', 'Nutritionniste', 'Diététicien(ne)',
      'Préparateur(trice) physique', 'Sportif(ve) professionnel', 'Arbitre',
      'Professeur(e) de yoga', 'Professeur(e) de danse', 'Moniteur(trice) ski',
      'Maître-nageur', 'Manager sportif', 'Agent sportif'],
  },
  {
    category: 'Social & Humanitaire', emoji: '🤝',
    jobs: ['Travailleur(se) social', 'Assistant(e) social', 'Éducateur(trice) jeunesse',
      'Animateur(trice) social', 'Coordinateur(trice) ONG', 'Chargé(e) de mission humanitaire',
      'Médiateur(trice)', 'Conseiller(ère) d\'insertion', 'Bénévole professionnel'],
  },
  {
    category: 'Transport & Logistique', emoji: '🚛',
    jobs: ['Chauffeur routier', 'Livreur(se)', 'Pilote', 'Contrôleur(se) aérien',
      'Responsable logistique', 'Supply chain manager', 'Agent(e) douanier',
      'Marin(e)', 'Conducteur(trice) de train', 'Chauffeur VTC'],
  },
  {
    category: 'Étudiant(e)', emoji: '📚',
    jobs: ['Étudiant(e) médecine', 'Étudiant(e) droit', 'Étudiant(e) ingénierie',
      'Étudiant(e) commerce', 'Étudiant(e) arts', 'Étudiant(e) lettres',
      'Étudiant(e) sciences', 'Alternant(e)', 'Doctorant(e)', 'Stagiaire'],
  },
  {
    category: 'Autre', emoji: '✨',
    jobs: ['Fonctionnaire', 'Militaire', 'Policier(ère)', 'Pompier(ère)', 'Gendarme',
      'Agent(e) immobilier', 'Entrepreneur(se)', 'Freelance', 'Auto-entrepreneur(e)',
      'Agriculteur(trice)', 'Viticulteur(trice)', 'À la recherche d\'emploi',
      'En reconversion', 'Retraité(e)'],
  },
];

const ALL_JOBS = JOBS_BY_CATEGORY.flatMap(c => c.jobs);

// ─── Chips ────────────────────────────────────────────────────────────────────

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'man', label: 'Homme', emoji: '👨' },
  { value: 'woman', label: 'Femme', emoji: '👩' },
  { value: 'non_binary', label: 'Non-binaire', emoji: '🧑' },
  { value: 'other', label: 'Autre', emoji: '✨' },
];

const LOOKING_OPTIONS: { value: LookingFor; label: string; emoji: string }[] = [
  { value: 'woman', label: 'Des femmes', emoji: '👩' },
  { value: 'man', label: 'Des hommes', emoji: '👨' },
  { value: 'everyone', label: 'Tout le monde', emoji: '🌍' },
];

const RELATION_OPTIONS: { value: RelationType; label: string; emoji: string }[] = [
  { value: 'serious', label: 'Relation sérieuse', emoji: '💍' },
  { value: 'casual', label: 'Casual', emoji: '✨' },
  { value: 'friendship', label: 'Amitié', emoji: '🤝' },
  { value: 'open', label: 'Ouvert à tout', emoji: '🌈' },
];

// ─── ChipRow ──────────────────────────────────────────────────────────────────

function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; emoji: string }[];
  selected: T | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={chipS.wrap}>
      {options.map(opt => {
        const active = selected === opt.value;
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

// ─── City Search ──────────────────────────────────────────────────────────────

function CitySearch({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (city: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const search = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.length < 2) { setResults([]); return; }

    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=6&featuretype=city&accept-language=fr`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'NextLove/1.0 (contact@nextlove.app)' },
        });
        const data = await res.json();
        const cities: CityResult[] = data
          .filter((r: any) => r.address?.city || r.address?.town || r.address?.village || r.address?.municipality)
          .map((r: any) => ({
            display_name: r.display_name,
            city: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || '',
            country: r.address?.country || '',
          }))
          .filter((r: CityResult, i: number, arr: CityResult[]) =>
            arr.findIndex(x => x.city === r.city) === i
          );
        setResults(cities.slice(0, 5));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  return (
    <View>
      <Text style={fieldS.label}>Ville</Text>
      <View style={cityS.inputWrap}>
        <Ionicons name="location-outline" size={16} color={Colors.primary} style={cityS.icon} />
        <TextInput
          style={cityS.input}
          value={query}
          onChangeText={search}
          placeholder="Tapez votre ville..."
          placeholderTextColor={Colors.textMuted}
        />
        {searching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 12 }} />}
      </View>
      {results.length > 0 && (
        <View style={cityS.dropdown}>
          {results.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[cityS.item, i < results.length - 1 && cityS.itemBorder]}
              onPress={() => {
                setQuery(r.city);
                setResults([]);
                onSelect(r.city);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={14} color={Colors.primary} />
              <View>
                <Text style={cityS.itemCity}>{r.city}</Text>
                <Text style={cityS.itemCountry}>{r.country}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const cityS = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  icon: { marginLeft: 14 },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  itemCity: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  itemCountry: { color: Colors.textMuted, fontSize: 12 },
});

// ─── Job Picker ───────────────────────────────────────────────────────────────

function JobPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (job: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.length > 0
    ? ALL_JOBS.filter(j => j.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <>
      <View style={fieldS.container}>
        <Text style={fieldS.label}>Profession</Text>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={jobS.selector}
          activeOpacity={0.8}
        >
          <Ionicons name="briefcase-outline" size={16} color={Colors.primary} />
          <Text style={[jobS.selectorText, !value && jobS.placeholder]}>
            {value || 'Choisir une profession...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={jobS.modalBackdrop}>
          <View style={jobS.modal}>
            {/* Header */}
            <View style={jobS.modalHeader}>
              <Text style={jobS.modalTitle}>Profession</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={jobS.searchWrap}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={jobS.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un métier..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filtered ?? JOBS_BY_CATEGORY.flatMap(c =>
                [{ type: 'category', label: `${c.emoji} ${c.category}` }, ...c.jobs.map(j => ({ type: 'job', label: j }))]
              )}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }: { item: any }) => {
                if (item.type === 'category') {
                  return (
                    <View style={jobS.categoryHeader}>
                      <Text style={jobS.categoryLabel}>{item.label}</Text>
                    </View>
                  );
                }
                const jobLabel = typeof item === 'string' ? item : item.label;
                const isSelected = value === jobLabel;
                return (
                  <TouchableOpacity
                    style={[jobS.jobItem, isSelected && jobS.jobItemSelected]}
                    onPress={() => { onSelect(jobLabel); setVisible(false); setSearch(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[jobS.jobLabel, isSelected && jobS.jobLabelSelected]}>
                      {jobLabel}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const jobS = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectorText: { flex: 1, color: Colors.text, fontSize: 15 },
  placeholder: { color: Colors.textMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  categoryLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  jobItemSelected: { backgroundColor: 'rgba(255,107,157,0.08)' },
  jobLabel: { color: Colors.text, fontSize: 14 },
  jobLabelSelected: { color: Colors.primary, fontWeight: '600' },
});

// ─── Field simple ─────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={fieldS.container}>
      <Text style={fieldS.label}>{label}</Text>
      <TextInput
        style={[fieldS.input, multiline && fieldS.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const fieldS = StyleSheet.create({
  container: { gap: 6 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 15,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { questionnaireCompleted } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');
  const [job, setJob] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  const [lookingFor, setLookingFor] = useState<LookingFor | undefined>();
  const [relationType, setRelationType] = useState<RelationType | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<ProfilePrompt[]>([]);

  useEffect(() => {
    if (!user) return;
    userService.getById(user.id).then(profile => {
      if (!profile) return;
      setName(profile.name ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setCity((profile.location as UserLocation | undefined)?.city ?? '');
      setAbout(profile.about ?? '');
      setJob(profile.questionnaire_data?.job ?? '');
      setGender(profile.gender as Gender | undefined);
      setLookingFor(profile.looking_for as LookingFor | undefined);
      setRelationType(profile.relation_type as RelationType | undefined);
      setPhotos(profile.photos ?? []);
      setPrompts((profile.profile_prompts as ProfilePrompt[]) ?? []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { Alert.alert('Erreur', 'Le prénom est requis.'); return; }

    const ageNum = age ? parseInt(age) : 0;
    if (age && (isNaN(ageNum) || ageNum < 18)) {
      Alert.alert('Âge minimum requis', 'Tu dois avoir au moins 18 ans pour utiliser NextLove.');
      return;
    }

    setSaving(true);
    try {
      await userService.update(user.id, {
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        about: about.trim() || undefined,
        gender,
        looking_for: lookingFor,
        relation_type: relationType,
        location: city.trim() ? { city: city.trim() } as UserLocation : undefined,
      });

      // Sauvegarde le job + les prompts
      const { supabase } = await import('../services/supabase');
      const currentProfile = await userService.getById(user.id);
      await supabase
        .from('users')
        .update({
          ...(job ? { questionnaire_data: { ...currentProfile?.questionnaire_data, job } } : {}),
          profile_prompts: prompts,
        })
        .eq('id', user.id);

      // Première fois (pas encore de questionnaire) → aller compléter la compatibilité
      if (!questionnaireCompleted) {
        router.replace('/questionnaire');
      } else {
        Alert.alert('✅ Sauvegardé', 'Votre profil a été mis à jour.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradientDark} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            {questionnaireCompleted ? (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}
            <Text style={styles.headerTitle}>
              {questionnaireCompleted ? 'Modifier le profil' : 'Créer mon profil'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.saveBtnText}>
                    {questionnaireCompleted ? 'Sauvegarder' : 'Continuer'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Bannière premier lancement */}
          {!questionnaireCompleted && (
            <View style={styles.setupBanner}>
              <Ionicons name="heart" size={16} color={Colors.primary} />
              <Text style={styles.setupBannerText}>
                Étape 1/2 · Remplis ces infos pour trouver des matchs
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photos */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Mes photos</Text>
              {user && (
                <MultiPhotoGrid
                  userId={user.id}
                  photos={photos}
                  onChange={setPhotos}
                />
              )}
            </View>

            {/* Infos de base */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations de base</Text>
              <Field label="Prénom" value={name} placeholder="Votre prénom" onChangeText={setName} />
              <Field label="Âge" value={age} placeholder="Votre âge" onChangeText={setAge} keyboardType="numeric" />
              <CitySearch value={city} onSelect={setCity} />
            </View>

            {/* Profession */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profession</Text>
              <JobPicker value={job} onSelect={setJob} />
            </View>

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos de moi</Text>
              <Field
                label="Bio"
                value={about}
                placeholder="Parlez de vous en quelques mots..."
                onChangeText={setAbout}
                multiline
              />
            </View>

            {/* Questions de profil */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Questions de profil</Text>
              <PromptEditor
                prompts={prompts}
                onChange={setPrompts}
              />
            </View>

            {/* Genre */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Je suis</Text>
              <ChipRow options={GENDER_OPTIONS} selected={gender} onSelect={setGender} />
            </View>

            {/* Je cherche */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Je cherche</Text>
              <ChipRow options={LOOKING_OPTIONS} selected={lookingFor} onSelect={setLookingFor} />
            </View>

            {/* Type de relation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de relation</Text>
              <ChipRow options={RELATION_OPTIONS} selected={relationType} onSelect={setRelationType} />
            </View>

            {/* Questionnaire — uniquement pour les users existants */}
            {questionnaireCompleted && <TouchableOpacity
              onPress={() => router.push('/questionnaire')}
              style={styles.questionnaireBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(106,53,217,0.2)', 'rgba(255,107,157,0.1)']}
                style={styles.questionnaireBtnInner}
              >
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionnaireBtnTitle}>Questionnaire de compatibilité</Text>
                  <Text style={styles.questionnaireBtnSub}>Affiner votre score de compatibilité</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={Colors.primary} />
              </LinearGradient>
            </TouchableOpacity>}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,157,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,157,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  setupBannerText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', flex: 1 },
  scroll: { padding: 16, gap: 20 },
  photoSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  photoHint: { color: Colors.textMuted, fontSize: 12 },
  section: {
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionnaireBtn: { borderRadius: 16, overflow: 'hidden' },
  questionnaireBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.2)',
  },
  questionnaireBtnTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  questionnaireBtnSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
});
