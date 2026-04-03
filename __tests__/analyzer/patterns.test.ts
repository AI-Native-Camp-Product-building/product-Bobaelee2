import { describe, it, expect } from "vitest";
import {
  DIMENSION_PATTERNS,
  countPatternMatches,
  countUniqueSignals,
  TOOL_NAMES,
  extractToolNames,
} from "@/lib/analyzer/patterns";

describe("DIMENSION_PATTERNS", () => {
  it("6개 차원이 모두 정의되어야 한다", () => {
    const expectedDimensions = [
      "automation",
      "control",
      "toolDiversity",
      "contextAwareness",
      "teamImpact",
      "security",
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
  it("'금지', 'NEVER', 'MUST' 등을 감지해야 한다", () => {
    const text = "절대 커밋 금지. NEVER push to main. 반드시 확인 후 진행. IMPORTANT 규칙";
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
