import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOST_END_KEY = 'nextlove_boost_end';
const BOOST_USED_KEY = 'nextlove_boost_used_date';
const STREAK_KEY = 'nextlove_streak_count';
const STREAK_LAST_KEY = 'nextlove_streak_last_date';

export const BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ─── Boost ────────────────────────────────────────────────────────────────────

export async function activateBoost(): Promise<{ success: boolean; alreadyUsed: boolean }> {
  const today = new Date().toISOString().split('T')[0];
  const usedDate = await AsyncStorage.getItem(BOOST_USED_KEY);

  if (usedDate === today) {
    return { success: false, alreadyUsed: true };
  }

  const endTime = Date.now() + BOOST_DURATION_MS;
  await AsyncStorage.setItem(BOOST_END_KEY, String(endTime));
  await AsyncStorage.setItem(BOOST_USED_KEY, today);
  return { success: true, alreadyUsed: false };
}

export async function getBoostStatus(): Promise<{ active: boolean; remainingMs: number }> {
  const endStr = await AsyncStorage.getItem(BOOST_END_KEY);
  if (!endStr) return { active: false, remainingMs: 0 };

  const endTime = parseInt(endStr);
  const remaining = endTime - Date.now();

  if (remaining <= 0) {
    await AsyncStorage.removeItem(BOOST_END_KEY);
    return { active: false, remainingMs: 0 };
  }

  return { active: true, remainingMs: remaining };
}

export async function isBoostUsedToday(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const usedDate = await AsyncStorage.getItem(BOOST_USED_KEY);
  return usedDate === today;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function checkAndUpdateStreak(): Promise<{ streak: number; isNew: boolean }> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const lastDate = await AsyncStorage.getItem(STREAK_LAST_KEY);
  const streakStr = await AsyncStorage.getItem(STREAK_KEY);
  const currentStreak = streakStr ? parseInt(streakStr) : 0;

  if (lastDate === today) {
    // Already checked in today
    return { streak: currentStreak, isNew: false };
  }

  let newStreak: number;
  if (lastDate === yesterday) {
    // Consecutive day — increment
    newStreak = currentStreak + 1;
  } else {
    // Streak broken or first time
    newStreak = 1;
  }

  await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
  await AsyncStorage.setItem(STREAK_LAST_KEY, today);
  return { streak: newStreak, isNew: true };
}

export async function getStreak(): Promise<number> {
  const streakStr = await AsyncStorage.getItem(STREAK_KEY);
  return streakStr ? parseInt(streakStr) : 0;
}

// ─── Profile completion ───────────────────────────────────────────────────────

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  points: number;
}

export function computeProfileCompletion(user: {
  name?: string;
  age?: number;
  photos?: string[];
  bio?: string;
  job?: string;
  location?: unknown;
  questionnaire_data?: Record<string, unknown>;
}): { percent: number; items: CompletionItem[] } {
  const q = user.questionnaire_data ?? {};

  const items: CompletionItem[] = [
    { key: 'photo', label: 'Photo de profil', done: (user.photos?.length ?? 0) > 0, points: 25 },
    { key: 'bio', label: 'Biographie', done: Boolean(user.bio && String(user.bio).length > 10), points: 15 },
    { key: 'job', label: 'Métier', done: Boolean(user.job), points: 10 },
    { key: 'location', label: 'Ville', done: Boolean(user.location), points: 10 },
    { key: 'questionnaire', label: 'Questionnaire complet', done: Object.keys(q).length >= 10, points: 30 },
    { key: 'loveLanguage', label: 'Langage amoureux', done: Boolean(q.loveLanguage), points: 5 },
    { key: 'interests', label: 'Centres d\'intérêt', done: Array.isArray(q.hobbies) && (q.hobbies as string[]).length > 0, points: 5 },
  ];

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const earnedPoints = items.filter(i => i.done).reduce((sum, i) => sum + i.points, 0);
  const percent = Math.round((earnedPoints / totalPoints) * 100);

  return { percent, items };
}
