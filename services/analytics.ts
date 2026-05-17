/**
 * NextLove Analytics
 * Tracks key events in Supabase — swap token for Mixpanel/Amplitude post-launch
 */

import { supabase } from './supabase';

type EventName =
  | 'sign_up'
  | 'sign_in'
  | 'questionnaire_completed'
  | 'profile_updated'
  | 'swipe_like'
  | 'swipe_skip'
  | 'match'
  | 'message_sent'
  | 'chat_opened'
  | 'premium_viewed'
  | 'premium_purchased'
  | 'ad_watched'
  | 'profile_viewed'
  | 'search_filtered'
  | 'icebreaker_used'
  | 'app_opened';

interface EventProps {
  [key: string]: string | number | boolean | null | undefined;
}

let _userId: string | null = null;

export const Analytics = {
  identify(userId: string) {
    _userId = userId;
  },

  async track(event: EventName, props?: EventProps) {
    try {
      // Log en dev
      if (__DEV__) {
        console.log(`[Analytics] ${event}`, props ?? {});
      }

      // Sauvegarde dans Supabase (table analytics_events si elle existe)
      if (_userId) {
        await supabase.from('analytics_events').insert({
          user_id: _userId,
          event,
          properties: props ?? {},
          created_at: new Date().toISOString(),
        }).then(() => {}); // silencieux si la table n'existe pas
      }
    } catch {
      // Silencieux — analytics ne doit jamais crasher l'app
    }
  },

  // Raccourcis pour les événements fréquents
  swipeLike: (targetId: string) =>
    Analytics.track('swipe_like', { target_id: targetId }),

  swipeSkip: (targetId: string) =>
    Analytics.track('swipe_skip', { target_id: targetId }),

  match: (matchId: string, score?: number) =>
    Analytics.track('match', { match_id: matchId, compatibility_score: score }),

  messageSent: (matchId: string) =>
    Analytics.track('message_sent', { match_id: matchId }),

  icebreakerUsed: (matchId: string) =>
    Analytics.track('icebreaker_used', { match_id: matchId }),

  profileViewed: (targetId: string) =>
    Analytics.track('profile_viewed', { target_id: targetId }),

  questionnaireCompleted: (score: number) =>
    Analytics.track('questionnaire_completed', { score }),

  premiumViewed: () =>
    Analytics.track('premium_viewed'),

  adWatched: (likesEarned: number) =>
    Analytics.track('ad_watched', { likes_earned: likesEarned }),
};
