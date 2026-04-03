import { describe, it, expect } from "vitest";
import type {
  PersonaKey,
  DimensionScores,
  MdStats,
  RoastItem,
  StrengthItem,
  PrescriptionItem,
  CompatInfo,
  AnalysisResult,
  SavedResult,
  GlobalStats,
} from "@/lib/types";

// PersonaKey 타입 검증용 — 8개 값 모두 할당 가능해야 함
const PERSONA_KEYS: PersonaKey[] = [
  "puppet-master",
  "speedrunner",
  "fortress",
  "minimalist",
  "collector",
  "legislator",
  "craftsman",
  "deep-diver",
  "evangelist",
  "architect",
  "huggies",
  "daredevil",
];

describe("PersonaKey", () => {
  it("13개 페르소나 키가 존재해야 한다", () => {
    expect(PERSONA_KEYS).toHaveLength(13);
  });

  it("모든 키가 문자열이어야 한다", () => {
    PERSONA_KEYS.forEach((key) => {
      expect(typeof key).toBe("string");
    });
  });

  it("중복 없이 고유한 키여야 한다", () => {
    const unique = new Set(PERSONA_KEYS);
    expect(unique.size).toBe(13);
  });
});

describe("DimensionScores", () => {
  it("6개 차원을 모두 가져야 한다", () => {
    const scores: DimensionScores = {
      automation: 80,
      control: 60,
      toolDiversity: 70,
      contextAwareness: 90,
      teamImpact: 50,
      security: 75,
    };

    expect(Object.keys(scores)).toHaveLength(6);
    expect(scores.automation).toBeDefined();
    expect(scores.control).toBeDefined();
    expect(scores.toolDiversity).toBeDefined();
    expect(scores.contextAwareness).toBeDefined();
    expect(scores.teamImpact).toBeDefined();
    expect(scores.security).toBeDefined();
  });

  it("0~100 범위의 숫자 값을 가져야 한다", () => {
    const scores: DimensionScores = {
      automation: 0,
      control: 100,
      toolDiversity: 50,
      contextAwareness: 25,
      teamImpact: 75,
      security: 10,
    };

    Object.values(scores).forEach((v) => {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });
});

describe("MdStats", () => {
  it("필수 필드를 모두 가져야 한다", () => {
    const stats: MdStats = {
      totalLines: 100,
      sectionCount: 5,
      toolNames: ["Slack", "Notion"],
      hasMemory: true,
      hasHooks: false,
      hasProjectMd: true,
      ruleCount: 10,
      claudeMdLines: 100,
      keywordHits: { automation: 3, security: 2 },
      keywordUniqueHits: { automation: 2, security: 2 },
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
    };

    expect(stats.totalLines).toBeDefined();
    expect(stats.sectionCount).toBeDefined();
    expect(Array.isArray(stats.toolNames)).toBe(true);
    expect(typeof stats.hasMemory).toBe("boolean");
    expect(typeof stats.hasHooks).toBe("boolean");
    expect(typeof stats.hasProjectMd).toBe("boolean");
    expect(stats.ruleCount).toBeDefined();
    expect(stats.keywordHits).toBeDefined();
  });
});

describe("RoastItem", () => {
  it("text, detail, color 필드를 가져야 한다", () => {
    const roast: RoastItem = {
      text: "봇을 너무 믿는다",
      detail: "Claude가 알아서 해줄 거라는 믿음, 건강한가요?",
      color: "red",
    };

    expect(roast.text).toBeDefined();
    expect(roast.detail).toBeDefined();
    expect(["red", "orange", "blue"]).toContain(roast.color);
  });
});

describe("AnalysisResult", () => {
  it("모든 필수 필드를 가져야 한다", () => {
    const result: AnalysisResult = {
      persona: "puppet-master",
      secondaryPersona: null,
      scores: {
        automation: 90,
        control: 60,
        toolDiversity: 80,
        contextAwareness: 85,
        teamImpact: 70,
        security: 65,
      },
      qualityScores: {
        actionability: 70,
        conciseness: 60,
        structure: 80,
        uniqueness: 50,
        safety: 75,
      },
      roasts: [],
      strengths: [],
      prescriptions: [],
      mdPower: { score: 450, tier: "tree", tierEmoji: "🌳", tierName: "Tree", tierTagline: "주변에서 물어보는 수준" },
      mdStats: {
        totalLines: 200,
        sectionCount: 10,
        toolNames: ["Slack", "GitHub"],
        hasMemory: true,
        hasHooks: true,
        hasProjectMd: true,
        ruleCount: 20,
        claudeMdLines: 200,
        keywordHits: {},
        keywordUniqueHits: {},
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
      },
    };

    expect(result.persona).toBeDefined();
    expect(result.scores).toBeDefined();
    expect(result.roasts).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.prescriptions).toBeDefined();
    expect(result.mdStats).toBeDefined();
  });
});

describe("SavedResult", () => {
  it("AnalysisResult에 id와 createdAt을 추가해야 한다", () => {
    const saved: SavedResult = {
      id: "abc-123",
      createdAt: "2026-04-02T00:00:00Z",
      isLegacyResult: false,
      persona: "minimalist",
      secondaryPersona: null,
      scores: {
        automation: 10,
        control: 10,
        toolDiversity: 10,
        contextAwareness: 10,
        teamImpact: 10,
        security: 10,
      },
      qualityScores: {
        actionability: 0,
        conciseness: 0,
        structure: 0,
        uniqueness: 0,
        safety: 0,
      },
      roasts: [],
      strengths: [],
      prescriptions: [],
      mdPower: { score: 0, tier: "egg", tierEmoji: "🥚", tierName: "Egg", tierTagline: ".md가 뭐예요?" },
      mdStats: {
        totalLines: 3,
        sectionCount: 0,
        toolNames: [],
        hasMemory: false,
        hasHooks: false,
        hasProjectMd: false,
        ruleCount: 0,
        claudeMdLines: 3,
        keywordHits: {},
        keywordUniqueHits: {},
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
      },
    };

    expect(saved.id).toBe("abc-123");
    expect(saved.createdAt).toBeDefined();
  });
});

describe("GlobalStats", () => {
  it("userPercentile에 lines, tools, complexity가 있어야 한다", () => {
    const stats: GlobalStats = {
      totalUsers: 1000,
      personaCounts: {
        "puppet-master": 120,
        speedrunner: 80,
        fortress: 90,
        minimalist: 200,
        collector: 110,
        legislator: 100,
        craftsman: 150,
        "deep-diver": 150,
        evangelist: 0,
        architect: 0,
        huggies: 0,
        daredevil: 0,
      },
      avgLines: 85,
      userPercentile: {
        lines: 75,
        tools: 60,
        complexity: 80,
      },
    };

    expect(stats.userPercentile.lines).toBeDefined();
    expect(stats.userPercentile.tools).toBeDefined();
    expect(stats.userPercentile.complexity).toBeDefined();
  });
});
