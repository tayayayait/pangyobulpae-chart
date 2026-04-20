# Phase 23 Change Log (export-pptx 401 Retry Hardening)

## Problem
- `POST /functions/v1/export-pptx` intermittently returned `401 Unauthorized` in the editor export flow.
- UI only showed the generic `Edge Function returned a non-2xx status code`, which hid the real failure reason.

## Root Cause
- `401` at the function gateway means the JWT in `Authorization` was rejected before function execution.
- Single-shot invocation had no targeted recovery path for token boundary cases (expired/invalid token at invocation time).

## Changes
- File: `src/pages/Editor.tsx`
  - Added JWT shape sanitization for access tokens before use.
  - Extended `getValidAccessToken` with `forceRefresh` option to support explicit retry paths.
  - Added `readEdgeFunctionErrorMessage` to parse HTTP error payloads from function responses.
  - Updated export flow:
    - first invoke uses validated token,
    - if response is HTTP `401`, force refresh token and retry once,
    - surface parsed function error message instead of generic message when available.

## Expected Effect
- Reduces export failures caused by transient/invalid token boundaries.
- Produces actionable export error messages for faster diagnosis.

## Scope
- No schema, migration, or Supabase function source changes.
- Frontend retry/recovery and error observability only.
