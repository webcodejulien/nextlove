/**
 * NextLove — Bot Engagement Engine
 * 
 * Ce que font les bots :
 * 1. Likent les vrais users selon compatibilité
 * 2. Visitent les profils (notifications "X a vu ton profil")
 * 3. Si match → envoient UN seul message d'accroche puis restent discrets
 * 
 * Ce que les bots NE font PAS :
 * - Pas de longues conversations
 * - Pas de push vers premium
 * - Pas de réponses continues
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Messages d'accroche pour un seul premier message (après match)
const ICEBREAKER_MESSAGES = [
  "Salut ! J'ai vu ton score de compatibilité... on a vraiment des points communs ! 😊",
  "Hello ! Sympa de matcher avec toi. T'habites où exactement en Belgique ?",
  "Coucou ! J'ai vu que tu aimes aussi {hobby}. C'est cool ça !",
  "Salut ! Ton profil m'a vraiment tapé dans l'œil 😊",
  "Hello, {prenom} ! Je voulais juste dire bonjour avant que la timidité revienne 😄",
  "Coucou ! On a {score}% de compatibilité, c'est pas rien ça !",
  "Salut ! J'espère que ta journée se passe bien à {city} 😊",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Calcule un score de compatibilité simplifié
function compatScore(botQ: Record<string, unknown>, userQ: Record<string, unknown>): number {
  let score = 0;
  let factors = 0;

  const checks = [
    ['familyImportance', 15],
    ['ambitionLevel', 10],
    ['honestyLevel', 10],
    ['humorLevel', 8],
  ] as [string, number][];

  for (const [key, weight] of checks) {
    const bVal = Number(botQ[key] ?? 70);
    const uVal = Number(userQ[key] ?? 70);
    const diff = Math.abs(bVal - uVal);
    score += (1 - diff / 100) * weight;
    factors += weight;
  }

  return Math.round(60 + (score / factors) * 35);
}

// ÉTAPE 1 : Les bots visitent les profils des vrais users actifs
async function botVisitProfiles(realUserIds: string[]) {
  if (realUserIds.length === 0) return;

  // Récupère des bots actifs aléatoires
  const { data: bots } = await supabase
    .from('users')
    .select('id, gender, looking_for, location')
    .eq('is_bot', true)
    .eq('is_active', true)
    .limit(50)
    .order('bot_last_active', { ascending: true });

  if (!bots?.length) return;

  const visits: { viewer_id: string; viewed_id: string; created_at: string }[] = [];

  for (const userId of realUserIds.slice(0, 10)) {
    // 2 à 5 bots visitent chaque user
    const numVisitors = Math.floor(Math.random() * 4) + 2;
    const visitors = bots
      .sort(() => Math.random() - 0.5)
      .slice(0, numVisitors);

    for (const bot of visitors) {
      visits.push({
        viewer_id: bot.id,
        viewed_id: userId,
        created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
  }

  if (visits.length > 0) {
    await supabase
      .from('profile_views')
      .upsert(visits, { onConflict: 'viewer_id,viewed_id', ignoreDuplicates: true });
  }

  console.log(`👁️  ${visits.length} visites de profils enregistrées`);
}

// ÉTAPE 2 : Les bots likent les vrais users
async function botLikeUsers(realUsers: { id: string; gender: string; questionnaire_data: Record<string, unknown> }[]) {
  if (realUsers.length === 0) return;

  let likesSent = 0;
  let matchesCreated = 0;

  for (const user of realUsers) {
    // Récupère des bots compatibles avec ce user
    const botGender = user.gender === 'man' ? 'woman' : 'man';
    const { data: compatBots } = await supabase
      .from('users')
      .select('id, gender, questionnaire_data, bot_personality, name, location')
      .eq('is_bot', true)
      .eq('is_active', true)
      .eq('gender', botGender)
      .limit(20);

    if (!compatBots?.length) continue;

    // Filtre les bots qui n'ont pas déjà liké ce user
    const { data: existingLikes } = await supabase
      .from('likes')
      .select('liker_id')
      .eq('liked_id', user.id)
      .in('liker_id', compatBots.map(b => b.id));

    const alreadyLiked = new Set((existingLikes ?? []).map(l => l.liker_id));
    const eligibleBots = compatBots.filter(b => !alreadyLiked.has(b.id));

    if (eligibleBots.length === 0) continue;

    // 3 à 8 bots likent ce user (selon les nouveaux inscrits)
    const numLikes = Math.floor(Math.random() * 6) + 3;
    const botsToLike = eligibleBots
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(numLikes, eligibleBots.length));

    for (const bot of botsToLike) {
      // Insérer le like
      const { error } = await supabase
        .from('likes')
        .upsert({ liker_id: bot.id, liked_id: user.id }, { ignoreDuplicates: true });

      if (!error) {
        likesSent++;

        // Vérifier si le vrai user a aussi liké ce bot (match mutuel)
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('liker_id', user.id)
          .eq('liked_id', bot.id)
          .maybeSingle();

        if (userLike) {
          // Créer le match !
          const score = compatScore(
            (bot.questionnaire_data as Record<string, unknown>) ?? {},
            user.questionnaire_data ?? {}
          );

          const { data: match, error: matchErr } = await supabase
            .from('matches')
            .upsert({
              user1_id: bot.id,
              user2_id: user.id,
              compatibility_score: score,
            }, { ignoreDuplicates: true })
            .select()
            .maybeSingle();

          if (match && !matchErr) {
            matchesCreated++;

            // Le bot envoie UN seul message d'accroche (avec délai réaliste)
            await sendBotIcebreaker(match.id, bot, user);
          }
        }
      }
    }
  }

  console.log(`💜 ${likesSent} likes envoyés par des bots, ${matchesCreated} matchs créés`);
}

// ÉTAPE 3 : Message d'accroche unique après match
async function sendBotIcebreaker(
  matchId: string,
  bot: { id: string; name: string; bot_personality: Record<string, unknown>; location: Record<string, unknown> },
  user: { id: string }
) {
  const personality = (bot.bot_personality as Record<string, unknown>) ?? {};
  const hobbies = (personality.hobbies as string[]) ?? [];
  const city = (bot.location as Record<string, unknown>)?.city ?? 'Bruxelles';

  let msg = rand(ICEBREAKER_MESSAGES);
  msg = msg
    .replace('{hobby}', hobbies[0] ?? 'la randonnée')
    .replace('{prenom}', bot.name)
    .replace('{city}', city as string)
    .replace('{score}', String(Math.floor(Math.random() * 15) + 80));

  // Délai réaliste : 10 min à 2h après le match
  const delayMs = (Math.floor(Math.random() * 110) + 10) * 60 * 1000;
  const scheduledAt = new Date(Date.now() + delayMs).toISOString();

  await supabase.from('bot_message_queue').insert({
    match_id: matchId,
    bot_user_id: bot.id,
    real_user_id: user.id,
    trigger_message: msg,
    scheduled_at: scheduledAt,
    sent: false,
  });
}

// ÉTAPE 4 : Envoyer les messages en attente dans la queue
async function processBotMessageQueue() {
  const { data: pending } = await supabase
    .from('bot_message_queue')
    .select('*')
    .eq('sent', false)
    .lte('scheduled_at', new Date().toISOString())
    .limit(20);

  if (!pending?.length) return;

  let sent = 0;
  for (const item of pending) {
    const { error } = await supabase.from('messages').insert({
      match_id: item.match_id,
      sender_id: item.bot_user_id,
      content: item.trigger_message,
      is_read: false,
    });

    if (!error) {
      await supabase
        .from('bot_message_queue')
        .update({ sent: true })
        .eq('id', item.id);
      sent++;
    }
  }

  console.log(`💬 ${sent} messages bot envoyés`);
}

// ── HANDLER PRINCIPAL ──────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'full';
    const newUserId = body.userId;

    if (action === 'new_user' && newUserId) {
      // Nouveau user inscrit : engagement immédiat ciblé
      const { data: newUser } = await supabase
        .from('users')
        .select('id, gender, questionnaire_data')
        .eq('id', newUserId)
        .eq('is_bot', false)
        .maybeSingle();

      if (newUser) {
        await botVisitProfiles([newUser.id]);
        await botLikeUsers([newUser]);
      }

    } else {
      // Run complet (appelé par cron)
      const { data: realUsers } = await supabase
        .from('users')
        .select('id, gender, questionnaire_data')
        .eq('is_bot', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (realUsers?.length) {
        await botVisitProfiles(realUsers.map(u => u.id));
        await botLikeUsers(realUsers);
      }

      await processBotMessageQueue();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Bot engagement error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
