# 차원 재교정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mdTI 7차원 평가 엔진의 패턴/임계값/보정을 벤치마크 데이터 기반으로 재교정하여, 차원 겹침 해소 + 비개발자 지원 + 페르소나 분포 균형화를 달성한다.

**Architecture:** 7차원 구조와 12개 페르소나는 유지. patterns.ts(패턴 재배치) → scorer.ts(threshold+보정) → classifier.ts(진입 임계값) → types.ts(라벨) → prescriptions.ts(톤 변환) 순으로 바텀업 수정. 각 태스크마다 TDD로 테스트 먼저 작성.

**Tech Stack:** TypeScript, Vitest, Next.js 16

**Spec:** `docs/superpowers/specs/2026-04-08-dimension-recalibration-design.md`

---

### Task 1: patterns.ts — control 패턴을 "주제 결합형"으로 교체

**Files:**
- Modify: `lib/analyzer/patterns.ts:25-37` (control 패턴 배열)
- Test: `__tests__/analyzer/patterns.test.ts`

- [ ] **Step 1: control 교차 매칭 방지 테스트 작성**

`__tests__/analyzer/patterns.test.ts`에 추가:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run __tests__/analyzer/patterns.test.ts -v`
Expected: "control 패턴 — 보안 맥락 제외" 테스트 중 4개 FAIL (현재 control이 보안 맥락도 감지하므로)

- [ ] **Step 3: control 패턴 배열 교체**

`lib/analyzer/patterns.ts:25-37`을 다음으로 교체:

```typescript
  // 제어 성향 — AI 사용 스타일 제어 (응답 형식, 코딩 스타일, 행동 제약)
  // 보안 맥락(커밋/secret/.env/token/push)은 negative lookahead로 제외
  control: [
    // 응답/출력 형식 제어
    /한국어로|korean|영어로|english/gi,
    /간결하게|짧게|concise|brief/gi,
    /이모지|emoji/gi,
    /마크다운|markdown|포맷/gi,
    // 코딩 스타일 강제
    /컨벤션|convention|naming/gi,
    /타입.*annotation|타입.*주석/gi,
    /주석.*필수|comment.*필수/gi,
    // 행동 제약 (보안/배포 맥락 제외)
    /확인.*후.*진행|승인.*후.*진행|before.*proceed/gi,
    /DO\s*NOT(?!.*secret)(?!.*\.env)(?!.*token)(?!.*credential)/gi,
    /금지(?!.*커밋)(?!.*\.env)(?!.*push)(?!.*secret)(?!.*token)/gi,
    /MUST(?!.*commit)(?!.*secret)(?!.*\.env)(?!.*token)/gi,
    // 비개발자도 쓰는 제어 표현
    /형식|format|양식/gi,
    /톤|tone|말투/gi,
    /대상.*설명|쉽게.*설명/gi,
  ],
```

파일 상단 주석도 수정: `6개 차원별` → `7개 차원별`

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run __tests__/analyzer/patterns.test.ts -v`
Expected: 신규 테스트 전부 PASS

- [ ] **Step 5: 기존 patterns 테스트의 차원 수 업데이트**

`__tests__/analyzer/patterns.test.ts:11-19`에서 `expectedDimensions` 배열에 `"agentOrchestration"` 추가 (현재 6개만 체크):

```typescript
const expectedDimensions = [
  "automation",
  "control",
  "toolDiversity",
  "contextAwareness",
  "teamImpact",
  "security",
  "agentOrchestration",
];
```

- [ ] **Step 6: 전체 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/analyzer/patterns.ts __tests__/analyzer/patterns.test.ts
git commit -m "control 패턴을 주제 결합형으로 교체 — 보안 맥락 negative lookahead"
```

---

### Task 2: patterns.ts — agentOrchestration 패턴 재배치 + 신규 추가

**Files:**
- Modify: `lib/analyzer/patterns.ts:9-23` (automation 배열 끝)
- Modify: `lib/analyzer/patterns.ts:112-134` (agentOrchestration 배열)
- Modify: `lib/analyzer/patterns.ts:97-109` (security 배열)
- Test: `__tests__/analyzer/patterns.test.ts`

- [ ] **Step 1: 패턴 재배치 테스트 작성**

`__tests__/analyzer/patterns.test.ts`에 추가:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run __tests__/analyzer/patterns.test.ts -v`
Expected: 재배치 테스트 FAIL

