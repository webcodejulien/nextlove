/**
 * Supabase Edge Function — create-payment-intent
 *
 * Crée un PaymentIntent Stripe pour l'abonnement Premium NextLove (9,99 €/mois).
 * Doit être déployée avec :
 *   supabase functions deploy create-payment-intent
 *   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
 *
 * Elle est appelée uniquement depuis l'app mobile (JWT Supabase vérifié).
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserFromJwt(authHeader: string): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { id: data.id, email: data.email };
}

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Check if we already stored a Stripe customer ID in Supabase
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=stripe_customer_id`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (res.ok) {
    const rows: { stripe_customer_id?: string }[] = await res.json();
    const existing = rows[0]?.stripe_customer_id;
    if (existing) return existing;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Persist the Stripe customer ID (best-effort)
  await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ stripe_customer_id: customer.id }),
  });

  return customer.id;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    // ── Auth: verify Supabase JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const user = await getUserFromJwt(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Get or create Stripe customer ─────────────────────────────────────────
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // ── Create PaymentIntent (9,99 € = 999 centimes) ──────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 999,           // en centimes
      currency: 'eur',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        supabase_user_id: user.id,
        plan: 'premium_monthly',
        product: 'NextLove Premium',
      },
      description: 'NextLove Premium — 9,99 €/mois',
      receipt_email: user.email,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        customerId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Stripe error:', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Internal server error' }),
      {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }
});
