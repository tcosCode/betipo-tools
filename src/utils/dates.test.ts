import { describe, expect, it } from "vitest";

import {
  dbDateToUtc,
  formatSpainDateTime,
  spainToUtc,
  utcToSpain,
} from "./dates";

describe("date utilities", () => {
  it("returns empty strings for empty inputs", () => {
    expect(utcToSpain("")).toBe("");
    expect(spainToUtc("")).toBe("");
    expect(formatSpainDateTime("")).toBe("");
    expect(dbDateToUtc("")).toBe("");
  });

  it("converts UTC dates to Spain datetime-local values", () => {
    expect(utcToSpain("2026-01-30T15:10:00.000Z")).toBe("2026-01-30T16:10");
  });

  it("converts Spain datetime-local values to UTC ISO strings", () => {
    expect(spainToUtc("2026-01-30T16:10")).toBe("2026-01-30T15:10:00.000Z");
  });

  it("formats UTC dates in Spain time", () => {
    expect(formatSpainDateTime("2026-01-30T15:10:00.000Z")).toBe(
      "30/01/2026 04:10 PM",
    );
  });

  it("converts database timestamp text to UTC ISO text", () => {
    expect(dbDateToUtc("2026-01-30 15:10:00.000")).toBe(
      "2026-01-30T15:10:00.000Z",
    );
  });
});
