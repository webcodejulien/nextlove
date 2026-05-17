-- Adds questionnaire_data column to store full questionnaire answers as JSON
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS questionnaire_data JSONB NOT NULL DEFAULT '{}';
