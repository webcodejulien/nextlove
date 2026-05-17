/**
 * NextLove — Algorithme de Matching IA
 * Score 0-100 basé sur 7 thèmes pondérés + pénalités deal-breakers
 */

import { QuestionnaireAnswers } from '../constants/questionnaire';

export interface ThemeScore {
  theme: string;
  score: number;
  emoji: string;
  detail: string;
}

export interface DetailedScore {
  total: number;
  themes: ThemeScore[];
  label: string;
  color: string;
  dealBreakersFired: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numericCompat(a: number, b: number, maxDiff = 5): number {
  const diff = Math.abs(a - b);
  return Math.max(0, Math.round((1 - diff / maxDiff) * 100));
}

function arrayOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 60;
  const intersection = a.filter(x => b.includes(x)).length;
  const union = new Set([...a, ...b]).size;
  return Math.round((intersection / union) * 100);
}

function weighted(scores: [number, number][]): number {
  const valid = scores.filter(([s]) => s >= 0);
  if (!valid.length) return 65;
  const totalW = valid.reduce((s, [, w]) => s + w, 0);
  return Math.round(valid.reduce((s, [sc, w]) => s + sc * w, 0) / totalW);
}

// ─── Tables de compatibilité ──────────────────────────────────────────────────

const ATTACHMENT_COMPAT: Record<string, Record<string, number>> = {
  secure:   { secure: 100, anxious: 75, avoidant: 60 },
  anxious:  { secure: 75,  anxious: 45, avoidant: 25 },
  avoidant: { secure: 60,  anxious: 25, avoidant: 50 },
};

const LOVE_LANG_COMPAT: Record<string, Record<string, number>> = {
  words:  { words: 100, acts: 80, gifts: 70, time: 85, touch: 75 },
  acts:   { words: 80, acts: 100, gifts: 75, time: 80, touch: 85 },
  gifts:  { words: 70, acts: 75, gifts: 100, time: 70, touch: 65 },
  time:   { words: 85, acts: 80, gifts: 70,  time: 100, touch: 80 },
  touch:  { words: 75, acts: 85, gifts: 65,  time: 80, touch: 100 },
};

const CONFLICT_COMPAT: Record<string, Record<string, number>> = {
  talk_asap: { talk_asap: 95, cool_down: 70, write: 80, avoid: 40 },
  cool_down: { talk_asap: 70, cool_down: 90, write: 80, avoid: 60 },
  write:     { talk_asap: 80, cool_down: 80, write: 95, avoid: 55 },
  avoid:     { talk_asap: 40, cool_down: 60, write: 55, avoid: 50 },
};

// ─── Thème Personnalité ───────────────────────────────────────────────────────

function scorePersonality(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];

  if (a.personality && b.personality) {
    const m: Record<string, number> = { introvert: 0, ambivert: 1, extravert: 2 };
    const diff = Math.abs((m[a.personality] ?? 1) - (m[b.personality] ?? 1));
    s.push([diff === 0 ? 85 : diff === 1 ? 95 : 70, 2]);
  }
  if (a.loveLanguage && b.loveLanguage)
    s.push([LOVE_LANG_COMPAT[a.loveLanguage]?.[b.loveLanguage] ?? 70, 3]);
  if (a.communication && b.communication)
    s.push([a.communication === b.communication ? 90 : 65, 2]);
  if (a.attachment && b.attachment)
    s.push([ATTACHMENT_COMPAT[a.attachment]?.[b.attachment] ?? 60, 3]);
  if (a.conflictStyle && b.conflictStyle)
    s.push([CONFLICT_COMPAT[a.conflictStyle]?.[b.conflictStyle] ?? 60, 2.5]);
  if (a.lovePersonality && b.lovePersonality)
    s.push([a.lovePersonality === b.lovePersonality ? 85 : 70, 1]);
  s.push([numericCompat(a.humorLevel, b.humorLevel, 4), 1.5]);

  const score = weighted(s);
  return { theme: 'Personnalité', emoji: '🧠', score,
    detail: score >= 85 ? 'Vous vous comprenez naturellement'
          : score >= 65 ? 'Bonne complémentarité'
          : 'Des différences à apprivoiser' };
}

// ─── Thème Valeurs ────────────────────────────────────────────────────────────

