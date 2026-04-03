import { describe, it, expect } from "vitest";
import { calculateScores, extractMdStats } from "@/lib/analyzer/scorer";

// 자동화 특화 CLAUDE.md 샘플
const HIGH_AUTOMATION_MD = `
# 자동화 설정

## 훅 설정
- PostToolUse hook으로 자동 실행
- PreToolUse hook으로 검증
- cron 스케줄: 매일 09:00
- 자동화 스크립트 배포
- webhook 연동
- bot 자동 응답
- pipeline 구성
- launchd 설정
- clasp push 자동화
- deploy 스크립트

## 봇 관리
- Slack bot 자동 응답
- 자동 schedule 관리
- 스크립트로 자동 처리
`;

// 보안 특화 CLAUDE.md 샘플
const HIGH_SECURITY_MD = `
# 보안 규칙
- .env 파일 절대 커밋 금지
- API 키 노출 금지
- token 관리 필수
- 민감 정보 보안
- password 절대 커밋하지 마라
- credential 보호
- 암호화 필수
- 권한 관리
- sensitive 데이터 보호
- auth 토큰 외부 노출 금지
`;

// 최소한의 CLAUDE.md 샘플
const MINIMAL_MD = `
안녕하세요
`;

// 파워유저 CLAUDE.md 샘플
const POWER_USER_MD = `
# 프로젝트 규칙

## 자동화
- PostToolUse hook 설정
- cron 스케줄로 자동 deploy
- webhook으로 자동화 pipeline
- bot 자동 응답 script

## 보안
- .env 파일 절대 커밋 금지
- API 키 token 관리 필수
- 민감 정보 보안 유지
- credential 노출 금지

## 도구
- Slack, Notion, GitHub 사용
- Google Sheets 연동
- Supabase DB 관리
- Vercel 배포

## 협업
- 팀 코드 리뷰 필수
- PR 기반 브랜치 전략
- 컨벤션 lint 준수

## 메모리
- memory/session 관리
- 컨텍스트 유지

## 규칙
- 반드시 확인 후 진행
- MUST verify before push
- NEVER skip review
- ALWAYS write in Korean
`;

