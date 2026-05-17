import { supabase } from './supabase';

const EDGE_URL =
  process.env.EXPO_PUBLIC_STRIPE_EDGE_URL ??
  'https://esccnfqkavtvngowizgc.supabase.co/functions/v1/create-payment-intent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentIntentResponse {
  clientSecret: string;
  customerId: string;
  amount: number;    // en centimes
  currency: string;
}

export type PaymentErrorCode =
  | 'CARD_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'EXPIRED_CARD'
  | 'INCORRECT_CVC'
  | 'PROCESSING_ERROR'
  | 'REQUIRES_ACTION'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'UNKNOWN';

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  raw?: string;
}

// ─── Create PaymentIntent via Edge Function ───────────────────────────────────

/**
 * Calls the Supabase Edge Function to create a PaymentIntent.
 * Returns the clientSecret needed to confirm payment with Stripe SDK.
 */
export async function createPaymentIntent(amount?: number): Promise<PaymentIntentResponse> {
  // Get current session JWT
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

  if (sessionErr || !session) {
    throw {
      code: 'AUTH_ERROR',
      message: 'Vous devez être connecté pour souscrire.',
    } satisfies PaymentError;
  }

  let res: Response;
  try {
    res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
    });
  } catch {
    throw {
      code: 'NETWORK_ERROR',
      message: 'Impossible de contacter le serveur de paiement. Vérifiez votre connexion.',
    } satisfies PaymentError;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      code: 'PROCESSING_ERROR',
      message: body.error ?? `Erreur serveur (${res.status})`,
    } satisfies PaymentError;
  }

  return res.json() as Promise<PaymentIntentResponse>;
}

// ─── Activate Premium in Supabase (client-side fallback) ─────────────────────
// Webhook est la source de vérité, mais on met aussi à jour côté client
// pour une réactivité immédiate en mode test.

export async function activatePremiumLocally(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_premium: true })
    .eq('id', userId);

  if (error) console.warn('Could not update is_premium locally:', error.message);

  // Insert subscription record
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: 'premium_monthly',
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

// ─── Map Stripe error codes → user-friendly messages ─────────────────────────

export function mapStripeError(code: string | undefined, message: string): PaymentError {
  switch (code) {
    case 'card_declined':
      return { code: 'CARD_DECLINED', message: 'Carte refusée. Vérifiez vos informations ou utilisez une autre carte.', raw: message };
    case 'insufficient_funds':
      return { code: 'INSUFFICIENT_FUNDS', message: 'Fonds insuffisants sur cette carte.', raw: message };
    case 'expired_card':
      return { code: 'EXPIRED_CARD', message: 'Votre carte a expiré. Utilisez une autre carte.', raw: message };
    case 'incorrect_cvc':
      return { code: 'INCORRECT_CVC', message: 'Code CVC incorrect.', raw: message };
    case 'requires_action':
      return { code: 'REQUIRES_ACTION', message: 'Authentification 3D Secure requise.', raw: message };
    case 'processing_error':
      return { code: 'PROCESSING_ERROR', message: 'Erreur de traitement. Réessayez dans quelques instants.', raw: message };
    default:
      return { code: 'UNKNOWN', message: message || 'Une erreur inattendue est survenue.', raw: message };
  }
}

// ─── Test card constants (mode test uniquement) ───────────────────────────────

export const TEST_CARDS = [
  {
    number: '4242 4242 4242 4242',
    label: 'Paiement réussi',
    color: '#00E676',
    icon: 'checkmark-circle',
  },
  {
    number: '4000 0025 0000 3155',
    label: '3D Secure requis',
    color: '#FFD740',
    icon: 'shield-checkmark',
  },
  {
    number: '4000 0000 0000 9995',
    label: 'Carte refusée',
    color: '#FF5252',
    icon: 'close-circle',
  },
] as const;
