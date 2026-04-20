# Phase 16 Change Log (Disable JWT on analyze-chart)

## Objective
- Remove persistent `401 Unauthorized` on `functions/v1/analyze-chart`.

## Changes
- Updated [`supabase/config.toml`](../supabase/config.toml):
  - `[functions.analyze-chart] verify_jwt = false`
- Deployed the function with JWT verification disabled:
  - `npx supabase functions deploy analyze-chart --no-verify-jwt`

## Deployment Result
- Project: `wpcolzucohrwgxmquyoc`
- Function: `analyze-chart`
- Deploy command returned success.

## Notes
- With `verify_jwt=false`, the function can be called without a valid user JWT.
- This resolves auth-gate 401 at the function edge, but increases exposure to unauthenticated invocation.
