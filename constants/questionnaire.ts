export type ChipOption = { label: string; value: string; emoji?: string };

// ============================================================
// Types — QuestionnaireAnswers (backward compatible + enrichi)
// ============================================================

export interface QuestionnaireAnswers {
  // ── Étape 1 : Identité ────────────────────────────────────
  firstName: string;
  age: number;
  city: string;
  job: string;
  education: string;
  gender: string;               // man | woman | non_binary | other
  lookingFor: string;           // man | woman | everyone

  // ── Étape 2 : Personnalité & Caractère ────────────────────
  personality: string;          // introvert | extravert | ambivert
  dominantTrait: string;        // adventurer | romantic | rational | creative | empathic
  loveLanguage: string;         // words | acts | gifts | time | touch
  communication: string;        // direct | diplomatic | emotional | factual
  attachment: string;           // secure | anxious | avoidant
  humorType: string;
  conflictStyle: string;        // talk_asap | cool_down | write | avoid
  lovePersonality: string;      // passionate | tender | playful | serious

  // ── Étape 3 : Valeurs & Croyances ────────────────────────
  religion: string;
  politics: string;
  familyImportance: number;     // 1-10
  honestyLevel: number;         // 1-10
  loyaltyLevel: number;         // 1-10
  openMindedness: number;       // 1-10
  coreValues: string[];         // multi: family | freedom | success | love | ...

  // ── Étape 4 : Mode de vie & Santé ────────────────────────
  lifestyle: string;
  sports: string;
  wakeUpTime: string;           // early_bird | night_owl | flexible
  alcohol: string;
  smoking: string;
  diet: string;
  pets: string;
  travelFrequency: string;      // never | rarely | sometimes | often | always

  // ── Étape 5 : Avenir & Famille ───────────────────────────
  wantsChildren: string;        // yes | no | already_have | open
  childrenCount: string;        // 0 | 1 | 2 | 3plus
  whereToLive: string;          // city | countryside | abroad | flexible
  financialGoals: string;       // stability | growth | freedom | luxury
  ambitionLevel: number;        // 1-10
  lifeProjection: string;       // now | 2years | 5years | 10years (horizon)
  marriageView: string;         // yes | no | maybe | already_married

  // ── Étape 6 : Loisirs & Culture ──────────────────────────
  musicGenres: string[];        // multi
  filmGenres: string[];         // multi
  hobbies: string[];            // multi
  readingFrequency: string;     // never | sometimes | often | always
  socialLife: string;           // homebody | balanced | social_butterfly
  weekendStyle: string;         // adventure | relax | culture | friends | mix

  // ── Étape 7 : Finances & Ambition ────────────────────────
  financialSituation: string;   // student | stable | growing | wealthy | prefer_not
  splitBill: string;            // always | usually | sometimes | never
  workLifeBalance: string;      // work_first | balanced | life_first
  entrepreneurSpirit: string;   // employee | entrepreneur | both | freelance

  // ── Étape 8 : Relation & Intimité ────────────────────────
  relationshipPace: string;     // fast | moderate | slow
  jealousyLevel: number;        // 1-10
  independenceLevel: number;    // 1-10 (need for personal space)
  affectionLevel: number;       // 1-10
  sexualityImportance: number;  // 1-10
  relationType: string;         // serious | casual | open | friendship
  pastRelationships: string;    // none | few | several | many

  // ── Étape 9 : Critères Partenaire ────────────────────────
  partnerAgeMin: number;
  partnerAgeMax: number;
  maxDistance: number;
  appearanceImportance: number;
  partnerEducation: string;
  partnerAmbition: number;      // 1-10
  partnerHumorType: string;
  childrenOk: string;

  // ── Étape 10 : Deal-breakers ──────────────────────────────
  dealBreakers: string[];
}

// ============================================================
// Default answers
// ============================================================

