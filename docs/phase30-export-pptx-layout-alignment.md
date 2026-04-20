# Phase 30 - PPTX Export Layout Alignment

## Scope
- Align the exported PPTX slide layout with the editor preview/reference draft for header label color, summary area, source position, and footer premium/date composition.

## Files Changed
- `supabase/functions/export-pptx/index.ts`

## Change Details
1. Header right label color alignment
- Changed the right header label box fill color (`부동산 PICK` / `WALL ST`) to use the same resolved top/bottom bar color (`topBarColorHex`) instead of a separate dark-blue constant.

2. Summary area text fitting
- Updated summary font scaling thresholds to match the preview logic.
- Added `fit: "shrink"` to both summary badge title and summary body text so long strings stay inside their boxes.
- Tightened summary badge title box inset and vertical alignment to prevent awkward wrapping.

3. SOURCE position alignment
- Moved `SOURCE:` from footer area to the chart-bottom right area:
  - `x: chartZone.x`
  - `y: chartZone.y + chartZone.h + 8`
  - `w: chartZone.w`
  - right aligned, dark text (`#111111`)

4. Premium footer composition alignment
- Reworked premium mark text block to a stable two-line composition (`Premium / Contents.`) with adjusted size and vertical position.
- Shifted the footer Korean copy and date text down to better match the reference visual baseline.

## Verification
- Run `npm test` and verify all tests pass.
- Validate exported PPTX visually against the reference screenshot for:
  - header right label color parity with bars,
  - summary area text containment,
  - source position under chart-right,
  - premium/date footer alignment.
