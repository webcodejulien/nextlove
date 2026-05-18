import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState } from 'react-native';
import { Profile, mockProfiles, defaultCriteria } from '../constants/mockData';
import { Language } from '../constants/translations';
import { QuestionnaireAnswers, DEFAULT_ANSWERS } from '../constants/questionnaire';
import { sendLocalNotification, buildNotificationPayload } from '../services/notificationService';
import {
  userService,
  likeService,
  matchService,
  subscriptionService,
  profileService,
  User,
  UserLocation,
  supabase,
} from '../services/supabase';
import { computeDetailedScore } from '../services/questionnaireScore';
import { Analytics } from '../services/analytics';
import { useAuth } from './AuthContext';
import {
  getRemainingLikes,
  consumeLike,
  FREE_LIKES_PER_DAY,
} from '../services/adService';

export interface CriteriaWeights {
  family: number;
  values: number;
  travel: number;
  lifestyle: number;
  ambition: number;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isPremium: boolean;
  setPremium: (premium: boolean) => void;
  remainingLikes: number;
  setRemainingLikes: (n: number) => void;
  matches: Profile[];
  addMatch: (profile: Profile) => void;
  likedIds: string[];
  addLike: (id: string) => Promise<Profile | null>; // retourne le profil si match mutuel
  skippedIds: string[];
  addSkip: (id: string) => void;
  undoSkip: (id: string) => void;
  criteria: CriteriaWeights;
  setCriteria: (criteria: CriteriaWeights) => void;
  profiles: Profile[];
  loadingProfiles: boolean;
  updateProfileScores: (scores: { id: string; score: number; explanation: string }[]) => void;
  resetSwipes: () => void;
  questionnaire: QuestionnaireAnswers;
  setQuestionnaire: (answers: QuestionnaireAnswers) => void;
  questionnaireCompleted: boolean;
  setQuestionnaireCompleted: (v: boolean) => void;
  aiScore: number;
  setAiScore: (score: number) => void;
  myLookingFor: string;
  myGender: string;
  refreshMatches: () => void;
  refreshProfiles: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function userToProfile(u: User): Profile {
  const q = u.questionnaire_data;
  return {
    id: u.id,
    name: u.name,
    age: u.age ?? 0,
    gender: u.gender ?? undefined,
    location: (u.location as UserLocation | undefined)?.city ?? '',
    coords: (u.location as UserLocation | undefined)?.lat && (u.location as UserLocation | undefined)?.lng
      ? { lat: (u.location as UserLocation).lat, lng: (u.location as UserLocation).lng }
      : undefined,
    bio: u.about ?? '',
    photo: u.photos?.[0] ?? 'https://randomuser.me/api/portraits/lego/1.jpg',
    photos: u.photos && u.photos.length > 1 ? u.photos : undefined,
    interests: u.values ?? [],
    job: q?.job ?? u.lifestyle ?? '',
    education: q?.education ?? u.education ?? '',
    traits: {
      family: q ? Math.round(q.familyImportance) : 5,
      values: q ? Math.round(q.honestyLevel) : 5,
      travel: q?.dominantTrait === 'adventurer' ? 9 : 5,
      lifestyle: q ? Math.round(q.ambitionLevel) : 5,
      ambition: q ? Math.round(q.ambitionLevel) : 5,
    },
    lastSeen: u.last_seen ?? null,
    profilePrompts: (u.profile_prompts as { promptId: string; answer: string }[] | undefined) ?? [],
    relationType: u.relation_type ?? undefined,
  };
}

function randomScore() {
  return Math.floor(Math.random() * 30) + 65;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const language: Language = 'FR'; const setLanguage = (_: Language) => {};
  const [isPremium, setPremium] = useState(false);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<CriteriaWeights>(defaultCriteria);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireAnswers>(DEFAULT_ANSWERS);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  const [myLookingFor, setMyLookingFor] = useState('everyone');
  const [myGender, setMyGender] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>(
    mockProfiles.map(p => ({ ...p, compatibilityScore: randomScore() }))
  );
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [remainingLikes, setRemainingLikes] = useState(FREE_LIKES_PER_DAY);
  // Mutex to prevent double-like race condition
  const likingRef = useRef(false);

  // Charge le quota de likes au démarrage
  useEffect(() => {
    getRemainingLikes().then(setRemainingLikes);
  }, []);

  // Met à jour last_seen quand l'app revient au premier plan
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active' && userId) {
        userService.updateLastSeen(userId).catch(() => {});
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfiles(mockProfiles.map(p => ({ ...p, compatibilityScore: randomScore() })));
      setLikedIds([]);
      setMatches([]);
      setPremium(false);
      return;
    }
    Analytics.identify(userId);
    Analytics.track('app_opened');
    loadRealData(userId);
  }, [userId]);

  // Listener global : notification toast quand un message arrive sur n'importe quel match
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as { sender_id: string; content: string; match_id: string };
          // Ne notifie que les messages reçus (pas envoyés)
          if (msg.sender_id === userId) return;

          // Ne notifie pas si l'app est au premier plan (le chat screen gère ça)
          if (AppState.currentState === 'active') return;

          // Trouve le nom du match pour la notification
          const match = matches.find(m => (m.matchId ?? m.id) === msg.match_id);
          if (!match) return;

          const { buildNotificationPayload: build, sendLocalNotification: send } =
            require('../services/notificationService') as typeof import('../services/notificationService');
          const payload2 = build('new_message', {
            name: match.name,
            matchId: msg.match_id,
            messagePreview: msg.content,
          });
          send(payload2).catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, matches]);

  const loadMatches = async (uid: string) => {
    try {
      const rawMatches = await matchService.getAll(uid);
      const mapped = rawMatches
        .map(m => {
          const other = matchService.getOtherUser(m, uid);
          if (!other) return null;
          return {
            ...userToProfile(other),
            matchId: m.id,
            compatibilityScore: m.compatibility_score ?? randomScore(),
          };
        })
        .filter(Boolean) as Profile[];
      setMatches(mapped);
    } catch (e) {
      console.warn('Failed to load matches:', e);
    }
  };

  const loadRealData = async (uid: string) => {
    setLoadingProfiles(true);
    // Mise à jour silencieuse du last_seen
    userService.updateLastSeen(uid).catch(() => {});
    try {
      // Charger le profil de l'utilisateur EN PREMIER pour avoir son questionnaire
      const ownProfile = await profileService.getProfile(uid);
      if (ownProfile?.questionnaire_data) {
        setQuestionnaire(ownProfile.questionnaire_data);
        setQuestionnaireCompleted(true);
      }
      if (ownProfile?.looking_for) setMyLookingFor(ownProfile.looking_for);
      if (ownProfile?.gender) setMyGender(ownProfile.gender);

      const realProfiles = await userService.getDiscoverProfiles(uid, 30);
      if (realProfiles.length > 0) {
        const myQ = ownProfile?.questionnaire_data;
        const scoredProfiles = realProfiles.map(u => {
          const profile = userToProfile(u);
          if (myQ && u.questionnaire_data) {
            try {
              const { total } = computeDetailedScore(myQ as any, u.questionnaire_data as any);
              return { ...profile, compatibilityScore: Math.max(10, Math.min(99, total)) };
            } catch { return { ...profile, compatibilityScore: randomScore() }; }
          }
          return { ...profile, compatibilityScore: randomScore() };
        });
        setProfiles(scoredProfiles);
      }
      // If no real profiles, keep mock data so the app works during development

      const liked = await likeService.getLikedUserIds(uid);
      setLikedIds(liked);

      await loadMatches(uid);

      const premium = await subscriptionService.isPremium(uid);
      setPremium(premium);
    } catch (e) {
      console.warn('Supabase load error, using mock data:', e);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const addMatch = (profile: Profile) => {
    setMatches(prev => {
      if (prev.find(m => m.id === profile.id)) return prev;
      const payload = buildNotificationPayload('new_match', {
        name: profile.name,
        matchId: profile.matchId ?? profile.id,
      });
      sendLocalNotification(payload).catch(() => {});
      return [...prev, profile];
    });
  };

  const addLike = async (id: string): Promise<Profile | null> => {
    // Mutex anti-double-tap
    if (likingRef.current) return null;
    likingRef.current = true;

    try {
    // Consomme un like du quota (sauf premium)
    if (!isPremium) {
      const ok = await consumeLike();
      if (!ok) return null; // quota épuisé — finally resets mutex
      setRemainingLikes(prev => Math.max(0, prev - 1));
    }

    setLikedIds(prev => [...prev, id]);
    Analytics.swipeLike(id);

    if (userId) {
      try {
        await likeService.like(userId, id);

        // Vérifie immédiatement si un match mutuel existe (trigger Supabase)
        await new Promise(r => setTimeout(r, 700));
        const match = await matchService.checkMutualMatch(userId, id);

        if (match) {
          // Recharge les matchs et retourne le profil pour afficher le modal
          loadMatches(userId);
          const other = matchService.getOtherUser(match, userId);
          if (other) {
            const profile = profiles.find(p => p.id === id) ?? {
              ...userToProfile(other),
              compatibilityScore: match.compatibility_score ?? undefined,
              matchId: match.id,
            };
            addMatch({ ...profile, matchId: match.id });
            Analytics.match(match.id, match.compatibility_score ?? undefined);
            return { ...profile, matchId: match.id };
          }
        } else {
          // Pas de match — recharge quand même en background
          setTimeout(() => loadMatches(userId), 600);
        }
      } catch {
        // Duplicate like ou contrainte — ignore
      }
      return null;
    } else {
      // Mode démo sans compte : match aléatoire (30% de chance)
      const profile = profiles.find(p => p.id === id);
      if (profile && Math.random() < 0.3) {
        addMatch(profile);
        return profile;
      }
      return null;
    }
    } finally {
      likingRef.current = false;
    }
  };

  const addSkip = (id: string) => {
    setSkippedIds(prev => [...prev, id]);
    Analytics.swipeSkip(id);
  };

  const undoSkip = (id: string) => {
    setSkippedIds(prev => prev.filter(s => s !== id));
  };

  const updateProfileScores = (scores: { id: string; score: number; explanation: string }[]) => {
    setProfiles(prev =>
      prev.map(p => {
        const score = scores.find(s => s.id === p.id);
        if (!score) return p;
        return { ...p, compatibilityScore: score.score, aiExplanation: score.explanation };
      })
    );
  };

  const resetSwipes = () => {
    setSkippedIds([]);
    if (userId) {
      userService.getDiscoverProfiles(userId, 30)
        .then(real => {
          if (real.length > 0) {
            setProfiles(real.map(u => ({ ...userToProfile(u), compatibilityScore: randomScore() })));
          }
        })
        .catch(() => {});
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isPremium,
        setPremium,
        remainingLikes,
        setRemainingLikes,
        matches,
        addMatch,
        likedIds,
        addLike,
        skippedIds,
        addSkip,
        undoSkip,
        criteria,
        setCriteria,
        profiles,
        loadingProfiles,
        updateProfileScores,
        resetSwipes,
        questionnaire,
        setQuestionnaire,
        questionnaireCompleted,
        setQuestionnaireCompleted,
        aiScore,
        setAiScore,
        myLookingFor,
        myGender,
        refreshMatches: () => { if (userId) loadMatches(userId); },
        refreshProfiles: () => { if (userId) loadRealData(userId); },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