export const DEFAULT_ANSWERS: QuestionnaireAnswers = {
  // Identité
  firstName: '', age: 0, city: '', job: '', education: '',
  gender: '', lookingFor: '',

  // Personnalité
  personality: '', dominantTrait: '', loveLanguage: '',
  communication: '', attachment: '', humorType: '',
  conflictStyle: '', lovePersonality: '',

  // Valeurs
  religion: '', politics: '', familyImportance: 7,
  honestyLevel: 9, loyaltyLevel: 9, openMindedness: 7,
  coreValues: [],

  // Lifestyle
  lifestyle: '', sports: '', wakeUpTime: '', alcohol: '',
  smoking: '', diet: '', pets: '', travelFrequency: '',

  // Avenir
  wantsChildren: '', childrenCount: '', whereToLive: '',
  financialGoals: '', ambitionLevel: 7, lifeProjection: '',
  marriageView: '',

  // Loisirs
  musicGenres: [], filmGenres: [], hobbies: [],
  readingFrequency: '', socialLife: '', weekendStyle: '',

  // Finances
  financialSituation: '', splitBill: '', workLifeBalance: '',
  entrepreneurSpirit: '',

  // Relation & Intimité
  relationshipPace: '', jealousyLevel: 3, independenceLevel: 7,
  affectionLevel: 8, sexualityImportance: 7, relationType: '',
  pastRelationships: '',

  // Critères partenaire
  partnerAgeMin: 22, partnerAgeMax: 38, maxDistance: 100,
  appearanceImportance: 6, partnerEducation: '',
  partnerAmbition: 6, partnerHumorType: '', childrenOk: '',

  // Deal-breakers
  dealBreakers: [],
};

// ============================================================
// Steps
// ============================================================

export const STEPS = [
  { id: 1, title: 'Personnalité',        subtitle: 'Votre caractère & façon d\'aimer',   emoji: '🧠' },
  { id: 2, title: 'Valeurs',             subtitle: 'Ce qui guide vos choix de vie',      emoji: '💎' },
  { id: 3, title: 'Mode de vie',         subtitle: 'Votre quotidien & habitudes',        emoji: '🌿' },
  { id: 4, title: 'Avenir & Famille',    subtitle: 'Où vous voyez-vous dans 5 ans ?',   emoji: '🏡' },
  { id: 5, title: 'Loisirs & Culture',   subtitle: 'Ce qui vous fait vibrer',            emoji: '🎨' },
  { id: 6, title: 'Finances & Travail',  subtitle: 'Votre rapport à l\'argent',          emoji: '💰' },
  { id: 7, title: 'Relation & Intimité', subtitle: 'Votre façon d\'aimer',               emoji: '💑' },
  { id: 8, title: 'Partenaire idéal',    subtitle: 'Ce que vous recherchez',             emoji: '✨' },
  { id: 9, title: 'Red flags',           subtitle: 'Ce que vous ne pouvez pas accepter', emoji: '🚩' },
];

// ============================================================
// Options par étape
// ============================================================

// Étape 1
export const GENDER_OPTIONS: ChipOption[] = [
  { label: 'Homme',       value: 'man',        emoji: '👨' },
  { label: 'Femme',       value: 'woman',      emoji: '👩' },
  { label: 'Non-binaire', value: 'non_binary', emoji: '🧑' },
  { label: 'Autre',       value: 'other',      emoji: '✨' },
];
export const LOOKING_FOR_OPTIONS: ChipOption[] = [
  { label: 'Des femmes',    value: 'woman',    emoji: '👩' },
  { label: 'Des hommes',    value: 'man',      emoji: '👨' },
  { label: 'Tout le monde', value: 'everyone', emoji: '🌍' },
];
export const EDUCATION_OPTIONS: ChipOption[] = [
  { label: 'Bac',       value: 'bac',       emoji: '📜' },
  { label: 'Bac+2',     value: 'bac2',      emoji: '🎓' },
  { label: 'Bac+3',     value: 'bac3',      emoji: '🎓' },
  { label: 'Bac+5',     value: 'bac5',      emoji: '🎓' },
  { label: 'Doctorat',  value: 'doctorate', emoji: '🏅' },
];

