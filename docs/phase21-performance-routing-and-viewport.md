# Phase 21: Performance Routing & Viewport Optimization

## Summary
- Applied route-level code splitting with `React.lazy` and `Suspense` in `src/App.tsx`.
- Replaced duplicated `resize` listeners with a shared viewport store hook: `src/hooks/useViewportWidth.ts`.
- Updated `Reports` card images to use lazy loading attributes.
- Added Rollup manual chunk splitting in `vite.config.ts` to reduce single-entry chunk pressure.

## Changes
1. Route lazy loading
- File: `src/App.tsx`
- Replaced static imports for `Auth`, `Reports`, `Editor`, `Unsupported`, `NotFound` with `lazy(() => import(...))`.
- Wrapped route tree with `Suspense` fallback.

2. Shared viewport subscription
- New file: `src/hooks/useViewportWidth.ts`
- Implemented `useSyncExternalStore`-based width store.
- Ensures one global `resize` listener regardless of subscriber count.

3. Screen adoption
- File: `src/App.tsx`
  - `ViewportGate` now reads width from `useViewportWidth`.
- File: `src/pages/Reports.tsx`
  - Removed local `resize` listener state and switched to `useViewportWidth`.
- File: `src/pages/Editor.tsx`
  - Removed local `resize` listener state and switched to `useViewportWidth`.

4. Rendering optimization
- File: `src/pages/Reports.tsx`
  - Added `loading="lazy"` and `decoding="async"` to report card images.

5. Build chunk strategy
- File: `vite.config.ts`
- Added `build.rollupOptions.output.manualChunks` and split major dependency groups:
  - `react-vendor`
  - `query-vendor`
  - `supabase-vendor`
  - `ui-vendor`

## Expected Impact
- Lower initial bundle payload on non-editor routes.
- Reduced duplicate global event listener registration.
- Reduced image decode/network pressure on initial report list render.

## Validation
- Run `npm run build` and compare chunk distribution.
- Run `npm test` to verify no behavioral regression.
