export interface Prompt {
  id: string;
  question: string;
  category: 'fun' | 'deep' | 'lifestyle' | 'love';
  emoji: string;
}

export interface ProfilePrompt {
  promptId: string;
  answer: string;
}

export const PROMPTS: Prompt[] = [
  // Fun
  { id: 'p1',  category: 'fun',       emoji: '😂', question: 'Mon talent caché totalement inutile...' },
  { id: 'p2',  category: 'fun',       emoji: '🍕', question: 'Je pourrais manger ça chaque jour de ma vie...' },
  { id: 'p3',  category: 'fun',       emoji: '🎭', question: 'En soirée, je suis toujours celui/celle qui...' },
  { id: 'p4',  category: 'fun',       emoji: '🐾', question: 'Si j\'étais un animal, je serais...' },
  { id: 'p5',  category: 'fun',       emoji: '🎬', question: 'Mon film préféré que je n\'ose pas admettre...' },
  { id: 'p6',  category: 'fun',       emoji: '🛒', question: 'La chose bizarre dans mon caddie que j\'achète toujours...' },

  // Deep
  { id: 'p7',  category: 'deep',      emoji: '🌟', question: 'La chose dont je suis le plus fier(ère) dans ma vie...' },
  { id: 'p8',  category: 'deep',      emoji: '📚', question: 'Le livre/film qui a changé ma façon de voir le monde...' },
  { id: 'p9',  category: 'deep',      emoji: '💭', question: 'Je pense trop souvent à...' },
  { id: 'p10', category: 'deep',      emoji: '🔮', question: 'Dans 5 ans, je veux...' },
  { id: 'p11', category: 'deep',      emoji: '❤️', question: 'Pour moi, l\'amour c\'est surtout...' },
  { id: 'p12', category: 'deep',      emoji: '🧠', question: 'Ma philosophie de vie en une phrase...' },

  // Lifestyle
  { id: 'p13', category: 'lifestyle', emoji: '✈️', question: 'Le voyage qui m\'a le plus marqué(e)...' },
  { id: 'p14', category: 'lifestyle', emoji: '🌅', question: 'Mon week-end idéal ressemble à...' },
  { id: 'p15', category: 'lifestyle', emoji: '🏃', question: 'Le sport/activité que je pratique régulièrement...' },
  { id: 'p16', category: 'lifestyle', emoji: '🍳', question: 'Ma spécialité en cuisine c\'est...' },
  { id: 'p17', category: 'lifestyle', emoji: '🎵', question: 'La chanson que j\'écoute en boucle en ce moment...' },
  { id: 'p18', category: 'lifestyle', emoji: '☕', question: 'Ma routine du matin inclut toujours...' },
  { id: 'p19', category: 'lifestyle', emoji: '🌿', question: 'Mon coin préféré dans ma ville...' },
  { id: 'p20', category: 'lifestyle', emoji: '📱', question: 'L\'app que j\'utilise le plus (à part NextLove !)...' },

  // Love
  { id: 'p21', category: 'love',      emoji: '💑', question: 'En relation, j\'ai besoin de...' },
  { id: 'p22', category: 'love',      emoji: '💌', question: 'Mon geste romantique préféré...' },
  { id: 'p23', category: 'love',      emoji: '🎁', question: 'La chose que je ferais pour quelqu\'un qui me plaît...' },
  { id: 'p24', category: 'love',      emoji: '🔑', question: 'Ce qui me fait craquer chez quelqu\'un...' },
  { id: 'p25', category: 'love',      emoji: '🌙', question: 'Pour moi, le premier rendez-vous idéal c\'est...' },
  { id: 'p26', category: 'love',      emoji: '🤝', question: 'Ce que je cherche vraiment chez l\'autre...' },
  { id: 'p27', category: 'love',      emoji: '⚡', question: 'Ce qui crée une vraie connexion pour moi...' },
  { id: 'p28', category: 'love',      emoji: '🏡', question: 'Le couple que j\'admire dans ma vie...' },
  { id: 'p29', category: 'fun',       emoji: '🎲', question: 'Si on se rencontrait, on ferait forcément...' },
  { id: 'p30', category: 'deep',      emoji: '✨', question: 'La meilleure décision que j\'ai prise récemment...' },
];

export const PROMPT_CATEGORIES = [
  { id: 'fun',       label: 'Fun',      emoji: '😂', color: '#FF6B35' },
  { id: 'deep',      label: 'Profond',  emoji: '💭', color: '#7B2FFF' },
  { id: 'lifestyle', label: 'Lifestyle',emoji: '✈️', color: '#00BFA5' },
  { id: 'love',      label: 'Amour',    emoji: '❤️', color: '#FF6B9D' },
] as const;

export const MAX_PROMPTS = 3;