// Étape 2
export const PERSONALITY_OPTIONS: ChipOption[] = [
  { label: 'Introverti',  value: 'introvert', emoji: '🌙' },
  { label: 'Extraverti',  value: 'extravert', emoji: '☀️' },
  { label: 'Ambiverti',   value: 'ambivert',  emoji: '⚖️' },
];
export const DOMINANT_TRAIT_OPTIONS: ChipOption[] = [
  { label: 'Aventurier',  value: 'adventurer', emoji: '🌍' },
  { label: 'Romantique',  value: 'romantic',   emoji: '💕' },
  { label: 'Rationnel',   value: 'rational',   emoji: '🧠' },
  { label: 'Créatif',     value: 'creative',   emoji: '🎨' },
  { label: 'Empathique',  value: 'empathic',   emoji: '💞' },
  { label: 'Ambitieux',   value: 'ambitious',  emoji: '🚀' },
  { label: 'Protecteur',  value: 'protector',  emoji: '🛡️' },
];
export const LOVE_LANGUAGE_OPTIONS: ChipOption[] = [
  { label: 'Mots doux',      value: 'words',  emoji: '💬' },
  { label: 'Actes du soin',  value: 'acts',   emoji: '🤲' },
  { label: 'Cadeaux',        value: 'gifts',  emoji: '🎁' },
  { label: 'Temps de qualité', value: 'time', emoji: '⏰' },
  { label: 'Toucher',        value: 'touch',  emoji: '🤗' },
];
export const COMMUNICATION_OPTIONS: ChipOption[] = [
  { label: 'Direct',       value: 'direct',     emoji: '🎯' },
  { label: 'Diplomatique', value: 'diplomatic', emoji: '🕊️' },
  { label: 'Émotionnel',   value: 'emotional',  emoji: '💬' },
  { label: 'Factuel',      value: 'factual',    emoji: '📊' },
];
export const ATTACHMENT_OPTIONS: ChipOption[] = [
  { label: 'Sécure',   value: 'secure',   emoji: '🏠' },
  { label: 'Anxieux',  value: 'anxious',  emoji: '💭' },
  { label: 'Évitant',  value: 'avoidant', emoji: '🚪' },
];
export const CONFLICT_STYLE_OPTIONS: ChipOption[] = [
  { label: 'J\'en parle tout de suite', value: 'talk_asap',   emoji: '🗣️' },
  { label: 'Je me calme d\'abord',      value: 'cool_down',   emoji: '🧘' },
  { label: 'Je préfère écrire',         value: 'write',       emoji: '✉️' },
  { label: 'J\'évite le conflit',       value: 'avoid',       emoji: '🙈' },
];
export const LOVE_PERSONALITY_OPTIONS: ChipOption[] = [
  { label: 'Passionné(e)',  value: 'passionate', emoji: '🔥' },
  { label: 'Tendre',        value: 'tender',     emoji: '🌸' },
  { label: 'Joueur(se)',    value: 'playful',    emoji: '😄' },
  { label: 'Sérieux(se)',   value: 'serious',    emoji: '💼' },
];

// Étape 3
export const RELIGION_OPTIONS: ChipOption[] = [
  { label: 'Aucune',      value: 'none',       emoji: '✨' },
  { label: 'Croyant(e)',  value: 'believer',   emoji: '🙏' },
  { label: 'Pratiquant(e)', value: 'practicing', emoji: '⛪' },
  { label: 'Spirituel(le)', value: 'spiritual', emoji: '🌿' },
  { label: 'Agnostique',  value: 'agnostic',   emoji: '🤔' },
  { label: 'Athée',       value: 'atheist',    emoji: '🔬' },
];
export const POLITICS_OPTIONS: ChipOption[] = [
  { label: 'Gauche',      value: 'left',       emoji: '🌹' },
  { label: 'Centre',      value: 'center',     emoji: '⚖️' },
  { label: 'Droite',      value: 'right',      emoji: '🔵' },
  { label: 'Apolitique',  value: 'apolitical', emoji: '🤝' },
  { label: 'Écologiste',  value: 'green',      emoji: '🌱' },
];
export const CORE_VALUES_OPTIONS: ChipOption[] = [
  { label: 'Famille',     value: 'family',     emoji: '👨‍👩‍👧' },
  { label: 'Liberté',     value: 'freedom',    emoji: '🦋' },
  { label: 'Succès',      value: 'success',    emoji: '🏆' },
  { label: 'Amour',       value: 'love',       emoji: '❤️' },
  { label: 'Santé',       value: 'health',     emoji: '💪' },
  { label: 'Créativité',  value: 'creativity', emoji: '🎨' },
  { label: 'Justice',     value: 'justice',    emoji: '⚖️' },
  { label: 'Aventure',    value: 'adventure',  emoji: '🌍' },
  { label: 'Sécurité',    value: 'security',   emoji: '🛡️' },
  { label: 'Spiritualité', value: 'spirituality', emoji: '🌟' },
];

