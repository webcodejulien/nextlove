import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { QuestionnaireAnswers } from '../constants/questionnaire';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================
// Types
// ============================================================

export type Gender = 'man' | 'woman' | 'non_binary' | 'other';
export type LookingFor = 'man' | 'woman' | 'everyone';
export type RelationType = 'serious' | 'casual' | 'friendship' | 'open';
export type KidsPreference = 'want' | 'dont_want' | 'have' | 'open';
export type SmokingHabit = 'never' | 'sometimes' | 'regularly';
export type DrinkingHabit = 'never' | 'socially' | 'regularly';
export type EducationLevel = 'high_school' | 'bachelors' | 'masters' | 'phd' | 'other';
export type SubscriptionPlan = 'premium_monthly' | 'premium_yearly' | 'premium_plus' | 'monthly' | 'yearly' | 'weekly' | 'quarterly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type ReportReason = 'spam' | 'fake' | 'inappropriate' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  age?: number;
  gender?: Gender;
  looking_for?: LookingFor;
  about?: string;
  lifestyle?: string;
  relation_type?: RelationType;
  kids?: KidsPreference;
  religion?: string;
  smoke?: SmokingHabit;
  drink?: DrinkingHabit;
  education?: EducationLevel;
  values: string[];
  photos: string[];
  location?: UserLocation;
  is_premium: boolean;
  is_verified: boolean;
  is_active: boolean;
  last_seen: string;
  created_at: string;
  questionnaire_data?: QuestionnaireAnswers;
  profile_prompts?: { promptId: string; answer: string }[];
}

export interface Like {
  id: string;
  user_id: string;
  liked_user_id: string;
  is_super_like: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score?: number;
  created_at: string;
  user1?: User;
  user2?: User;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at?: string;
  stripe_id?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  is_primary: boolean;
  is_approved: boolean;
  created_at: string;
}

// ============================================================
// Auth
// ============================================================

export const authService = {
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return data;
  },

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================================
// Users
// ============================================================

