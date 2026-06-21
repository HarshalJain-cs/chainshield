import { describe, it, expect } from "vitest";
import { fmtUsd, fmtNum, formatPremium, products, type CoverageProduct } from "@/lib/mock/data";

describe("fmtUsd", () => {
  it("formats billions", () => {
    expect(fmtUsd(11_800_000_000)).toBe("$11.80B");
  });
  it("formats millions", () => {
    expect(fmtUsd(5_200_000)).toBe("$5.20M");
  });
  it("formats thousands", () => {
    expect(fmtUsd(25_000)).toBe("$25.0K");
  });
  it("formats small amounts with cents", () => {
    expect(fmtUsd(89)).toBe("$89.00");
  });
});

describe("fmtNum", () => {
  it("formats millions", () => {
    expect(fmtNum(2_890_000)).toBe("2.89M");
  });
  it("formats thousands", () => {
    expect(fmtNum(1_240)).toBe("1.2K");
  });
  it("passes small numbers through", () => {
    expect(fmtNum(42)).toBe("42");
  });
});

describe("formatPremium", () => {
  const make = (premiumModel: CoverageProduct["premiumModel"], premium: number): CoverageProduct => ({
    id: "x", line: "defi", name: "X", symbol: "X", category: "c", region: "r",
    tier: "Standard", risk: "Low", premium, premiumModel,
    capacityUsd: 0, utilizationPct: 0, tvlUsd: 0, color: "0 0% 0%",
  });

  it("formats APY percentage", () => {
    expect(formatPremium(make("pct_apy", 2.1))).toBe("2.10%");
  });
  it("formats monthly USD", () => {
    expect(formatPremium(make("monthly_usd", 89))).toBe("$89/mo");
  });
  it("formats annual USD", () => {
    expect(formatPremium(make("annual_usd", 1180))).toBe("$1180/yr");
  });
  it("formats flat USD", () => {
    expect(formatPremium(make("flat_usd", 78))).toBe("$78 flat");
  });
});

describe("product catalog", () => {
  it("has products across every coverage line", () => {
    const lines = new Set(products.map((p) => p.line));
    expect(lines).toContain("defi");
    expect(lines).toContain("health");
    expect(lines).toContain("auto");
    expect(lines).toContain("life");
    expect(lines).toContain("travel");
  });
  it("has unique product ids", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
