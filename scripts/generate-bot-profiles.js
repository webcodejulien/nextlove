/**
 * NextLove — Générateur de 1000 profils belges ultra-réalistes
 * Utilise Claude API pour créer des personnalités cohérentes
 */

const https = require('https');
const fs = require('fs');

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const SUPABASE_URL = 'https://esccnfqkavtvngowizgc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY2NuZnFrYXZ0dm5nb3dpemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMzQ0MCwiZXhwIjoyMDk0Mjc5NDQwfQ.jVKgL9Wc9f8luzZffnKRhwQgh3AWbn0iRUmzR0Ebwbg';

// ── Données belges réalistes ──────────────────────────────────────

const VILLES_WALLONIE = [
  { city: 'Bruxelles', region: 'Bruxelles-Capitale', lat: 50.85, lng: 4.35 },
  { city: 'Liège', region: 'Wallonie', lat: 50.63, lng: 5.57 },
  { city: 'Namur', region: 'Wallonie', lat: 50.47, lng: 4.87 },
  { city: 'Charleroi', region: 'Wallonie', lat: 50.41, lng: 4.44 },
  { city: 'Mons', region: 'Wallonie', lat: 50.45, lng: 3.95 },
  { city: 'La Louvière', region: 'Wallonie', lat: 50.48, lng: 4.19 },
  { city: 'Tournai', region: 'Wallonie', lat: 50.60, lng: 3.39 },
  { city: 'Seraing', region: 'Wallonie', lat: 50.58, lng: 5.50 },
  { city: 'Verviers', region: 'Wallonie', lat: 50.59, lng: 5.86 },
  { city: 'Mouscron', region: 'Wallonie', lat: 50.74, lng: 3.21 },
  { city: 'Arlon', region: 'Wallonie', lat: 49.68, lng: 5.81 },
  { city: 'Wavre', region: 'Wallonie', lat: 50.71, lng: 4.61 },
  { city: 'Waterloo', region: 'Wallonie', lat: 50.72, lng: 4.40 },
  { city: 'Louvain-la-Neuve', region: 'Wallonie', lat: 50.67, lng: 4.61 },
  { city: 'Ottignies', region: 'Wallonie', lat: 50.67, lng: 4.57 },
  { city: 'Braine-l\'Alleud', region: 'Wallonie', lat: 50.68, lng: 4.37 },
  { city: 'Ixelles', region: 'Bruxelles', lat: 50.83, lng: 4.37 },
  { city: 'Anderlecht', region: 'Bruxelles', lat: 50.84, lng: 4.30 },
  { city: 'Schaerbeek', region: 'Bruxelles', lat: 50.87, lng: 4.38 },
  { city: 'Etterbeek', region: 'Bruxelles', lat: 50.83, lng: 4.39 },
];

const PRENOMS_FEMMES = [
  'Emma','Léa','Chloé','Manon','Sarah','Laura','Julie','Camille','Lucie','Marie',
  'Inès','Jade','Pauline','Alice','Mathilde','Clémence','Noémie','Charlotte','Elise','Zoé',
  'Margot','Anaïs','Océane','Ambre','Céline','Virginie','Laure','Sophie','Anne-Sophie','Mélanie',
  'Justine','Valentine','Aurélie','Nathalie','Isabelle','Sandrine','Stéphanie','Vanessa','Jessica','Audrey',
  'Axelle','Florence','Catherine','Véronique','Christine','Nadia','Sabrina','Yasmine','Fatima','Aicha',
];

const PRENOMS_HOMMES = [
  'Thomas','Nicolas','Alexandre','Maxime','Lucas','Antoine','Hugo','Louis','Théo','Arthur',
  'Ethan','Axel','Tom','Mathis','Raphaël','Nathan','Clément','Pierre','Baptiste','Julien',
  'Romain','Guillaume','Florian','Quentin','Sébastien','Michaël','David','Yannick','Xavier','François',
  'Laurent','Patrick','Christophe','Philippe','Stéphane','Marc','Olivier','Frédéric','Vincent','Benoît',
  'Kevin','Dylan','Enzo','Matteo','Ryan','Nils','Sacha','Amir','Mehdi','Bilal',
];

