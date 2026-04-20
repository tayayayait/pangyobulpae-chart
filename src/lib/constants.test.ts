import { describe, expect, it } from "vitest";
import {
  getCategoryDisplayLabel,
  getCategoryDisplayLabelExact,
  getCategoryLabel,
  getHeaderLabelCodeByTitle,
  getHeaderLabelText,
  getHeaderTitleLabel,
  normalizeCategory,
  normalizeCategoryValue,
  normalizeHeaderLabel,
  normalizeHeaderTitle,
} from "./constants";

describe("category normalization", () => {
  it("normalizes legacy english values", () => {
    expect(normalizeCategory("Markets")).toBe("US_MARKET");
    expect(normalizeCategory("Macro")).toBe("MACRO");
    expect(normalizeCategory("Equities")).toBe("US_MARKET");
  });

  it("normalizes korean labels", () => {
    expect(normalizeCategory("미국증시")).toBe("US_MARKET");
    expect(normalizeCategory("채권")).toBe("FUTURES");
    expect(normalizeCategory("매크로")).toBe("MACRO");
  });

  it("falls back to OTHER for unknown values", () => {
    expect(normalizeCategory("unknown-category")).toBe("OTHER");
  });

  it("returns korean label from any known value", () => {
    expect(getCategoryLabel("US_MARKET")).toBe("미국증시");
    expect(getCategoryLabel("Markets")).toBe("미국증시");
    expect(getCategoryLabel("unknown")).toBe("기타");
  });

  it("keeps custom category values for editing/selecting", () => {
    expect(normalizeCategoryValue("Macro")).toBe("MACRO");
    expect(normalizeCategoryValue("  커스텀 카테고리  ")).toBe("커스텀 카테고리");
  });

  it("returns display label for both built-in and custom categories", () => {
    expect(getCategoryDisplayLabel("US_MARKET")).toBe("미국증시");
    expect(getCategoryDisplayLabel("커스텀 카테고리")).toBe("커스텀 카테고리");
  });

  it("keeps non-exact aliases as custom text in exact display mode", () => {
    expect(getCategoryDisplayLabelExact("US_MARKET")).toBe("미국증시");
    expect(getCategoryDisplayLabelExact("거시경제")).toBe("거시경제");
  });
});

describe("header title normalization", () => {
  it("supports option code and both current/legacy label values", () => {
    expect(normalizeHeaderTitle("REAL_ESTATE_ISSUES")).toBe("REAL_ESTATE_ISSUES");
    expect(normalizeHeaderTitle("월가 이슈를 한눈에")).toBe("WALL_ST_ISSUES");
    expect(normalizeHeaderTitle("월스트리트 이슈 한판승부")).toBe("WALL_ST_ISSUES");
  });

  it("falls back to default value for unknown title", () => {
    expect(normalizeHeaderTitle("unknown-title")).toBe("REAL_ESTATE_ISSUES");
  });

  it("returns normalized label text", () => {
    expect(getHeaderTitleLabel("WALL_ST_ISSUES")).toBe("월가 이슈를 한눈에");
  });
});

describe("header label normalization", () => {
  it("supports code, label and alias values", () => {
    expect(normalizeHeaderLabel("WALL_ST")).toBe("WALL_ST");
    expect(normalizeHeaderLabel("WALL ST")).toBe("WALL_ST");
    expect(normalizeHeaderLabel("wallst")).toBe("WALL_ST");
  });

  it("falls back to default value for unknown label", () => {
    expect(normalizeHeaderLabel("unknown-label")).toBe("REAL_ESTATE_PICK");
  });

  it("returns normalized label text", () => {
    expect(getHeaderLabelText("REAL_ESTATE_PICK")).toBe("부동산 PICK");
  });
});

describe("header title to label mapping", () => {
  it("maps each header title to its fixed label code", () => {
    expect(getHeaderLabelCodeByTitle("REAL_ESTATE_ISSUES")).toBe("REAL_ESTATE_PICK");
    expect(getHeaderLabelCodeByTitle("WALL_ST_ISSUES")).toBe("WALL_ST");
  });

  it("maps localized title labels to the same fixed label code", () => {
    expect(getHeaderLabelCodeByTitle("부동산 이슈를 한눈에")).toBe("REAL_ESTATE_PICK");
    expect(getHeaderLabelCodeByTitle("월가 이슈를 한눈에")).toBe("WALL_ST");
    expect(getHeaderLabelCodeByTitle("월스트리트 이슈 한판승부")).toBe("WALL_ST");
  });
});