// Étape 4
export const LIFESTYLE_OPTIONS: ChipOption[] = [
  { label: 'Très actif(ve)', value: 'Actif',    emoji: '⚡' },
  { label: 'Casanier(ère)',  value: 'Casanier', emoji: '🏠' },
  { label: 'Équilibré(e)',   value: 'Équilibré', emoji: '⚖️' },
];
export const SPORTS_OPTIONS: ChipOption[] = [
  { label: 'Jamais',      value: 'none',       emoji: '🛋️' },
  { label: 'Parfois',     value: 'occasional', emoji: '🚶' },
  { label: 'Régulier',    value: 'regular',    emoji: '🏋️' },
  { label: 'Intensif',    value: 'intensive',  emoji: '🏆' },
];
export const WAKE_UP_OPTIONS: ChipOption[] = [
  { label: 'Lève-tôt',    value: 'early_bird', emoji: '🌅' },
  { label: 'Couche-tard', value: 'night_owl',  emoji: '🦉' },
  { label: 'Flexible',    value: 'flexible',   emoji: '😊' },
];
export const ALCOHOL_OPTIONS: ChipOption[] = [
  { label: 'Jamais',      value: 'none',       emoji: '💧' },
  { label: 'Occasionnel', value: 'occasional', emoji: '🥂' },
  { label: 'Modéré',      value: 'moderate',   emoji: '🍷' },
  { label: 'Régulier',    value: 'regular',    emoji: '🍺' },
];
export const SMOKING_OPTIONS: ChipOption[] = [
  { label: 'Non fumeur',  value: 'none',       emoji: '✅' },
  { label: 'Occasionnel', value: 'occasional', emoji: '💨' },
  { label: 'Fumeur',      value: 'smoker',     emoji: '🚬' },
];
export const DIET_OPTIONS: ChipOption[] = [
  { label: 'Omnivore',    value: 'omnivore',   emoji: '🍖' },
  { label: 'Végétarien',  value: 'vegetarian', emoji: '🥗' },
  { label: 'Végan',       value: 'vegan',      emoji: '🌱' },
  { label: 'Sans gluten', value: 'glutenfree', emoji: '🌾' },
  { label: 'Autre',       value: 'other',      emoji: '🍽️' },
];
export const PETS_OPTIONS: ChipOption[] = [
  { label: 'J\'adore !',  value: 'love',     emoji: '🐾' },
  { label: 'J\'aime',     value: 'like',     emoji: '🐶' },
  { label: 'Neutre',      value: 'neutral',  emoji: '😐' },
  { label: 'Allergique',  value: 'allergic', emoji: '🤧' },
];
export const TRAVEL_OPTIONS: ChipOption[] = [
  { label: 'Jamais',      value: 'never',    emoji: '🏠' },
  { label: 'Rarement',    value: 'rarely',   emoji: '🗺️' },
  { label: 'Parfois',     value: 'sometimes', emoji: '✈️' },
  { label: 'Souvent',     value: 'often',    emoji: '🌍' },
  { label: 'Toujours',    value: 'always',   emoji: '🧳' },
];

