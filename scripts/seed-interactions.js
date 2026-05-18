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

// 4 photos par bot = même ID Unsplash, crops différents → photos cohérentes de la même personne
const FEMALE_UNSPLASH_IDS = [
  '1494790108377-be9c29b29330', '1529626455594-4ff0802cfb7e', '1531746020798-e6953c6e8e04',
  '1544005313-94ddf0286df2', '1558203728-00f45afa2c82', '1534528741775-53994a69daeb',
  '1573496359142-b8d87734a5a2', '1580489944761-15a19d674349', '1520813792240-56fc4a3765a7',
  '1509967419530-da38b4704bc6', '1508214751196-bcfd4ca60f91', '1499155286265-d5a3c37c594e',
  '1488426862026-3ee34a7d66df', '1487412720507-e7ab37603c6f', '1438761681033-6461ffad8d80',
  '1505033575518-a36ea2ef75ae', '1468228711308-5d89bd4c5e30', '1489424731084-a5d8b950d169',
  '1582152629442-206f6f5b0718', '1581824043583-6904b080a19c',
  '1570295999919-56ceb5ecca61', '1551836022-d5d88e9218df', '1546961342-ea5f73db4f42',
  '1552058711-9ab6a56b4543', '1554151228-14d9def656e4', '1550525811-e5539e7a0935',
  '1607746882042-944635dfe10e', '1599842057874-6b8e2c9f9ad2', '1614644147798-f8c0fc9da7f6',
  '1609010697446-11f2b9b5f5d8', '1567532939604-b6b5b0db2604', '1586297135537-9b5cfd5e6714',
  '1598550874175-4d0ef436c909', '1601412436518-3c5fba9b32b9', '1534180477871-5d6cc81f3920',
  '1542206395-9eb3ec557bd6', '1546961342-ea5f73db4f42', '1524502397800-2eeaad7c3fe5',
  '1504703395235-85f4937b2520', '1613410853065-2e9ab461703c',
  '1517841905240-472988babdf9', '1494790108377-be9c29b29330', '1529626455594-4ff0802cfb7e',
  '1531746020798-e6953c6e8e04', '1544005313-94ddf0286df2', '1558203728-00f45afa2c82',
  '1534528741775-53994a69daeb', '1573496359142-b8d87734a5a2', '1580489944761-15a19d674349',
  '1520813792240-56fc4a3765a7',
];

const MALE_UNSPLASH_IDS = [
  '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1472099645785-5658abf4ff4e',
  '1463453091185-61582044d556', '1480455624526-28d9f5f6e57f', '1519085360753-af0119f7cbe7',
  '1531427186611-ed533b990b4b', '1506794778202-cad84cf45f1d', '1492562080023-ab3db95bfbce',
  '1522556189639-2f4af8b0958f', '1500648767791-00dcc994a43e', '1507003211169-0a1dd7228f2d',
  '1472099645785-5658abf4ff4e', '1463453091185-61582044d556', '1480455624526-28d9f5f6e57f',
  '1519085360753-af0119f7cbe7', '1531427186611-ed533b990b4b', '1506794778202-cad84cf45f1d',
  '1492562080023-ab3db95bfbce', '1522556189639-2f4af8b0958f',
  '1560250097-0b93528c311a', '1566492031773-4f4e44671857', '1607990281366-20a57c8b4861',
  '1611498602461-4f63c8386f4f', '1615920186527-09882b8e5e33', '1618077360395-b09c4bcf8ac6',
  '1624395149393-ef9bed5e7c4e', '1628157588553-5ecdced3032f', '1629425703699-afae30249604',
  '1633332755192-727a05c4013d',
];

function getPersonaPhotos(gender, index) {
  const ids = gender === 'female' ? FEMALE_UNSPLASH_IDS : MALE_UNSPLASH_IDS;
  const id = ids[index % ids.length];
  const base = `https://images.unsplash.com/photo-${id}`;
  return [
    `${base}?w=600&h=800&fit=crop&crop=faces&auto=format&q=80`,
    `${base}?w=600&h=750&fit=crop&crop=top&auto=format&q=80`,
    `${base}?w=500&h=700&fit=crop&crop=face&auto=format&q=80`,
    `${base}?w=600&h=900&fit=crop&auto=format&q=80`,
  ];
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
    const photos = getPersonaPhotos(gender, i);

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