- [ ] **Step 3: automation 배열에 이동 패턴 추가**

`lib/analyzer/patterns.ts` automation 배열 끝(`/clasp\s+push/gi,` 다음)에 추가:

```typescript
    /rollback|복구/gi,                        // agentOrchestration에서 이동 — 운영 자동화
    /반드시.*후.*배포|deploy.*후.*반드시/gi,    // agentOrchestration에서 이동 — 배포 절차
```

- [ ] **Step 4: security 배열에 이동 패턴 추가**

`lib/analyzer/patterns.ts` security 배열 끝에 추가:

```typescript
    /실수로.*커밋|실패.*경험/gi,              // agentOrchestration에서 이동 — 보안 실수 언급
```

- [ ] **Step 5: agentOrchestration 배열에서 이동 패턴 제거 + 신규 추가**

`lib/analyzer/patterns.ts:112-134`를 다음으로 교체:

```typescript
  // 자율 에이전트 오케스트레이션 — 에이전트 루프, 가드레일, 자율 판단 위임
  agentOrchestration: [
    // 자율 실행 구조
    /autonomous|자율\s*에이전트|agent\s*loop/gi,
    /iteration|이터레이션|반복\s*실행/gi,
    /fresh\s*(instance|context)|clean\s*context/gi,
    // 안전장치
    /stop\s*condition|중단\s*조건/gi,
    /dry[\s-]?run|사전\s*테스트/gi,
    // 메모리 아키텍처
    /progress\.txt|progress\s*log/gi,
    /cross[\s-]?iteration|이전\s*이터레이션/gi,
    /pattern\s*consolidat|패턴\s*축적/gi,
    // 스코프/위임
    /한\s*번에\s*하나|one\s*(story|task)\s*per/gi,
    /context\s*window|컨텍스트\s*윈도우/gi,
    /병렬\s*(에이전트|처리|실행)|parallel\s*agent/gi,
    /권한\s*위임|자율.*실행.*확인\s*불필요/gi,
    // 신규 — 일반 사용자도 히트 가능한 패턴
    /알아서|스스로\s*판단/gi,
    /자동.*모드|auto.*mode/gi,
    /에이전트|agent(?!s\.md)/gi,
  ],
```

- [ ] **Step 6: 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/analyzer/patterns.ts __tests__/analyzer/patterns.test.ts
git commit -m "agentOrchestration 패턴 재배치 + 일반 사용자 패턴 3개 추가"
```

---

### Task 3: patterns.ts — 비개발자 패턴 + extractSkillCount

**Files:**
- Modify: `lib/analyzer/patterns.ts:79-95` (teamImpact 배열)
- Modify: `lib/analyzer/patterns.ts:63-77` (contextAwareness 배열)
- Modify: `lib/analyzer/patterns.ts` (extractSkillCount 함수 추가)
- Test: `__tests__/analyzer/patterns.test.ts`

- [ ] **Step 1: 비개발자 패턴 테스트 작성**

`__tests__/analyzer/patterns.test.ts`에 추가:

```typescript
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
```

- [ ] **Step 2: extractSkillCount 테스트 작성**

```typescript
import { extractSkillCount } from "@/lib/analyzer/patterns";

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
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run __tests__/analyzer/patterns.test.ts -v`
Expected: 비개발자 패턴 + extractSkillCount 테스트 FAIL

- [ ] **Step 4: teamImpact 배열에 비개발자 패턴 추가**

`lib/analyzer/patterns.ts` teamImpact 배열 끝에 추가:

```typescript
    /회의|meeting|미팅/gi,
    /보고|report|리포트/gi,
```

- [ ] **Step 5: contextAwareness 배열에 비개발자 패턴 추가**

contextAwareness 배열 끝에 추가:

```typescript
    /프로젝트|project/gi,
    /배경|background/gi,
```

- [ ] **Step 6: extractSkillCount 함수 추가**

`lib/analyzer/patterns.ts` 파일 하단 (`extractExpandedSignals` 함수 뒤)에 추가:

```typescript
/**
 * 확장 수집 데이터의 skills 섹션에서 스킬 수를 추출한다
 */