// Étape 5
export const WANTS_CHILDREN_OPTIONS: ChipOption[] = [
  { label: 'Oui, je veux',          value: 'yes',            emoji: '👶' },
  { label: 'Non',                   value: 'no',             emoji: '🚫' },
  { label: "J'en ai déjà",          value: 'already_have',   emoji: '👨‍👧' },
  { label: 'Ouvert(e)',             value: 'open',           emoji: '🤷' },
];
export const CHILDREN_COUNT_OPTIONS: ChipOption[] = [
  { label: '1',     value: '1',    emoji: '1️⃣' },
  { label: '2',     value: '2',    emoji: '2️⃣' },
  { label: '3+',    value: '3plus', emoji: '👨‍👩‍👧‍👦' },
];
export const WHERE_TO_LIVE_OPTIONS: ChipOption[] = [
  { label: 'Grande ville', value: 'city',       emoji: '🏙️' },
  { label: 'Campagne',     value: 'countryside', emoji: '🌾' },
  { label: 'À l\'étranger', value: 'abroad',    emoji: '🌍' },
  { label: 'Flexible',      value: 'flexible',  emoji: '🏡' },
];
export const FINANCIAL_GOALS_OPTIONS: ChipOption[] = [
  { label: 'Stabilité',   value: 'stability', emoji: '🏠' },
  { label: 'Croissance',  value: 'growth',    emoji: '📈' },
  { label: 'Liberté',     value: 'freedom',   emoji: '🦋' },
  { label: 'Luxe',        value: 'luxury',    emoji: '💎' },
];
export const MARRIAGE_OPTIONS: ChipOption[] = [
  { label: 'Oui, j\'y tiens',    value: 'yes',       emoji: '💍' },
  { label: 'Non',                value: 'no',        emoji: '🚫' },
  { label: 'Pourquoi pas',       value: 'maybe',     emoji: '🤔' },
  { label: 'Déjà marié(e)',      value: 'already',   emoji: '💒' },
];

// Étape 6
export const MUSIC_GENRES_OPTIONS: ChipOption[] = [
  { label: 'Pop',         value: 'pop',         emoji: '🎤' },
  { label: 'Rap / Hip-hop', value: 'rap',       emoji: '🎤' },
  { label: 'Rock',        value: 'rock',        emoji: '🎸' },
  { label: 'Électro',     value: 'electro',     emoji: '🎧' },
  { label: 'Jazz',        value: 'jazz',        emoji: '🎷' },
  { label: 'Classique',   value: 'classical',   emoji: '🎻' },
  { label: 'R&B / Soul',  value: 'rnb',         emoji: '🎵' },
  { label: 'Metal',       value: 'metal',       emoji: '🤘' },
  { label: 'Folk',        value: 'folk',        emoji: '🪕' },
  { label: 'Tout !',      value: 'everything',  emoji: '🎶' },
];
export const FILM_GENRES_OPTIONS: ChipOption[] = [
  { label: 'Comédie',     value: 'comedy',      emoji: '😂' },
  { label: 'Drame',       value: 'drama',       emoji: '🎭' },
  { label: 'Action',      value: 'action',      emoji: '💥' },
  { label: 'Romance',     value: 'romance',     emoji: '💕' },
  { label: 'Sci-fi',      value: 'scifi',       emoji: '🚀' },
  { label: 'Horreur',     value: 'horror',      emoji: '😱' },
  { label: 'Documentaire', value: 'documentary', emoji: '📹' },
  { label: 'Animation',   value: 'animation',   emoji: '🎬' },
  { label: 'Thriller',    value: 'thriller',    emoji: '🔍' },
];
export const HOBBIES_OPTIONS: ChipOption[] = [
  { label: 'Sport',         value: 'sport',       emoji: '⚽' },
  { label: 'Cuisine',       value: 'cooking',     emoji: '👨‍🍳' },
  { label: 'Lecture',       value: 'reading',     emoji: '📚' },
  { label: 'Voyages',       value: 'travel',      emoji: '✈️' },
  { label: 'Gaming',        value: 'gaming',      emoji: '🎮' },
  { label: 'Art / Dessin',  value: 'art',         emoji: '🎨' },
  { label: 'Musique',       value: 'music',       emoji: '🎵' },
  { label: 'Photo',         value: 'photography', emoji: '📷' },
  { label: 'Randonnée',     value: 'hiking',      emoji: '🏔️' },
  { label: 'Yoga',          value: 'yoga',        emoji: '🧘' },
  { label: 'Cinéma',        value: 'cinema',      emoji: '🎬' },
  { label: 'Jardinage',     value: 'gardening',   emoji: '🌱' },
  { label: 'Danse',         value: 'dance',       emoji: '💃' },
  { label: 'Bénévolat',     value: 'volunteering', emoji: '🤝' },
];
export const READING_OPTIONS: ChipOption[] = [
  { label: 'Jamais',      value: 'never',    emoji: '😅' },
  { label: 'Parfois',     value: 'sometimes', emoji: '📖' },
  { label: 'Souvent',     value: 'often',    emoji: '📚' },
  { label: 'Passionné(e)', value: 'always',  emoji: '🤓' },
];
export const SOCIAL_LIFE_OPTIONS: ChipOption[] = [
  { label: 'Soirées tranquilles', value: 'homebody',         emoji: '🕯️' },
  { label: 'Selon l\'humeur',     value: 'balanced',         emoji: '🎲' },
  { label: 'Toujours dehors',     value: 'social_butterfly', emoji: '🦋' },
];
export const WEEKEND_STYLE_OPTIONS: ChipOption[] = [
  { label: 'Aventure & sport', value: 'adventure', emoji: '🏔️' },
  { label: 'Repos total',      value: 'relax',     emoji: '🛋️' },
  { label: 'Sorties culturelles', value: 'culture', emoji: '🎭' },
  { label: 'Amis & famille',  value: 'friends',   emoji: '👨‍👩‍👧' },
  { label: 'Mix de tout',      value: 'mix',       emoji: '🎲' },
];

