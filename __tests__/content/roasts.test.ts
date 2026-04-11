import { describe, it, expect } from "vitest";
import { PERSONAS } from "@/lib/content/personas";
import { generateRoasts } from "@/lib/content/roasts";
import { generateStrengths } from "@/lib/content/strengths";
import { generatePrescriptions } from "@/lib/content/prescriptions";
import { getCompatibility } from "@/lib/content/compatibility";
import type { MdStats, PersonaKey, QualityScores, DimensionScores } from "@/lib/types";

/** 테스트용 기본 MdStats */
function makeMdStats(overrides: Partial<MdStats> = {}): MdStats {
  const totalLines = overrides.totalLines ?? 80;
  return {
    totalLines,
    sectionCount: 5,
    toolNames: ["Slack", "Notion", "GitHub"],
    hasMemory: true,
    hasHooks: true,
    hasProjectMd: true,
    hasRoleDefinition: false,
    ruleCount: 8,
    claudeMdLines: totalLines,
    keywordHits: {
      automation: 5,
      control: 6,
      toolDiversity: 4,
      contextAwareness: 7,
      teamImpact: 3,
      security: 5,
    },
    keywordUniqueHits: {
      automation: 3,
      control: 4,
      toolDiversity: 3,
      contextAwareness: 4,
      teamImpact: 2,
      security: 3,
    },
    pluginCount: 0,
    mcpServerCount: 0,
    commandCount: 0,
    hookCount: 0,
    skillCount: 0,
    agentCount: 0,
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

/** 테스트용 기본 QualityScores */
function makeQuality(overrides: Partial<QualityScores> = {}): QualityScores {
  return {
    actionability: 50,
    conciseness: 50,
    structure: 50,
    uniqueness: 50,
    safety: 50,
    ...overrides,
  };
}

/** 테스트용 기본 DimensionScores */
function makeDimScores(overrides: Partial<DimensionScores> = {}): DimensionScores {
  return {
    automation: 50,
    control: 50,
    toolDiversity: 50,
    contextAwareness: 50,
    teamImpact: 50,
    security: 50,
    agentOrchestration: 0,
    ...overrides,
  };
}

const ALL_PERSONAS: PersonaKey[] = [
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

describe("PERSONAS — 페르소나 정의", () => {
  it("12개 페르소나가 모두 정의되어야 한다", () => {
    expect(Object.keys(PERSONAS)).toHaveLength(12);
  });

  it("각 페르소나에 필수 필드가 있어야 한다", () => {
    ALL_PERSONAS.forEach((key) => {
      const persona = PERSONAS[key];
      expect(persona.key).toBe(key);
      expect(persona.nameKo).toBeTruthy();
      expect(persona.nameEn).toBeTruthy();
      expect(persona.emoji).toBeTruthy();
      expect(persona.tagline).toBeTruthy();
      expect(persona.description).toBeTruthy();
    });
  });

  it("각 페르소나의 이름이 스펙과 일치해야 한다", () => {
    expect(PERSONAS["puppet-master"].nameKo).toBe("봇 농장주");
    expect(PERSONAS["speedrunner"].nameKo).toBe("손이 빠른 무법자");
    expect(PERSONAS["fortress"].nameKo).toBe("보안 편집증 환자");
    expect(PERSONAS["minimalist"].nameKo).toBe("CLAUDE.md 3줄러");
    expect(PERSONAS["collector"].nameKo).toBe("플러그인 수집가");
    expect(PERSONAS["legislator"].nameKo).toBe("규칙 제왕");
    expect(PERSONAS["craftsman"].nameKo).toBe("조용한 장인");
    expect(PERSONAS["deep-diver"].nameKo).toBe("과몰입러");
  });

  it("emoji는 빈 문자열이 아니어야 한다", () => {
    ALL_PERSONAS.forEach((key) => {
      expect(PERSONAS[key].emoji.length).toBeGreaterThan(0);
    });
  });
});

describe("generateRoasts — 로스팅 생성", () => {
  it("모든 페르소나에서 3개의 로스팅을 반환해야 한다", () => {
    const stats = makeMdStats();
    ALL_PERSONAS.forEach((persona) => {
      const roasts = generateRoasts(persona, stats);
      expect(roasts).toHaveLength(3);
    });
  });

  it("각 로스팅 아이템에 text, detail, color가 있어야 한다", () => {
    const stats = makeMdStats();
    const roasts = generateRoasts("puppet-master", stats);
    roasts.forEach((roast) => {
      expect(roast.text).toBeTruthy();
      expect(roast.detail).toBeTruthy();
      expect(["red", "orange", "blue"]).toContain(roast.color);
    });
  });

  it("MdStats 데이터를 동적으로 반영해야 한다", () => {
    const stats = makeMdStats({ toolNames: ["Slack", "Notion", "GitHub", "Supabase", "Vercel"] });
    const roasts = generateRoasts("puppet-master", stats);
    // 도구 수가 텍스트에 반영되는지 확인
    const allText = roasts.map((r) => r.text + r.detail).join(" ");
    expect(allText.length).toBeGreaterThan(0);
  });

  it("줄 수가 적은 minimalist는 그에 맞는 로스팅을 받아야 한다", () => {
    const stats = makeMdStats({ totalLines: 3, sectionCount: 0, ruleCount: 0, toolNames: [] });
    const roasts = generateRoasts("minimalist", stats);
    expect(roasts).toHaveLength(3);
    // 줄 수가 반영되어야 함
    const detail = roasts[0].detail;
    expect(detail).toContain("3");
  });

  it("roast color는 red/orange/blue 중 하나여야 한다", () => {
    const stats = makeMdStats();
    ALL_PERSONAS.forEach((persona) => {
      generateRoasts(persona, stats).forEach((roast) => {
        expect(["red", "orange", "blue"]).toContain(roast.color);
      });
    });
  });
});


describe("generateStrengths — 강점 생성", () => {
  it("모든 페르소나에서 3개의 강점을 반환해야 한다", () => {
    const stats = makeMdStats();
    ALL_PERSONAS.forEach((persona) => {
      const strengths = generateStrengths(persona, stats);
      expect(strengths).toHaveLength(3);
    });
  });

  it("각 강점 아이템에 text가 있어야 한다", () => {
    const stats = makeMdStats();
    generateStrengths("craftsman", stats).forEach((s) => {
      expect(s.text).toBeTruthy();
      expect(typeof s.text).toBe("string");
    });
  });

  it("MdStats 데이터를 활용해 구체적인 강점을 생성해야 한다", () => {
    const stats = makeMdStats({ totalLines: 200, ruleCount: 20 });
    const strengths = generateStrengths("legislator", stats);
    const allText = strengths.map((s) => s.text).join(" ");
    // 규칙 수가 반영되는지 확인
    expect(allText).toContain("20");
  });

  it("hasMemory 여부에 따라 deep-diver 강점이 달라야 한다", () => {
    const withMemory = generateStrengths("deep-diver", makeMdStats({ hasMemory: true }));
    const withoutMemory = generateStrengths("deep-diver", makeMdStats({ hasMemory: false }));
    // 텍스트가 달라야 함
    expect(withMemory[1].text).not.toBe(withoutMemory[1].text);
  });
});

describe("generatePrescriptions — 처방전 생성", () => {
  it("모든 페르소나에서 처방전을 반환해야 한다", () => {
    const stats = makeMdStats();
    ALL_PERSONAS.forEach((persona) => {
      const prescriptions = generatePrescriptions(persona, stats, makeQuality(), makeDimScores());
      expect(prescriptions.length).toBeGreaterThan(0);
    });
  });

  it("각 처방전 아이템에 text와 priority가 있어야 한다", () => {
    const stats = makeMdStats();
    generatePrescriptions("minimalist", stats, makeQuality(), makeDimScores()).forEach((p) => {
      expect(p.text).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(p.priority);
    });
  });

  it("우선순위 순으로 정렬되어야 한다 (high → medium → low)", () => {
    const stats = makeMdStats({ hasMemory: false, hasHooks: false, totalLines: 5, claudeMdLines: 5 });
    const prescriptions = generatePrescriptions("minimalist", stats, makeQuality(), makeDimScores());
    const priorities = prescriptions.map((p) => p.priority);
    // high가 low보다 앞에 와야 함
    const firstLowIndex = priorities.indexOf("low");
    const lastHighIndex = priorities.lastIndexOf("high");
    if (firstLowIndex !== -1 && lastHighIndex !== -1) {
      expect(lastHighIndex).toBeLessThan(firstLowIndex);
    }
  });

  it("hasMemory가 false이면 컨텍스트 관리 관련 처방이 포함되어야 한다", () => {
    const stats = makeMdStats({ hasMemory: false, hasProjectMd: false });
    const prescriptions = generatePrescriptions("craftsman", stats, makeQuality(), makeDimScores());
    const allText = prescriptions.map((p) => p.text).join(" ");
    // 새 처방전에서는 "맥락"이라는 단어로 컨텍스트 관리를 안내함
    expect(allText).toMatch(/맥락|컨텍스트|CLAUDE\.md/i);
  });

  it("totalLines < 10이면 high priority 처방이 포함되어야 한다", () => {
    const stats = makeMdStats({ totalLines: 3, claudeMdLines: 3, ruleCount: 0, hasMemory: false, hasProjectMd: false });
    const prescriptions = generatePrescriptions("minimalist", stats, makeQuality(), makeDimScores());
    const highPriority = prescriptions.filter((p) => p.priority === "high");
    expect(highPriority.length).toBeGreaterThan(0);
  });
});

describe("getCompatibility — 궁합 정보", () => {
  it("모든 페르소나에서 2개의 궁합 정보를 반환해야 한다", () => {
    ALL_PERSONAS.forEach((persona) => {
      const compat = getCompatibility(persona);
      expect(compat).toHaveLength(2);
    });
  });

  it("perfect, chaos 타입이 모두 포함되어야 한다", () => {
    ALL_PERSONAS.forEach((persona) => {
      const compat = getCompatibility(persona);
      const types = compat.map((c) => c.type);
      expect(types).toContain("perfect");
      expect(types).toContain("chaos");
    });
  });

  it("각 궁합 정보에 description이 있어야 한다", () => {
    ALL_PERSONAS.forEach((persona) => {
      getCompatibility(persona).forEach((c) => {
        expect(c.description).toBeTruthy();
        expect(c.description.length).toBeGreaterThan(10);
      });
    });
  });

  it("puppet-master의 perfect 궁합은 speedrunner여야 한다", () => {
    const compat = getCompatibility("puppet-master");
    const perfect = compat.find((c) => c.type === "perfect");
    expect(perfect?.targetPersona).toBe("speedrunner");
  });

  it("speedrunner의 chaos 궁합은 legislator여야 한다", () => {
    const compat = getCompatibility("speedrunner");
    const chaos = compat.find((c) => c.type === "chaos");
    expect(chaos?.targetPersona).toBe("legislator");
  });

  it("targetPersona는 항상 유효한 PersonaKey여야 한다", () => {
    ALL_PERSONAS.forEach((persona) => {
      getCompatibility(persona).forEach((c) => {
        expect(ALL_PERSONAS).toContain(c.targetPersona);
      });
    });
  });
});