describe("calculateScores", () => {
  it("자동화 특화 MD는 높은 automation 점수를 가져야 한다", () => {
    const scores = calculateScores(HIGH_AUTOMATION_MD);
    expect(scores.automation).toBeGreaterThan(50);
  });

  it("보안 특화 MD는 높은 security 점수를 가져야 한다", () => {
    const scores = calculateScores(HIGH_SECURITY_MD);
    expect(scores.security).toBeGreaterThan(50);
  });

  it("최소 MD는 모든 점수가 낮아야 한다", () => {
    const scores = calculateScores(MINIMAL_MD);
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(avg).toBeLessThan(20);
  });

  it("빈 텍스트는 모든 점수가 0이어야 한다", () => {
    const scores = calculateScores("");
    Object.values(scores).forEach((v) => {
      expect(v).toBe(0);
    });
  });

  it("모든 점수는 0~100 범위여야 한다", () => {
    const scores = calculateScores(POWER_USER_MD);
    Object.values(scores).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("파워유저 MD는 여러 차원에서 높은 점수를 가져야 한다", () => {
    const scores = calculateScores(POWER_USER_MD);
    const highScores = Object.values(scores).filter((v) => v > 30);
    expect(highScores.length).toBeGreaterThanOrEqual(3);
  });

  it("6개 차원이 모두 포함된 결과를 반환해야 한다", () => {
    const scores = calculateScores(POWER_USER_MD);
    expect(scores).toHaveProperty("automation");
    expect(scores).toHaveProperty("control");
    expect(scores).toHaveProperty("toolDiversity");
    expect(scores).toHaveProperty("contextAwareness");
    expect(scores).toHaveProperty("teamImpact");
    expect(scores).toHaveProperty("security");
  });
});

describe("calculateScores — 고유 신호 카운팅", () => {
  it("같은 키워드 반복은 점수를 올리지 않아야 한다", () => {
    const repeated = "hook hook hook hook hook hook hook hook hook hook";
    const diverse = "hook, cron, 자동 배포, bot, webhook";
    const repeatedScore = calculateScores(repeated);
    const diverseScore = calculateScores(diverse);
    expect(diverseScore.automation).toBeGreaterThan(repeatedScore.automation);
  });

  it("서로 다른 신호가 많을수록 점수가 높아야 한다", () => {
    const few = ".env 보호";
    const many = ".env 보호, API 키 금지, 민감 정보, 비밀번호, 커밋 금지, 권한 관리, 암호화, 보안";
    const fewScore = calculateScores(few);
    const manyScore = calculateScores(many);
    expect(manyScore.security).toBeGreaterThan(fewScore.security);
  });
});

describe("extractMdStats", () => {
  it("줄 수를 올바르게 계산해야 한다", () => {
    const stats = extractMdStats(POWER_USER_MD);
    expect(stats.totalLines).toBeGreaterThan(0);
  });

  it("섹션 수를 올바르게 계산해야 한다", () => {
    const stats = extractMdStats(POWER_USER_MD);
    expect(stats.sectionCount).toBeGreaterThanOrEqual(5);
  });

  it("도구명을 올바르게 추출해야 한다", () => {
    const stats = extractMdStats(POWER_USER_MD);
    expect(stats.toolNames).toContain("Slack");
    expect(stats.toolNames).toContain("Notion");
    expect(stats.toolNames).toContain("GitHub");
  });

  it("memory 언급 여부를 감지해야 한다", () => {
    const withMemory = extractMdStats("## 메모리 설정\nmemory 관리 중요");
    expect(withMemory.hasMemory).toBe(true);

    const withoutMemory = extractMdStats("## 일반 설정\n기본 설정만 있음");
    expect(withoutMemory.hasMemory).toBe(false);
  });

  it("hook 언급 여부를 감지해야 한다", () => {
    const withHooks = extractMdStats("PostToolUse hook 설정");
    expect(withHooks.hasHooks).toBe(true);
  });

  it("규칙 수를 계산해야 한다", () => {
    const stats = extractMdStats(HIGH_SECURITY_MD);
    expect(stats.ruleCount).toBeGreaterThan(0);
  });

  it("빈 텍스트에서 기본값을 반환해야 한다", () => {
    const stats = extractMdStats("");
    expect(stats.totalLines).toBe(0);
    expect(stats.sectionCount).toBe(0);
    expect(stats.toolNames).toEqual([]);
    expect(stats.hasMemory).toBe(false);
    expect(stats.hasHooks).toBe(false);
    expect(stats.ruleCount).toBe(0);
  });

  it("keywordHits에 6개 차원 히트 수가 포함되어야 한다", () => {
    const stats = extractMdStats(POWER_USER_MD);
    expect(stats.keywordHits).toHaveProperty("automation");
    expect(stats.keywordHits).toHaveProperty("security");
    expect(stats.keywordHits).toHaveProperty("control");
  });

  it("keywordUniqueHits에 6개 차원 고유 신호 수가 포함되어야 한다", () => {
    const stats = extractMdStats(POWER_USER_MD);
    expect(stats.keywordUniqueHits).toHaveProperty("automation");
    expect(stats.keywordUniqueHits).toHaveProperty("security");
    expect(stats.keywordUniqueHits).toHaveProperty("contextAwareness");
  });

  it("keywordUniqueHits는 keywordHits 이하여야 한다 (고유 ≤ 반복)", () => {
    const stats = extractMdStats(POWER_USER_MD);
    for (const dim of Object.keys(stats.keywordUniqueHits)) {
      expect(stats.keywordUniqueHits[dim]).toBeLessThanOrEqual(stats.keywordHits[dim]);
    }
  });

  it("빈 텍스트에서 keywordUniqueHits는 빈 객체여야 한다", () => {
    const stats = extractMdStats("");
    expect(stats.keywordUniqueHits).toEqual({});
  });
});
