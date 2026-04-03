import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/analyzer/index";
import type { PersonaKey } from "@/lib/types";

/** 파워유저 CLAUDE.md 샘플 */
const POWER_USER_MD = `
# 퓨쳐스콜레 GitHub 보안 규칙
- .env, .env.* 파일은 절대 git에 커밋하지 마라
- API 키, 비밀번호, 토큰, 인증서 등 민감 정보를 코드나 파일에 포함하지 마라
- *.key, *.pem, credentials/, secrets/ 등 인증 관련 파일은 절대 커밋하지 마라
- 개인정보가 포함된 파일은 절대 커밋하지 마라
- git push 전에 민감 정보가 포함되지 않았는지 반드시 확인하라
- 커밋 메시지는 한글로 명확하게 작성하라

# 프로젝트 규칙

## 자동화
- PostToolUse hook 설정
- PreToolUse hook으로 검증
- cron 스케줄로 자동 deploy
- webhook으로 자동화 pipeline
- bot 자동 응답 script
- launchd 자동 실행

## 도구
- Slack: 팀 소통
- Notion: 문서화
- GitHub: 코드 관리
- Google Sheets: 데이터 관리
- Supabase: DB
- Vercel: 배포

## 메모리
- memory 파일로 컨텍스트 관리
- 세션 간 정보 유지

## 협업
- 팀 코드 리뷰 필수
- PR 기반 브랜치 전략
- 컨벤션 lint 준수

## 언어
- 항상 한국어로 답변
- 코드 주석도 한국어

## 태도
- IMPORTANT: 확인 없이 파일 삭제 금지
- NEVER push to main without review
- MUST verify before deploy
- ALWAYS write tests first
`;

/** 짧은 CLAUDE.md 샘플 */
const SHORT_MD = `
한국어로 답변해줘
`;

/** 빈 입력 */
const EMPTY_MD = "";

const ALL_PERSONA_KEYS: PersonaKey[] = [
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

describe("analyze() — 통합 테스트", () => {
  it("파워유저 MD에서 유효한 결과를 반환해야 한다", () => {
    const result = analyze(POWER_USER_MD);

    // 페르소나가 유효한 키여야 함
    expect(ALL_PERSONA_KEYS).toContain(result.persona);
  });

  it("결과에 모든 필수 필드가 있어야 한다", () => {
    const result = analyze(POWER_USER_MD);

    expect(result.persona).toBeDefined();
    expect(result).toHaveProperty("secondaryPersona");
    expect(result.qualityScores).toBeDefined();
    expect(result.scores).toBeDefined();
    expect(result.roasts).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.prescriptions).toBeDefined();
    expect(result.mdStats).toBeDefined();
  });

  it("scores에 6개 차원이 있어야 한다", () => {
    const result = analyze(POWER_USER_MD);

    expect(result.scores).toHaveProperty("automation");
    expect(result.scores).toHaveProperty("control");
    expect(result.scores).toHaveProperty("toolDiversity");
    expect(result.scores).toHaveProperty("contextAwareness");
    expect(result.scores).toHaveProperty("teamImpact");
    expect(result.scores).toHaveProperty("security");
  });

  it("scores는 모두 0~100 범위여야 한다", () => {
    const result = analyze(POWER_USER_MD);

    Object.values(result.scores).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it("roasts는 3개여야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.roasts).toHaveLength(3);
  });

  it("strengths는 3개여야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.strengths).toHaveLength(3);
  });

  it("prescriptions는 1개 이상이어야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.prescriptions.length).toBeGreaterThan(0);
  });

  it("mdStats에 도구명이 포함되어야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.mdStats.toolNames).toContain("Slack");
    expect(result.mdStats.toolNames).toContain("Notion");
    expect(result.mdStats.toolNames).toContain("GitHub");
  });

  it("mdStats에 hasMemory=true가 반영되어야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.mdStats.hasMemory).toBe(true);
  });

  it("mdStats에 hasHooks=true가 반영되어야 한다", () => {
    const result = analyze(POWER_USER_MD);
    expect(result.mdStats.hasHooks).toBe(true);
  });
});

describe("analyze() — 빈 입력 테스트", () => {
  it("빈 MD는 minimalist를 반환해야 한다", () => {
    const result = analyze(EMPTY_MD);
    expect(result.persona).toBe("minimalist");
  });

  it("빈 MD의 scores는 모두 0이어야 한다", () => {
    const result = analyze(EMPTY_MD);
    Object.values(result.scores).forEach((score) => {
      expect(score).toBe(0);
    });
  });

  it("빈 MD도 유효한 roasts/strengths/prescriptions를 반환해야 한다", () => {
    const result = analyze(EMPTY_MD);
    expect(result.roasts).toHaveLength(3);
    expect(result.strengths).toHaveLength(3);
    expect(result.prescriptions.length).toBeGreaterThan(0);
  });
});

describe("analyze() — 짧은 입력 테스트", () => {
  it("짧은 MD는 minimalist 또는 speedrunner를 반환해야 한다", () => {
    const result = analyze(SHORT_MD);
    expect(["minimalist", "speedrunner"]).toContain(result.persona);
  });

  it("짧은 MD의 점수는 전체적으로 낮아야 한다", () => {
    const result = analyze(SHORT_MD);
    const avg =
      Object.values(result.scores).reduce((a, b) => a + b, 0) / 6;
    expect(avg).toBeLessThan(30);
  });
});

describe("analyze() — 결과 일관성 테스트", () => {
  it("같은 입력은 같은 결과를 반환해야 한다 (순수 함수)", () => {
    const result1 = analyze(POWER_USER_MD);
    const result2 = analyze(POWER_USER_MD);

    expect(result1.persona).toBe(result2.persona);
    expect(result1.scores.automation).toBe(result2.scores.automation);
  });

  it("roast color는 red/orange/blue 중 하나여야 한다", () => {
    const result = analyze(POWER_USER_MD);
    result.roasts.forEach((r) => {
      expect(["red", "orange", "blue"]).toContain(r.color);
    });
  });

  it("prescription priority는 high/medium/low 중 하나여야 한다", () => {
    const result = analyze(POWER_USER_MD);
    result.prescriptions.forEach((p) => {
      expect(["high", "medium", "low"]).toContain(p.priority);
    });
  });
});
