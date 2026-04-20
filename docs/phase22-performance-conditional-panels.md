# Phase 22: Conditional Editor Panels & Re-render Optimization

## Summary
- Applied `bundle-conditional` by lazy-loading editor-only UI blocks.
- Applied `rerender-memo` / `rerender-no-inline-components` by splitting editor panels into dedicated components.
- Applied `rendering-content-visibility` candidate to report list cards.

## Implemented Changes
1. Conditional loading for editor-only blocks
- `src/pages/Editor.tsx`
  - Added lazy imports:
    - `LazyEditorRightPanel`
    - `LazyExportModal`
  - Rendered both through `Suspense` and mounted only when needed:
    - Right panel: only when aside is visible or drawer is open.
    - Export modal: only when `exportOpen === true`.

2. Editor panel component split
- New components:
  - `src/components/editor/EditorLeftPanel.tsx`
  - `src/components/editor/EditorPreviewPanel.tsx`
  - `src/components/editor/EditorRightPanel.tsx`
  - `src/components/editor/EditorActionButtons.tsx`
- `src/pages/Editor.tsx`
  - Replaced large inline panel JSX/functions with imported components.
  - Added callback stabilization using `useCallback` for major update handlers.

3. Listener and rendering follow-up
- `src/pages/Reports.tsx`
  - Added `content-visibility: auto` and `contain-intrinsic-size` to report cards.
  - Existing `loading=\"lazy\"`, `decoding=\"async\"` 유지.

## Build Validation
- `npm run build` success.
- New split chunks confirmed:
  - `assets/EditorRightPanel-*.js`
  - `assets/ExportModal-*.js`
- `/reports` path no longer carries editor-side panel/modal code in main route chunk.

## Test Validation
- `npm test` success.
- 5 test files, 30 tests passed.

## Hotfix
- `src/pages/Editor.tsx`
  - Fixed runtime TDZ error (`Cannot access 'pendingLowConfidenceSet' before initialization`).
  - Cause: `useCallback` dependency referenced `pendingLowConfidenceSet` before its declaration.
  - Fix: removed forward reference and computed headline-review condition from `row.analysis` inside callback.