export function extractSkillCount(text: string): number {
  const skillSection = text.match(/===\s*skills\s*===\n([\s\S]*?)(?:\n===|$)/);
  if (!skillSection) return 0;
  return skillSection[1].trim().split("\n").filter(l => l.trim()).length;
}
```

- [ ] **Step 7: 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/analyzer/patterns.ts __tests__/analyzer/patterns.test.ts
git commit -m "비개발자 패턴 추가 + extractSkillCount 함수 추가"
```

---

### Task 4: scorer.ts — threshold 재조정 + deny 이중 가산 해소 + 확장 보정

**Files:**
- Modify: `lib/analyzer/scorer.ts:24-34` (THRESHOLD_RATIO + DEFAULT_RATIO)
- Modify: `lib/analyzer/scorer.ts:73-107` (확장 보정 블록)
- Create: `lib/analyzer/scorer.ts` 하단에 `isNonDevProfile` 함수
- Test: `__tests__/analyzer/scorer.test.ts`

- [ ] **Step 1: threshold 재조정 테스트 작성**

`__tests__/analyzer/scorer.test.ts`에 추가:

```typescript
describe("threshold 재교정 — 벤치마크 기반", () => {
  it("SaaS 6개 언급 시 toolDiversity가 100에 가까워야 한다", () => {
    const md = "Slack Notion GitHub Supabase Vercel Linear 사용";
    const scores = calculateScores(md);
    expect(scores.toolDiversity).toBeGreaterThanOrEqual(80);
  });

  it("SaaS 3개 언급 시 toolDiversity가 50 내외여야 한다", () => {
    const md = "Slack과 Notion, GitHub를 연동합니다";
    const scores = calculateScores(md);
    expect(scores.toolDiversity).toBeGreaterThanOrEqual(40);
    expect(scores.toolDiversity).toBeLessThanOrEqual(60);
  });

  it("기존 automation 고득점 샘플의 점수가 유지되어야 한다", () => {
    const md = `hook 설정, cron 스케줄, 자동 배포, bot 응답, pipeline, webhook, ci/cd, workflow, pre-commit`;
    const scores = calculateScores(md);
    expect(scores.automation).toBeGreaterThanOrEqual(80);
  });
});
```

- [ ] **Step 2: deny 이중 가산 해소 테스트 작성**

```typescript
describe("deny 이중 가산 해소", () => {
  it("deny 규칙이 있을 때 control에 가산되지 않아야 한다", () => {
    const mdBase = "일반 텍스트입니다\n=== settings.json ===\n";
    const mdWithDeny = mdBase + `"permissions": { "deny": ["Bash(rm -rf)", "Bash(git push --force)"] }`;
    const baseScores = calculateScores(mdBase);
    const denyScores = calculateScores(mdWithDeny);
    // security는 올라가야 하고
    expect(denyScores.security).toBeGreaterThan(baseScores.security);
    // control은 deny 때문에 올라가면 안 된다
    expect(denyScores.control).toBe(baseScores.control);
  });
});
```

- [ ] **Step 3: 확장 보정 추가 테스트 작성**

