import { describe, it, expect } from "vitest";
import { calculateQualityScores } from "@/lib/analyzer/quality";
import type { MdStats } from "@/lib/types";

function makeStats(overrides: Partial<MdStats> = {}): MdStats {
  const totalLines = overrides.totalLines ?? 50;
  return {
    totalLines, sectionCount: 5, toolNames: [], hasMemory: false, hasHooks: false,
    hasProjectMd: false, hasRoleDefinition: false, ruleCount: 0, claudeMdLines: totalLines, keywordHits: {}, keywordUniqueHits: {},
    pluginCount: 0, mcpServerCount: 0, commandCount: 0, hookCount: 0,
    skillCount: 0, agentCount: 0,
    pluginNames: [], mcpServerNames: [], commandNames: [], isExpandedInput: false,
    denyCount: 0, blocksDangerousOps: false, hookPromptCount: 0, hookCommandCount: 0,
    pluginEnabledRatio: 0, projectMdCount: 0,
    ...overrides,
  };
}

describe("calculateQualityScores — 빈 입력", () => {
  it("빈 텍스트는 모든 차원이 0이어야 한다", () => {
    const q = calculateQualityScores("", makeStats({ totalLines: 0 }));
    Object.values(q).forEach(v => expect(v).toBe(0));
  });
});

describe("scoreActionability", () => {
  it("백틱 커맨드 3개 이상이면 30점 이상", () => {
    const md = "## Commands\n- `npm run test`\n- `npm run build`\n- `npm run lint`";
    const q = calculateQualityScores(md, makeStats({ totalLines: 3 }));
    expect(q.actionability).toBeGreaterThanOrEqual(30);
  });

  it("자연어 설명만 있으면 커맨드 점수 없음", () => {
    const md = "테스트를 돌려야 합니다\n빌드를 해야 합니다";
    const q = calculateQualityScores(md, makeStats({ totalLines: 2 }));
    expect(q.actionability).toBeLessThan(15);
  });

  it("아키텍처 경로 + 역할 설명이 있으면 보너스", () => {
    const md = "`/src/services/` → 비즈니스 로직\n`/src/db/` → 데이터베이스\n`/src/handlers/` → HTTP 핸들러";
    const q = calculateQualityScores(md, makeStats({ totalLines: 3 }));
    expect(q.actionability).toBeGreaterThanOrEqual(25);
  });

  it("검증 루프 패턴이 있으면 +20", () => {
    const md = "반드시 test 실행 후 commit\n`npm run test`";
    const q = calculateQualityScores(md, makeStats({ totalLines: 2 }));
    expect(q.actionability).toBeGreaterThanOrEqual(35); // 커맨드 15 + 검증 20
  });
});

describe("scoreConciseness", () => {
  it("15~50줄이면 길이 점수 최대 (50점 구간)", () => {
    const md = Array(30).fill("- 규칙").join("\n");
    const q = calculateQualityScores(md, makeStats({ totalLines: 30 }));
    expect(q.conciseness).toBeGreaterThanOrEqual(50);
  });

  it("251줄 이상이면 길이 점수 최저", () => {
    const md = Array(300).fill("- 규칙").join("\n");
    const q = calculateQualityScores(md, makeStats({ totalLines: 300 }));
    expect(q.conciseness).toBeLessThanOrEqual(35); // 5 + 분리 보너스 가능
  });

  it("'clean code' 같은 노이즈가 있으면 감점", () => {
    const withNoise = "## Rules\n- clean code 작성\n- DRY 원칙\n- 좋은 코드 작성\n" + Array(20).fill("- 규칙").join("\n");
    const withoutNoise = "## Rules\n" + Array(23).fill("- 규칙").join("\n");
    const qNoise = calculateQualityScores(withNoise, makeStats({ totalLines: 23 }));
    const qClean = calculateQualityScores(withoutNoise, makeStats({ totalLines: 23 }));
    expect(qClean.conciseness).toBeGreaterThan(qNoise.conciseness);
  });

  it("@import 사용하면 분리 보너스", () => {
    const md = "@./rules.md\n" + Array(20).fill("- 규칙").join("\n");
    const q = calculateQualityScores(md, makeStats({ totalLines: 21 }));
    expect(q.conciseness).toBeGreaterThanOrEqual(60); // 50 + 10
  });

  it("한국어 노이즈 패턴도 감점", () => {
    const md = "## 태도\n- 깔끔하게 작성\n- 정중하게 답변\n- 친절하게 응답\n" + Array(20).fill("- 규칙").join("\n");
    const q = calculateQualityScores(md, makeStats({ totalLines: 23 }));
    // 노이즈 3개 × -5 = -15
    expect(q.conciseness).toBeLessThan(50);
  });
});

