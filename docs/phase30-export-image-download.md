# Phase 30 - Export Image Download (PNG)

## Problem
- Editor export flow supported only PPTX download.
- Users needed a way to save the final card output immediately as an image file.

## Changes
- Added image export action to `ExportModal` done state:
  - `PPTX 다운로드`
  - `이미지 다운로드`
- Added a persistent `이미지 다운로드` button to the editor action area (right panel / floating bottom bar) so users can save PNG without waiting for PPTX export completion.
- Added preview capture target in `PreviewCanvas` via `data-export-slide-root="true"`.
- Added client-side PNG generation in `Editor` using `html-to-image`:
  - Captures the slide root node at `1440x1800` (`SLIDE_W`, `SLIDE_H`)
  - Forces `transform: none` at export-time to avoid scaled preview artifacts
  - Downloads as `C2I_YYYYMMDD_<headline-or-report-id>.png`
- Changed `html-to-image` loading to dynamic import inside the image-download handler so editor route loading is not blocked by temporary Vite optimize-cache mismatch.
- Added fallback loader for Vite dev optimize-cache mismatch:
  - On initial import failure, reads `/node_modules/.vite/deps/_metadata.json` and retries with current `browserHash`.
  - If still unavailable, retries with direct dep path cache-bust query.
- Added `html-to-image` dependency.

## Verification
- `npm test` passes.
- After PPTX export completes, Export modal exposes both PPTX and PNG download buttons.
- PNG download works from the same final preview content shown in editor.
