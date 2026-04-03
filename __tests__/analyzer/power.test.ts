import { describe, it, expect } from "vitest";
import { calculateMdPower } from "@/lib/analyzer/power";
import type { DimensionScores, MdStats } from "@/lib/types";

function makeScores(overrides: Partial<DimensionScores> = {}): DimensionScores {
  return { automation: 0, control: 0, toolDiversity: 0, maturity: 0, collaboration: 0, security: 0, ...overrides };
}

function makeStats(overrides: Partial<MdStats> = {}): MdStats {
  return {
    totalLines: 0, sectionCount: 0, toolNames: [], hasMemory: false, hasHooks: false,
    hasProjectMd: false, ruleCount: 0, keywordHits: {},
    pluginCount: 0, mcpServerCount: 0, commandCount: 0, hookCount: 0,
    pluginNames: [], mcpServerNames: [], commandNames: [], isExpandedInput: false,
    denyCount: 0, blocksDangerousOps: false, hookPromptCount: 0, hookCommandCount: 0,
    pluginEnabledRatio: 0, projectMdCount: 0,
    ...overrides,
  };
}

describe("calculateMdPower", () => {
  it("모든 차원 0이면 Egg 티어", () => {
    const result = calculateMdPower(makeScores(), makeStats());
    expect(result.score).toBe(0);
    expect(result.tier).toBe("egg");
  });

  it("6개 차원 합계만으로 기본 점수가 계산된다", () => {
    const scores = makeScores({ automation: 50, control: 50, toolDiversity: 50, maturity: 50, collaboration: 50, security: 50 });
    const result = calculateMdPower(scores, makeStats());
    expect(result.score).toBe(300);
    expect(result.tier).toBe("sapling");
  });

  it("확장 입력 시 에코시스템 보너스가 적용된다", () => {
    const scores = makeScores({ automation: 50, control: 50, toolDiversity: 50, maturity: 50, collaboration: 50, security: 50 });
    const stats = makeStats({ isExpandedInput: true, pluginCount: 5, mcpServerCount: 3, commandCount: 4, hookCount: 3 });
    const result = calculateMdPower(scores, stats);
    // 기본 300 + 에코(50+45+20+15) = 300 + 130 = 430
    expect(result.score).toBe(430);
    expect(result.tier).toBe("tree");
  });

  it("심층 보너스가 적용된다", () => {
    const scores = makeScores({ automation: 80, control: 60, toolDiversity: 80, maturity: 80, collaboration: 60, security: 80 });
    const stats = makeStats({
      isExpandedInput: true, pluginCount: 8, mcpServerCount: 4, commandCount: 8, hookCount: 4,
      blocksDangerousOps: true, hookPromptCount: 1, hookCommandCount: 3, projectMdCount: 3,
    });
    const result = calculateMdPower(scores, stats);
    // 기본 440 + 에코(80+60+40+20=200) + 심층(40+20+30+30=120) = 760
    expect(result.score).toBe(760);
    expect(result.tier).toBe("oak");
  });

  it("최대 1000을 초과하지 않는다", () => {
    const scores = makeScores({ automation: 100, control: 100, toolDiversity: 100, maturity: 100, collaboration: 100, security: 100 });
    const stats = makeStats({
      isExpandedInput: true, pluginCount: 20, mcpServerCount: 10, commandCount: 20, hookCount: 10,
      blocksDangerousOps: true, hookPromptCount: 5, hookCommandCount: 5, projectMdCount: 10,
    });
    const result = calculateMdPower(scores, stats);
    expect(result.score).toBeLessThanOrEqual(1000);
    expect(result.tier).toBe("sequoia");
  });

  it("티어 경계값이 정확하다", () => {
    const cases: [number, string][] = [
      [0, "egg"], [99, "egg"],
      [100, "sprout"], [249, "sprout"],
      [250, "sapling"], [399, "sapling"],
      [400, "tree"], [599, "tree"],
      [600, "oak"], [799, "oak"],
      [800, "sequoia"], [1000, "sequoia"],
    ];

    for (const [targetScore, expectedTier] of cases) {
      // 기본 점수만으로 티어 확인 (에코 보너스 없이)
      const perDim = Math.floor(targetScore / 6);
      const remainder = targetScore - perDim * 6;
      const scores = makeScores({
        automation: perDim + (remainder > 0 ? 1 : 0),
        control: perDim + (remainder > 1 ? 1 : 0),
        toolDiversity: perDim + (remainder > 2 ? 1 : 0),
        maturity: perDim + (remainder > 3 ? 1 : 0),
        collaboration: perDim + (remainder > 4 ? 1 : 0),
        security: perDim + (remainder > 5 ? 1 : 0),
      });
      const result = calculateMdPower(scores, makeStats());
      expect(result.tier).toBe(expectedTier);
    }
  });
});
