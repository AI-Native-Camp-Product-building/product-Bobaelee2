import { describe, it, expect } from "vitest";
import { classifyPersona, classifyPersonaDebug } from "@/lib/analyzer/classifier";
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
    claudeMdLines: 50,
    keywordHits: {},
    keywordUniqueHits: {},
    pluginCount: 0,
    mcpServerCount: 0,
    commandCount: 0,
    hookCount: 0,
    skillCount: 0,
    agentCount: 0,
    skillNames: [],
    pluginSkillCount: 0,
    userSkillCount: 0,
    pluginAgentCount: 0,
    userAgentCount: 0,
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
    hasRoleDefinition: false,
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
    teamImpact: 30,
    security: 30,
    agentOrchestration: 0,
    ...overrides,
  };
}

describe("classifyPersona — minimalist", () => {
  it("줄 수가 매우 적고 평균 점수가 낮으면 minimalist여야 한다", () => {
    const scores = makeScores({ automation: 5, control: 5, toolDiversity: 5, contextAwareness: 5, teamImpact: 5, security: 5 });
    const stats = makeMdStats({ totalLines: 3 });
    expect(classifyPersona(scores, stats).primary).toBe("minimalist");
  });

  it("모든 점수가 25 미만이면 minimalist여야 한다", () => {
    const scores = makeScores({ automation: 10, control: 15, toolDiversity: 20, contextAwareness: 10, teamImpact: 5, security: 12 });
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

  it("automation/toolDiversity 높고 security도 적절하면 puppet-master여야 한다", () => {
    const scores = makeScores({ automation: 90, toolDiversity: 85, control: 10, security: 40, contextAwareness: 10, teamImpact: 10 });
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

  it("security가 극단적으로 높으면 fortress가 primary여야 한다 (deep-diver가 전용 페르소나를 밀어내지 않음)", () => {
    // security:90, others:10 → fortress가 전용 페르소나이므로 deep-diver fit이 낮아짐
    const scores = makeScores({ security: 90, automation: 10, control: 10, toolDiversity: 10, contextAwareness: 10, teamImpact: 10 });
    const stats = makeMdStats({ totalLines: 80 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("fortress");
    expect(result.secondary).toBeNull();
  });
});

describe("classifyPersona — legislator", () => {
  it("control ≥ 75이고 dominanceRatio < 2.0이면 legislator여야 한다", () => {
    // control:80, security:30 → ratio=80/30=2.67 ≥ 2.0 → deep-diver fit > legislator fit
    // control:80, security:50 → ratio=80/50=1.6 < 2.0 → deep-diver 조건 불충족 → legislator
    const scores = makeScores({ control: 80, security: 50, automation: 50 });
    const stats = makeMdStats({ totalLines: 60 });
    expect(classifyPersona(scores, stats).primary).toBe("legislator");
  });

  it("control이 극단적으로 높으면 legislator가 primary여야 한다 (deep-diver가 전용 페르소나를 밀어내지 않음)", () => {
    // control:85, others:10 → legislator가 전용 페르소나이므로 deep-diver fit이 낮아짐
    const scores = makeScores({ control: 85, automation: 10, toolDiversity: 10, contextAwareness: 10, teamImpact: 10, security: 10 });
    const stats = makeMdStats({ totalLines: 80 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("legislator");
    expect(result.secondary).toBeNull();
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
    const scores = makeScores({ control: 15, contextAwareness: 20, automation: 40, toolDiversity: 35, teamImpact: 25, security: 30 });
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
      teamImpact: 44,
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
      teamImpact: 20,
      security: 20,
    });
    const stats = makeMdStats({ totalLines: 200 });
    expect(classifyPersona(scores, stats).primary).toBe("deep-diver");
  });
});

describe("classifyPersona — 경계값 테스트", () => {
  it("automation=85, toolDiversity=85이면 puppet-master여야 한다", () => {
    const scores = makeScores({ automation: 85, toolDiversity: 85, security: 40 });
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
      "evangelist", "architect", "huggies", "daredevil",
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
    // automation/toolDiversity 높고 security도 높음 → 두 후보의 fit이 모두 높아야 함
    const scores = makeScores({
      automation: 90,
      toolDiversity: 90,
      security: 90,
      control: 10,
      contextAwareness: 10,
      teamImpact: 10,
    });
    const stats = makeMdStats({ totalLines: 100 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBeDefined();
    expect(result.secondary).not.toBeNull();
  });

  it("하나만 압도적이면 secondary는 null이어야 한다", () => {
    // security:80, others:10 → fortress가 전용 페르소나 → fortress primary, secondary null
    const scores = makeScores({
      security: 80,
      automation: 10,
      control: 10,
      toolDiversity: 10,
      contextAwareness: 10,
      teamImpact: 10,
    });
    const stats = makeMdStats({ totalLines: 80 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("fortress");
    expect(result.secondary).toBeNull();
  });

  it("minimalist는 항상 secondary가 null이어야 한다", () => {
    const scores = makeScores({ automation: 5, control: 5, toolDiversity: 5, contextAwareness: 5, teamImpact: 5, security: 5 });
    const stats = makeMdStats({ totalLines: 3 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("minimalist");
    expect(result.secondary).toBeNull();
  });
});

describe("classifyPersona — 재교정된 임계값", () => {
  it("security=55면 fortress 후보로 등록되어야 한다", () => {
    const scores = makeScores({ security: 55, automation: 10, control: 10, toolDiversity: 10, contextAwareness: 10, teamImpact: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("fortress");
  });

  it("control=55면 legislator 후보로 등록되어야 한다", () => {
    const scores = makeScores({ control: 55, automation: 10, security: 10, toolDiversity: 10, contextAwareness: 10, teamImpact: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("legislator");
  });

  it("automation=55, toolDiversity=40면 puppet-master 후보로 등록되어야 한다", () => {
    // security=25 이상이어야 daredevil 조건(security<20) 불충족 → puppet-master 우선
    const scores = makeScores({ automation: 55, toolDiversity: 40, control: 10, security: 25, contextAwareness: 10, teamImpact: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("puppet-master");
  });

  it("teamImpact=55이면 evangelist 후보로 등록되어야 한다", () => {
    const scores = makeScores({ teamImpact: 55, automation: 10, control: 10, security: 10, toolDiversity: 10, contextAwareness: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("evangelist");
  });

  it("모든 차원이 45인 중간 점수에서 fallback이 아닌 후보가 등록되어야 한다", () => {
    const scores = makeScores({ automation: 45, control: 45, toolDiversity: 45, security: 45, contextAwareness: 45, teamImpact: 45, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).not.toBe("minimalist");
  });

  it("하기스: OMC 스킬 사용 + agentOrchestration 낮으면 huggies", () => {
    const scores = makeScores({ automation: 50, agentOrchestration: 30 });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 8,
      mcpServerCount: 5,
      skillNames: ["autopilot", "ralph", "ultrawork", "team", "handoff", "pickup"],
    });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("huggies");
  });

  it("하기스: 플러그인/MCP 3개 이상이면 huggies", () => {
    const scores = makeScores({ automation: 30, agentOrchestration: 10 });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 4,
      mcpServerCount: 2,
      skillNames: [],
    });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("huggies");
  });

  it("로데오: agentOrchestration ≥ 70이면 architect", () => {
    const scores = makeScores({ agentOrchestration: 75, automation: 40 });
    const stats = makeMdStats({ totalLines: 200 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("architect");
  });

  it("하기스+로데오 동시 해당 시: agentOrch 높으면 로데오가 이김", () => {
    const scores = makeScores({ agentOrchestration: 80, automation: 50 });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 10,
      mcpServerCount: 5,
      skillNames: ["autopilot", "ralph", "team"],
    });
    const result = classifyPersona(scores, stats);
    // architect fit(90+10=100) > huggies fit(75+15=90)
    expect(result.primary).toBe("architect");
    expect(result.secondary).toBe("huggies");
  });
});

describe("classifyPersonaDebug — 투명성 디버그 정보", () => {
  it("classifyPersona와 동일한 primary/secondary를 리턴해야 한다", () => {
    const scores = makeScores({
      automation: 100,
      control: 100,
      toolDiversity: 75,
      contextAwareness: 100,
      teamImpact: 100,
      security: 88,
      agentOrchestration: 55,
    });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 11,
      commandCount: 9,
      hookCount: 2,
    });
    const plain = classifyPersona(scores, stats);
    const debug = classifyPersonaDebug(scores, stats);
    expect(debug.primary).toBe(plain.primary);
    expect(debug.secondary).toBe(plain.secondary);
  });

  it("후보 리스트는 fit 내림차순으로 정렬되어야 한다", () => {
    const scores = makeScores({
      automation: 80,
      control: 80,
      teamImpact: 80,
    });
    const debug = classifyPersonaDebug(scores, makeMdStats());
    for (let i = 1; i < debug.candidates.length; i++) {
      expect(debug.candidates[i - 1].fit).toBeGreaterThanOrEqual(debug.candidates[i].fit);
    }
  });

  it("각 후보에 등록 이유(reason)가 있어야 한다", () => {
    const scores = makeScores({ control: 80, security: 70 });
    const debug = classifyPersonaDebug(scores, makeMdStats());
    expect(debug.candidates.length).toBeGreaterThan(0);
    debug.candidates.forEach((c) => {
      expect(c.reason).toBeTruthy();
      expect(typeof c.reason).toBe("string");
    });
  });

  it("전체 수집 분석 시 notes에 관련 문구가 포함되어야 한다", () => {
    const stats = makeMdStats({ isExpandedInput: true });
    const debug = classifyPersonaDebug(makeScores({ automation: 60 }), stats);
    expect(debug.notes.some((n) => n.includes("전체 수집 분석"))).toBe(true);
  });

  it("CLAUDE.md만 분석 시 notes에 수집 스크립트 안내가 포함되어야 한다", () => {
    const stats = makeMdStats({ isExpandedInput: false });
    const debug = classifyPersonaDebug(makeScores({ automation: 60 }), stats);
    expect(debug.notes.some((n) => n.includes("본문만으로 분석"))).toBe(true);
    expect(debug.notes.some((n) => n.includes("수집 스크립트"))).toBe(true);
  });

  it("minimalist 단축 분기 시 shortCircuitReason이 채워져야 한다", () => {
    const scores = makeScores({
      automation: 5,
      control: 5,
      toolDiversity: 5,
      contextAwareness: 5,
      teamImpact: 5,
      security: 5,
      agentOrchestration: 0,
    });
    const debug = classifyPersonaDebug(scores, makeMdStats({ totalLines: 3 }));
    expect(debug.primary).toBe("minimalist");
    expect(debug.shortCircuitReason).toBeTruthy();
    expect(debug.candidates).toHaveLength(0);
  });
});
