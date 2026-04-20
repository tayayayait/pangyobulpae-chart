import { describe, expect, it } from "vitest";
import { pxToInches, pxToPoints } from "../../supabase/functions/export-pptx/layout";

describe("export-pptx layout scaling", () => {
  it("converts template px to slide inches using 4:5 layout scale", () => {
    expect(pxToInches(1440)).toBeCloseTo(8, 8);
    expect(pxToInches(1800)).toBeCloseTo(10, 8);
  });

  it("scales font px to PPT points with the same layout ratio", () => {
    expect(pxToPoints(132)).toBeCloseTo(52.8, 8);
    expect(pxToPoints(70)).toBeCloseTo(28, 8);
    expect(pxToPoints(58)).toBeCloseTo(23.2, 8);
  });
});