/**
 * Supabase Edge Function — send-push-notification
 *
 * Envoie des notifications push via l'API Expo Push Service.
 * Appelée côté serveur (webhook Stripe, triggers Supabase, etc.).
 *
 * Déploiement :
 *   supabase functions deploy send-push-notification
 *
 * Usage : POST avec body JSON :
 * {
 *   "userId": "uuid",
 *   "type": "new_match" | "new_message" | "new_like",
 *   "params": { "name": "Sophie", "matchId": "...", "messagePreview": "..." }
 * }
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'new_match' | 'new_message' | 'new_like';

interface SendRequest {
  userId: string;
  type: NotificationType;
  params?: {
    name?: string;
    matchId?: string;
    messagePreview?: string;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

// ─── Build notification content ───────────────────────────────────────────────

function buildContent(
  type: NotificationType,
  params: SendRequest['params'] = {}
): Pick<ExpoPushMessage, 'title' | 'body' | 'data' | 'channelId'> {
  const { name = 'Quelqu\'un', matchId, messagePreview } = params;

  switch (type) {
    case 'new_match':
      return {
        title: '❤️ Nouveau match !',
        body: `Vous et ${name} avez matché. Dites-lui bonjour !`,
        data: { type, matchId },
        channelId: 'nextlove-matches',
      };
    case 'new_message': {
      const preview = messagePreview
        ? messagePreview.length > 60
          ? messagePreview.slice(0, 57) + '…'
          : messagePreview
        : 'Vous avez reçu un message.';
      return {
        title: `💬 ${name}`,
        body: preview,
        data: { type, matchId, senderName: name },
        channelId: 'nextlove-messages',
      };
    }
    case 'new_like':
      return {
        title: '👀 Vous avez un admirateur !',
        body: 'Quelqu\'un a aimé votre profil. Activez Premium pour le voir.',
        data: { type },
        channelId: 'nextlove-matches',
      };
  }
}

// ─── Get push token from Supabase ─────────────────────────────────────────────

async function getPushToken(userId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=expo_push_token`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows: { expo_push_token?: string }[] = await res.json();
  return rows[0]?.expo_push_token ?? null;
}

// ─── Send via Expo Push API ───────────────────────────────────────────────────

async function sendExpoPush(message: ExpoPushMessage): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const json = await res.json();

  if (json.data?.status === 'error') {
    return { ok: false, error: json.data.message };
  }

  return { ok: true };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const body: SendRequest = await req.json();
    const { userId, type, params } = body;

    if (!userId || !type) {
      return new Response(JSON.stringify({ error: 'userId and type required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Get push token
    const pushToken = await getPushToken(userId);
    if (!pushToken) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no push token' }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Validate Expo push token format
    const isValidToken =
      pushToken.startsWith('ExponentPushToken[') ||
      pushToken.startsWith('ExpoPushToken[');
    if (!isValidToken) {
      return new Response(JSON.stringify({ skipped: true, reason: 'invalid token format' }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const content = buildContent(type, params);
    const result = await sendExpoPush({
      to: pushToken,
      ...content,
      badge: 1,
      sound: 'default',
      priority: type === 'new_message' ? 'high' : 'default',
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-push-notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