```typescript
describe("확장 보정 — agentOrchestration/teamImpact", () => {
  it("defaultMode:auto면 agentOrchestration이 올라가야 한다", () => {
    const md = `=== settings.json ===\n{"defaultMode": "auto"}`;
    const scores = calculateScores(md);
    expect(scores.agentOrchestration).toBeGreaterThanOrEqual(15);
  });

  it("projectMdCount 3개 이상이면 teamImpact이 올라가야 한다", () => {
    const md = `=== settings.json ===\n{}\n=== /proj1/CLAUDE.md ===\ntest\n=== /proj2/CLAUDE.md ===\ntest\n=== /proj3/CLAUDE.md ===\ntest`;
    const stats = extractMdStats(md);
    expect(stats.projectMdCount).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `npx vitest run __tests__/analyzer/scorer.test.ts -v`
Expected: 신규 테스트 FAIL

- [ ] **Step 5: THRESHOLD_RATIO + DEFAULT_RATIO 수정**

`lib/analyzer/scorer.ts:24-29`를 다음으로 교체:

```typescript
const THRESHOLD_RATIO: Partial<Record<keyof DimensionScores, number>> = {
  toolDiversity: 0.3,         // 20개 중 6개 → 만점 (벤치마크: 최대 3개 히트)
  agentOrchestration: 0.3,    // ~16개 중 5개 → 만점 (벤치마크: 75%가 0점)
  contextAwareness: 0.4,      // ~14개 중 6개 → 만점
  teamImpact: 0.5,            // ~16개 중 8개 → 만점 (분포가 건강)
  security: 0.5,              // ~11개 중 6개 → 만점 (벤치마크: 중위값 0)
  control: 0.7,               // 유지 (패턴 재설계로 점수 자연 하락)
};
const DEFAULT_RATIO = 0.6;    // automation: ~15개 중 9개 → 만점
```

- [ ] **Step 6: 확장 보정 블록 수정**

`lib/analyzer/scorer.ts:73-107` 전체 보정 블록을 다음으로 교체:

```typescript
  // 확장 수집 데이터가 있으면 구조화된 신호로 점수 보정
  if (isExpandedInput(md)) {
    const sig = extractExpandedSignals(md);

    // 보안: deny 규칙, 위험 명령어 차단, PreToolUse hook → security에만 귀속
    if (sig.blocksDangerousOps) result.security = Math.min(100, result.security + 12);
    if (sig.hasDenyRules) result.security = Math.min(100, result.security + Math.min(sig.denyCount * 3, 12));
    if (sig.hasPreToolUseHook) result.security = Math.min(100, result.security + 6);

    // 자동화: PostToolUse hook, Session hook, hook 유형 다양성
    if (sig.hasPostToolUseHook) result.automation = Math.min(100, result.automation + 8);
    if (sig.hasSessionHooks) result.automation = Math.min(100, result.automation + 5);
    if (sig.hookTypeCommandCount >= 2) result.automation = Math.min(100, result.automation + 6);

    // 컨텍스트 관리: prompt hook, statusLine, 마켓플레이스, 플러그인 선별, 프로젝트별 CLAUDE.md
    if (sig.hookTypePromptCount >= 1) result.contextAwareness = Math.min(100, result.contextAwareness + 5);
    if (sig.hasStatusLine) result.contextAwareness = Math.min(100, result.contextAwareness + 5);
    if (sig.hasMultipleMarketplaces) result.contextAwareness = Math.min(100, result.contextAwareness + 3);
    if (sig.pluginEnabledRatio > 0 && sig.pluginEnabledRatio < 0.5) {
      result.contextAwareness = Math.min(100, result.contextAwareness + 6);
    }
    if (sig.projectMdCount >= 2) result.contextAwareness = Math.min(100, result.contextAwareness + 6);

    // 제어: defaultMode가 auto가 아님 = 수동 승인 선호 (deny는 제거됨)
    if (!sig.defaultModeIsAuto) result.control = Math.min(100, result.control + 8);

    // 도구 다양성: MCP 서버 수
    const mcpServers = extractMcpServerNames(md);
    if (mcpServers.length >= 3) result.toolDiversity = Math.min(100, result.toolDiversity + 10);
    else if (mcpServers.length >= 1) result.toolDiversity = Math.min(100, result.toolDiversity + 5);

    // 에이전트 오케스트레이션: defaultMode:auto, AI 판단 hook, 스킬 수
    if (sig.defaultModeIsAuto) result.agentOrchestration = Math.min(100, result.agentOrchestration + 15);
    if (sig.hookTypePromptCount >= 2) result.agentOrchestration = Math.min(100, result.agentOrchestration + 8);
    const skillCount = extractSkillCount(md);
    if (skillCount >= 5) result.agentOrchestration = Math.min(100, result.agentOrchestration + 12);
    else if (skillCount >= 2) result.agentOrchestration = Math.min(100, result.agentOrchestration + 6);

    // 팀 임팩트: 프로젝트별 CLAUDE.md = 팀 환경
    if (sig.projectMdCount >= 3) result.teamImpact = Math.min(100, result.teamImpact + 8);
  }
```

import에 `extractSkillCount` 추가:

```typescript
import {
  // ... 기존 imports
  extractSkillCount,
} from "./patterns";
```

- [ ] **Step 7: isNonDevProfile 함수 추가**

`lib/analyzer/scorer.ts` 파일 하단 (`extractMdStats` 함수 뒤)에 추가:

```typescript
/**
 * 비개발자 프로파일인지 판정한다
 * 역할 정의가 있으면서 개발자 특화 차원이 전부 낮은 경우
 */
