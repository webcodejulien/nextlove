export type Language = 'FR' | 'EN' | 'ES' | 'DE' | 'PT';

export interface TranslationSet {
  // Navigation
  discover: string;
  aiMatch: string;
  matches: string;
  profile: string;
  // Actions
  like: string;
  skip: string;
  superLike: string;
  // IA
  compatibility: string;
  aiScore: string;
  analyzeButton: string;
  loading: string;
  analyzing: string;
  // Discover
  noMoreProfiles: string;
  refreshProfiles: string;
  // AI Match
  criteriaTitle: string;
  criteriaSubtitle: string;
  resultsTitle: string;
  resultsSubtitle: string;
  // Premium
  premiumTitle: string;
  premiumSubtitle: string;
  premiumButton: string;
  premiumActive: string;
  // Misc
  languageLabel: string;
  adText: string;
  adRemove: string;
  criteria: {
    family: string;
    values: string;
    travel: string;
    lifestyle: string;
    ambition: string;
  };
  yourCriteria: string;
  // Matches
  match: string;
  newMatch: string;
  chatButton: string;
  noMatchesYet: string;
  noMatchesSubtitle: string;
  startSwiping: string;
  // Profile
  yourProfile: string;
  editProfile: string;
  // Onboarding
  getStarted: string;
  tagline: string;
  findYourMatch: string;
  // Errors
  apiKeyMissing: string;
  apiKeyMissingSubtitle: string;
  noResults: string;
  tryAgain: string;
  aiExplanation: string;
  year: string;
  // Discover filters
  filters: string;
  filtersTitle: string;
  ageRange: string;
  distance: string;
  noLimit: string;
  applyFilters: string;
  resetFilters: string;
  // Chat
  typeMessage: string;
  send: string;
  online: string;
  // Settings
  notifications: string;
  help: string;
  logout: string;
  deleteAccount: string;
  language: string;
  // Likes
  likesLeft: string;
  watchAd: string;
  noMoreLikes: string;
  noMoreLikesSubtitle: string;
  // Boost
  boostTitle: string;
  boostSub: string;
  boostActive: string;
}

