import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/supabase';
import {
  QuestionnaireAnswers,
  DEFAULT_ANSWERS,
  STEPS,
  ChipOption,
  // Étape 1 (Personnalité)
  PERSONALITY_OPTIONS,
  DOMINANT_TRAIT_OPTIONS,
  LOVE_LANGUAGE_OPTIONS,
  COMMUNICATION_OPTIONS,
  ATTACHMENT_OPTIONS,
  CONFLICT_STYLE_OPTIONS,
  LOVE_PERSONALITY_OPTIONS,
  // Étape 3
  RELIGION_OPTIONS,
  POLITICS_OPTIONS,
  CORE_VALUES_OPTIONS,
  // Étape 4
  LIFESTYLE_OPTIONS,
  SPORTS_OPTIONS,
  WAKE_UP_OPTIONS,
  ALCOHOL_OPTIONS,
  SMOKING_OPTIONS,
  DIET_OPTIONS,
  PETS_OPTIONS,
  TRAVEL_OPTIONS,
  // Étape 5
  WANTS_CHILDREN_OPTIONS,
  CHILDREN_COUNT_OPTIONS,
  WHERE_TO_LIVE_OPTIONS,
  FINANCIAL_GOALS_OPTIONS,
  MARRIAGE_OPTIONS,
  // Étape 6
  MUSIC_GENRES_OPTIONS,
  FILM_GENRES_OPTIONS,
  HOBBIES_OPTIONS,
  READING_OPTIONS,
  SOCIAL_LIFE_OPTIONS,
  WEEKEND_STYLE_OPTIONS,
  // Étape 7
  FINANCIAL_SITUATION_OPTIONS,
  SPLIT_BILL_OPTIONS,
  WORK_LIFE_OPTIONS,
  ENTREPRENEUR_OPTIONS,
  // Étape 8
  RELATIONSHIP_PACE_OPTIONS,
  RELATION_TYPE_OPTIONS,
  PAST_RELATIONSHIPS_OPTIONS,
  // Étape 9
  CHILDREN_OK_OPTIONS,
  PARTNER_EDUCATION_OPTIONS,
  // Étape 10
  DEAL_BREAKER_OPTIONS,
  HUMOR_TYPE_OPTIONS,
} from '../constants/questionnaire';
import {
  computeRealtimeScore,
  getScoreLabel,
  getStepCompletion,
} from '../services/questionnaireScore';

// ─── Chip Selector ────────────────────────────────────────────────────────────