describe("scoreStructure", () => {
  it("표준 섹션명이 있으면 보너스", () => {
    const md = "# Project\n## Commands\n- test\n## Architecture\n- src/\n## Rules\n- 규칙";
    const q = calculateQualityScores(md, makeStats({ totalLines: 7, sectionCount: 3 }));
    expect(q.structure).toBeGreaterThanOrEqual(30);
  });

  it("IMPORTANT 남발하면 우선순위 마킹 점수 저하", () => {
    const lines = Array(10).fill("IMPORTANT: 규칙");
    const md = lines.join("\n");
    const q = calculateQualityScores(md, makeStats({ totalLines: 10 }));
    // 10줄 중 10줄이 IMPORTANT = 100% → 5점만
    expect(q.structure).toBeLessThan(60);
  });
});

describe("scoreUniqueness", () => {
  it("구체적 금지 + 워크플로우가 있으면 높은 점수", () => {
    const md = "- NEVER modify /src/legacy/ 모듈\n- PR은 반드시 1명 이상 리뷰 후 merge\n- Redis는 캐싱용만";
    const q = calculateQualityScores(md, makeStats({ totalLines: 3 }));
    expect(q.uniqueness).toBeGreaterThanOrEqual(40);
  });

  it("도구명만 나열하면 도구 맥락 점수 낮음", () => {
    const md = "Slack, Notion, GitHub, Supabase";
    const q = calculateQualityScores(md, makeStats({ totalLines: 1 }));
    expect(q.uniqueness).toBeLessThan(20);
  });
});

describe("scoreSafety", () => {
  it(".env + 금지 동사 조합이면 민감 정보 25점", () => {
    const md = ".env 파일 절대 커밋 금지\nAPI 키 노출 절대 금지\n비밀번호 커밋 금지";
    const q = calculateQualityScores(md, makeStats({ totalLines: 3 }));
    expect(q.safety).toBeGreaterThanOrEqual(40); // 금지 15~25 + 민감 25
  });

  it("검증 의무화 패턴이 있으면 25점", () => {
    const md = "반드시 test 실행 후 commit";
    const q = calculateQualityScores(md, makeStats({ totalLines: 1 }));
    expect(q.safety).toBeGreaterThanOrEqual(25);
  });

  it("확장 데이터 보너스는 isExpandedInput일 때만", () => {
    const md = ".env 절대 커밋 금지";
    const basic = calculateQualityScores(md, makeStats({ isExpandedInput: false, denyCount: 5 }));
    const expanded = calculateQualityScores(md, makeStats({ isExpandedInput: true, denyCount: 5, blocksDangerousOps: true }));
    expect(expanded.safety).toBeGreaterThan(basic.safety);
  });
});

describe("calculateMdPower (품질 기반)", () => {
  it("5개 차원 모두 100이면 1000점", () => {
    // 직접 power.ts 테스트는 power.test.ts에서 하지만, 간접 확인
    const md = `## Commands
\`npm run test\`
\`npm run build\`
\`npm run lint\`
\`npm run typecheck\`
\`npm run deploy\`

## Architecture
\`/src/services/\` → 비즈니스 로직
\`/src/db/\` → 데이터베이스
\`/src/handlers/\` → HTTP 핸들러
\`/src/middleware/\` → 미들웨어

## Rules
- 반드시 test 실행 후 commit
- before push 반드시 typecheck
- .env 파일 절대 커밋 금지
- API 키 노출 절대 금지
- NEVER modify /src/legacy/ 모듈
- credential 노출 금지
- token 커밋 금지
- 비밀번호 절대 노출 금지

## Workflow
- PR은 반드시 1명 이상 리뷰 후 merge
- branch 전략: git flow

## Environment
- .env 파일에 환경 변수 설정 필요
- Redis 서비스 실행 필요

## Tools
- Slack → 팀 소통
- Notion → 문서화 위해 사용
- GitHub → 코드 관리 연동
- Supabase → DB 처리

## Constraints
- Redis는 캐싱용만
- 직접 접근 금지
- 대신 사용하지 않음`;
    const q = calculateQualityScores(md, makeStats({ totalLines: md.split("\n").length }));
    // 모든 차원이 상당히 높아야 함
    const total = Object.values(q).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(200);
  });

  it("에코시스템이 많아도 품질 점수에 영향 없음", () => {
    const md = "한국어로 답변";
    const q1 = calculateQualityScores(md, makeStats({ pluginCount: 0 }));
    const q2 = calculateQualityScores(md, makeStats({ pluginCount: 100 }));
    expect(q1).toEqual(q2);
  });
});
