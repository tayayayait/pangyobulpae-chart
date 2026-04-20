# Phase 22 - Summary Font Size Increase

## Scope
- Increase font size in the `핵심요약` body text area (`summaryTextZone`) on the social card preview.

## Files Changed
- `src/components/PreviewCanvas.tsx`

## Change Detail
- Updated `getSummaryFontSize(lines)` return values:
  - For 3 lines:
    - `54 -> 58`
    - `50 -> 54`
    - `46 -> 50`
  - For 1 to 2 lines:
    - `59 -> 63`
    - `54 -> 58`
    - `48 -> 52`

## Expected Result
- Summary text appears visibly larger than before while preserving line wrapping and existing layout box constraints.

## Verification
- Run `npm test` and confirm no regression in existing unit tests.
