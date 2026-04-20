# Phase 27 - export-pptx Font Scaling Fix

## Problem
- Downloaded PPTX opened with severe text overlap and layout breakage.
- Chart image/frame positions looked mostly correct, but headline/category/summary/footer text rendered much larger than preview.

## Root Cause
- Export function used two different scaling rules:
  - Shape/image positions and sizes: template px -> slide inches (`8 / 1440`).
  - Font size: template px -> points using fixed `0.75` multiplier (`pt = px * 0.75`).
- This made text about `1.875x` larger than the layout scale (`0.75 / 0.4`).

## Changes
- `supabase/functions/export-pptx/layout.ts`
  - Added shared layout conversion helpers:
    - `pxToInches`
    - `pxToPoints` (derived from the same layout ratio).
- `supabase/functions/export-pptx/index.ts`
  - Replaced local `px`/`pt` conversion logic with helpers from `layout.ts`.
  - Font and geometry now use one consistent scaling basis.
- `src/lib/pptxLayoutScale.test.ts`
  - Added regression tests for inch conversion and point conversion.

## Expected Result
- Downloaded PPTX text box content no longer explodes outside intended areas.
- Preview and exported PPTX typography scale are aligned.

## Verification
- Run `npm test` and ensure all tests pass, including `pptxLayoutScale.test.ts`.