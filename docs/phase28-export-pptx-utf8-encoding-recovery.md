# Phase 28 - export-pptx UTF-8 Encoding Recovery

## Problem
- PPTX export size/layout was corrected, but Korean text rendered as broken glyphs (`□`, `?`, or mojibake) in downloaded slides.
- Affected texts included fixed labels such as brand/header/category/footer strings.

## Root Cause
- `supabase/functions/export-pptx/index.ts` was saved in a non-UTF-8 codepage during local edits.
- Supabase Edge Functions (Deno) read source as UTF-8, so Korean literals were decoded incorrectly and written as corrupted text into PPT.

## Changes
- Converted `supabase/functions/export-pptx/index.ts` source encoding to UTF-8 (no BOM).
- Verified key literals (`판교불패`, `부동산 이슈를 한눈에`, `핵심요약`, `네이버프리미엄 콘텐츠 제공`) decode correctly from UTF-8.
- Kept Phase 27 font-scaling fix intact (`layout.ts` shared conversion helpers).

## Verification
- Confirmed replacement character count in source is `0`.
- Confirmed Korean literals decode correctly via UTF-8 read.
- Run `npm test` and ensure all tests pass.

## Deployment
- Redeploy `export-pptx` after this fix:
  - `npx supabase functions deploy export-pptx --project-ref wpcolzucohrwgxmquyoc --no-verify-jwt`