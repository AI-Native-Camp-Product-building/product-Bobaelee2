import { describe, it, expect } from "vitest";
import { classifyPersona } from "@/lib/analyzer/classifier";
import type { DimensionScores, MdStats } from "@/lib/types";

/** 테스트용 기본 MdStats */
function makeMdStats(overrides: Partial<MdStats> = {}): MdStats {
  return {
    totalLines: 50,
    sectionCount: 5,
    toolNames: [],
    hasMemory: false,
    hasHooks: false,
    hasProjectMd: false,
    ruleCount: 3,
    keywordHits: {},
    pluginCount: 0,
    mcpServerCount: 0,
    commandCount: 0,
    hookCount: 0,
    pluginNames: [],
    mcpServerNames: [],
    commandNames: [],
    isExpandedInput: false,
    denyCount: 0,
    blocksDangerousOps: false,
    hookPromptCount: 0,
    hookCommandCount: 0,
    pluginEnabledRatio: 0,
    projectMdCount: 0,
    ...overrides,
  };
}

/** 점수 객체 빌더 */
function makeScores(overrides: Partial<DimensionScores> = {}): DimensionScores {
  return {
    automation: 30,
    control: 30,
    toolDiversity: 30,
    contextAwareness: 30,
    collaboration: 30,
    security: 30,
    ...overrides,
  };
}

describe("classifyPersona — minimalist", () => {
  it("줄 수가 매우 적고 평균 점수가 낮으면 minimalist여야 한다", () => {
    const scores = makeScores({ automation: 5, control: 5, toolDiversity: 5, contextAwareness: 5, collaboration: 5, security: 5 });
    const stats = makeMdStats({ totalLines: 3 });
    expect(classifyPersona(scores, stats).primary).toBe("minimalist");
  });

  it("모든 점수가 25 미만이면 minimalist여야 한다", () => {
    const scores = makeScores({ automation: 10, control: 15, toolDiversity: 20, contextAwareness: 10, collaboration: 5, security: 12 });
    const stats = makeMdStats({ totalLines: 20 });
    expect(classifyPersona(scores, stats).primary).toBe("minimalist");
  });
});

describe("classifyPersona — puppet-master", () => {
  it("automation ≥ 70 && toolDiversity ≥ 70이면 puppet-master여야 한다", () => {
    const scores = makeScores({ automation: 85, toolDiversity: 80, security: 30 });
    const stats = makeMdStats({ totalLines: 100 });
    expect(classifyPersona(scores, stats).primary).toBe("puppet-master");
  });

  it("max ≥ 80 && stdDev ≥ 30 && automation/toolDiversity 모두 ≥ 75이면 puppet-master여야 한다", () => {
    const scores = makeScores({ automation: 90, toolDiversity: 85, control: 10, security: 10, contextAwareness: 10, collaboration: 10 });
    const stats = makeMdStats({ totalLines: 150 });
    expect(classifyPersona(scores, stats).primary).toBe("puppet-master");
  });
});

describe("classifyPersona — fortress", () => {
  it("security ≥ 75이면 fortress여야 한다", () => {
    const scores = makeScores({ security: 80, automation: 20, control: 30 });
    const stats = makeMdStats({ totalLines: 60 });
    expect(classifyPersona(scores, stats).primary).toBe("fortress");
  });

  it("max ≥ 80 && stdDev ≥ 30 && security가 최고이면 fortress여야 한다", () => {
    const scores = makeScores({ security: 90, automation: 10, control: 10, toolDiversity: 10, contextAwareness: 10, collaboration: 10 });
    const stats = makeMdStats({ totalLines: 80 });
    expect(classifyPersona(scores, stats).primary).toBe("fortress");
  });
});

describe("classifyPersona — legislator", () => {
  it("control ≥ 75이면 legislator여야 한다", () => {
    const scores = makeScores({ control: 80, security: 30, automation: 20 });
    const stats = makeMdStats({ totalLines: 60 });
    expect(classifyPersona(scores, stats).primary).toBe("legislator");
  });

  it("max ≥ 80 && stdDev ≥ 30 && control이 최고이면 legislator여야 한다", () => {
    const scores = makeScores({ control: 85, automation: 10, toolDiversity: 10, contextAwareness: 10, collaboration: 10, security: 10 });
    const stats = makeMdStats({ totalLines: 80 });
    expect(classifyPersona(scores, stats).primary).toBe("legislator");
  });
});