export const userService = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'last_seen' | 'is_premium' | 'is_verified' | 'is_active'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, last_seen: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async savePrompts(id: string, prompts: { promptId: string; answer: string }[]): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ profile_prompts: prompts })
      .eq('id', id);
    if (error) throw error;
  },

  async updateLastSeen(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getDiscoverProfiles(userId: string, limit = 20): Promise<User[]> {
    const { data, error } = await supabase
      .rpc('get_discover_profiles', { p_user_id: userId, p_limit: limit });
    if (error) throw error;
    return data ?? [];
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// Likes
// ============================================================

export const likeService = {
  async like(userId: string, likedUserId: string, isSuperLike = false): Promise<Like> {
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: userId, liked_user_id: likedUserId, is_super_like: isSuperLike })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unlike(userId: string, likedUserId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('liked_user_id', likedUserId);
    if (error) throw error;
  },

  async hasLiked(userId: string, likedUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('liked_user_id', likedUserId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },

  async getLikedUserIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('liked_user_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((l) => l.liked_user_id);
  },

  async getWhoLikedMe(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('user_id')
      .eq('liked_user_id', userId);
    if (error) throw error;
    return (data ?? []).map((l) => l.user_id);
  },
};

// ============================================================
// Matches
// ============================================================

export const matchService = {
  // Vérifie si un match mutuel existe entre deux utilisateurs
  async checkMutualMatch(userId: string, targetId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`*, user1:user1_id(*), user2:user2_id(*)`)
      .or(
        `and(user1_id.eq.${userId},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${userId})`
      )
      .maybeSingle();
    if (error) return null;
    return data;
  },

  async getAll(userId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:user1_id(*),
        user2:user2_id(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:user1_id(*),
        user2:user2_id(*)
      `)
      .eq('id', matchId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateCompatibilityScore(matchId: string, score: number): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ compatibility_score: score })
      .eq('id', matchId);
    if (error) throw error;
  },

  async delete(matchId: string): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);
    if (error) throw error;
  },

  getOtherUser(match: Match, currentUserId: string): User | undefined {
    if (match.user1_id === currentUserId) return match.user2 as User;
    return match.user1 as User;
  },
};

// ============================================================
// Messages
// ============================================================

export const messageService = {
  async getByMatch(matchId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async send(matchId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: senderId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(matchId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const userMatches = await matchService.getAll(userId);
    const matchIds = userMatches.map((m) => m.id);
    if (matchIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  },

  subscribeToMatch(matchId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
  },
};

// ============================================================
// Blocks
// ============================================================

export const blockService = {
  async block(blockerId: string, blockedId: string, reason?: string): Promise<Block> {
    const { data, error } = await supabase
      .from('blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId, reason })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) throw error;
  },

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },

  async getBlockedIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);
    if (error) throw error;
    return (data ?? []).map((b) => b.blocked_id);
  },
};

// ============================================================
// Reports
// ============================================================

export const reportService = {
  async report(reporterId: string, reportedId: string, reason: ReportReason, description?: string): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({ reporter_id: reporterId, reported_id: reportedId, reason, description })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByReporter(reporterId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

// ============================================================
// Profile Views
// ============================================================

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_id: string;
  viewed_at: string;
  viewer?: User;
}

export const profileViewService = {
  /** Enregistre une vue (upsert — ne compte qu'une fois par paire) */
  async recordView(viewerId: string, viewedId: string): Promise<void> {
    if (viewerId === viewedId) return; // ne pas compter ses propres vues
    await supabase
      .from('profile_views')
      .upsert({ viewer_id: viewerId, viewed_id: viewedId, viewed_at: new Date().toISOString() }, { onConflict: 'viewer_id,viewed_id' });
    // silent — never throw
  },

  /** Retourne le nombre de vues sur le profil dans les 7 derniers jours */
  async getViewCount(userId: string): Promise<number> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewed_id', userId)
      .gte('viewed_at', since);
    if (error) return 0;
    return count ?? 0;
  },

  /** Retourne la liste des viewers (premium only) */
  async getViewers(userId: string, limit = 12): Promise<User[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('profile_views')
      .select('viewer_id, viewed_at')
      .eq('viewed_id', userId)
      .gte('viewed_at', since)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    const viewers = await Promise.all(
      data.map(v => supabase.from('users').select('*').eq('id', v.viewer_id).single().then(r => r.data as User | null))
    );
    return viewers.filter(Boolean) as User[];
  },
};

// ============================================================
// Subscriptions
// ============================================================

export const subscriptionService = {
  async getActive(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(userId: string, plan: SubscriptionPlan, stripeId?: string, expiresAt?: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan, stripe_id: stripeId, expires_at: expiresAt })
      .select()
      .single();
    if (error) throw error;
    await userService.update(userId, { is_premium: true });
    return data;
  },

  // Activation Apple IAP / Google Play avec calcul automatique de l'expiration
  async createFromIAP(params: {
    userId: string;
    plan: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    daysFromNow: number;
    transactionId?: string;
  }): Promise<void> {
    const expiresAt = new Date(
      Date.now() + params.daysFromNow * 24 * 60 * 60 * 1000
    ).toISOString();

    const planMap: Record<string, SubscriptionPlan> = {
      weekly: 'monthly',
      monthly: 'monthly',
      quarterly: 'monthly',
      yearly: 'yearly',
    };

    await supabase.from('subscriptions').upsert({
      user_id: params.userId,
      plan: planMap[params.plan] ?? 'monthly',
      stripe_id: params.transactionId ?? `iap_${params.plan}_${Date.now()}`,
      expires_at: expiresAt,
      status: 'active',
    }, { onConflict: 'user_id' });

    await userService.update(params.userId, { is_premium: true });
  },

  async cancel(subscriptionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);
    if (error) throw error;

    const active = await this.getActive(userId);
    if (!active) await userService.update(userId, { is_premium: false });
  },

  async isPremium(userId: string): Promise<boolean> {
    const sub = await this.getActive(userId);
    return sub !== null;
  },
};

// ============================================================
// Photos
// ============================================================

export const photoService = {
  async getByUser(userId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .eq('is_approved', true)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async add(userId: string, url: string, isPrimary = false): Promise<Photo> {
    if (isPrimary) {
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('photos')
      .insert({ user_id: userId, url, is_primary: isPrimary })
      .select()
      .single();
    if (error) throw error;

    const photos = await this.getByUser(userId);
    await userService.update(userId, { photos: photos.map((p) => p.url) });
    return data;
  },

  async delete(photoId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);
    if (error) throw error;

    const photos = await this.getByUser(userId);
    await userService.update(userId, { photos: photos.map((p) => p.url) });
  },

  async setPrimary(photoId: string, userId: string): Promise<void> {
    await supabase
      .from('photos')
      .update({ is_primary: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('photos')
      .update({ is_primary: true })
      .eq('id', photoId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async uploadToStorage(userId: string, fileUri: string, fileName: string): Promise<string> {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const path = `${userId}/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(data.path);
    return publicUrl;
  },
};

// ============================================================
// Profile — questionnaire mapping + save
// ============================================================

function mapEducation(v: string): string {
  return ({ bac: 'high_school', bac2: 'high_school', bac3: 'bachelors', bac5: 'masters', doctorate: 'phd' } as Record<string, string>)[v] ?? 'other';
}
function mapSmoke(v: string): string {
  return ({ none: 'never', occasional: 'sometimes', smoker: 'regularly' } as Record<string, string>)[v] ?? 'never';
}
function mapDrink(v: string): string {
  return ({ none: 'never', occasional: 'socially', moderate: 'socially', regular: 'regularly' } as Record<string, string>)[v] ?? 'never';
}

export const profileService = {
  async saveFromQuestionnaire(
    userId: string,
    answers: QuestionnaireAnswers,
    fallbackName?: string,
  ): Promise<User> {
    const name = answers.firstName.trim() || fallbackName || 'Utilisateur';

    // Mapping kids preference
    const mapKids = (v: string): string => {
      const m: Record<string, string> = { yes: 'want', no: 'dont_want', already_have: 'have', open: 'open' };
      return m[v] ?? 'open';
    };

    // Core fields — always exist in the schema
    const corePayload: Partial<User> & { id: string } = {
      id: userId,
      name,
      ...(answers.age > 0 && { age: answers.age }),
      ...(answers.religion && { religion: answers.religion }),
      ...(answers.education && { education: mapEducation(answers.education) as EducationLevel }),
      ...(answers.smoking && { smoke: mapSmoke(answers.smoking) as SmokingHabit }),
      ...(answers.alcohol && { drink: mapDrink(answers.alcohol) as DrinkingHabit }),
      ...(answers.lifestyle && { lifestyle: answers.lifestyle }),
      ...(answers.dealBreakers?.length > 0 && { values: answers.dealBreakers }),
      ...(answers.city?.trim() && { location: { city: answers.city.trim() } as UserLocation }),
      // Nouveaux champs questionnaire v2
      ...(answers.gender && { gender: answers.gender as Gender }),
      ...(answers.lookingFor && { looking_for: answers.lookingFor as LookingFor }),
      ...(answers.relationType && { relation_type: answers.relationType as RelationType }),
      ...(answers.wantsChildren && { kids: mapKids(answers.wantsChildren) as KidsPreference }),
      is_active: true,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(corePayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    // questionnaire_data is added by migration 002 — save it if the column exists
    await supabase
      .from('users')
      .update({ questionnaire_data: answers } as any)
      .eq('id', userId)
      .then(() => {}); // ignore error if column doesn't exist yet

    return data as User;
  },

  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async hasProfile(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return data !== null;
  },
};
