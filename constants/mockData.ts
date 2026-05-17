export interface Profile {
  id: string;
  name: string;
  age: number;
  gender?: string;    // 'man' | 'woman' | 'non_binary'
  location: string;
  coords?: { lat: number; lng: number }; // coordonnées GPS pour le filtre distance
  bio: string;
  photo: string;
  photos?: string[];   // carousel multi-photos
  interests: string[];
  job: string;
  education: string;
  traits: {
    family: number;
    values: number;
    travel: number;
    lifestyle: number;
    ambition: number;
  };
  compatibilityScore?: number;
  aiExplanation?: string;
  matchId?: string;
  lastSeen?: string | null;
  profilePrompts?: { promptId: string; answer: string }[];
  relationType?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  age: number;
  location: string;
  photo: string;
  isPremium: boolean;
}

// ─── Photos haute qualité (Unsplash, ~800px) ─────────────────────────────────
// Format : https://images.unsplash.com/photo-[ID]?w=600&h=800&fit=crop&q=85

export const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Sophie',
    age: 28,
    gender: 'woman',
    location: 'Paris, France',
    bio: "Architecte le jour, exploratrice la nuit. J'aime les musées, les festivals et les voyages improvisés. Amoureuse des chats et de la bonne cuisine.",
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Voyages', 'Architecture', 'Yoga', 'Musique', 'Cuisine'],
    job: 'Architecte',
    education: 'École des Beaux-Arts de Paris',
    traits: { family: 8, values: 9, travel: 10, lifestyle: 7, ambition: 9 },
  },
  {
    id: '2',
    name: 'Emma',
    age: 25,
    gender: 'woman',
    location: 'Lyon, France',
    bio: 'Photographe freelance passionnée par la nature et les paysages. Je rêve de faire le tour du monde avec un sac à dos et un appareil photo.',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Photographie', 'Randonnée', 'Art', 'Lecture', 'Vélo'],
    job: 'Photographe',
    education: 'ENSP Arles',
    traits: { family: 6, values: 8, travel: 10, lifestyle: 9, ambition: 7 },
  },
  {
    id: '3',
    name: 'Camille',
    age: 30,
    gender: 'woman',
    location: 'Bordeaux, France',
    bio: 'Médecin urgentiste et marathonienne. La vie est courte, il faut en profiter. Fan de jazz, de bonne cuisine et de longues conversations.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Running', 'Jazz', 'Médecine', 'Cuisine', 'Lecture'],
    job: 'Médecin Urgentiste',
    education: 'Faculté de Médecine Paris VI',
    traits: { family: 7, values: 9, travel: 6, lifestyle: 8, ambition: 10 },
  },
  {
    id: '4',
    name: 'Léa',
    age: 26,
    gender: 'woman',
    location: 'Marseille, France',
    bio: "Développeuse web le jour, danseuse salsa la nuit. Je cherche quelqu'un qui sait rire et qui n'a pas peur de danser sous la pluie.",
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Danse', 'Technologie', 'Mer', 'Salsa', 'Startups'],
    job: 'Développeuse Web Full-Stack',
    education: 'Epitech Marseille',
    traits: { family: 7, values: 8, travel: 8, lifestyle: 9, ambition: 8 },
  },
  {
    id: '5',
    name: 'Marie',
    age: 29,
    gender: 'woman',
    location: 'Toulouse, France',
    bio: "Ingénieure aérospatiale passionnée par les étoiles et l'exploration. Je crois aux grandes aventures et aux petits bonheurs quotidiens.",
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Sciences', 'Astronomie', 'Escalade', 'Cuisine', 'Voyages'],
    job: 'Ingénieure Aérospatiale',
    education: 'ISAE-SUPAERO',
    traits: { family: 6, values: 9, travel: 9, lifestyle: 7, ambition: 10 },
  },
  {
    id: '6',
    name: 'Julie',
    age: 27,
    gender: 'woman',
    location: 'Nantes, France',
    bio: "Professeure d'art et créatrice dans l'âme. J'aime les personnes authentiques qui ont une vraie passion dans la vie.",
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Art', 'Peinture', 'Musées', 'Lecture', 'Randonnée'],
    job: "Professeure d'Art",
    education: 'Université Paris 1 Panthéon-Sorbonne',
    traits: { family: 9, values: 10, travel: 7, lifestyle: 8, ambition: 7 },
  },
  {
    id: '7',
    name: 'Chloé',
    age: 31,
    gender: 'woman',
    location: 'Nice, France',
    bio: 'Cheffe cuisinière et voyageuse. Ma passion : marier les saveurs du monde entier dans mon restaurant. Cherche quelquun aussi gourmand que moi.',
    photo: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Gastronomie', 'Voyages', 'Surf', 'Vins', 'Meditation'],
    job: 'Cheffe Cuisinière',
    education: 'Institut Paul Bocuse',
    traits: { family: 8, values: 9, travel: 10, lifestyle: 10, ambition: 9 },
  },
  {
    id: '8',
    name: 'Anaïs',
    age: 24,
    gender: 'woman',
    location: 'Strasbourg, France',
    bio: 'Étudiante en droit européen, passionnée de politique et de langues. Je parle 4 langues et je veux en apprendre 4 autres.',
    photo: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=600&h=800&fit=crop&q=85',
    photos: [
      'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1535324492437-d8b561f8d531?w=600&h=800&fit=crop&q=85',
      'https://images.unsplash.com/photo-1523264653568-d3d4032d1476?w=600&h=800&fit=crop&q=85',
    ],
    interests: ['Politique', 'Langues', 'Tennis', 'Voyages', 'Lecture'],
    job: 'Étudiante en Droit',
    education: 'Université de Strasbourg',
    traits: { family: 8, values: 9, travel: 8, lifestyle: 6, ambition: 10 },
  },
];

export const currentUser: CurrentUser = {
  id: 'me',
  name: 'Alex',
  age: 29,
  location: 'Paris, France',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&q=85',
  isPremium: false,
};

export const defaultCriteria = {
  family: 7,
  values: 8,
  travel: 9,
  lifestyle: 7,
  ambition: 8,
};