const NOMS_BELGES = [
  'Dubois','Lambert','Simon','Laurent','Lecomte','Renard','Dupont','Martin','Bernard','Fontaine',
  'Jacobs','Lejeune','Pirard','Bodart','Gilles','Schmitz','Willems','Collin','Bastin','Defays',
  'Marechal','Denis','Claes','Leclercq','Charlier','Peeters','Adam','Thiry','Piron','Feron',
  'Dessart','Deprez','Detaille','Brouwers','Claessens','Hermans','Noel','Marquet','Boxus','Dethier',
];

const METIERS = {
  'Santé': ['Infirmière','Médecin généraliste','Kiné','Sage-femme','Pharmacien','Dentiste','Aide-soignant'],
  'Education': ['Institutrice','Professeur secondaire','Éducateur','Logopède','Psychologue scolaire'],
  'Tech': ['Développeur web','Data analyst','UX designer','DevOps','Cybersécurité','Product manager'],
  'Commerce': ['Comptable','Auditeur','Conseiller bancaire','Courtier','Gestionnaire RH','Marketing manager'],
  'Créatif': ['Graphiste','Photographe','Journaliste','Community manager','Architecte d\'intérieur','Illustrateur'],
  'Social': ['Assistante sociale','Éducateur spécialisé','Animateur socio-culturel','Travailleur social'],
  'Artisanat': ['Électricien','Plombier','Menuisier','Coiffeur','Esthéticienne','Chef cuisinier'],
  'Étudiant': ['Étudiant en médecine','Étudiant en droit','Étudiant en ingé','Étudiant en commerce'],
  'Transport': ['Chauffeur de bus STIB','Pilote','Conducteur de train SNCB','Logisticien'],
  'Public': ['Fonctionnaire communal','Policier','Pompier','Agent SPF','Notaire'],
};

// Valeurs exactes selon les contraintes DB
const EDUCATIONS_DB = ['high_school','bachelors','bachelors','masters','masters','phd'];
const EDUCATIONS_LABEL = { high_school:'Secondaire', bachelors:'Bachelier', masters:'Master', phd:'Doctorat' };

const VALEURS = [
  'famille','honnêteté','loyauté','ambition','aventure','créativité','spiritualité',
  'équilibre','générosité','indépendance','respect','humor','santé','nature','voyages',
];

const HOBBIES = [
  'randonnée','vélo','cuisine','lecture','cinéma','musique','yoga','running','natation',
  'tennis','football','escalade','photographie','voyages','jeux de société','jardinage',
  'concerts','musées','restaurants','théâtre','ski','surf','danse','dessin','bricolage',
];

const LANGUES_BELGES = ['Français','Néerlandais','Anglais','Allemand','Espagnol','Italien','Arabe'];

// ── Générateur de profil avec Claude ─────────────────────────────

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          resolve(r.content?.[0]?.text || '');
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickPhoto(gender, index) {
  // Photos randomuser.me — API gratuite de personnes générées
  const side = gender === 'man' ? 'men' : 'women';
  const num = (index % 90) + 1;
  return `https://randomuser.me/api/portraits/${side}/${num}.jpg`;
}

