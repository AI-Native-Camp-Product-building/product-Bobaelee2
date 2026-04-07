import { describe, it, expect } from "vitest";
import { calculatePercentile } from "@/lib/store";

describe("calculatePercentile", () => {
  it("중간값이면 약 50%를 반환한다", () => {
    expect(calculatePercentile(50, 5, 10)).toBe(50);
  });
  it("최고값이면 상위 10% 이하를 반환한다", () => {
    expect(calculatePercentile(100, 10, 10)).toBeLessThanOrEqual(10);
  });
  it("최저값이면 상위 90% 이상을 반환한다", () => {
    expect(calculatePercentile(0, 0, 10)).toBeGreaterThanOrEqual(90);
  });
  it("전체 0명이면 50을 반환한다", () => {
    expect(calculatePercentile(50, 0, 0)).toBe(50);
  });
});
