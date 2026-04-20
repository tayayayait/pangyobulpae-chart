# Phase 15 Change Log (Edge Function 401 Auth Fix)

## Problem
- After chart upload, `analyze-chart` sometimes returned `401 Unauthorized`.
- Existing logic treated any non-empty `access_token` from `getSession()` as valid, so expired or invalid tokens could still be used for function calls.

## Root Cause
- Session object presence is not equal to token validity.
- With `verify_jwt=true`, Supabase Edge Functions reject invalid JWTs with `401`.

## Changes
- File: `src/pages/Editor.tsx`
  - Replaced `ensureValidSession()` with `getValidAccessToken()`.
  - Added pre-invocation token validation plus refresh fallback via `refreshSession()`.
  - Added explicit `Authorization: Bearer <token>` header in `supabase.functions.invoke()` calls.
  - Applied to:
    - `analyze-chart`
    - `regenerate-summary`
    - `export-pptx`

## Expected Effect
- Blocks function invocations that only have a stale token string in local session storage.
- Reduces recurrence of `401` caused by expired or invalid client tokens.

## Note
- `verify_jwt=true` stays enabled in `supabase/config.toml`; this fix assumes and supports that policy.