export function isNonDevProfile(stats: MdStats, scores: DimensionScores): boolean {
  return (
    stats.hasRoleDefinition &&
    scores.automation < 20 &&
    scores.security < 20 &&
    scores.agentOrchestration < 10
  );
}
```

- [ ] **Step 8: 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/analyzer/scorer.ts __tests__/analyzer/scorer.test.ts
git commit -m "threshold 벤치마크 기반 재조정 + deny 이중 가산 해소 + 확장 보정 균형화"
```

---

### Task 5: classifier.ts — 페르소나 진입 임계값 하향 + fit 재조정

**Files:**
- Modify: `lib/analyzer/classifier.ts:84-131` (후보 등록 블록)
- Test: `__tests__/analyzer/classifier.test.ts`

- [ ] **Step 1: 새 임계값 경계 테스트 작성**

`__tests__/analyzer/classifier.test.ts`에 추가:

```typescript
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
    const scores = makeScores({ automation: 55, toolDiversity: 40, control: 10, security: 10, contextAwareness: 10, teamImpact: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("puppet-master");
  });

  it("teamImpact=50이면 evangelist 후보로 등록되어야 한다", () => {
    const scores = makeScores({ teamImpact: 50, automation: 10, control: 10, security: 10, toolDiversity: 10, contextAwareness: 10, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    expect(result.primary).toBe("evangelist");
  });

  it("모든 차원이 45인 중간 점수에서 fallback이 아닌 후보가 등록되어야 한다", () => {
    const scores = makeScores({ automation: 45, control: 45, toolDiversity: 45, security: 45, contextAwareness: 45, teamImpact: 45, agentOrchestration: 0 });
    const result = classifyPersona(scores, makeMdStats());
    // craftsman(sd 낮음) 또는 다른 후보 — minimalist가 아니어야 함
    expect(result.primary).not.toBe("minimalist");
  });

  it("architect: eco=20, hookCount=3이면 architect", () => {
    const scores = makeScores({ automation: 50, agentOrchestration: 30 });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 8,
      mcpServerCount: 5,
      commandCount: 7,
      hookCount: 3,
    });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("architect");
  });

  it("huggies: eco=8, hookCount=1이면 huggies", () => {
    const scores = makeScores({ automation: 30, agentOrchestration: 10 });
    const stats = makeMdStats({
      isExpandedInput: true,
      pluginCount: 4,
      mcpServerCount: 2,
      commandCount: 2,
      hookCount: 1,
    });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("huggies");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run __tests__/analyzer/classifier.test.ts -v`
Expected: 새 임계값 테스트 대부분 FAIL

- [ ] **Step 3: classifier.ts 후보 등록 블록 수정**

`lib/analyzer/classifier.ts:84-131`을 다음으로 교체:

```typescript
  // 에코시스템 기반 (확장 수집 시) — 임계값 완화
  if (mdStats.isExpandedInput) {
    const eco = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.commandCount;
    if (eco >= 20 && mdStats.hookCount >= 3) {
      candidates.push({ persona: "architect", fit: 95 });
    } else if (eco >= 8 && mdStats.hookCount >= 1) {
      candidates.push({ persona: "huggies", fit: 80 });
    }
  }

  // 차원 기반 후보 — 벤치마크 기반 임계값
  if (scores.automation >= 55 && scores.toolDiversity >= 40) {
    const fit = (scores.automation - 55) / 45 * 50 + (scores.toolDiversity - 40) / 60 * 50;
    candidates.push({ persona: "puppet-master", fit });
  }
  if (scores.automation >= 45 && scores.security < 20) {
    const gap = scores.automation - scores.security;
    const fit = Math.max(0, (gap - 25) / 75 * 100);
    candidates.push({ persona: "daredevil", fit });
  }
  if (scores.security >= 55) {
    const fit = (scores.security - 55) / 45 * 100;
    candidates.push({ persona: "fortress", fit });
  }
  if (scores.control >= 55) {
    const fit = (scores.control - 55) / 45 * 100;
    candidates.push({ persona: "legislator", fit });
  }
  if (scores.teamImpact >= 50) {
    const fit = (scores.teamImpact - 50) / 50 * 100;
    candidates.push({ persona: "evangelist", fit });
  }
  if (scores.toolDiversity >= 45 && scores.automation < 30) {
    const fit = (scores.toolDiversity - 45) / 55 * 50 + (30 - scores.automation) / 30 * 50;
    candidates.push({ persona: "collector", fit });
  }
  if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30 && max < 70) {
    candidates.push({ persona: "speedrunner", fit: 50 });
  }
  if (sd < 20 && avg >= 30) {
    let fit = Math.max(0, (avg - 30) / 70 * 100);
    const hasStrongCompetitor = candidates.some(c => c.fit >= 15);
    if (hasStrongCompetitor) fit *= 0.5;
    candidates.push({ persona: "craftsman", fit });
  }
```