// Étape 7
export const FINANCIAL_SITUATION_OPTIONS: ChipOption[] = [
  { label: 'Étudiant(e)',       value: 'student',     emoji: '📚' },
  { label: 'Stable',            value: 'stable',      emoji: '⚓' },
  { label: 'En croissance',     value: 'growing',     emoji: '📈' },
  { label: 'À l\'aise',        value: 'wealthy',     emoji: '💰' },
  { label: 'Préfère ne pas dire', value: 'prefer_not', emoji: '🤐' },
];
export const SPLIT_BILL_OPTIONS: ChipOption[] = [
  { label: 'Toujours 50/50',     value: 'always',    emoji: '⚖️' },
  { label: 'Selon les revenus',  value: 'usually',   emoji: '💡' },
  { label: 'Parfois l\'un, parfois l\'autre', value: 'sometimes', emoji: '🔄' },
  { label: 'Celui qui invite paye', value: 'never',  emoji: '🎁' },
];
export const WORK_LIFE_OPTIONS: ChipOption[] = [
  { label: 'Travail avant tout', value: 'work_first', emoji: '💼' },
  { label: 'Équilibré',          value: 'balanced',   emoji: '⚖️' },
  { label: 'Vie perso avant',   value: 'life_first', emoji: '❤️' },
];
export const ENTREPRENEUR_OPTIONS: ChipOption[] = [
  { label: 'Salarié(e)',        value: 'employee',      emoji: '🏢' },
  { label: 'Entrepreneur(e)',   value: 'entrepreneur',  emoji: '🚀' },
  { label: 'Freelance',         value: 'freelance',     emoji: '💻' },
  { label: 'Les deux',          value: 'both',          emoji: '⚡' },
];

// Étape 8
export const RELATIONSHIP_PACE_OPTIONS: ChipOption[] = [
  { label: 'Vite',     value: 'fast',     emoji: '⚡' },
  { label: 'Modéré',   value: 'moderate', emoji: '🚶' },
  { label: 'Lentement', value: 'slow',   emoji: '🐢' },
];
export const RELATION_TYPE_OPTIONS: ChipOption[] = [
  { label: 'Relation sérieuse', value: 'serious',    emoji: '💍' },
  { label: 'Casual',            value: 'casual',     emoji: '✨' },
  { label: 'Relation ouverte',  value: 'open',       emoji: '🌈' },
  { label: 'Amitié d\'abord',   value: 'friendship', emoji: '🤝' },
];
export const PAST_RELATIONSHIPS_OPTIONS: ChipOption[] = [
  { label: 'Aucune',    value: 'none',    emoji: '🌱' },
  { label: '1-2',       value: 'few',     emoji: '💛' },
  { label: '3-5',       value: 'several', emoji: '💚' },
  { label: '6+',        value: 'many',    emoji: '💙' },
];