export const translations: Record<Language, TranslationSet> = {
  FR: {
    discover: 'Découvrir',
    aiMatch: 'Recherche',
    matches: 'Matchs',
    profile: 'Profil',
    like: "J'aime",
    skip: 'Passer',
    superLike: 'Super Like',
    compatibility: 'Compatibilité',
    aiScore: 'Score',
    analyzeButton: 'Analyser ma compatibilité',
    loading: 'Chargement...',
    analyzing: 'Calcul de vos compatibilités...',
    noMoreProfiles: 'Plus de profils disponibles !',
    refreshProfiles: 'Voir de nouveaux profils',
    criteriaTitle: 'Vos critères',
    criteriaSubtitle: 'Ajustez les curseurs pour trouver votre match parfait',
    resultsTitle: 'Résultats',
    resultsSubtitle: 'Classés par compatibilité',
    premiumTitle: 'Passez à Premium ✨',
    premiumSubtitle: 'Matchs illimités, Super Likes, et plus encore',
    premiumButton: 'Obtenir Premium',
    premiumActive: 'Membre Premium ✨',
    languageLabel: 'Langue',
    adText: '📢 Publicité',
    adRemove: 'Supprimer les pubs → Premium',
    criteria: { family: 'Famille', values: 'Valeurs', travel: 'Voyages', lifestyle: 'Style de vie', ambition: 'Ambition' },
    yourCriteria: 'Vos critères',
    match: 'C\'est un match !',
    newMatch: 'Nouveau Match !',
    chatButton: 'Envoyer un message',
    noMatchesYet: 'Pas encore de matchs',
    noMatchesSubtitle: 'Commencez à swiper pour trouver votre âme sœur !',
    startSwiping: 'Commencer à swiper',
    yourProfile: 'Votre profil',
    editProfile: 'Modifier le profil',
    getStarted: "Commencer l'aventure",
    tagline: "Trouvez l'amour basé sur\nvos vraies affinités",
    findYourMatch: 'Votre match parfait vous attend',
    apiKeyMissing: 'Calcul indisponible',
    apiKeyMissingSubtitle: 'Le calcul de compatibilité est temporairement indisponible',
    noResults: 'Aucun résultat',
    tryAgain: 'Réessayer',
    aiExplanation: 'Analyse de compatibilité',
    year: 'ans',
    filters: 'Filtres',
    filtersTitle: 'Filtrer les profils',
    ageRange: 'Tranche d\'âge',
    distance: 'Distance max',
    noLimit: 'Sans limite',
    applyFilters: 'Appliquer',
    resetFilters: 'Réinitialiser',
    typeMessage: 'Votre message...',
    send: 'Envoyer',
    online: 'En ligne',
    notifications: 'Notifications',
    help: 'Aide & Support',
    logout: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    language: 'Langue',
    likesLeft: 'likes restants',
    watchAd: 'Regarder une vidéo (+5 likes)',
    noMoreLikes: 'Plus de likes disponibles',
    noMoreLikesSubtitle: 'Regardez une vidéo pour obtenir 5 likes supplémentaires',
    boostTitle: 'Booster mon profil',
    boostSub: '1×/jour · Soyez vu par 10× plus de personnes',
    boostActive: 'Boost actif !',
  },
  EN: {
    discover: 'Discover',
    aiMatch: 'Search',
    matches: 'Matches',
    profile: 'Profile',
    like: 'Like',
    skip: 'Skip',
    superLike: 'Super Like',
    compatibility: 'Compatibility',
    aiScore: 'Score',
    analyzeButton: 'Analyze my compatibility',
    loading: 'Loading...',
    analyzing: 'Calculating your compatibility...',
    noMoreProfiles: 'No more profiles available!',
    refreshProfiles: 'See new profiles',
    criteriaTitle: 'Your criteria',
    criteriaSubtitle: 'Adjust sliders to find your perfect match',
    resultsTitle: 'Results',
    resultsSubtitle: 'Ranked by compatibility',
    premiumTitle: 'Go Premium ✨',
    premiumSubtitle: 'Unlimited matches, Super Likes, and more',
    premiumButton: 'Get Premium',
    premiumActive: 'Premium Member ✨',
    languageLabel: 'Language',
    adText: '📢 Advertisement',
    adRemove: 'Remove ads → Premium',
    criteria: { family: 'Family', values: 'Values', travel: 'Travel', lifestyle: 'Lifestyle', ambition: 'Ambition' },
    yourCriteria: 'Your criteria',
    match: "It's a match!",
    newMatch: 'New Match!',
    chatButton: 'Send a message',
    noMatchesYet: 'No matches yet',
    noMatchesSubtitle: 'Start swiping to find your soulmate!',
    startSwiping: 'Start swiping',
    yourProfile: 'Your profile',
    editProfile: 'Edit profile',
    getStarted: 'Start the adventure',
    tagline: 'Find love based on\nyour real affinities',
    findYourMatch: 'Your perfect match is waiting',
    apiKeyMissing: 'Calculation unavailable',
    apiKeyMissingSubtitle: 'Compatibility calculation is temporarily unavailable',
    noResults: 'No results',
    tryAgain: 'Try again',
    aiExplanation: 'Compatibility analysis',
    year: 'y.o.',
    filters: 'Filters',
    filtersTitle: 'Filter profiles',
    ageRange: 'Age range',
    distance: 'Max distance',
    noLimit: 'No limit',
    applyFilters: 'Apply',
    resetFilters: 'Reset',
    typeMessage: 'Your message...',
    send: 'Send',
    online: 'Online',
    notifications: 'Notifications',
    help: 'Help & Support',
    logout: 'Log out',
    deleteAccount: 'Delete my account',
    language: 'Language',
    likesLeft: 'likes left',
    watchAd: 'Watch a video (+5 likes)',
    noMoreLikes: 'No more likes available',
    noMoreLikesSubtitle: 'Watch a video to get 5 more likes',
    boostTitle: 'Boost my profile',
    boostSub: '1×/day · Be seen by 10× more people',
    boostActive: 'Boost active!',
  },
  ES: {
    discover: 'Descubrir',
    aiMatch: 'Recherche',
    matches: 'Coincidencias',
    profile: 'Perfil',
    like: 'Me gusta',
    skip: 'Saltar',
    superLike: 'Super Like',
    compatibility: 'Compatibilidad',
    aiScore: 'Puntuación',
    analyzeButton: 'Analizar mi compatibilidad',
    loading: 'Cargando...',
    analyzing: 'Calculando tu compatibilidad...',
    noMoreProfiles: '¡No hay más perfiles disponibles!',
    refreshProfiles: 'Ver nuevos perfiles',
    criteriaTitle: 'Tus criterios',
    criteriaSubtitle: 'Ajusta los valores para encontrar tu match perfecto',
    resultsTitle: 'Resultados',
    resultsSubtitle: 'Ordenados por compatibilidad',
    premiumTitle: 'Hazte Premium ✨',
    premiumSubtitle: 'Matches ilimitados, Super Likes y mucho más',
    premiumButton: 'Obtener Premium',
    premiumActive: 'Miembro Premium ✨',
    languageLabel: 'Idioma',
    adText: '📢 Publicidad',
    adRemove: 'Eliminar anuncios → Premium',
    criteria: { family: 'Familia', values: 'Valores', travel: 'Viajes', lifestyle: 'Estilo de vida', ambition: 'Ambición' },
    yourCriteria: 'Tus criterios',
    match: '¡Es un match!',
    newMatch: '¡Nuevo Match!',
    chatButton: 'Enviar mensaje',
    noMatchesYet: 'Aún no tienes matches',
    noMatchesSubtitle: '¡Empieza a deslizar para encontrar tu alma gemela!',
    startSwiping: 'Empezar a deslizar',
    yourProfile: 'Tu perfil',
    editProfile: 'Editar perfil',
    getStarted: 'Comenzar la aventura',
    tagline: 'Encuentra el amor basado en\ntus verdaderas afinidades',
    findYourMatch: 'Tu pareja perfecta te espera',
    apiKeyMissing: 'Clave API no encontrada',
    apiKeyMissingSubtitle: 'El cálculo de compatibilidad no está disponible temporalmente',
    noResults: 'Sin resultados',
    tryAgain: 'Intentar de nuevo',
    aiExplanation: 'Análisis de compatibilidad',
    year: 'años',
    filters: 'Filtros',
    filtersTitle: 'Filtrar perfiles',
    ageRange: 'Rango de edad',
    distance: 'Distancia máx.',
    noLimit: 'Sin límite',
    applyFilters: 'Aplicar',
    resetFilters: 'Restablecer',
    typeMessage: 'Tu mensaje...',
    send: 'Enviar',
    online: 'En línea',
    notifications: 'Notificaciones',
    help: 'Ayuda y Soporte',
    logout: 'Cerrar sesión',
    deleteAccount: 'Eliminar mi cuenta',
    language: 'Idioma',
    likesLeft: 'likes restantes',
    watchAd: 'Ver un vídeo (+5 likes)',
    noMoreLikes: 'Sin likes disponibles',
    noMoreLikesSubtitle: 'Mira un vídeo para obtener 5 likes más',
    boostTitle: 'Impulsar mi perfil',
    boostSub: '1×/día · Sé visto por 10× más personas',
    boostActive: '¡Boost activo!',
  },
  DE: {
    discover: 'Entdecken',
    aiMatch: 'KI Match',
    matches: 'Matches',
    profile: 'Profil',
    like: 'Gefällt mir',
    skip: 'Überspringen',
    superLike: 'Super Like',
    compatibility: 'Kompatibilität',
    aiScore: 'Ergebnis',
    analyzeButton: 'Kompatibilität analysieren',
    loading: 'Wird geladen...',
    analyzing: 'Kompatibilität wird berechnet...',
    noMoreProfiles: 'Keine weiteren Profile verfügbar!',
    refreshProfiles: 'Neue Profile anzeigen',
    criteriaTitle: 'Deine Kriterien',
    criteriaSubtitle: 'Passe die Werte an, um deinen perfekten Match zu finden',
    resultsTitle: 'Ergebnisse',
    resultsSubtitle: 'Nach Kompatibilität sortiert',
    premiumTitle: 'Premium werden ✨',
    premiumSubtitle: 'Unbegrenzte Matches, Super Likes und mehr',
    premiumButton: 'Premium holen',
    premiumActive: 'Premium-Mitglied ✨',
    languageLabel: 'Sprache',
    adText: '📢 Werbung',
    adRemove: 'Werbung entfernen → Premium',
    criteria: { family: 'Familie', values: 'Werte', travel: 'Reisen', lifestyle: 'Lebensstil', ambition: 'Ehrgeiz' },
    yourCriteria: 'Deine Kriterien',
    match: 'Es ist ein Match!',
    newMatch: 'Neuer Match!',
    chatButton: 'Nachricht senden',
    noMatchesYet: 'Noch keine Matches',
    noMatchesSubtitle: 'Fang an zu swipen, um deine Seelenverwandte zu finden!',
    startSwiping: 'Jetzt swipen',
    yourProfile: 'Dein Profil',
    editProfile: 'Profil bearbeiten',
    getStarted: 'Abenteuer beginnen',
    tagline: 'Finde die Liebe basierend auf\ndeinen echten Affinitäten',
    findYourMatch: 'Dein perfekter Match wartet',
    apiKeyMissing: 'API-Schlüssel fehlt',
    apiKeyMissingSubtitle: 'Kompatibilitätsberechnung ist vorübergehend nicht verfügbar',
    noResults: 'Keine Ergebnisse',
    tryAgain: 'Erneut versuchen',
    aiExplanation: 'Kompatibilitätsanalyse',
    year: 'J.',
    filters: 'Filter',
    filtersTitle: 'Profile filtern',
    ageRange: 'Altersbereich',
    distance: 'Max. Entfernung',
    noLimit: 'Kein Limit',
    applyFilters: 'Anwenden',
    resetFilters: 'Zurücksetzen',
    typeMessage: 'Deine Nachricht...',
    send: 'Senden',
    online: 'Online',
    notifications: 'Benachrichtigungen',
    help: 'Hilfe & Support',
    logout: 'Abmelden',
    deleteAccount: 'Konto löschen',
    language: 'Sprache',
    likesLeft: 'Likes übrig',
    watchAd: 'Video ansehen (+5 Likes)',
    noMoreLikes: 'Keine Likes mehr',
    noMoreLikesSubtitle: 'Sieh dir ein Video an, um 5 weitere Likes zu erhalten',
    boostTitle: 'Profil boosten',
    boostSub: '1×/Tag · Werde 10× öfter gesehen',
    boostActive: 'Boost aktiv!',
  },
  PT: {
    discover: 'Descobrir',
    aiMatch: 'Recherche',
    matches: 'Combinações',
    profile: 'Perfil',
    like: 'Curtir',
    skip: 'Pular',
    superLike: 'Super Like',
    compatibility: 'Compatibilidade',
    aiScore: 'Pontuação',
    analyzeButton: 'Analisar minha compatibilidade',
    loading: 'Carregando...',
    analyzing: 'Calculando sua compatibilidade...',
    noMoreProfiles: 'Sem mais perfis disponíveis!',
    refreshProfiles: 'Ver novos perfis',
    criteriaTitle: 'Seus critérios',
    criteriaSubtitle: 'Ajuste os valores para encontrar seu match perfeito',
    resultsTitle: 'Resultados',
    resultsSubtitle: 'Classificados por compatibilidade',
    premiumTitle: 'Seja Premium ✨',
    premiumSubtitle: 'Matches ilimitados, Super Likes e muito mais',
    premiumButton: 'Obter Premium',
    premiumActive: 'Membro Premium ✨',
    languageLabel: 'Idioma',
    adText: '📢 Publicidade',
    adRemove: 'Remover anúncios → Premium',
    criteria: { family: 'Família', values: 'Valores', travel: 'Viagens', lifestyle: 'Estilo de vida', ambition: 'Ambição' },
    yourCriteria: 'Seus critérios',
    match: 'É um match!',
    newMatch: 'Novo Match!',
    chatButton: 'Enviar mensagem',
    noMatchesYet: 'Ainda sem matches',
    noMatchesSubtitle: 'Comece a deslizar para encontrar sua alma gêmea!',
    startSwiping: 'Começar a deslizar',
    yourProfile: 'Seu perfil',
    editProfile: 'Editar perfil',
    getStarted: 'Começar a aventura',
    tagline: 'Encontre o amor baseado em\nsuas verdadeiras afinidades',
    findYourMatch: 'Seu match perfeito está esperando',
    apiKeyMissing: 'Chave API ausente',
    apiKeyMissingSubtitle: 'O cálculo de compatibilidade está temporariamente indisponível',
    noResults: 'Sem resultados',
    tryAgain: 'Tentar novamente',
    aiExplanation: 'Análise de compatibilidade',
    year: 'anos',
    filters: 'Filtros',
    filtersTitle: 'Filtrar perfis',
    ageRange: 'Faixa etária',
    distance: 'Distância máx.',
    noLimit: 'Sem limite',
    applyFilters: 'Aplicar',
    resetFilters: 'Redefinir',
    typeMessage: 'Sua mensagem...',
    send: 'Enviar',
    online: 'Online',
    notifications: 'Notificações',
    help: 'Ajuda e Suporte',
    logout: 'Sair',
    deleteAccount: 'Excluir minha conta',
    language: 'Idioma',
    likesLeft: 'likes restantes',
    watchAd: 'Assistir vídeo (+5 likes)',
    noMoreLikes: 'Sem likes disponíveis',
    noMoreLikesSubtitle: 'Assista a um vídeo para ganhar mais 5 likes',
    boostTitle: 'Impulsionar meu perfil',
    boostSub: '1×/dia · Seja visto por 10× mais pessoas',
    boostActive: 'Boost ativo!',
  },
};
