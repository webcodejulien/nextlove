/**
 * seed-interactions.js
 *
 * 1. Corrige is_bot = true pour les profils seedés sans email
 * 2. Ajoute 3 photos par profil bot (même genre)
 * 3. Crée des likes fictifs (bots → vrai utilisateur)
 * 4. Crée des visites fictives (bots → vrai utilisateur)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esccnfqkavtvngowizgc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY2NuZnFrYXZ0dm5nb3dpemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMzQ0MCwiZXhwIjoyMDk0Mjc5NDQwfQ.jVKgL9Wc9f8luzZffnKRhwQgh3AWbn0iRUmzR0Ebwbg';

// Ton vrai user ID
const REAL_USER_ID = '3ab27f56-5f05-456b-b968-cc411cc95dc5';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Groupes de 4 photos par "persona" (même genre, indices proches = ressemblance visuelle)
// Chaque groupe simule les 4 photos d'une même personne
const FEMALE_PHOTO_GROUPS = [
  [2, 3, 4, 5], [10, 11, 12, 13], [20, 21, 22, 23], [30, 31, 32, 33],
  [40, 41, 42, 43], [50, 51, 52, 53], [60, 61, 62, 63], [70, 71, 72, 73],
  [0, 1, 6, 7],   [14, 15, 16, 17], [24, 25, 26, 27], [34, 35, 36, 37],
  [44, 45, 46, 47],[54, 55, 56, 57], [64, 65, 66, 67], [74, 75, 76, 77],
  [8, 9, 18, 19],  [28, 29, 38, 39], [48, 49, 58, 59], [68, 69, 78, 79],
];

const MALE_PHOTO_GROUPS = [
  [2, 3, 4, 5], [10, 11, 12, 13], [20, 21, 22, 23], [30, 31, 32, 33],
  [40, 41, 42, 43], [50, 51, 52, 53], [60, 61, 62, 63], [70, 71, 72, 73],
  [0, 1, 6, 7],   [14, 15, 16, 17], [24, 25, 26, 27], [34, 35, 36, 37],
  [44, 45, 46, 47],[54, 55, 56, 57], [64, 65, 66, 67], [74, 75, 76, 77],
  [8, 9, 18, 19],  [28, 29, 38, 39], [48, 49, 58, 59], [68, 69, 78, 79],
];

function randomPhotoUrls(gender, groupIndex) {
  const groups = gender === 'female' ? FEMALE_PHOTO_GROUPS : MALE_PHOTO_GROUPS;
  const type = gender === 'female' ? 'women' : 'men';
  const group = groups[groupIndex % groups.length];
  return group.map(i => `https://randomuser.me/api/portraits/${type}/${i}.jpg`);
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 23), Math.floor(Math.random() * 59));
  return d.toISOString();
}

async function main() {
  console.log('🚀 Démarrage du seeding...\n');

  // ── 1. Corriger is_bot pour les profils seedés sans email ─────────────────
  console.log('1️⃣  Correction is_bot pour les profils sans email...');
  const { data: toFix, error: e1 } = await supabase
    .from('users')
    .select('id, name, gender, photos')
    .eq('is_active', true)
    .eq('is_bot', false)
    .is('email', null);

  if (e1) { console.error('Erreur:', e1); process.exit(1); }
  console.log(`   → ${toFix.length} profils à corriger`);

  for (const u of toFix) {
    await supabase.from('users').update({ is_bot: true }).eq('id', u.id);
  }
  console.log('   ✅ is_bot corrigé\n');

  // ── 2. Ajouter 3-4 photos par profil bot ──────────────────────────────────
  console.log('2️⃣  Ajout de photos multiples aux bots...');
  const { data: allBots, error: e2 } = await supabase
    .from('users')
    .select('id, name, gender, photos')
    .eq('is_active', true)
    .eq('is_bot', true);

  if (e2) { console.error('Erreur:', e2); process.exit(1); }

  let photoCount = 0;
  for (let i = 0; i < allBots.length; i++) {
    const bot = allBots[i];
    const gender = bot.gender === 'male' ? 'male' : 'female';
    const photos = randomPhotoUrls(gender, i);

    await supabase.from('users').update({ photos }).eq('id', bot.id);
    photoCount++;
    if (photoCount % 100 === 0) console.log(`   → ${photoCount}/${allBots.length} mis à jour...`);
  }
  console.log(`   ✅ ${photoCount} profils avec 4 photos\n`);

  // ── 3. Likes fictifs (bots → toi) ─────────────────────────────────────────
  console.log('3️⃣  Création de likes fictifs...');

  // Supprimer les anciens likes fictifs pour éviter les doublons
  await supabase.from('likes').delete().eq('liked_user_id', REAL_USER_ID);

  // Prendre 80 bots aléatoires qui vont te liker
  const likerBots = allBots.sort(() => Math.random() - 0.5).slice(0, 80);

  const likesData = likerBots.map(bot => ({
    user_id: bot.id,
    liked_user_id: REAL_USER_ID,
    is_super_like: Math.random() < 0.1, // 10% de super likes
    created_at: randomDate(30),
  }));

  const { error: e3 } = await supabase.from('likes').insert(likesData);
  if (e3) console.error('Erreur likes:', e3);
  else console.log(`   ✅ ${likesData.length} likes créés\n`);

  // ── 4. Visites fictives (bots → toi) ──────────────────────────────────────
  console.log('4️⃣  Création de visites fictives...');

  // Supprimer les anciennes visites fictives
  await supabase.from('profile_views').delete().eq('viewed_id', REAL_USER_ID);

  // 150 bots t'ont visité (certains plusieurs fois)
  const viewerBots = allBots.sort(() => Math.random() - 0.5).slice(0, 150);
  const viewsData = [];

  for (const bot of viewerBots) {
    const nbViews = Math.floor(Math.random() * 3) + 1; // 1 à 3 visites
    for (let v = 0; v < nbViews; v++) {
      viewsData.push({
        viewer_id: bot.id,
        viewed_id: REAL_USER_ID,
        viewed_at: randomDate(14),
      });
    }
  }

  // Insérer par batch de 200 (ignore les doublons)
  for (let i = 0; i < viewsData.length; i += 200) {
    const batch = viewsData.slice(i, i + 200);
    const { error: e4 } = await supabase
      .from('profile_views')
      .upsert(batch, { onConflict: 'viewer_id,viewed_id', ignoreDuplicates: true });
    if (e4) console.error('Erreur views batch:', e4);
  }
  console.log(`   ✅ ${viewsData.length} visites créées\n`);

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('✅ SEEDING TERMINÉ');
  console.log(`   • ${toFix.length} profils corrigés (is_bot = true)`);
  console.log(`   • ${photoCount} bots avec 4 photos`);
  console.log(`   • ${likesData.length} likes fictifs sur ton profil`);
  console.log(`   • ${viewsData.length} visites fictives sur ton profil`);
  console.log('═══════════════════════════════════════');
}

main().catch(console.error);
