/**
 * Supabase Edge Function — stripe-webhook
 *
 * Reçoit les événements Stripe et met à jour Supabase en conséquence.
 * À configurer dans le dashboard Stripe → Developers → Webhooks :
 *   URL : https://<project>.supabase.co/functions/v1/stripe-webhook
 *   Événements : payment_intent.succeeded, payment_intent.payment_failed
 *
 * supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function activatePremium(supabaseUserId: string): Promise<void> {
  // 1. Update users table
  await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${supabaseUserId}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ is_premium: true }),
  });

  // 2. Insert subscription record
  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: supabaseUserId,
      plan: 'premium_monthly',
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
}

async function deactivatePremium(supabaseUserId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${supabaseUserId}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ is_premium: false }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const sig = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = pi.metadata?.supabase_user_id;
        if (userId) {
          await activatePremium(userId);
          console.log(`✅ Premium activated for user ${userId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = pi.metadata?.supabase_user_id;
        console.warn(`❌ Payment failed for user ${userId}: ${pi.last_payment_error?.message}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await deactivatePremium(userId);
          console.log(`🔴 Premium deactivated for user ${userId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Handler error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
