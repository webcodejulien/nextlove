/**
 * NextLove — AdMob Rewarded Video Service
 *
 * - En production (EAS build) : vraie pub rewarded AdMob
 * - En Expo Go / dev : simulation (délai de 2s puis reward accordé)
 *
 * IDs de test Google utilisés par défaut.
 * Remplacer par vos vrais IDs une fois le compte AdMob créé.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────

// IDs de test Google (fonctionnent toujours en dev)
const TEST_REWARDED_AD_IOS     = 'ca-app-pub-3940256099942544/1712485313';
const TEST_REWARDED_AD_ANDROID = 'ca-app-pub-3940256099942544/5224354917';

// ✅ IDs de PRODUCTION — à renseigner dans .env après création du compte AdMob
// 1. Créer un compte sur https://admob.google.com
// 2. Créer une app iOS + Android
// 3. Créer une unité publicitaire "Rewarded" pour chaque
// 4. Renseigner les IDs dans .env :
//    EXPO_PUBLIC_ADMOB_REWARDED_IOS=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
//    EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
const PROD_REWARDED_AD_IOS     = process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS     ?? '';
const PROD_REWARDED_AD_ANDROID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ?? '';

const isProduction = PROD_REWARDED_AD_IOS !== '' && PROD_REWARDED_AD_ANDROID !== '';

export const REWARDED_AD_UNIT_ID = Platform.OS === 'ios'
  ? (isProduction ? PROD_REWARDED_AD_IOS     : TEST_REWARDED_AD_IOS)
  : (isProduction ? PROD_REWARDED_AD_ANDROID : TEST_REWARDED_AD_ANDROID);

// ─── Likes quotidiens ─────────────────────────────────────────────────────────

const DAILY_LIKES_KEY   = '@nextlove:daily_likes';
const LIKES_DATE_KEY    = '@nextlove:likes_date';
export const FREE_LIKES_PER_DAY = 10;
export const LIKES_PER_VIDEO    = 5; // Likes obtenus par vidéo regardée

function todayStr() {
  return new Date().toISOString().split('T')[0]; // "2026-05-15"
}

/**
 * Retourne le nombre de likes restants aujourd'hui.
 */
export async function getRemainingLikes(): Promise<number> {
  const today = todayStr();
  const savedDate = await AsyncStorage.getItem(LIKES_DATE_KEY);

  if (savedDate !== today) {
    // Nouveau jour → reset
    await AsyncStorage.setItem(LIKES_DATE_KEY, today);
    await AsyncStorage.setItem(DAILY_LIKES_KEY, String(FREE_LIKES_PER_DAY));
    return FREE_LIKES_PER_DAY;
  }

  const saved = await AsyncStorage.getItem(DAILY_LIKES_KEY);
  return saved !== null ? Math.max(0, parseInt(saved)) : FREE_LIKES_PER_DAY;
}

/**
 * Consomme un like. Retourne false si quota épuisé.
 */
export async function consumeLike(): Promise<boolean> {
  const remaining = await getRemainingLikes();
  if (remaining <= 0) return false;
  await AsyncStorage.setItem(DAILY_LIKES_KEY, String(remaining - 1));
  return true;
}

/**
 * Ajoute des likes après avoir regardé une vidéo.
 */
export async function addBonusLikes(count = LIKES_PER_VIDEO): Promise<number> {
  const remaining = await getRemainingLikes();
  const newTotal = remaining + count;
  await AsyncStorage.setItem(DAILY_LIKES_KEY, String(newTotal));
  return newTotal;
}

// ─── Rewarded Ad ──────────────────────────────────────────────────────────────

/**
 * Affiche une pub rewarded.
 * - En prod (EAS) : vraie pub AdMob
 * - En Expo Go    : simulation avec délai
 *
 * Retourne true si la récompense a été accordée.
 */
export async function showRewardedAd(): Promise<boolean> {
  try {
    // Essaie d'importer AdMob (disponible seulement en build natif)
    const { RewardedAd, RewardedAdEventType, AdEventType } = await import(
      'react-native-google-mobile-ads'
    );

    return new Promise((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      let rewardEarned = false;
      const unsubs: (() => void)[] = [];

      // Timeout de sécurité : 15s max, sinon on résout à false
      const timeout = setTimeout(() => {
        unsubs.forEach(fn => fn());
        resolve(false);
      }, 15000);

      const cleanup = (result: boolean) => {
        clearTimeout(timeout);
        unsubs.forEach(fn => fn());
        resolve(result);
      };

      // Récompense obtenue
      unsubs.push(rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => { rewardEarned = true; }
      ));

      // Pub fermée → on résout avec le résultat
      unsubs.push(rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => cleanup(rewardEarned)
      ));

      // Erreur → on résout à false proprement
      unsubs.push(rewarded.addAdEventListener(
        AdEventType.ERROR,
        () => cleanup(false)
      ));

      // Pub chargée → on l'affiche
      unsubs.push(rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => { rewarded.show(); }
      ));

      rewarded.load();
    });
  } catch {
    // Expo Go ou AdMob non disponible → simulation
    return simulateRewardedAd();
  }
}

/**
 * Simulation pour Expo Go (délai de 2s puis reward accordé).
 */
async function simulateRewardedAd(): Promise<boolean> {
  await new Promise(r => setTimeout(r, 2000));
  return true;
}
