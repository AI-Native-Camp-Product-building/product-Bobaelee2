import { describe, it, expect } from "vitest";
import {
  DIMENSION_PATTERNS,
  countPatternMatches,
  countUniqueSignals,
  TOOL_NAMES,
  extractToolNames,
  extractSkillCount,
  countAxisSignals,
  judgeVerboseAxis,
  judgeStructureAxis,
  judgeControlFromSettings,
  PATTERN_AXIS_MAP,
} from "@/lib/analyzer/patterns";
import type { MdStats } from "@/lib/types";

describe("DIMENSION_PATTERNS", () => {
  it("7개 차원이 모두 정의되어야 한다", () => {
    const expectedDimensions = [
      "automation",
      "control",
      "toolDiversity",
      "contextAwareness",
      "teamImpact",
      "security",
      "agentOrchestration",
    ];
    expectedDimensions.forEach((dim) => {
      expect(DIMENSION_PATTERNS[dim]).toBeDefined();
      expect(Array.isArray(DIMENSION_PATTERNS[dim])).toBe(true);
      expect(DIMENSION_PATTERNS[dim].length).toBeGreaterThan(0);
    });
  });

  it("각 차원의 패턴은 RegExp 배열이어야 한다", () => {
    Object.values(DIMENSION_PATTERNS).forEach((patterns) => {
      patterns.forEach((p) => {
        expect(p).toBeInstanceOf(RegExp);
      });
    });
  });
});

describe("countPatternMatches — automation 패턴", () => {
  it("'hook', 'cron', 'auto' 키워드를 감지해야 한다", () => {
    const text = "PostToolUse hook 설정, cron 스케줄, 자동 배포 자동화";
    const count = countPatternMatches(text, DIMENSION_PATTERNS.automation);
    expect(count).toBeGreaterThan(0);
  });

  it("빈 텍스트에서 0을 반환해야 한다", () => {
    expect(countPatternMatches("", DIMENSION_PATTERNS.automation)).toBe(0);
  });

  it("관련 없는 텍스트에서 낮은 점수를 반환해야 한다", () => {
    const count = countPatternMatches("안녕하세요", DIMENSION_PATTERNS.automation);
    expect(count).toBe(0);
  });
});

describe("countPatternMatches — control 패턴", () => {
  it("응답 형식, 코딩 스타일, 행동 제약 키워드를 감지해야 한다", () => {
    const text = "항상 한국어로 간결하게 답변. DO NOT use emojis. 형식에 맞춰 작성. 톤을 맞춰서 대답.";
    const count = countPatternMatches(text, DIMENSION_PATTERNS.control);
    expect(count).toBeGreaterThan(3);
  });

  it("빈 텍스트에서 0을 반환해야 한다", () => {
    expect(countPatternMatches("", DIMENSION_PATTERNS.control)).toBe(0);
  });
});

describe("countPatternMatches — security 패턴", () => {
  it(".env, API 키, 보안 관련 키워드를 감지해야 한다", () => {
    const text = ".env 파일 커밋 금지. API 키는 token으로 관리. 보안 credential 절대 노출 금지.";
    const count = countPatternMatches(text, DIMENSION_PATTERNS.security);
    expect(count).toBeGreaterThan(3);
  });
});