- [ ] **Step 4: 기존 테스트 중 깨지는 것 수정**

기존 테스트에서 `security: 75`로 fortress를 테스트하는 케이스는 여전히 동작 (75 >= 55). `control: 80`으로 legislator 테스트도 동작 (80 >= 55). **기존 고득점 테스트는 수정 불필요.**

다만 `security: 70`이 정확히 경계였던 테스트가 있다면 확인 필요.

- [ ] **Step 5: 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/analyzer/classifier.ts __tests__/analyzer/classifier.test.ts
git commit -m "페르소나 진입 임계값 벤치마크 기반 하향 + architect/huggies 완화"
```

---

### Task 6: types.ts + prescriptions.ts — 라벨 변경 + 비개발자 톤 변환

**Files:**
- Modify: `lib/types.ts:168-176` (DIMENSION_LABELS)
- Modify: `lib/content/prescriptions.ts` (톤 변환 후처리)
- Test: `__tests__/analyzer/scorer.test.ts` (isNonDevProfile)
- Test: `__tests__/content/roasts.test.ts` (처방전)

- [ ] **Step 1: isNonDevProfile 테스트 작성**

`__tests__/analyzer/scorer.test.ts`에 추가:

```typescript
import { isNonDevProfile } from "@/lib/analyzer/scorer";

