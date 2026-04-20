# Troubleshooting: `PATCH /rest/v1/reports` 400

## Symptom

- Browser console shows:
  - `PATCH https://<project>.supabase.co/rest/v1/reports?... 400 (Bad Request)`
- Often appears in editor autosave flow.

## Verified Cause Pattern

- Local frontend sends fields that exist in local migration files.
- Remote Supabase schema is missing one or more of these columns:
  - `top_bar_color`
  - `bottom_bar_color`
  - `header_title`
  - `header_label`
- Result: PostgREST rejects PATCH with 400 when unknown column is included.

## Runtime Safeguard in Frontend

- Editor now:
  - Detects available report columns from `select *` response.
  - Filters autosave PATCH payload to only columns that exist in the fetched row shape.
  - Shows a one-time warning toast when expected columns are missing.

## Permanent Fix

1. Apply all SQL files in `supabase/migrations/` to project `wpcolzucohrwgxmquyoc`.
2. Confirm missing columns now exist in `public.reports`.
3. Re-open editor and verify autosave PATCH returns 2xx.
