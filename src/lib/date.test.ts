import { describe, expect, it } from "vitest";
import { formatSlideDateShortFromIso, getCurrentKstDateIso, getCurrentKstSlideDateShort } from "./date";

describe("date helpers", () => {
  it("calculates current KST date in ISO format", () => {
    const utcLateNight = new Date("2026-04-17T15:30:00.000Z");
    expect(getCurrentKstDateIso(utcLateNight)).toBe("2026-04-18");
  });

  it("formats ISO date into slide footer format", () => {
    expect(formatSlideDateShortFromIso("2026-04-18")).toBe("26.4.18");
    expect(formatSlideDateShortFromIso("invalid")).toBe("invalid");
  });

  it("returns current KST footer date format", () => {
    const utcLateNight = new Date("2026-04-17T15:30:00.000Z");
    expect(getCurrentKstSlideDateShort(utcLateNight)).toBe("26.4.18");
  });
});
