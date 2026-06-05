
-- API keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'default',
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  balance_cents integer NOT NULL DEFAULT 500,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner insert keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner delete keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- API calls / billing log
CREATE TABLE public.api_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  status integer NOT NULL,
  cost_cents integer NOT NULL DEFAULT 1,
  species text,
  health real,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read calls" ON public.api_calls FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.api_keys k WHERE k.id = api_key_id AND k.user_id = auth.uid()));

-- Village reports
CREATE TABLE public.village_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  village text,
  scan_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.village_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read reports" ON public.village_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner insert reports" ON public.village_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public view reports" ON public.village_reports FOR SELECT USING (true);

-- Province on scans
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS province text;

-- Retraining bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('retraining_required', 'retraining_required', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth upload retraining" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'retraining_required' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner read retraining" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'retraining_required' AND (storage.foldername(name))[1] = auth.uid()::text);