// Étape 9
export const CHILDREN_OK_OPTIONS: ChipOption[] = [
  { label: 'Oui',         value: 'yes',          emoji: '👨‍👩‍👧' },
  { label: 'Non',         value: 'no',           emoji: '🚫' },
  { label: 'Indifférent', value: 'indifferent',  emoji: '🤷' },
];
export const PARTNER_EDUCATION_OPTIONS: ChipOption[] = [
  { label: 'Peu importe', value: 'any',   emoji: '✨' },
  { label: 'Bac min.',    value: 'bac',   emoji: '📜' },
  { label: 'Bac+3 min.',  value: 'bac3',  emoji: '🎓' },
  { label: 'Bac+5 min.',  value: 'bac5',  emoji: '🏅' },
];

// Étape 10
export const DEAL_BREAKER_OPTIONS: ChipOption[] = [
  { label: 'Fumeur(se)',              value: 'smoker',           emoji: '🚬' },
  { label: 'Enfants déjà',           value: 'has_children',     emoji: '👶' },
  { label: 'Veut des enfants',       value: 'wants_children',   emoji: '🍼' },
  { label: 'Ne veut pas d\'enfants', value: 'no_children',      emoji: '🚫' },
  { label: 'Alcool fréquent',        value: 'heavy_drinker',    emoji: '🍺' },
  { label: 'Trop grande distance',   value: 'long_distance',    emoji: '📍' },
  { label: 'Valeurs différentes',    value: 'different_values', emoji: '⚡' },
  { label: 'Sédentaire',             value: 'no_sport',         emoji: '🛋️' },
  { label: 'Infidélité passée',      value: 'infidelity',       emoji: '💔' },
  { label: 'Relation non sérieuse',  value: 'casual_only',      emoji: '🎲' },
  { label: 'Pas de mariage',         value: 'no_marriage',      emoji: '🚫' },
  { label: 'Religion incompatible',  value: 'religion_clash',   emoji: '⛪' },
  { label: 'Jalousie excessive',     value: 'jealousy',         emoji: '😤' },
  { label: 'Pas d\'ambition',        value: 'no_ambition',      emoji: '😴' },
  { label: 'Manipulateur(trice)', value: 'manipulative',    emoji: '🎭' },
  { label: 'Trop possessif(ve)',  value: 'possessive',      emoji: '🔗' },
  { label: 'Pas de sport',       value: 'inactive',         emoji: '🛋️' },
  { label: 'Violence verbale',   value: 'verbal_violence',  emoji: '💢' },
  { label: 'Narcissisme',        value: 'narcissism',       emoji: '🪞' },
  { label: 'Incompatibilité sexuelle', value: 'sexual_incomp', emoji: '🔥' },
  { label: 'Pas de projet commun', value: 'no_project',    emoji: '🗺️' },
  { label: 'Différence d\'âge',  value: 'age_gap',          emoji: '⏳' },
  { label: 'Problèmes financiers', value: 'financial_issues', emoji: '💸' },
  { label: 'Hygiène insuffisante', value: 'hygiene',        emoji: '🧼' },
];

export const HUMOR_TYPE_OPTIONS: ChipOption[] = [
  { label: '1er degré',        value: 'first_degree',  emoji: '😊' },
  { label: '2ème degré',       value: 'second_degree', emoji: '😏' },
  { label: 'Humour noir',      value: 'dark',          emoji: '🖤' },
  { label: 'Absurde',          value: 'absurd',        emoji: '🤪' },
  { label: 'Piquant / Sarc.',  value: 'sarcastic',     emoji: '😈' },
  { label: 'Blagues de papa',  value: 'dad_jokes',     emoji: '🧔' },
  { label: 'Peu d\'humour',    value: 'serious',       emoji: '🧐' },
];