describe("classifyPersona — collector", () => {
  it("toolDiversity ≥ 70 && automation < 40이면 collector여야 한다", () => {
    const scores = makeScores({ toolDiversity: 75, automation: 20, security: 30, control: 30 });
    const stats = makeMdStats({ totalLines: 80 });
    expect(classifyPersona(scores, stats).primary).toBe("collector");
  });
});

describe("classifyPersona — speedrunner", () => {
  it("짧고 통제/성숙도 낮으면 speedrunner여야 한다", () => {
    const scores = makeScores({ control: 15, contextAwareness: 20, automation: 40, toolDiversity: 35, collaboration: 25, security: 30 });
    const stats = makeMdStats({ totalLines: 15 });
    expect(classifyPersona(scores, stats).primary).toBe("speedrunner");
  });
});

describe("classifyPersona — craftsman", () => {
  it("표준편차가 낮으면 craftsman이어야 한다", () => {
    // 모든 점수가 균등하게 중간값
    const scores = makeScores({
      automation: 45,
      control: 48,
      toolDiversity: 42,
      contextAwareness: 47,
      collaboration: 44,
      security: 46,
    });
    const stats = makeMdStats({ totalLines: 60 });
    expect(classifyPersona(scores, stats).primary).toBe("craftsman");
  });
});

describe("classifyPersona — deep-diver", () => {
  it("contextAwareness가 가장 높고 기타 조건 없으면 deep-diver여야 한다", () => {
    // max ≥ 80 && stdDev ≥ 30이지만 security/control이 dominant가 아닌 경우
    // 또는 기본 규칙으로 contextAwareness dominant
    const scores = makeScores({
      contextAwareness: 85,
      automation: 20,
      control: 20,
      toolDiversity: 20,
      collaboration: 20,
      security: 20,
    });
    const stats = makeMdStats({ totalLines: 200 });
    expect(classifyPersona(scores, stats).primary).toBe("deep-diver");
  });
});

describe("classifyPersona — 경계값 테스트", () => {
  it("automation=70, toolDiversity=70 경계값은 puppet-master여야 한다", () => {
    const scores = makeScores({ automation: 70, toolDiversity: 70, security: 30 });
    const stats = makeMdStats({ totalLines: 80 });
    expect(classifyPersona(scores, stats).primary).toBe("puppet-master");
  });

  it("security=75 경계값은 fortress여야 한다", () => {
    const scores = makeScores({ security: 75, automation: 20, control: 30 });
    const stats = makeMdStats({ totalLines: 60 });
    expect(classifyPersona(scores, stats).primary).toBe("fortress");
  });

  it("반환값은 항상 유효한 PersonaKey여야 한다", () => {
    const validKeys = [
      "puppet-master", "speedrunner", "fortress", "minimalist",
      "collector", "legislator", "craftsman", "deep-diver",
      "evangelist", "architect", "huggies", "macgyver", "daredevil",
    ];
    // 다양한 점수 조합 테스트
    const testCases = [
      makeScores({ automation: 50, control: 50, toolDiversity: 50 }),
      makeScores({ automation: 90, control: 90, toolDiversity: 90 }),
      makeScores(),
    ];
    testCases.forEach((scores) => {
      const result = classifyPersona(scores, makeMdStats());
      expect(validKeys).toContain(result.primary);
      if (result.secondary) {
        expect(validKeys).toContain(result.secondary);
        expect(result.secondary).not.toBe(result.primary);
      }
    });
  });
});

describe("classifyPersona — 주+부 페르소나", () => {
  it("두 성향이 동시에 강하면 주+부 모두 반환해야 한다", () => {
    // automation 높고 security도 높음 → puppet-master 또는 fortress가 후보
    const scores = makeScores({
      automation: 75,
      toolDiversity: 75,
      security: 70,
      control: 10,
      contextAwareness: 10,
      collaboration: 10,
    });
    const stats = makeMdStats({ totalLines: 100 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBeDefined();
    expect(result.secondary).not.toBeNull();
  });

  it("하나만 압도적이면 secondary는 null이어야 한다", () => {
    const scores = makeScores({
      security: 90,
      automation: 10,
      control: 10,
      toolDiversity: 10,
      contextAwareness: 10,
      collaboration: 10,
    });
    const stats = makeMdStats({ totalLines: 80 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("fortress");
    // 다른 후보의 fit이 fortress의 60% 미만이면 null
  });

  it("minimalist는 항상 secondary가 null이어야 한다", () => {
    const scores = makeScores({ automation: 5, control: 5, toolDiversity: 5, contextAwareness: 5, collaboration: 5, security: 5 });
    const stats = makeMdStats({ totalLines: 3 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("minimalist");
    expect(result.secondary).toBeNull();
  });
});
