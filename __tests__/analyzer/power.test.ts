import { describe, it, expect } from "vitest";
import { calculateMdPower } from "@/lib/analyzer/power";
import type { QualityScores, MdStats } from "@/lib/types";

function makeQuality(overrides: Partial<QualityScores> = {}): QualityScores {
  return { actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0, ...overrides };
}

function makeStats(overrides: Partial<MdStats> = {}): MdStats {
  return {
    totalLines: 0, sectionCount: 0, toolNames: [], hasMemory: false, hasHooks: false,
    hasProjectMd: false, hasRoleDefinition: false, ruleCount: 0, claudeMdLines: 0, keywordHits: {}, keywordUniqueHits: {},
    pluginCount: 0, mcpServerCount: 0, commandCount: 0, hookCount: 0,
    skillCount: 0, agentCount: 0,
    skillNames: [], pluginSkillCount: 0, userSkillCount: 0, pluginAgentCount: 0, userAgentCount: 0,
    pluginNames: [], mcpServerNames: [], commandNames: [], isExpandedInput: false,
    denyCount: 0, blocksDangerousOps: false, hookPromptCount: 0, hookCommandCount: 0,
    pluginEnabledRatio: 0, projectMdCount: 0,
    ...overrides,
  };
}

describe("calculateMdPower (품질 기반)", () => {
  it("모든 차원 0이면 Egg 티어", () => {
    const result = calculateMdPower(makeQuality(), makeStats());
    expect(result.score).toBe(0);
    expect(result.tier).toBe("egg");
  });

  it("5개 차원 합산 × 2로 점수가 계산된다", () => {
    const quality = makeQuality({ actionability: 50, conciseness: 50, structure: 50, uniqueness: 50, safety: 50 });
    const result = calculateMdPower(quality, makeStats());
    // 250 × 2 = 500
    expect(result.score).toBe(500);
    expect(result.tier).toBe("tree");
  });

  it("5개 차원 모두 100이면 1000점 Sequoia", () => {
    const quality = makeQuality({ actionability: 100, conciseness: 100, structure: 100, uniqueness: 100, safety: 100 });
    const result = calculateMdPower(quality, makeStats());
    expect(result.score).toBe(1000);
    expect(result.tier).toBe("sequoia");
  });

  it("에코시스템이 아무리 많아도 점수에 영향 없다", () => {
    const quality = makeQuality({ actionability: 30 });
    const withEco = calculateMdPower(quality, makeStats({
      isExpandedInput: true, pluginCount: 20, mcpServerCount: 10, commandCount: 20, hookCount: 10,
    }));
    const withoutEco = calculateMdPower(quality, makeStats());
    expect(withEco.score).toBe(withoutEco.score);
  });

  it("최대 1000을 초과하지 않는다", () => {
    const quality = makeQuality({ actionability: 100, conciseness: 100, structure: 100, uniqueness: 100, safety: 100 });
    const result = calculateMdPower(quality, makeStats());
    expect(result.score).toBeLessThanOrEqual(1000);
  });

  it("티어 경계값이 정확하다", () => {
    // 짝수 점수만 테스트 (quality합 × 2 = score → 홀수 score는 정확한 역산 불가)
    const cases: [number, string][] = [
      [0, "egg"], [98, "egg"],
      [100, "sprout"], [248, "sprout"],
      [250, "sapling"], [398, "sapling"],
      [400, "tree"], [598, "tree"],
      [600, "oak"], [798, "oak"],
      [800, "sequoia"], [1000, "sequoia"],
    ];

    for (const [targetScore, expectedTier] of cases) {
      const qualityTotal = targetScore / 2;
      const perDim = Math.floor(qualityTotal / 5);
      const remainder = qualityTotal - perDim * 5;
      const quality = makeQuality({
        actionability: perDim + (remainder > 0 ? 1 : 0),
        conciseness: perDim + (remainder > 1 ? 1 : 0),
        structure: perDim + (remainder > 2 ? 1 : 0),
        uniqueness: perDim + (remainder > 3 ? 1 : 0),
        safety: perDim + (remainder > 4 ? 1 : 0),
      });
      const result = calculateMdPower(quality, makeStats());
      expect(result.tier).toBe(expectedTier);
    }
  });
});
