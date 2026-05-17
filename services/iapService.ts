/**
 * NextLove — IAP Service
 *
 * Gestion de l'activation premium après achat Apple IAP ou Google Play.
 * Plus de Stripe — paiements gérés exclusivement par les stores natifs.
 */

import { supabase } from './supabase';

/**
 * Active le premium localement dans Supabase après validation IAP.
 * Le webhook Apple/Google est la source de vérité en production,
 * mais cette fonction offre une réactivité immédiate côté client.
 */
export async function activatePremiumLocally(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_premium: true })
    .eq('id', userId);

  if (error) console.warn('Could not update is_premium locally:', error.message);
}

/**
 * Désactive le premium (appelé lors de l'expiration ou annulation).
 */
export async function deactivatePremiumLocally(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_premium: false })
    .eq('id', userId);

  if (error) console.warn('Could not update is_premium locally:', error.message);
}
