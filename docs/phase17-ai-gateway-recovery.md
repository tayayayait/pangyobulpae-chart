# Phase 17 Change Log (AI Gateway Recovery)

## Incident
- `analyze-chart` failed with runtime error: `AI_GATEWAY_API_KEY missing`.
- After injecting secrets, requests still failed in some cases due gateway/image handling mismatch.

## Operational Changes
- Supabase project secrets were added:
  - `AI_GATEWAY_API_KEY`
  - `AI_GATEWAY_BASE_URL`

## Code Changes
- Files:
  - `supabase/functions/analyze-chart/index.ts`
  - `supabase/functions/regenerate-summary/index.ts`
- Added AI gateway config resolver with fallback support:
  - API key fallback: `AI_GATEWAY_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`
  - Base URL fallback: `AI_GATEWAY_BASE_URL`, `GEMINI_BASE_URL`, default Google OpenAI base URL
  - Endpoint/model selection by provider type
- Added image preprocessing:
  - Fetch chart image in function runtime
  - Convert bytes to Base64 data URL before sending to model

## Deployment
- `analyze-chart` redeployed with JWT disabled:
  - `npx supabase functions deploy analyze-chart --no-verify-jwt`
- `regenerate-summary` redeployed:
  - `npx supabase functions deploy regenerate-summary`

## Verification
- Secret list now includes both `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL`.
- Direct function invocation with known accessible image returned `200` and structured `analysis` payload.