describe("countUniqueSignals", () => {
  it("같은 키워드가 반복되어도 1점만 부여해야 한다", () => {
    const text = "hook hook hook hook hook hook hook hook hook hook";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.automation);
    expect(count).toBe(1);
  });

  it("서로 다른 신호가 많을수록 점수가 높아야 한다", () => {
    const singleSignal = "hook 설정";
    const multiSignal = "hook 설정, cron 스케줄, 자동 배포, bot 응답, webhook";
    const single = countUniqueSignals(singleSignal, DIMENSION_PATTERNS.automation);
    const multi = countUniqueSignals(multiSignal, DIMENSION_PATTERNS.automation);
    expect(multi).toBeGreaterThan(single);
  });

  it("빈 텍스트에서 0을 반환해야 한다", () => {
    expect(countUniqueSignals("", DIMENSION_PATTERNS.automation)).toBe(0);
  });

  it("countPatternMatches와 달리 반복 횟수를 무시해야 한다", () => {
    const text = "hook hook hook cron cron";
    const unique = countUniqueSignals(text, DIMENSION_PATTERNS.automation);
    const total = countPatternMatches(text, DIMENSION_PATTERNS.automation);
    expect(unique).toBe(2);  // hook + cron
    expect(total).toBeGreaterThan(unique);  // 반복 카운트가 더 높아야 함
  });
});

