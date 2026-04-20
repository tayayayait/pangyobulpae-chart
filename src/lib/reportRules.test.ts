import { describe, expect, it } from "vitest";
import {
  applyAnalysisVariantSelection,
  getAnalysisSelectedVariantIndex,
  getAnalysisVariants,
  LOGO_MAX_BYTES,
  markAnalysisAsCustomSelection,
  isExportDisabled,
  markAnalysisFieldReviewed,
  validateLogoFile,
} from "./reportRules";

describe("reportRules", () => {
  it("blocks export until low-confidence fields are reviewed", () => {
    const analysis = {
      fields: {
        headline: { value: "headline", confidence: 0.62 },
        source: { value: "source", confidence: 0.94 },
      },
    };

    expect(
      isExportDisabled({
        status: "review_required",
        headlineOver: false,
        summaryOver: false,
        sourceOver: false,
        hasChartImage: true,
        analysis,
      }),
    ).toBe(true);

    const reviewed = markAnalysisFieldReviewed(analysis, "headline", "keep");

    expect(
      isExportDisabled({
        status: "review_required",
        headlineOver: false,
        summaryOver: false,
        sourceOver: false,
        hasChartImage: true,
        analysis: reviewed,
      }),
    ).toBe(false);
  });

  it("validates logo mime type and size", () => {
    expect(validateLogoFile({ name: "logo.jpg", type: "image/jpeg", size: 1024 })).toMatch(/PNG.*SVG/i);
    expect(validateLogoFile({ name: "logo.png", type: "image/png", size: LOGO_MAX_BYTES + 1 })).toContain("2MB");
    expect(validateLogoFile({ name: "logo.svg", type: "image/svg+xml", size: LOGO_MAX_BYTES })).toBeNull();
  });

  it("blocks export while export job is queued or processing", () => {
    expect(
      isExportDisabled({
        status: "ready",
        exportStatus: "queued",
        headlineOver: false,
        summaryOver: false,
        sourceOver: false,
        hasChartImage: true,
      }),
    ).toBe(true);

    expect(
      isExportDisabled({
        status: "ready",
        exportStatus: "processing",
        headlineOver: false,
        summaryOver: false,
        sourceOver: false,
        hasChartImage: true,
      }),
    ).toBe(true);
  });

  it("normalizes variants and guarantees three candidates", () => {
    const variants = getAnalysisVariants(
      {
        variants: [
          {
            headline: "A".repeat(40),
            summary: ["line1", "line2", "line3", "line4"],
          },
        ],
      },
      {
        headline: "fallback headline",
        summaryLines: ["fallback 1", "fallback 2", "fallback 3"],
      },
    );

    expect(variants).toHaveLength(3);
    expect(variants[0].headline.length).toBeLessThanOrEqual(44);
    expect(variants[0].summary).toHaveLength(3);
    expect(variants[1].headline).toBe("");
    expect(variants[2].summary).toEqual(["", "", ""]);
  });

  it("uses legacy headline/summary fallback when variants are missing", () => {
    const variants = getAnalysisVariants(
      {},
      {
        headline: "기존 헤드라인",
        summaryLines: ["요약1", "요약2", "요약3"],
      },
    );

    expect(variants[0].headline).toBe("기존 헤드라인");
    expect(variants[0].summary).toEqual(["요약1", "요약2", "요약3"]);
    expect(variants[1]).toEqual({ headline: "", summary: ["", "", ""] });
    expect(variants[2]).toEqual({ headline: "", summary: ["", "", ""] });
  });

  it("tracks variant selection and custom transition", () => {
    const analysis = {
      variants: [
        { headline: "v1", summary: ["a", "b", "c"] },
        { headline: "v2", summary: ["d", "e", "f"] },
        { headline: "v3", summary: ["g", "h", "i"] },
      ],
    };

    const selected = applyAnalysisVariantSelection(analysis, 2);
    expect(getAnalysisSelectedVariantIndex(selected)).toBe(2);

    const custom = markAnalysisAsCustomSelection(selected);
    expect(getAnalysisSelectedVariantIndex(custom)).toBeNull();
  });

  it("preserves three summary sentences for each variant", () => {
    const variants = getAnalysisVariants({
      variants: [{ headline: "v1", summary: ["첫째 문장", "둘째 문장", "셋째 문장"] }],
    });

    expect(variants[0].summary).toEqual(["첫째 문장", "둘째 문장", "셋째 문장"]);
  });
});