function scoreValues(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.religion && b.religion) {
    const w = (a.religion === 'practicing' || b.religion === 'practicing') ? 4 : 2;
    s.push([a.religion === b.religion ? 100 : 50, w]);
  }
  if (a.politics && b.politics) {
    const pm: Record<string, number> = { left: 0, center: 1, right: 2, apolitical: 1, green: 0.5 };
    const diff = Math.abs((pm[a.politics] ?? 1) - (pm[b.politics] ?? 1));
    s.push([diff === 0 ? 100 : diff <= 0.5 ? 85 : diff === 1 ? 60 : 30, 2]);
  }
  if (a.coreValues?.length && b.coreValues?.length)
    s.push([arrayOverlap(a.coreValues, b.coreValues), 3]);
  s.push([numericCompat(a.honestyLevel, b.honestyLevel, 3), 2]);
  s.push([numericCompat(a.loyaltyLevel, b.loyaltyLevel, 3), 2]);
  s.push([numericCompat(a.familyImportance, b.familyImportance, 3), 2]);

  const score = weighted(s);
  return { theme: 'Valeurs', emoji: '💎', score,
    detail: score >= 85 ? 'Vos valeurs s\'alignent profondément'
          : score >= 65 ? 'Valeurs compatibles'
          : 'Des divergences sur l\'essentiel' };
}

// ─── Thème Lifestyle ─────────────────────────────────────────────────────────

function scoreLifestyle(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.lifestyle && b.lifestyle) s.push([a.lifestyle === b.lifestyle ? 95 : 65, 2]);
  if (a.wakeUpTime && b.wakeUpTime) {
    const ok = a.wakeUpTime === 'flexible' || b.wakeUpTime === 'flexible';
    s.push([ok ? 85 : a.wakeUpTime === b.wakeUpTime ? 100 : 45, 2]);
  }
  if (a.alcohol && b.alcohol) {
    const am: Record<string, number> = { none: 0, occasional: 1, moderate: 2, regular: 3 };
    const diff = Math.abs((am[a.alcohol] ?? 1) - (am[b.alcohol] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 75 : diff === 2 ? 45 : 20, 2]);
  }
  if (a.smoking && b.smoking) {
    const sm: Record<string, number> = { none: 0, occasional: 1, smoker: 2 };
    const diff = Math.abs((sm[a.smoking] ?? 0) - (sm[b.smoking] ?? 0));
    s.push([diff === 0 ? 100 : diff === 1 ? 60 : 20, 2]);
  }
  if (a.travelFrequency && b.travelFrequency) {
    const tm: Record<string, number> = { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 };
    const diff = Math.abs((tm[a.travelFrequency] ?? 2) - (tm[b.travelFrequency] ?? 2));
    s.push([diff === 0 ? 100 : diff === 1 ? 80 : diff === 2 ? 55 : 35, 1.5]);
  }
  if (a.pets && b.pets) {
    const pm: Record<string, number> = { love: 3, like: 2, neutral: 1, allergic: 0 };
    const diff = Math.abs((pm[a.pets] ?? 1) - (pm[b.pets] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 80 : diff === 2 ? 55 : 30, 1]);
  }
  const score = weighted(s);
  return { theme: 'Mode de vie', emoji: '🌿', score,
    detail: score >= 85 ? 'Vos quotidiens s\'emboîtent parfaitement'
          : score >= 65 ? 'Rythmes de vie compatibles'
          : 'Des habitudes à adapter' };
}

// ─── Thème Avenir ─────────────────────────────────────────────────────────────

function scoreFuture(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.wantsChildren && b.wantsChildren) {
    const yes = ['yes', 'already_have', 'open'];
    const aW = yes.includes(a.wantsChildren), bW = yes.includes(b.wantsChildren);
    const aNo = a.wantsChildren === 'no', bNo = b.wantsChildren === 'no';
    s.push([(aW && bW) || (aNo && bNo) ? 100 : a.wantsChildren === 'open' || b.wantsChildren === 'open' ? 70 : 15, 4]);
  }
  if (a.marriageView && b.marriageView) {
    const mm: Record<string, number> = { yes: 2, maybe: 1, no: 0, already: 2 };
    const diff = Math.abs((mm[a.marriageView] ?? 1) - (mm[b.marriageView] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 70 : 35, 2.5]);
  }
  if (a.whereToLive && b.whereToLive) {
    const flex = a.whereToLive === 'flexible' || b.whereToLive === 'flexible';
    s.push([a.whereToLive === b.whereToLive ? 100 : flex ? 80 : 50, 2]);
  }
  if (a.financialGoals && b.financialGoals)
    s.push([a.financialGoals === b.financialGoals ? 95 : 65, 1.5]);
  s.push([numericCompat(a.ambitionLevel, b.ambitionLevel, 4), 1.5]);

  const score = weighted(s);
  return { theme: 'Avenir', emoji: '🏡', score,
    detail: score >= 85 ? 'Vous construisez vers le même horizon'
          : score >= 65 ? 'Projets de vie compatibles'
          : 'Visions du futur à aligner' };
}

