# Phase 25 Change Log (export-pptx Gateway 401 Header Path Fix)

## Problem
- `export-pptx` invocation showed repeated HTTP `401` at the Edge gateway.
- Supabase dashboard invocation list showed `POST 401` while function logs had no handler error context for those requests.

## Root Cause
- Failure occurred at gateway JWT verification boundary, before normal function execution path.
- Manual per-request `Authorization` header injection in editor export flow increased mismatch risk at this boundary.
- Production tokens were confirmed as `ES256`, and the Edge gateway rejected them with `UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM` before handler execution.

## Changes
- File: `src/pages/Editor.tsx`
  - Removed manual `Authorization` header injection for `export-pptx` invocation.
  - Added pre-invocation authenticated-session check using `supabase.auth.getUser()`.
  - Added forced refresh fallback via existing token-refresh path before giving up.
  - Kept single retry path on HTTP 401, but retry now uses client-managed auth header path.
- File: `supabase/config.toml`
  - Changed `[functions.export-pptx] verify_jwt` from `true` to `false`.
  - Gateway JWT verification is bypassed; auth remains enforced inside the function via `supabase.auth.getUser()`.

## Expected Effect
- Eliminates header-shape drift between app and Supabase client auth pipeline.
- Reduces gateway-level 401 for export requests when valid user session exists.

## Scope
- Export invocation path and function gateway policy only.
- No DB migration required.
