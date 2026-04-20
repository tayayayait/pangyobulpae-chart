-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  export_status TEXT,
  template_id TEXT NOT NULL DEFAULT 'finance-premium-01',
  category TEXT,
  headline TEXT,
  summary_lines JSONB DEFAULT '[]'::jsonb,
  source TEXT,
  slide_date DATE,
  brand_name TEXT,
  chart_image_url TEXT,
  logo_url TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own reports select" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own reports insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reports update" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own reports delete" ON public.reports FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reports_user_created ON public.reports(user_id, created_at DESC);

-- Export jobs
CREATE TABLE public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own jobs select" ON public.export_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own jobs insert" ON public.export_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own jobs update" ON public.export_jobs FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.export_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('chart-images', 'chart-images', false),
  ('logos', 'logos', false),
  ('exports', 'exports', false);

-- Storage policies: user can only access files under their own user_id folder
CREATE POLICY "chart read own" ON storage.objects FOR SELECT
  USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chart insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chart update own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chart delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "logos read own" ON storage.objects FOR SELECT
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos update own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "exports read own" ON storage.objects FOR SELECT
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "exports insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);