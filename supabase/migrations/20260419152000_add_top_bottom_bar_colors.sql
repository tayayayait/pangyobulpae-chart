ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS top_bar_color TEXT NOT NULL DEFAULT '#1A3C34',
  ADD COLUMN IF NOT EXISTS bottom_bar_color TEXT NOT NULL DEFAULT '#1A3C34';

UPDATE public.reports
SET
  top_bar_color = '#1A3C34'
WHERE
  top_bar_color IS NULL
  OR top_bar_color !~ '^#[0-9A-Fa-f]{6}$';

UPDATE public.reports
SET
  bottom_bar_color = '#1A3C34'
WHERE
  bottom_bar_color IS NULL
  OR bottom_bar_color !~ '^#[0-9A-Fa-f]{6}$';
