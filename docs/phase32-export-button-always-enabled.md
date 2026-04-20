# Phase 32 - Export Button Always Enabled

## Summary
- Changed editor behavior so the `PPTX 내보내기` button is always enabled.
- Existing gating checks (review status, length limits, job status, chart presence) no longer block button interaction in the UI.

## Changed File
- `src/pages/Editor.tsx`
  - Removed `isExportDisabled` usage and fixed `exportDisabled` to `false`.

## Impact
- Users can always click `PPTX 내보내기` regardless of current validation/review state.
- Export success still depends on server-side processing and runtime conditions.