function ChipGroup({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: ChipOption[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multi?: boolean;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <View style={chipStyles.wrap}>
      {options.map(opt => {
        const active = isSelected(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
          >
            {active && (
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            {opt.emoji && <Text style={chipStyles.emoji}>{opt.emoji}</Text>}
            <Text style={[chipStyles.label, active && chipStyles.labelActive]}>
              {opt.label}
            </Text>
            {active && (
              <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  chipActive: { borderColor: Colors.primary },
  emoji: { fontSize: 14 },
  label: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  labelActive: { color: '#FFF' },
});

// ─── Step Slider ──────────────────────────────────────────────────────────────

function StepSlider({
  label,
  value,
  min = 1,
  max = 10,
  onChange,
  showLabels,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  showLabels?: [string, string];
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        {label ? <Text style={sliderStyles.label}>{label}</Text> : <View />}
        <View style={sliderStyles.badge}>
          <Text style={sliderStyles.badgeText}>{value}{max === 10 ? '/10' : ''}</Text>
        </View>
      </View>
      <View style={sliderStyles.track}>
        {steps.map(step => (
          <TouchableOpacity
            key={step}
            onPress={() => onChange(step)}
            style={[
              sliderStyles.dot,
              step <= value && sliderStyles.dotActive,
              step === value && sliderStyles.dotCurrent,
            ]}
          >
            {step === value && (
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={StyleSheet.absoluteFill}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {showLabels && (
        <View style={sliderStyles.labels}>
          <Text style={sliderStyles.minLabel}>{showLabels[0]}</Text>
          <Text style={sliderStyles.maxLabel}>{showLabels[1]}</Text>
        </View>
      )}
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  badge: {
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  badgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  track: { flexDirection: 'row', gap: 5 },
  dot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  dotActive: { backgroundColor: 'rgba(255,107,157,0.35)' },
  dotCurrent: { overflow: 'hidden' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  minLabel: { color: Colors.textMuted, fontSize: 10 },
  maxLabel: { color: Colors.textMuted, fontSize: 10 },
});

// ─── Text Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
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
});

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});

// ─── AI Score Widget ──────────────────────────────────────────────────────────

function AIScoreWidget({ score, step }: { score: number; step: number }) {
  const animScore = useRef(new Animated.Value(0)).current;
  const { label, color } = getScoreLabel(score);

  useEffect(() => {
    Animated.timing(animScore, {
      toValue: score,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [score]);

  return (
    <LinearGradient
      colors={['rgba(106,53,217,0.25)', 'rgba(255,107,157,0.12)']}
      style={scoreStyles.widget}
    >
      <View style={scoreStyles.left}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
        <View>
          <Text style={scoreStyles.widgetTitle}>Score de compatibilité</Text>
          <Text style={[scoreStyles.widgetLabel, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={scoreStyles.circle}>
        <Text style={[scoreStyles.scoreNum, { color }]}>{score}</Text>
        <Text style={scoreStyles.scoreMax}>/100</Text>
      </View>
    </LinearGradient>
  );
}

const scoreStyles = StyleSheet.create({
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.2)',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  widgetTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  widgetLabel: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  circle: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  scoreNum: { fontSize: 28, fontWeight: '900' },
  scoreMax: { color: Colors.textMuted, fontSize: 13, alignSelf: 'flex-end', marginBottom: 3 },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total, completions }: { current: number; total: number; completions: boolean[] }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => {
        const done = completions[i];
        const active = i + 1 === current;
        return (
          <View key={i} style={progressStyles.segWrapper}>
            <View
              style={[
                progressStyles.seg,
                done && progressStyles.segDone,
                active && !done && progressStyles.segActive,
              ]}
            >
              {(done || active) && (
                <LinearGradient
                  colors={done ? [Colors.success, Colors.success] : Colors.gradientPrimary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
            </View>
            <Text style={[progressStyles.num, active && progressStyles.numActive]}>
              {i + 1}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8 },
  segWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  seg: { height: 4, width: '100%', borderRadius: 2, backgroundColor: Colors.surface, overflow: 'hidden' },
  segDone: {},
  segActive: {},
  num: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  numActive: { color: Colors.primary },
});

// ─── Steps ────────────────────────────────────────────────────────────────────

type StepProps = { answers: QuestionnaireAnswers; update: (k: keyof QuestionnaireAnswers, v: any) => void };

function Step1({ answers, update }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <SectionCard title="Type de personnalité">
        <ChipGroup
          options={PERSONALITY_OPTIONS}
          selected={answers.personality}
          onSelect={v => update('personality', v)}
        />
      </SectionCard>
      <SectionCard title="Trait dominant">
        <ChipGroup
          options={DOMINANT_TRAIT_OPTIONS}
          selected={answers.dominantTrait}
          onSelect={v => update('dominantTrait', v)}
        />
      </SectionCard>
      <SectionCard title="Langage de l'amour">
        <ChipGroup
          options={LOVE_LANGUAGE_OPTIONS}
          selected={answers.loveLanguage}
          onSelect={v => update('loveLanguage', v)}
        />
      </SectionCard>
      <SectionCard title="Communication & Attachement">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Style de communication</Text>
          <ChipGroup
            options={COMMUNICATION_OPTIONS}
            selected={answers.communication}
            onSelect={v => update('communication', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Style d'attachement</Text>
          <ChipGroup
            options={ATTACHMENT_OPTIONS}
            selected={answers.attachment}
            onSelect={v => update('attachment', v)}
          />
        </View>
      </SectionCard>
      <SectionCard title="Gestion des conflits">
        <ChipGroup
          options={CONFLICT_STYLE_OPTIONS}
          selected={answers.conflictStyle}
          onSelect={v => update('conflictStyle', v)}
        />
      </SectionCard>
      <SectionCard title="Personnalité amoureuse">
        <ChipGroup
          options={LOVE_PERSONALITY_OPTIONS}
          selected={answers.lovePersonality}
          onSelect={v => update('lovePersonality', v)}
        />
      </SectionCard>
      <SectionCard title="Humour">
        <ChipGroup
          options={HUMOR_TYPE_OPTIONS}
          selected={answers.humorType}
          onSelect={v => update('humorType', v)}
        />
      </SectionCard>
    </View>
  );
}

// Étape 2 : Valeurs & Croyances
function Step2({ answers, update }: StepProps) {
  const toggleCoreValue = (value: string) => {
    const current = answers.coreValues;
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update('coreValues', next);
  };

  return (
    <View style={styles.stepContent}>
      <SectionCard title="Spiritualité & Politique">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Religion / Spiritualité</Text>
          <ChipGroup
            options={RELIGION_OPTIONS}
            selected={answers.religion}
            onSelect={v => update('religion', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Sensibilité politique</Text>
          <ChipGroup
            options={POLITICS_OPTIONS}
            selected={answers.politics}
            onSelect={v => update('politics', v)}
          />
        </View>
      </SectionCard>
      <SectionCard title="Valeurs fondamentales (multi-sélection)">
        <ChipGroup
          options={CORE_VALUES_OPTIONS}
          selected={answers.coreValues}
          onSelect={toggleCoreValue}
          multi
        />
      </SectionCard>
      <SectionCard title="Ce qui vous importe">
        <StepSlider
          label="Importance de la famille"
          value={answers.familyImportance}
          onChange={v => update('familyImportance', v)}
          showLabels={['Peu important', 'Essentiel']}
        />
        <StepSlider
          label="Honnêteté"
          value={answers.honestyLevel}
          onChange={v => update('honestyLevel', v)}
          showLabels={['Flexible', 'Non-négociable']}
        />
        <StepSlider
          label="Loyauté"
          value={answers.loyaltyLevel}
          onChange={v => update('loyaltyLevel', v)}
          showLabels={['Flexible', 'Absolue']}
        />
        <StepSlider
          label="Ouverture d'esprit"
          value={answers.openMindedness}
          onChange={v => update('openMindedness', v)}
          showLabels={['Traditionnel', 'Très ouvert']}
        />
      </SectionCard>
    </View>
  );
}

// Étape 3 : Mode de vie & Santé
function Step3({ answers, update }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <SectionCard title="Mode de vie">
        <ChipGroup
          options={LIFESTYLE_OPTIONS}
          selected={answers.lifestyle}
          onSelect={v => update('lifestyle', v)}
        />
      </SectionCard>
      <SectionCard title="Rythme & Sport">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Pratique sportive</Text>
          <ChipGroup
            options={SPORTS_OPTIONS}
            selected={answers.sports}
            onSelect={v => update('sports', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Rythme de vie</Text>
          <ChipGroup
            options={WAKE_UP_OPTIONS}
            selected={answers.wakeUpTime}
            onSelect={v => update('wakeUpTime', v)}
          />
        </View>
      </SectionCard>
      <SectionCard title="Consommation">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Alcool</Text>
          <ChipGroup
            options={ALCOHOL_OPTIONS}
            selected={answers.alcohol}
            onSelect={v => update('alcohol', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Tabac</Text>
          <ChipGroup
            options={SMOKING_OPTIONS}
            selected={answers.smoking}
            onSelect={v => update('smoking', v)}
          />
        </View>
      </SectionCard>
      <SectionCard title="Alimentation, Animaux & Voyages">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Régime alimentaire</Text>
          <ChipGroup
            options={DIET_OPTIONS}
            selected={answers.diet}
            onSelect={v => update('diet', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Rapport aux animaux</Text>
          <ChipGroup
            options={PETS_OPTIONS}
            selected={answers.pets}
            onSelect={v => update('pets', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Fréquence de voyage</Text>
          <ChipGroup
            options={TRAVEL_OPTIONS}
            selected={answers.travelFrequency}
            onSelect={v => update('travelFrequency', v)}
          />
        </View>
      </SectionCard>
    </View>
  );
}

// Étape 4 : Avenir & Famille
function Step4({ answers, update }: StepProps) {
  const showChildrenCount = answers.wantsChildren === 'yes' || answers.wantsChildren === 'already_have';

  return (
    <View style={styles.stepContent}>
      <SectionCard title="Enfants">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Souhaitez-vous des enfants ?</Text>
          <ChipGroup
            options={WANTS_CHILDREN_OPTIONS}
            selected={answers.wantsChildren}
            onSelect={v => update('wantsChildren', v)}
          />
        </View>
        {showChildrenCount && (
          <View style={{ gap: 8 }}>
            <Text style={fieldStyles.label}>Combien ?</Text>
            <ChipGroup
              options={CHILDREN_COUNT_OPTIONS}
              selected={answers.childrenCount}
              onSelect={v => update('childrenCount', v)}
            />
          </View>
        )}
      </SectionCard>
      <SectionCard title="Lieu de vie">
        <ChipGroup
          options={WHERE_TO_LIVE_OPTIONS}
          selected={answers.whereToLive}
          onSelect={v => update('whereToLive', v)}
        />
      </SectionCard>
      <SectionCard title="Objectifs financiers">
        <ChipGroup
          options={FINANCIAL_GOALS_OPTIONS}
          selected={answers.financialGoals}
          onSelect={v => update('financialGoals', v)}
        />
      </SectionCard>
      <SectionCard title="Mariage & Ambition">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Vision du mariage</Text>
          <ChipGroup
            options={MARRIAGE_OPTIONS}
            selected={answers.marriageView}
            onSelect={v => update('marriageView', v)}
          />
        </View>
        <StepSlider
          label="Niveau d'ambition"
          value={answers.ambitionLevel}
          onChange={v => update('ambitionLevel', v)}
          showLabels={['Serein(e)', 'Très ambitieux(se)']}
        />
      </SectionCard>
    </View>
  );
}

// Étape 5 : Loisirs & Culture
function Step5({ answers, update }: StepProps) {
  const toggleMulti = (key: keyof QuestionnaireAnswers, value: string) => {
    const current = answers[key] as string[];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update(key, next);
  };

  return (
    <View style={styles.stepContent}>
      <SectionCard title="Musique (multi-sélection)">
        <ChipGroup
          options={MUSIC_GENRES_OPTIONS}
          selected={answers.musicGenres}
          onSelect={v => toggleMulti('musicGenres', v)}
          multi
        />
      </SectionCard>
      <SectionCard title="Films & Séries (multi-sélection)">
        <ChipGroup
          options={FILM_GENRES_OPTIONS}
          selected={answers.filmGenres}
          onSelect={v => toggleMulti('filmGenres', v)}
          multi
        />
      </SectionCard>
      <SectionCard title="Hobbies (multi-sélection)">
        <ChipGroup
          options={HOBBIES_OPTIONS}
          selected={answers.hobbies}
          onSelect={v => toggleMulti('hobbies', v)}
          multi
        />
      </SectionCard>
      <SectionCard title="Lecture & Vie sociale">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Lecture</Text>
          <ChipGroup
            options={READING_OPTIONS}
            selected={answers.readingFrequency}
            onSelect={v => update('readingFrequency', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Vie sociale</Text>
          <ChipGroup
            options={SOCIAL_LIFE_OPTIONS}
            selected={answers.socialLife}
            onSelect={v => update('socialLife', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Week-end idéal</Text>
          <ChipGroup
            options={WEEKEND_STYLE_OPTIONS}
            selected={answers.weekendStyle}
            onSelect={v => update('weekendStyle', v)}
          />
        </View>
      </SectionCard>
    </View>
  );
}

// Étape 6 : Finances & Travail
function Step6({ answers, update }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <SectionCard title="Situation financière">
        <ChipGroup
          options={FINANCIAL_SITUATION_OPTIONS}
          selected={answers.financialSituation}
          onSelect={v => update('financialSituation', v)}
        />
      </SectionCard>
      <SectionCard title="Partage des frais">
        <ChipGroup
          options={SPLIT_BILL_OPTIONS}
          selected={answers.splitBill}
          onSelect={v => update('splitBill', v)}
        />
      </SectionCard>
      <SectionCard title="Équilibre vie pro / perso">
        <ChipGroup
          options={WORK_LIFE_OPTIONS}
          selected={answers.workLifeBalance}
          onSelect={v => update('workLifeBalance', v)}
        />
      </SectionCard>
      <SectionCard title="Profil professionnel">
        <ChipGroup
          options={ENTREPRENEUR_OPTIONS}
          selected={answers.entrepreneurSpirit}
          onSelect={v => update('entrepreneurSpirit', v)}
        />
      </SectionCard>
    </View>
  );
}

// Étape 7 : Relation & Intimité
function Step7({ answers, update }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <SectionCard title="Type de relation">
        <ChipGroup
          options={RELATION_TYPE_OPTIONS}
          selected={answers.relationType}
          onSelect={v => update('relationType', v)}
        />
      </SectionCard>
      <SectionCard title="Rythme & Passé">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Rythme de mise en relation</Text>
          <ChipGroup
            options={RELATIONSHIP_PACE_OPTIONS}
            selected={answers.relationshipPace}
            onSelect={v => update('relationshipPace', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Relations passées</Text>
          <ChipGroup
            options={PAST_RELATIONSHIPS_OPTIONS}
            selected={answers.pastRelationships}
            onSelect={v => update('pastRelationships', v)}
          />
        </View>
      </SectionCard>
      <SectionCard title="Curseurs d'intimité">
        <StepSlider
          label="Niveau de jalousie"
          value={answers.jealousyLevel}
          onChange={v => update('jealousyLevel', v)}
          showLabels={['Très confiant(e)', 'Jaloux(se)']}
        />
        <StepSlider
          label="Besoin d'indépendance"
          value={answers.independenceLevel}
          onChange={v => update('independenceLevel', v)}
          showLabels={['Fusionnel(le)', 'Très indépendant(e)']}
        />
        <StepSlider
          label="Besoin d'affection"
          value={answers.affectionLevel}
          onChange={v => update('affectionLevel', v)}
          showLabels={['Réservé(e)', 'Très affectueux(se)']}
        />
        <StepSlider
          label="Importance de la sexualité"
          value={answers.sexualityImportance}
          onChange={v => update('sexualityImportance', v)}
          showLabels={['Secondaire', 'Essentielle']}
        />
      </SectionCard>
    </View>
  );
}

// Étape 8 : Partenaire idéal
function Step8({ answers, update }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <SectionCard title="Tranche d'âge recherchée">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Âge minimum : {answers.partnerAgeMin} ans</Text>
          <StepSlider
            label=""
            value={answers.partnerAgeMin}
            min={18}
            max={60}
            onChange={v => update('partnerAgeMin', Math.min(v, answers.partnerAgeMax - 1))}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Âge maximum : {answers.partnerAgeMax} ans</Text>
          <StepSlider
            label=""
            value={answers.partnerAgeMax}
            min={18}
            max={60}
            onChange={v => update('partnerAgeMax', Math.max(v, answers.partnerAgeMin + 1))}
          />
        </View>
      </SectionCard>
      <SectionCard title="Distance & Apparence">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Distance max : {answers.maxDistance} km</Text>
          <StepSlider
            label=""
            value={answers.maxDistance}
            min={5}
            max={500}
            onChange={v => update('maxDistance', v)}
          />
        </View>
        <StepSlider
          label="Importance de l'apparence"
          value={answers.appearanceImportance}
          onChange={v => update('appearanceImportance', v)}
          showLabels={['Secondaire', 'Primordial']}
        />
      </SectionCard>
      <SectionCard title="Critères du partenaire">
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Niveau d'études minimum</Text>
          <ChipGroup
            options={PARTNER_EDUCATION_OPTIONS}
            selected={answers.partnerEducation}
            onSelect={v => update('partnerEducation', v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={fieldStyles.label}>Partenaire avec enfants déjà ?</Text>
          <ChipGroup
            options={CHILDREN_OK_OPTIONS}
            selected={answers.childrenOk}
            onSelect={v => update('childrenOk', v)}
          />
        </View>
        <StepSlider
          label="Ambition du partenaire"
          value={answers.partnerAmbition}
          onChange={v => update('partnerAmbition', v)}
          showLabels={['Serein(e)', 'Très ambitieux(se)']}
        />
      </SectionCard>
    </View>
  );
}

// Étape 9 : Deal-breakers
function Step9({ answers, update }: StepProps) {
  const toggleMulti = (key: keyof QuestionnaireAnswers, value: string) => {
    const current = answers[key] as string[];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update(key, next);
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.dealBreakerInfo}>
        <Ionicons name="warning-outline" size={18} color={Colors.warning} />
        <Text style={styles.dealBreakerText}>
          Sélectionnez les situations que vous ne pouvez absolument pas accepter dans une relation.
        </Text>
      </View>
      <SectionCard title="🚩 Mes critères éliminatoires">
        <ChipGroup
          options={DEAL_BREAKER_OPTIONS}
          selected={answers.dealBreakers}
          onSelect={v => toggleMulti('dealBreakers', v)}
          multi
        />
      </SectionCard>
      {answers.dealBreakers.length > 0 && (
        <View style={styles.dealBreakerCount}>
          <LinearGradient colors={['rgba(255,82,82,0.12)', 'rgba(255,82,82,0.06)']} style={styles.dealBreakerCountInner}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.danger} />
            <Text style={styles.dealBreakerCountText}>
              {answers.dealBreakers.length} limite{answers.dealBreakers.length > 1 ? 's' : ''} définie{answers.dealBreakers.length > 1 ? 's' : ''}
            </Text>
          </LinearGradient>
        </View>
      )}
      <SectionCard title="Humour du partenaire">
        <ChipGroup
          options={HUMOR_TYPE_OPTIONS}
          selected={answers.partnerHumorType}
          onSelect={v => update('partnerHumorType', v)}
        />
      </SectionCard>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9;

export default function QuestionnaireScreen() {
  const { questionnaire, setQuestionnaire, setQuestionnaireCompleted, setAiScore } = useApp();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => ({
    ...DEFAULT_ANSWERS,
    ...questionnaire,
  }));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const score = computeRealtimeScore(answers, step);
  const completions = getStepCompletion(answers);

  const update = useCallback((key: keyof QuestionnaireAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  const handleNext = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (user) {
        const fallbackName = user.email?.split('@')[0];
        await profileService.saveFromQuestionnaire(user.id, answers, fallbackName);
      }
      setQuestionnaire(answers);
      setQuestionnaireCompleted(true);
      setAiScore(score);
      // Nouvel utilisateur → Découvrir avec animation de bienvenue
      router.replace('/(tabs)/discover');
    } catch (err: any) {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      console.error('QUESTIONNAIRE SAVE ERROR:', msg);
      setSaveError(msg || 'Erreur lors de la sauvegarde.');
      setSaving(false);
    }
  }, [step, answers, score, user, setQuestionnaire, setQuestionnaireCompleted, setAiScore]);

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    } else {
      Alert.alert(
        'Quitter le questionnaire ?',
        'Tes réponses seront perdues. Tu peux le compléter plus tard depuis ton profil.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
        ]
      );
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerStep}>Étape {step}/{TOTAL_STEPS}</Text>
              <Text style={styles.headerTitle}>{currentStep.emoji} {currentStep.title}</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Progress */}
          <ProgressBar current={step} total={TOTAL_STEPS} completions={completions} />

          {/* AI Score Widget */}
          <AIScoreWidget score={score} step={step} />

          {/* Step subtitle */}
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

          {/* Content */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && <Step1 answers={answers} update={update} />}
            {step === 2 && <Step2 answers={answers} update={update} />}
            {step === 3 && <Step3 answers={answers} update={update} />}
            {step === 4 && <Step4 answers={answers} update={update} />}
            {step === 5 && <Step5 answers={answers} update={update} />}
            {step === 6 && <Step6 answers={answers} update={update} />}
            {step === 7 && <Step7 answers={answers} update={update} />}
            {step === 8 && <Step8 answers={answers} update={update} />}
            {step === 9 && <Step9 answers={answers} update={update} />}
            <View style={{ height: 24 }} />
          </ScrollView>

          {/* CTA */}
          <View style={styles.footer}>
            {saveError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{saveError}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={saving}
              activeOpacity={0.85}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={saving ? ['#555', '#444'] : Colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>
                      {step < TOTAL_STEPS ? 'Continuer' : 'Terminer mon profil'}
                    </Text>
                    <Ionicons
                      name={step < TOTAL_STEPS ? 'arrow-forward' : 'checkmark-circle'}
                      size={20}
                      color="#FFF"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerStep: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  headerRight: { width: 38 },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },
  stepContent: { gap: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dealBreakerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,215,64,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,64,0.2)',
  },
  dealBreakerText: { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  dealBreakerCount: { borderRadius: 12, overflow: 'hidden' },
  dealBreakerCountInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  dealBreakerCountText: { color: Colors.danger, fontSize: 13, fontWeight: '700' },
});
