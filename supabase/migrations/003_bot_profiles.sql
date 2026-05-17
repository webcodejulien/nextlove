-- Permissions pour les bots (service_role)
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Colonne bot déjà créée, on s'assure juste
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bot_personality jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bot_last_active timestamptz DEFAULT now();

-- Table queue de messages bots
CREATE TABLE IF NOT EXISTS public.bot_message_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  bot_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  real_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_message text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

GRANT ALL ON public.bot_message_queue TO service_role;
