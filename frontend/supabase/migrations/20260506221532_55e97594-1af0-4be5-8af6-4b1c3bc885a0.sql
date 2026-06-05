
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Scans (public-readable for heatmap, write own only)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  crop TEXT NOT NULL,
  predicted_label TEXT NOT NULL,
  confidence REAL NOT NULL,
  corrected_label TEXT,
  image_path TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view scans for heatmap" ON public.scans FOR SELECT USING (true);
CREATE POLICY "auth users insert own scan" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own scan" ON public.scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own scan" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('corrections', 'corrections', true);

CREATE POLICY "scans public read" ON storage.objects FOR SELECT USING (bucket_id IN ('scans','corrections'));
CREATE POLICY "scans auth upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('scans','corrections') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "scans owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('scans','corrections') AND (storage.foldername(name))[1] = auth.uid()::text);