async function generateProfile(index, gender) {
  const isFemale = gender === 'women';
  const prenom = isFemale ? rand(PRENOMS_FEMMES) : rand(PRENOMS_HOMMES);
  const nom = rand(NOMS_BELGES);
  const age = randInt(20, 42);
  const ville = rand(VILLES_WALLONIE);
  const secteur = rand(Object.keys(METIERS));
  const metier = rand(METIERS[secteur]);
  const educationDb = rand(EDUCATIONS_DB);
  const education = EDUCATIONS_LABEL[educationDb];
  const values = shuffle(VALEURS).slice(0, randInt(3, 6));
  const hobbies = shuffle(HOBBIES).slice(0, randInt(3, 7));
  const langues = ['Français', ...shuffle(LANGUES_BELGES.slice(1)).slice(0, randInt(0, 2))];

  // Génère une bio courte et réaliste avec Claude
  let bio = '';
  try {
    const bioPrompt = `Génère une bio de profil dating app pour un(e) belge de ${age} ans, habitant ${ville.city}, qui travaille comme ${metier}. Passions: ${hobbies.slice(0,3).join(', ')}. Valeurs: ${values.slice(0,2).join(', ')}. Bio courte (2-3 phrases max, 80-120 mots), naturelle et authentique, en français belge (peut utiliser "je suis" plutôt que "j'suis"). Pas de emoji. Pas de hashtag. Juste le texte de la bio.`;
    bio = await callClaude(bioPrompt);
    bio = bio.trim().replace(/^["']|["']$/g, '');
  } catch(e) {
    bio = `${metier} de profession, j'habite à ${ville.city} depuis quelques années. Passionné(e) de ${hobbies[0]} et ${hobbies[1]}, je cherche quelqu'un avec qui partager les petits bonheurs du quotidien.`;
  }

  // Questionnaire cohérent basé sur la personnalité
  const familyImportance = isFemale ? randInt(65, 95) : randInt(55, 88);
  const questionnaire = {
    // Personnalité
    attachmentStyle: rand(['secure', 'anxious', 'avoidant']),
    communicationStyle: rand(['direct', 'gentle', 'analytical', 'emotional']),
    conflictStyle: rand(['confrontational', 'avoidant', 'collaborative']),
    humorLevel: randInt(55, 95),
    empathyLevel: randInt(60, 98),
    introvertExtrovert: randInt(20, 80),

    // Valeurs
    honestyLevel: randInt(70, 99),
    loyaltyLevel: randInt(75, 99),
    ambitionLevel: randInt(40, 90),
    religionImportance: randInt(10, 75),
    politicalOrientation: rand(['left', 'center-left', 'center', 'center-right', 'apolitical']),

    // Famille
    familyImportance,
    wantsChildren: age < 35 ? rand(['yes', 'maybe', 'open']) : rand(['yes', 'no', 'already_have']),
    numberOfKidsWanted: randInt(1, 3),
    marriageImportance: randInt(40, 90),
    liveTogether: rand(['yes', 'eventually', 'not_sure']),

    // Mode de vie
    smokingStatus: rand(['non-smoker', 'non-smoker', 'non-smoker', 'occasional', 'smoker']),
    drinkingHabits: rand(['never', 'social', 'social', 'social', 'regular']),
    dietType: rand(['omnivore', 'omnivore', 'omnivore', 'vegetarian', 'flexitarian']),
    exerciseFrequency: rand(['daily', '3-4/week', '1-2/week', 'occasionally', 'rarely']),
    weekendStyle: rand(['adventurous', 'balanced', 'homebody', 'social']),
    sleepSchedule: rand(['night_owl', 'night_owl', 'early_bird', 'flexible']),
    cleanliness: randInt(60, 99),

    // Loisirs
    travelFrequency: rand(['monthly', 'several/year', 'once/year', 'rarely']),
    musicGenres: shuffle(['pop', 'rock', 'électro', 'rap', 'RnB', 'indie', 'jazz', 'classique']).slice(0, randInt(2, 4)),
    sports: hobbies.filter(h => ['tennis','football','running','natation','vélo','yoga','escalade','ski','surf','danse'].includes(h)),
    hobbies: hobbies,

    // Relation
    relationshipType: rand(['serious', 'serious', 'serious', 'open_to_see']),
    pastRelationships: rand(['few', 'some', 'several']),
    loveLanguage: rand(['words', 'acts', 'gifts', 'time', 'touch']),
    dealBreakers: shuffle(['smoking','drugs','infidelity','no_ambition','dishonesty','violence']).slice(0, 2),

    // Info pro
    job: metier,
    education,
    languages: langues,
    sector: secteur,

    // Compat score dimensions
    dominantTrait: rand(['family_first', 'adventurer', 'homebody', 'ambitious', 'creative', 'empathetic']),
  };

  // Email unique pour le bot
  const emailSlug = `${prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}.${nom.toLowerCase()}${index}`;
  const email = `bot.${emailSlug}@nextlove-internal.app`;

  const profile = {
    name: `${prenom} ${nom.charAt(0)}.`,
    age,
    email,
    gender: isFemale ? 'woman' : 'man',
    looking_for: isFemale ? rand(['man', 'everyone']) : rand(['woman', 'everyone']),
    location: { city: ville.city, region: ville.region, lat: ville.lat, lng: ville.lng },
    about: bio,
    education: educationDb,
    lifestyle: metier,
    relation_type: rand(['serious', 'serious', 'serious', 'casual', 'open']),
    kids: (() => {
      const w = questionnaire.wantsChildren;
      if (w === 'yes') return 'want';
      if (w === 'no') return 'dont_want';
      if (w === 'already_have') return 'have';
      return 'open';
    })(),
    smoke: questionnaire.smokingStatus === 'non-smoker' ? 'never' : (questionnaire.smokingStatus === 'occasional' ? 'sometimes' : 'regularly'),
    drink: questionnaire.drinkingHabits === 'never' ? 'never' : (questionnaire.drinkingHabits === 'regular' ? 'regularly' : 'socially'),
    values,
    photos: [pickPhoto(isFemale ? 'women' : 'men', index)],
    questionnaire_data: questionnaire,
    is_bot: true,
    is_active: true,
    is_verified: true,
    bot_personality: {
      firstName: prenom,
      lastName: nom,
      sector: secteur,
      city: ville.city,
      values,
      hobbies,
      responseDelay: { min: randInt(5, 30), max: randInt(60, 240) },
      activeHours: { start: randInt(7, 10), end: randInt(21, 23) },
      responseRate: randInt(65, 95),
      chatStyle: rand(['warm', 'playful', 'intellectual', 'direct', 'romantic']),
    },
    last_seen: new Date(Date.now() - randInt(0, 3600000)).toISOString(),
    created_at: new Date(Date.now() - randInt(0, 30 * 24 * 3600000)).toISOString(),
  };

  return profile;
}

async function insertProfile(profile) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(profile);
    const req = https.request({
      hostname: new URL(SUPABASE_URL).hostname,
      path: '/rest/v1/users',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'content-length': Buffer.byteLength(body),
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const TOTAL = 1000;
  const BATCH = 10; // profils générés en parallèle
  let created = 0;
  let errors = 0;

  // Distribution genre : 55% femmes, 45% hommes
  const genders = [];
  for (let i = 0; i < TOTAL; i++) {
    genders.push(i < TOTAL * 0.55 ? 'women' : 'men');
  }
  // Mélanger
  genders.sort(() => Math.random() - 0.5);

  console.log(`🚀 Génération de ${TOTAL} profils belges réalistes...`);
  console.log(`   55% femmes · 45% hommes · Villes Wallonie + Bruxelles\n`);

  const profiles = [];

  for (let i = 0; i < TOTAL; i += BATCH) {
    const batch = genders.slice(i, i + BATCH);
    const batchProfiles = await Promise.all(
      batch.map((gender, j) => generateProfile(i + j, gender))
    );

    // Insert en DB
    for (const profile of batchProfiles) {
      const result = await insertProfile(profile);
      if (result.status === 201) {
        created++;
      } else {
        errors++;
        if (errors <= 3) console.error(`  ⚠️  Insert error: ${result.data.slice(0, 100)}`);
      }
    }

    profiles.push(...batchProfiles);

    const pct = Math.round(((i + BATCH) / TOTAL) * 100);
    process.stdout.write(`\r  ✅ ${Math.min(i + BATCH, TOTAL)}/${TOTAL} profils (${pct}%) — ${created} créés, ${errors} erreurs`);

    // Pause pour éviter le rate limit Claude
    if (i + BATCH < TOTAL) await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\n\n🎉 TERMINÉ !`);
  console.log(`   ✅ ${created} profils créés en DB`);
  console.log(`   ❌ ${errors} erreurs`);

  // Sauvegarde locale
  fs.writeFileSync('/tmp/bot-profiles.json', JSON.stringify(profiles.slice(0, 5), null, 2));
  console.log(`\n📋 Exemple de profil généré:`);
  const ex = profiles[0];
  console.log(`   ${ex.name}, ${ex.age} ans · ${ex.location.city}`);
  console.log(`   ${ex.lifestyle} · ${ex.education}`);
  console.log(`   Bio: "${ex.about?.slice(0, 80)}..."`);
}

main().catch(console.error);