// ─── Thème Loisirs ────────────────────────────────────────────────────────────

function scoreHobbies(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.hobbies?.length && b.hobbies?.length) s.push([arrayOverlap(a.hobbies, b.hobbies), 3]);
  if (a.musicGenres?.length && b.musicGenres?.length) s.push([arrayOverlap(a.musicGenres, b.musicGenres), 1.5]);
  if (a.filmGenres?.length && b.filmGenres?.length) s.push([arrayOverlap(a.filmGenres, b.filmGenres), 1.5]);
  if (a.socialLife && b.socialLife) {
    const sm: Record<string, number> = { homebody: 0, balanced: 1, social_butterfly: 2 };
    const diff = Math.abs((sm[a.socialLife] ?? 1) - (sm[b.socialLife] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 75 : 45, 2]);
  }
  if (a.weekendStyle && b.weekendStyle)
    s.push([a.weekendStyle === b.weekendStyle ? 100 : a.weekendStyle === 'mix' || b.weekendStyle === 'mix' ? 80 : 55, 1.5]);

  const score = s.length ? weighted(s) : 70;
  return { theme: 'Loisirs', emoji: '🎨', score,
    detail: score >= 85 ? 'Vous partagerez de superbes moments'
          : score >= 65 ? 'Des activités à découvrir ensemble'
          : 'Des univers différents à explorer' };
}

// ─── Thème Finances ───────────────────────────────────────────────────────────

function scoreFinances(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.splitBill && b.splitBill) s.push([a.splitBill === b.splitBill ? 100 : 60, 2]);
  if (a.workLifeBalance && b.workLifeBalance) {
    const wm: Record<string, number> = { work_first: 0, balanced: 1, life_first: 2 };
    const diff = Math.abs((wm[a.workLifeBalance] ?? 1) - (wm[b.workLifeBalance] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 75 : 45, 2]);
  }
  s.push([numericCompat(a.ambitionLevel, b.ambitionLevel, 4), 2]);

  const score = s.length ? weighted(s) : 70;
  return { theme: 'Finances', emoji: '💰', score,
    detail: score >= 85 ? 'Même rapport à l\'argent et au travail'
          : score >= 65 ? 'Visions financières compatibles'
          : 'Des priorités à discuter' };
}

// ─── Thème Relation & Intimité ────────────────────────────────────────────────

function scoreRelationship(a: QuestionnaireAnswers, b: QuestionnaireAnswers): ThemeScore {
  const s: [number, number][] = [];
  if (a.relationType && b.relationType) s.push([a.relationType === b.relationType ? 100 : 40, 4]);
  if (a.relationshipPace && b.relationshipPace) {
    const rpm: Record<string, number> = { slow: 0, moderate: 1, fast: 2 };
    const diff = Math.abs((rpm[a.relationshipPace] ?? 1) - (rpm[b.relationshipPace] ?? 1));
    s.push([diff === 0 ? 100 : diff === 1 ? 75 : 45, 2]);
  }
  s.push([numericCompat(a.jealousyLevel, b.jealousyLevel, 3), 1.5]);
  s.push([numericCompat(a.affectionLevel, b.affectionLevel, 3), 2]);
  s.push([numericCompat(a.sexualityImportance, b.sexualityImportance, 3), 2]);

  const score = weighted(s);
  return { theme: 'Intimité', emoji: '💑', score,
    detail: score >= 85 ? 'Une connexion intime très prometteuse'
          : score >= 65 ? 'Besoins amoureux compatibles'
          : 'Des besoins à harmoniser' };
}

// ─── Deal-breakers ────────────────────────────────────────────────────────────

