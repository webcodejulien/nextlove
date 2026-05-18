/**
 * Génère un résumé humain des affinités entre deux profils
 * Basé sur les données du questionnaire — aucune IA impliquée
 */

import { QuestionnaireAnswers } from '../constants/questionnaire';

export interface CompatibilityPoint {
  emoji: string;
  title: string;
  description: string;
  strength: 'strong' | 'good' | 'note';
}

export interface CompatibilitySummary {
  points: CompatibilityPoint[];
  sharedValues: string[];
  headline: string;
}

const LOVE_LANG_LABELS: Record<string, string> = {
  words: 'les mots doux',
  acts: 'les actes de soin',
  gifts: 'les petits cadeaux',
  time: 'les moments de qualité',
  touch: 'le toucher',
};

const ATTACHMENT_LABELS: Record<string, string> = {
  secure: 'sécure',
  anxious: 'anxieux',
  avoidant: 'évitant',
};

const PERSONALITY_LABELS: Record<string, string> = {
  introvert: 'introverti(e)',
  ambivert: 'ambiverti(e)',
  extravert: 'extraverti(e)',
};

export function generateCompatibilitySummary(
  myQ: QuestionnaireAnswers | undefined,
  theirQ: QuestionnaireAnswers | undefined,
  theirName: string
): CompatibilitySummary {
  const points: CompatibilityPoint[] = [];
  const sharedValues: string[] = [];

  if (!myQ || !theirQ) {
    return {
      points: [{ emoji: '💫', title: 'Compatibilité', description: `Découvrez ce que vous avez en commun avec ${theirName} !`, strength: 'good' }],
      sharedValues: [],
      headline: `Lancez la conversation avec ${theirName} !`,
    };
  }

  // ── Langage de l'amour ────────────────────────────────────────────────
  if (myQ.loveLanguage && theirQ.loveLanguage) {
    if (myQ.loveLanguage === theirQ.loveLanguage) {
      points.push({
        emoji: '❤️',
        title: 'Même langage de l\'amour',
        description: `Vous exprimez tous les deux votre amour par ${LOVE_LANG_LABELS[myQ.loveLanguage] ?? myQ.loveLanguage}.`,
        strength: 'strong',
      });
      sharedValues.push('Langage amoureux');
    } else {
      points.push({
        emoji: '💑',
        title: 'Langages complémentaires',
        description: `Vous aimez ${LOVE_LANG_LABELS[myQ.loveLanguage] ?? myQ.loveLanguage}, ${theirName} préfère ${LOVE_LANG_LABELS[theirQ.loveLanguage] ?? theirQ.loveLanguage} — vous vous complétez.`,
        strength: 'good',
      });
    }
  }

  // ── Attachement ───────────────────────────────────────────────────────
  if (myQ.attachment && theirQ.attachment) {
    const both = myQ.attachment === 'secure' && theirQ.attachment === 'secure';
    if (both) {
      points.push({
        emoji: '🏠',
        title: 'Attachement sécure',
        description: 'Vous avez tous les deux un style d\'attachement sécure — excellent pour une relation stable.',
        strength: 'strong',
      });
      sharedValues.push('Attachement');
    } else if (myQ.attachment === 'secure' || theirQ.attachment === 'secure') {
      const secureOne = myQ.attachment === 'secure' ? 'Vous êtes' : `${theirName} est`;
      points.push({
        emoji: '🔒',
        title: 'Ancrage émotionnel',
        description: `${secureOne} sécure(e) — une base solide pour votre relation.`,
        strength: 'good',
      });
    }
  }

  // ── Famille & enfants ─────────────────────────────────────────────────
  if (myQ.wantsChildren && theirQ.wantsChildren) {
    const align = myQ.wantsChildren === theirQ.wantsChildren ||
      (myQ.wantsChildren === 'yes' && theirQ.wantsChildren === 'yes');
    if (align && myQ.wantsChildren === 'yes') {
      points.push({
        emoji: '👶',
        title: 'Même envie de famille',
        description: 'Vous souhaitez tous les deux des enfants — un projet de vie aligné.',
        strength: 'strong',
      });
      sharedValues.push('Famille');
    } else if (myQ.wantsChildren === 'no' && theirQ.wantsChildren === 'no') {
      points.push({
        emoji: '🌿',
        title: 'Mode de vie similaire',
        description: 'Ni l\'un ni l\'autre ne souhaitez d\'enfants — une vision cohérente.',
        strength: 'good',
      });
      sharedValues.push('Projet de vie');
    }
  }

  // ── Ambition ──────────────────────────────────────────────────────────
  if (myQ.ambitionLevel && theirQ.ambitionLevel) {
    const diff = Math.abs(myQ.ambitionLevel - theirQ.ambitionLevel);
    if (diff <= 1) {
      points.push({
        emoji: '🚀',
        title: 'Ambition similaire',
        description: 'Vous avez des niveaux d\'ambition proches — vous vous stimulerez mutuellement.',
        strength: 'good',
      });
      sharedValues.push('Ambition');
    }
  }

  // ── Humour ────────────────────────────────────────────────────────────
  if (myQ.humorType && theirQ.humorType) {
    if (myQ.humorType === theirQ.humorType) {
      points.push({
        emoji: '😂',
        title: 'Même sens de l\'humour',
        description: `Vous partagez le même style d\'humour — bonne complicité en vue !`,
        strength: 'good',
      });
      sharedValues.push('Humour');
    }
  }

  // ── Personnalité ──────────────────────────────────────────────────────
  if (myQ.personality && theirQ.personality) {
    if (myQ.personality === theirQ.personality) {
      points.push({
        emoji: '🧬',
        title: 'Même énergie',
        description: `Vous êtes tous les deux ${PERSONALITY_LABELS[myQ.personality] ?? myQ.personality}(e) — vous vous comprendrez naturellement.`,
        strength: 'good',
      });
    } else if (
      (myQ.personality === 'introvert' && theirQ.personality === 'introvert') === false &&
      myQ.personality !== theirQ.personality
    ) {
      points.push({
        emoji: '⚡',
        title: 'Personnalités complémentaires',
        description: `Vous êtes ${PERSONALITY_LABELS[myQ.personality] ?? myQ.personality}(e) et ${theirName} est ${PERSONALITY_LABELS[theirQ.personality] ?? theirQ.personality}(e) — un beau mélange.`,
        strength: 'note',
      });
    }
  }

  // ── Valeurs fondamentales ─────────────────────────────────────────────
  if (myQ.familyImportance && theirQ.familyImportance) {
    if (Math.abs(myQ.familyImportance - theirQ.familyImportance) <= 1 && myQ.familyImportance >= 7) {
      points.push({
        emoji: '👨‍👩‍👧',
        title: 'La famille avant tout',
        description: 'Vous accordez tous les deux beaucoup d\'importance à la famille.',
        strength: 'strong',
      });
      sharedValues.push('Famille');
    }
  }

  // Garantir au moins 2 points
  if (points.length < 2) {
    points.push({
      emoji: '🌟',
      title: 'Une belle rencontre',
      description: `Votre profil et celui de ${theirName} se complètent de façon unique. Découvrez-le !`,
      strength: 'good',
    });
  }

  // Headline
  const strongCount = points.filter(p => p.strength === 'strong').length;
  let headline: string;
  if (strongCount >= 3) {
    headline = `Match exceptionnel avec ${theirName} ! 🔥`;
  } else if (strongCount >= 2) {
    headline = `Très belles affinités avec ${theirName} ✨`;
  } else {
    headline = `Vous et ${theirName} avez de belles choses en commun`;
  }

  return { points: points.slice(0, 4), sharedValues, headline };
}
