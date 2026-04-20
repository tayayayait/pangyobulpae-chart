import { describe, expect, it } from "vitest";
import { getConfidenceMeta } from "@/lib/confidence";

describe("getConfidenceMeta", () => {
  it("returns high label at 0.85+", () => {
    expect(getConfidenceMeta(0.85).label).toBe("높음");
  });

  it("returns medium label at 0.75~0.84", () => {
    expect(getConfidenceMeta(0.8).label).toBe("보통");
  });

  it("returns review-needed label at 0.55~0.74", () => {
    expect(getConfidenceMeta(0.6).label).toBe("검토 필요");
  });

  it("returns required-fix label below 0.55", () => {
    expect(getConfidenceMeta(0.42).label).toBe("수정 필요");
  });
});
