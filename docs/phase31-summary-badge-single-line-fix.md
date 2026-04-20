# Phase 31 - Summary Badge Single-Line Fix

## Scope
- Fix awkward line wrap in the `핵심요약` badge text in exported PPTX.

## Files Changed
- `supabase/functions/export-pptx/index.ts`
- `src/components/PreviewCanvas.tsx`

## Changes
- Export badge text now uses a stable single-line configuration:
  - Removed `fit: "shrink"` on the badge title
  - Reduced badge title font size
  - Expanded text box to full badge width/height
  - Set `breakLine: false` to prevent unwanted wrap
  - Switched badge title font to `Malgun Gothic` for stable Korean glyph rendering in PowerPoint
- Preview badge font size was adjusted to better match export output.

## Verification
- Run `npm test` and verify all tests pass.