describe("isNonDevProfile", () => {
  it("역할 정의 + 개발 차원 낮으면 true", () => {
    const stats = { ...extractMdStats("나는 마케터입니다"), hasRoleDefinition: true } as MdStats;
    const scores: DimensionScores = {
      automation: 10, control: 30, toolDiversity: 15,
      contextAwareness: 10, teamImpact: 20, security: 5, agentOrchestration: 0,
    };
    expect(isNonDevProfile(stats, scores)).toBe(true);
  });

  it("역할 정의가 없으면 false", () => {
    const stats = { ...extractMdStats("일반 텍스트"), hasRoleDefinition: false } as MdStats;
    const scores: DimensionScores = {
      automation: 5, control: 5, toolDiversity: 5,
      contextAwareness: 5, teamImpact: 5, security: 5, agentOrchestration: 0,
    };
    expect(isNonDevProfile(stats, scores)).toBe(false);
  });

  it("automation이 높으면 false", () => {
    const stats = { ...extractMdStats("나는 DevOps입니다"), hasRoleDefinition: true } as MdStats;
    const scores: DimensionScores = {
      automation: 50, control: 30, toolDiversity: 15,
      contextAwareness: 10, teamImpact: 20, security: 5, agentOrchestration: 0,
    };
    expect(isNonDevProfile(stats, scores)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 확인**

Run: `npx vitest run __tests__/analyzer/scorer.test.ts -v`
Expected: isNonDevProfile 테스트 PASS (함수는 Task 4에서 이미 추가)

- [ ] **Step 3: DIMENSION_LABELS 변경**

`lib/types.ts:168-176`을 다음으로 교체:

```typescript
export const DIMENSION_LABELS: Record<keyof DimensionScores, { label: string; description: string }> = {
  automation: { label: "자동화", description: "반복 작업을 자동으로 처리" },
  control: { label: "규칙", description: "AI에게 지시하는 규칙과 제약" },
  toolDiversity: { label: "도구", description: "연결한 외부 서비스 종류" },
  contextAwareness: { label: "기억", description: "대화 맥락과 정보 관리" },
  teamImpact: { label: "협업", description: "팀과 함께 일하는 방식" },
  security: { label: "보안", description: "민감 정보 보호 규칙" },
  agentOrchestration: { label: "자율", description: "AI에게 맡기는 판단 범위" },
};
```

types.ts:12의 주석도 수정: `13가지 페르소나 키` → `12가지 페르소나 키`

types.ts:178의 패턴 수도 확인 — `TOTAL_PATTERN_COUNT`는 패턴 수 변경 후 재계산 필요:

```typescript
export const TOTAL_PATTERN_COUNT = Object.values(
  require("./analyzer/patterns").DIMENSION_PATTERNS
).reduce((sum: number, arr: unknown[]) => sum + arr.length, 0);
```

직접 숫자로 넣는 것이 안전하므로 패턴 추가/제거 수를 계산해서 업데이트. (Task 1-3 완료 후 정확한 수 확인)

- [ ] **Step 4: prescriptions.ts에 톤 변환 추가**

`lib/content/prescriptions.ts` 상단에 import 추가:

```typescript
import { isNonDevProfile } from "@/lib/analyzer/scorer";
```

파일 하단의 `generatePrescriptions` 함수 반환 전에 톤 변환 후처리 추가:

```typescript
/** 개발자 용어 → 비개발자 용어 치환 테이블 */
const DEV_TO_GENERAL: [RegExp, string][] = [
  [/커밋/g, "변경 사항 저장"],
  [/디버깅/g, "문제 해결"],
  [/린트/g, "자동 검수"],
  [/코드\s*리뷰/g, "동료 검토"],
  [/\bPR\b/g, "변경 요청"],
  [/빌드/g, "실행 준비"],
  [/CI\/CD/g, "자동 배포"],
  [/Hook/gi, "자동 실행 규칙"],
  [/\.env/g, "비밀 설정 파일"],
  [/MCP/g, "외부 연결"],
];

// generatePrescriptions 함수의 return 직전에:
if (isNonDevProfile(mdStats, dimensionScores)) {
  for (const item of selected) {
    item.text = DEV_TO_GENERAL.reduce(
      (t, [from, to]) => t.replace(from, to),
      item.text
    );
  }
}
```

- [ ] **Step 5: 전체 테스트 통과 확인 + 커밋**

Run: `npx vitest run -v`
Expected: 전체 PASS

```bash
git add lib/types.ts lib/content/prescriptions.ts __tests__/analyzer/scorer.test.ts
git commit -m "차원 라벨 비개발자 친화 변경 + 처방전 톤 변환 추가"
```

---

### Task 7: 벤치마크 재분석 + 최종 검증

**Files:**
- Modify: `scripts/analyze-benchmarks.ts` (import 경로 확인)
- Test: 전체 테스트 스위트

- [ ] **Step 1: 전체 테스트 실행**

Run: `npx vitest run -v`
Expected: 전체 PASS

- [ ] **Step 2: 벤치마크 42개 레포 재분석**

Run: `npx tsx scripts/analyze-benchmarks.ts`

검증 기준:
- evangelist+legislator 비율이 61% → **40% 이하**로 감소
- collector/fortress/puppet-master 출현율 증가
- toolDiversity 점수 분포가 중위값 7 → **20 이상**으로 이동
- agentOrchestration 점수 분포가 중위값 0 → **10 이상**으로 이동

결과가 기준에 미달하면 threshold를 미세 조정하고 재실행.

- [ ] **Step 3: Vivi의 CLAUDE.md로 A경로 테스트**

Run: `npm run dev` 후 로컬에서 Vivi의 `~/.claude/CLAUDE.md` 붙여넣기

검증: minimalist가 아닌 의미 있는 페르소나로 분류되는지 확인

- [ ] **Step 4: 비개발자 샘플 테스트**

로컬에서 다음 텍스트로 분석 실행:
```
나는 마케터입니다.
항상 한국어로 쉽게 설명해주세요.
주간 보고서 형식에 맞춰 작성해주세요.
Slack과 Notion을 사용합니다.
```

검증: 최소 2개 차원에서 0이 아닌 점수, 처방전에 개발자 용어 없음

- [ ] **Step 5: TOTAL_PATTERN_COUNT 업데이트**

모든 패턴 변경이 완료된 후, 실제 패턴 수를 세서 `lib/types.ts:178`의 `TOTAL_PATTERN_COUNT` 업데이트:

```bash
npx tsx -e "
const { DIMENSION_PATTERNS } = require('./lib/analyzer/patterns');
const total = Object.values(DIMENSION_PATTERNS).reduce((s, a) => s + a.length, 0);
console.log('TOTAL_PATTERN_COUNT =', total);
"
```

결과값으로 `types.ts` 업데이트.

- [ ] **Step 6: 최종 커밋**

```bash
git add -A
git commit -m "벤치마크 검증 완료 + TOTAL_PATTERN_COUNT 업데이트"
```
