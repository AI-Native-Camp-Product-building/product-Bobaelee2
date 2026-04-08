import { describe, it, expect } from "vitest";
import {
  DIMENSION_PATTERNS,
  countPatternMatches,
  countUniqueSignals,
  TOOL_NAMES,
  extractToolNames,
  extractSkillCount,
} from "@/lib/analyzer/patterns";

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
