# Phase 24 Change Log (Auth 422 Noise + Export JWT Guard)

## Problem
- Browser console repeatedly showed `POST /auth/v1/signup 422`.
- `export-pptx` intermittently failed with auth-related status and message (`인증이 필요합니다.`).
- Dialog accessibility warning appeared: missing `Description`/`aria-describedby` for `DialogContent`.

## Root Cause
- `signInAnonymously()` was called automatically in auth bootstrap paths while anonymous provider is disabled in project settings.
- Export flow accepted any JWT-shaped token string; relay/gateway and function-side auth can still fail when token is not a real user access token.
- Export modal lacked `DialogDescription`.

## Changes
- File: `src/hooks/useAuth.ts`
  - Added `VITE_ENABLE_ANONYMOUS_LOGIN` gate.
  - Anonymous auto-login now runs only when this flag is explicitly `true`.
- File: `src/pages/Auth.tsx`
  - Applied same `VITE_ENABLE_ANONYMOUS_LOGIN` gate for initial guest bootstrap.
- File: `src/pages/Editor.tsx`
  - Added JWT payload decode and `sub` claim validation in access-token sanitization.
  - Kept refresh/retry path; added explicit user-facing 401 auth message fallback.
- File: `src/components/ExportModal.tsx`
  - Added `DialogDescription` (screen-reader-only) to satisfy Radix accessibility requirement.

## Expected Effect
- Removes repeated 422 noise from disabled anonymous auth endpoint.
- Reduces export auth failures caused by non-user tokens.
- Removes dialog accessibility warning in console.

## Config Note
- Enable guest auto-login only when needed:
  - `VITE_ENABLE_ANONYMOUS_LOGIN=true`