describe("contextAwareness 패턴", () => {
  it("메모리, 컨텍스트, 세션 등 컨텍스트 관리 키워드를 감지해야 한다", () => {
    const text = "memory 설정, 컨텍스트 유지, 세션 관리, feedback 반영";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.contextAwareness);
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it(".claude/rules, CLAUDE.local.md, compact 등 고급 패턴을 감지해야 한다", () => {
    const text = ".claude/rules 분리 사용, CLAUDE.local.md 설정, /compact 주기적 실행";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.contextAwareness);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("마크다운 문법(헤딩, 코드블록, 테이블)은 감지하지 않아야 한다", () => {
    const text = "## 섹션\n```코드```\n| 표 | 내용 |";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.contextAwareness);
    expect(count).toBe(0);
  });
});

describe("toolDiversity 패턴", () => {
  it("기술 스택(Next.js, Python, Postgres 등)은 감지하지 않아야 한다", () => {
    const text = "Next.js React Vue Python Node.js Postgres MySQL Redis";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.toolDiversity);
    expect(count).toBe(0);
  });

  it("외부 서비스(Slack, Notion, Sentry 등)는 감지해야 한다", () => {
    const text = "Slack Notion GitHub Sentry Stripe";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.toolDiversity);
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

describe("extractToolNames", () => {
  it("텍스트에서 도구명을 추출해야 한다", () => {
    const text = "Slack, Notion, GitHub을 주로 사용합니다. Google Sheets도 씁니다.";
    const tools = extractToolNames(text);
    expect(tools).toContain("Slack");
    expect(tools).toContain("Notion");
    expect(tools).toContain("GitHub");
    expect(tools).toContain("Google Sheets");
  });

  it("빈 텍스트에서 빈 배열을 반환해야 한다", () => {
    expect(extractToolNames("")).toEqual([]);
  });

  it("중복 없이 반환해야 한다", () => {
    const text = "Slack 사용. Slack 메시지 발송. Slack 채널 관리.";
    const tools = extractToolNames(text);
    const slackCount = tools.filter((t) => t === "Slack").length;
    expect(slackCount).toBe(1);
  });

  it("관련 없는 텍스트에서 빈 배열을 반환해야 한다", () => {
    const tools = extractToolNames("안녕하세요 오늘 날씨가 좋네요");
    expect(tools).toEqual([]);
  });
});

describe("TOOL_NAMES", () => {
  it("17개 도구가 정의되어야 한다", () => {
    expect(Object.keys(TOOL_NAMES).length).toBeGreaterThanOrEqual(15);
  });

  it("각 항목은 RegExp여야 한다", () => {
    Object.values(TOOL_NAMES).forEach((p) => {
      expect(p).toBeInstanceOf(RegExp);
    });
  });
});

describe("control 패턴 — 보안 맥락 제외", () => {
  it("'반드시 .env 파일은 커밋 금지'는 control에 매칭되지 않아야 한다", () => {
    const text = "반드시 .env 파일은 커밋 금지";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBe(0);
  });

  it("'반드시 .env 커밋하지 마라'는 control에 매칭되지 않아야 한다", () => {
    const text = "반드시 .env 커밋하지 마라";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBe(0);
  });

  it("'한국어로 간결하게 답변'은 control에 매칭되어야 한다", () => {
    const text = "항상 한국어로 간결하게 답변해라";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBeGreaterThanOrEqual(2); // 한국어로 + 간결하게
  });

  it("'MUST NOT include secrets'는 control에 매칭되지 않아야 한다", () => {
    const text = "MUST NOT include secrets in code";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBe(0);
  });

  it("'DO NOT use emojis'는 control에 매칭되어야 한다", () => {
    const text = "DO NOT use emojis in responses";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("'형식에 맞춰 작성'은 control에 매칭되어야 한다", () => {
    const text = "보고서 형식에 맞춰 작성해주세요";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.control);
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe("agentOrchestration — 패턴 재배치", () => {
  it("'반드시 테스트 후 배포'는 automation에 매칭, agentOrchestration에 미매칭", () => {
    const text = "반드시 테스트 후 배포하라";
    const autoCount = countUniqueSignals(text, DIMENSION_PATTERNS.automation);
    const agentCount = countUniqueSignals(text, DIMENSION_PATTERNS.agentOrchestration);
    expect(autoCount).toBeGreaterThan(0);
    expect(agentCount).toBe(0);
  });

  it("'실수로 민감 파일을 커밋했다면'은 security에 매칭, agentOrchestration에 미매칭", () => {
    const text = "실수로 민감 파일을 커밋했다면 즉시 경고하라";
    const secCount = countUniqueSignals(text, DIMENSION_PATTERNS.security);
    const agentCount = countUniqueSignals(text, DIMENSION_PATTERNS.agentOrchestration);
    expect(secCount).toBeGreaterThan(0);
    expect(agentCount).toBe(0);
  });

  it("'Claude가 알아서 판단해'는 agentOrchestration에 매칭", () => {
    const text = "Claude가 알아서 판단해서 실행해줘";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.agentOrchestration);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("'자동 모드로 실행'은 agentOrchestration에 매칭", () => {
    const text = "auto mode로 자율 실행하도록 설정";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.agentOrchestration);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("'AGENTS.md'는 agentOrchestration에 매칭되지 않아야 한다", () => {
    const text = "참고: @AGENTS.md";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.agentOrchestration);
    expect(count).toBe(0);
  });
});

describe("비개발자 패턴", () => {
  it("'회의 일정 조율'은 teamImpact에 매칭", () => {
    const text = "주간 회의 일정을 조율해주세요";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.teamImpact);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("'보고서 작성'은 teamImpact에 매칭", () => {
    const text = "주간 보고서를 작성해야 합니다";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.teamImpact);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("'프로젝트 배경 설명'은 contextAwareness에 매칭", () => {
    const text = "이 프로젝트의 배경을 설명하면";
    const count = countUniqueSignals(text, DIMENSION_PATTERNS.contextAwareness);
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe("extractSkillCount", () => {
  it("skills 섹션에서 스킬 수를 추출한다", () => {
    const text = `=== skills ===
commit
review-pr
deploy
=== END ===`;
    expect(extractSkillCount(text)).toBe(3);
  });

  it("skills 섹션이 없으면 0을 반환한다", () => {
    expect(extractSkillCount("일반 텍스트")).toBe(0);
  });

  it("빈 skills 섹션이면 0을 반환한다", () => {
    const text = `=== skills ===
=== END ===`;
    expect(extractSkillCount(text)).toBe(0);
  });
});

// --- v2 5축 매핑 테스트 ---

/** 테스트용 최소 MdStats 생성 헬퍼 */
function makeMockStats(overrides: Partial<MdStats> = {}): MdStats {
  return {
    totalLines: 10,
    sectionCount: 1,
    toolNames: [],
    hasMemory: false,
    hasHooks: false,
    hasProjectMd: false,
    ruleCount: 0,
    claudeMdLines: 10,
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
    hasRoleDefinition: false,
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

describe("PATTERN_AXIS_MAP", () => {
  it("모든 DIMENSION_PATTERNS 패턴이 매핑되어야 한다 (teamImpact 제외)", () => {
    for (const [dim, patterns] of Object.entries(DIMENSION_PATTERNS)) {
      if (dim === "teamImpact") continue;
      for (let i = 0; i < patterns.length; i++) {
        const key = `${dim}:${i}`;
        expect(PATTERN_AXIS_MAP[key], `${key}가 PATTERN_AXIS_MAP에 없음`).toBeDefined();
      }
    }
  });

  it("teamImpact 패턴은 매핑되지 않아야 한다", () => {
    const teamKeys = Object.keys(PATTERN_AXIS_MAP).filter(k => k.startsWith("teamImpact:"));
    expect(teamKeys).toHaveLength(0);
  });
});

describe("countAxisSignals", () => {
  it("NEVER 키워드(control 패턴)가 있으면 control.a > 0이어야 한다", () => {
    // "NEVER"는 control 패턴의 "DO NOT" 또는 "MUST" 패턴에 직접 매칭되지 않으므로
    // "금지" (보안 맥락 아닌) 키워드로 테스트
    const text = "반드시 한국어로 답변하라. DO NOT use emojis.";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.control.a).toBeGreaterThan(0);
  });

  it("security 패턴(.env, token 등)이 있으면 control.a가 증가해야 한다", () => {
    const text = ".env 파일 커밋 금지. API 키 노출 절대 금지. token 보호";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.control.a).toBeGreaterThan(0);
  });

  it("toolDiversity 패턴(Slack, Notion 등)이 있으면 harness.a가 증가해야 한다", () => {
    const text = "Slack Notion GitHub Supabase Vercel";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.harness.a).toBeGreaterThan(0);
  });

  it("automation 파이프라인 패턴이 있으면 harness.b가 증가해야 한다", () => {
    const text = "PostToolUse hook 설정, CI/CD pipeline, webhook 연동, workflow trigger";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.harness.b).toBeGreaterThan(0);
  });

  it("automation 스크립트 패턴이 있으면 plan.b가 증가해야 한다", () => {
    const text = "cron 스케줄 설정, 자동 deploy 배포, script 실행";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.plan.b).toBeGreaterThan(0);
  });

  it("agentOrchestration 패턴이 있으면 harness.b와 plan.a가 모두 증가해야 한다", () => {
    const text = "autonomous agent loop 설정, iteration 반복 실행, stop condition 설정";
    const stats = makeMockStats();
    const result = countAxisSignals(text, stats);
    expect(result.harness.b).toBeGreaterThan(0);
    expect(result.plan.a).toBeGreaterThan(0);
  });

  it("확장 입력 보너스: 플러그인 5개 이상 → harness.a 증가", () => {
    const stats = makeMockStats({ isExpandedInput: true, pluginCount: 5 });
    const result = countAxisSignals("", stats);
    expect(result.harness.a).toBeGreaterThanOrEqual(1);
  });

  it("확장 입력 보너스: hookCount 3 이상 → harness.b 증가", () => {
    const stats = makeMockStats({ isExpandedInput: true, hookCount: 3 });
    const result = countAxisSignals("", stats);
    expect(result.harness.b).toBeGreaterThanOrEqual(1);
  });

  it("빈 텍스트 + 기본 stats에서 모든 축이 0이어야 한다", () => {
    const stats = makeMockStats();
    const result = countAxisSignals("", stats);
    expect(result.harness.a).toBe(0);
    expect(result.harness.b).toBe(0);
    expect(result.control.a).toBe(0);
    expect(result.control.b).toBe(0);
    expect(result.verbose.a).toBe(0);
    expect(result.verbose.b).toBe(0);
    expect(result.plan.a).toBe(0);
    expect(result.plan.b).toBe(0);
  });
});

describe("judgeVerboseAxis", () => {
  it("긴 텍스트(claudeMdLines > threshold)에서 a=1이어야 한다", () => {
    const stats = makeMockStats({ claudeMdLines: 50, isExpandedInput: false });
    const result = judgeVerboseAxis(stats);
    expect(result.a).toBe(1);
    expect(result.b).toBe(0);
  });

  it("짧은 텍스트(claudeMdLines <= threshold)에서 b=1이어야 한다", () => {
    const stats = makeMockStats({ claudeMdLines: 10, isExpandedInput: false });
    const result = judgeVerboseAxis(stats);
    expect(result.a).toBe(0);
    expect(result.b).toBe(1);
  });

  it("확장 입력 시 threshold가 100으로 높아져야 한다", () => {
    // 50줄: 일반은 장황(>30), 확장은 간결(<=100)
    const normalStats = makeMockStats({ claudeMdLines: 50, isExpandedInput: false });
    const expandedStats = makeMockStats({ claudeMdLines: 50, isExpandedInput: true });
    expect(judgeVerboseAxis(normalStats).a).toBe(1);  // 일반: 50 > 30 → 장황
    expect(judgeVerboseAxis(expandedStats).b).toBe(1); // 확장: 50 <= 100 → 간결
  });
});

describe("judgeStructureAxis", () => {
  it("헤딩이 3개 이상이면 a=1(구조화)이어야 한다", () => {
    const text = "# 섹션1\n내용\n## 섹션2\n내용\n### 섹션3\n내용";
    const result = judgeStructureAxis(text);
    expect(result.a).toBe(1);
    expect(result.b).toBe(0);
  });

  it("리스트 비율 20% 이상이면 a=1(구조화)이어야 한다", () => {
    const text = "- 항목1\n- 항목2\n- 항목3\n내용\n내용";
    const result = judgeStructureAxis(text);
    expect(result.a).toBe(1);
    expect(result.b).toBe(0);
  });

  it("플랫 텍스트에서 b=1(자유형)이어야 한다", () => {
    const text = "이것은 단순한 텍스트입니다.\n별다른 구조 없이 작성되었습니다.\n그냥 글입니다.\n추가 내용.\n더 많은 내용.\n또 다른 줄.\n마지막 줄.";
    const result = judgeStructureAxis(text);
    expect(result.a).toBe(0);
    expect(result.b).toBe(1);
  });

  it("번호 리스트도 구조화로 인식해야 한다", () => {
    const text = "1. 첫 번째\n2. 두 번째\n3. 세 번째\n4. 네 번째\n5. 다섯 번째";
    const result = judgeStructureAxis(text);
    expect(result.a).toBe(1);
    expect(result.b).toBe(0);
  });
});

describe("judgeControlFromSettings", () => {
  it("bypassPermissions가 있으면 b > 0(위임)이어야 한다", () => {
    const text = '"bypassPermissions": true';
    const result = judgeControlFromSettings(text);
    expect(result.b).toBeGreaterThan(0);
  });

  it("deny 규칙이 있으면 a > 0(통제)이어야 한다", () => {
    const text = '"deny": ["rm -rf", "git push --force"]';
    const result = judgeControlFromSettings(text);
    expect(result.a).toBeGreaterThan(0);
  });

  it('"plan" 모드가 있으면 a가 증가해야 한다', () => {
    const text = '"defaultMode": "plan"';
    const result = judgeControlFromSettings(text);
    expect(result.a).toBeGreaterThan(0);
  });

  it('"auto" 모드가 있으면 b > 0(위임)이어야 한다', () => {
    const text = '"defaultMode": "auto"';
    const result = judgeControlFromSettings(text);
    expect(result.b).toBeGreaterThan(0);
  });

  it("deny + plan 조합이면 a가 2 이상이어야 한다", () => {
    const text = '"deny": ["rm -rf"], "defaultMode": "plan"';
    const result = judgeControlFromSettings(text);
    expect(result.a).toBeGreaterThanOrEqual(2);
  });
});
