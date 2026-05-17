-- ============================================================
-- NextLove — Initial Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  name            TEXT NOT NULL,
  age             INTEGER CHECK (age >= 18 AND age <= 100),
  gender          TEXT CHECK (gender IN ('man', 'woman', 'non_binary', 'other')),
  looking_for     TEXT CHECK (looking_for IN ('man', 'woman', 'everyone')),
  about           TEXT,
  lifestyle       TEXT,
  relation_type   TEXT CHECK (relation_type IN ('serious', 'casual', 'friendship', 'open')),
  kids            TEXT CHECK (kids IN ('want', 'dont_want', 'have', 'open')),
  religion        TEXT,
  smoke           TEXT CHECK (smoke IN ('never', 'sometimes', 'regularly')),
  drink           TEXT CHECK (drink IN ('never', 'socially', 'regularly')),
  education       TEXT CHECK (education IN ('high_school', 'bachelors', 'masters', 'phd', 'other')),
  values          TEXT[] DEFAULT '{}',
  photos          TEXT[] DEFAULT '{}',
  location        JSONB,
  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active profiles" ON public.users
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_super_like   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, liked_user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes" ON public.likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_liked_user_id ON public.likes(liked_user_id);

-- ============================================================
-- 3. MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE INDEX idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX idx_matches_user2_id ON public.matches(user2_id);

-- ============================================================
-- 4. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Match participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Sender can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ============================================================
-- 5. BLOCKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert own blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

CREATE INDEX idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON public.blocks(blocked_id);

-- ============================================================
-- 6. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN ('spam', 'fake', 'inappropriate', 'harassment', 'other')),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON public.reports(reported_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- ============================================================
-- 7. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('premium_monthly', 'premium_yearly', 'premium_plus')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  stripe_id   TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_id);

-- ============================================================
-- 8. PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved photos" ON public.photos
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users can manage own photos" ON public.photos
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_photos_user_id ON public.photos(user_id);

-- ============================================================
-- AUTO-MATCH TRIGGER: creates a match when both users liked each other
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE user_id = NEW.liked_user_id
      AND liked_user_id = NEW.user_id
  ) THEN
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.user_id, NEW.liked_user_id),
      GREATEST(NEW.user_id, NEW.liked_user_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_mutual_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- ============================================================
-- FUNCTION: get profiles not yet seen by user (for discover feed)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_discover_profiles(
  p_user_id UUID,
  p_limit   INTEGER DEFAULT 20
)
RETURNS SETOF public.users AS $$
BEGIN
  RETURN QUERY
  SELECT u.*
  FROM public.users u
  WHERE u.id != p_user_id
    AND u.is_active = TRUE
    AND u.id NOT IN (
      SELECT liked_user_id FROM public.likes WHERE user_id = p_user_id
    )
    AND u.id NOT IN (
      SELECT blocked_id FROM public.blocks WHERE blocker_id = p_user_id
    )
    AND u.id NOT IN (
      SELECT blocker_id FROM public.blocks WHERE blocked_id = p_user_id
    )
  ORDER BY u.last_seen DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
