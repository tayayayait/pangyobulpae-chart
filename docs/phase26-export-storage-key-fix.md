# Phase 26 Change Log (export-pptx Storage Key Fix)

## Problem
- `export-pptx` returned HTTP `500` after gateway auth was resolved.
- Function logs showed `InvalidKey` from Supabase Storage with a key containing Korean headline text.

## Root Cause
- The storage object path reused the user-facing headline slug.
- Filename generation allowed Korean characters, but the `exports` object key path was rejected by Supabase Storage.

## Changes
- File: `supabase/functions/export-pptx/index.ts`
  - Added `toStorageKeySegment()` to build ASCII-safe storage key segments.
  - Storage filename now uses an ASCII-only headline token.
  - When headline cannot produce an ASCII token, fallback is `report-<reportId-prefix>`.

## Expected Effect
- Prevents `InvalidKey` on upload/signed URL creation for Korean or mixed-language headlines.
- Keeps per-report object keys deterministic and safe for storage APIs.