function checkDealBreakers(user: QuestionnaireAnswers, candidate: QuestionnaireAnswers) {
  const fired: string[] = [];
  let penalty = 0;
  const db = user.dealBreakers ?? [];

  if (db.includes('smoker') && candidate.smoking === 'smoker') { fired.push('Fumeur'); penalty += 40; }
  if (db.includes('heavy_drinker') && candidate.alcohol === 'regular') { fired.push('Alcool'); penalty += 30; }
  if (db.includes('has_children') && candidate.wantsChildren === 'already_have') { fired.push('Enfants'); penalty += 35; }
  if (db.includes('wants_children') && candidate.wantsChildren === 'yes') { fired.push('Veut enfants'); penalty += 35; }
  if (db.includes('no_children') && candidate.wantsChildren === 'no') { fired.push('Sans enfants'); penalty += 35; }
  if (db.includes('no_sport') && candidate.sports === 'none') { fired.push('Sédentaire'); penalty += 15; }
  if (db.includes('casual_only') && candidate.relationType === 'casual') { fired.push('Casual only'); penalty += 40; }
  if (db.includes('no_marriage') && candidate.marriageView === 'yes') { fired.push('Mariage'); penalty += 20; }

  return { penalty: Math.min(penalty, 70), fired };
}

// ─── Score global ─────────────────────────────────────────────────────────────

export function computeDetailedScore(
  user: QuestionnaireAnswers,
  candidate: QuestionnaireAnswers
): DetailedScore {
  const themes = [
    scorePersonality(user, candidate),
    scoreValues(user, candidate),
    scoreLifestyle(user, candidate),
    scoreFuture(user, candidate),
    scoreHobbies(user, candidate),
    scoreFinances(user, candidate),
    scoreRelationship(user, candidate),
  ];

  const weights = [
    1.5,
    user.familyImportance > 7 ? 2.5 : 2,
    1.5,
    user.wantsChildren ? 2.5 : 1.5,
    1.0,
    0.8,
    user.relationType === 'serious' ? 2.5 : 1.5,
  ];

  const weightedTotal = themes.reduce((sum, t, i) => sum + t.score * weights[i], 0);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const rawScore = Math.round(weightedTotal / totalWeight);

  const { penalty, fired: dealBreakersFired } = checkDealBreakers(user, candidate);
  const total = Math.max(5, Math.min(100, rawScore - penalty));

  return { total, themes, ...getLabel(total), dealBreakersFired };
}

// ─── Score temps réel (questionnaire) ────────────────────────────────────────

export function computeRealtimeScore(answers: QuestionnaireAnswers, step: number): number {
  const completedFields = Object.values(answers).filter(v =>
    v !== '' && v !== 0 && !(Array.isArray(v) && v.length === 0)
  ).length;
  const totalFields = Object.keys(answers).length;
  let score = 30 + (completedFields / totalFields) * 50;

  if (answers.attachment === 'secure') score += 5;
  if (answers.honestyLevel > 7) score += 3;
  if ((answers.loyaltyLevel ?? 0) > 7) score += 3;
  if (answers.coreValues?.length > 3) score += 3;
  if (answers.hobbies?.length > 3) score += 3;
  if (answers.dealBreakers?.length > 0) score += 3;

  return Math.min(99, Math.max(10, Math.round(score)));
}

// ─── Label & couleur ─────────────────────────────────────────────────────────

export function getLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Âme sœur potentielle ✨', color: '#FFD700' };
  if (score >= 80) return { label: 'Excellent match 💫',       color: '#00E676' };
  if (score >= 70) return { label: 'Très compatible 💚',       color: '#69F0AE' };
  if (score >= 60) return { label: 'Bonne compatibilité 💛',   color: '#FFC107' };
  if (score >= 45) return { label: 'Profil en cours... 🔄',    color: '#FF9800' };
  return              { label: 'À découvrir 🌱',               color: '#90A4AE' };
}

export function getScoreLabel(score: number) { return getLabel(score); }

export function getStepCompletion(answers: QuestionnaireAnswers): boolean[] {
  return [
    !!(answers.firstName && answers.age > 0 && answers.education && answers.gender),
    !!(answers.personality && answers.loveLanguage && answers.attachment),
    !!(answers.religion && answers.coreValues?.length > 0),
    !!(answers.lifestyle && answers.sports && answers.smoking),
    !!(answers.wantsChildren && answers.whereToLive),
    !!(answers.hobbies?.length > 0),
    !!(answers.workLifeBalance),
    !!(answers.relationType),
    !!(answers.partnerAgeMin > 0),
    true,
  ];
}
