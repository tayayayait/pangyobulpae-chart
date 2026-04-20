# Phase 29 - Manual Core Summary Editing

## Problem
- The right panel allowed direct edit for `headline`, but `핵심요약` (`summary_lines`) had no manual input control.
- Users had to rely on AI regeneration to update summary copy.

## Changes
- Added `핵심요약` textarea to the right panel (`EditorRightPanel`) with 3-line input (newline separated).
- Added per-line counters (`1행/2행/3행`) using `SUMMARY_MAX`.
- Added manual summary edit handler in `Editor.tsx`:
  - Parses textarea text into `[string, string, string]`.
  - Writes to `summary_lines`.
  - Marks analysis selection as custom (`selectedVariantIndex = null`) like headline manual edits.
- Wired new props for both aside mode and drawer mode so behavior is identical across layouts.

## Verification
- In editor right panel, edit summary text directly and confirm preview updates immediately.
- Confirm validation/export gating still follows existing summary rules (`SUMMARY_MIN`, `SUMMARY_MAX`, 3 lines required).
- Run `npm test`.
