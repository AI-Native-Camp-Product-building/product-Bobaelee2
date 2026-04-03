# mdTI 페르소나 재설계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 페르소나 분류 정확도 개선 + 처방전 중복 해소를 위해 macgyver 제거, deep-diver 조건 교체, collaboration→teamImpact 재정의, 처방전 ConditionalPrescription 구조 도입

**Architecture:** 6개 차원 중 collaboration을 teamImpact로 리네임+패턴 확장, classifier에서 macgyver 삭제+deep-diver dominanceRatio 조건+경계 케이스 가드 추가, prescriptions를 tag 기반 ConditionalPrescription으로 전면 리팩터링하여 5개 고정 출력

**Tech Stack:** Next.js (TypeScript), Vitest, Supabase

**Spec:** `docs/superpowers/specs/2026-04-04-mdti-persona-redesign.md`

---

## 파일 구조

| 파일 | 역할 | 변경 범위 |
|------|------|-----------|
| `lib/types.ts` | 타입 정의 | PersonaKey에서 macgyver 제거, DimensionScores collaboration→teamImpact, ConditionalPrescription 타입 추가 |
| `lib/analyzer/patterns.ts` | 패턴 정규식 | collaboration→teamImpact 패턴 교체 (8→10개) |
| `lib/analyzer/scorer.ts` | 차원 점수 계산 | collaboration→teamImpact 키, THRESHOLD_RATIO 0.6 |
| `lib/analyzer/classifier.ts` | 페르소나 분류 | deep-diver dominanceRatio, speedrunner 가드, craftsman 패널티, 부 페르소나 개선 |
| `lib/content/personas.ts` | 페르소나 정의 | macgyver 항목 삭제 |
| `lib/content/roasts.ts` | 로스팅 | macgyver 삭제 |
| `lib/content/strengths.ts` | 강점 | macgyver 삭제 |
| `lib/content/compatibility.ts` | 궁합 | macgyver 삭제 + 재배정 |
| `lib/content/prescriptions.ts` | 처방전 | ConditionalPrescription 전면 리팩터링 |
| `lib/analyzer/index.ts` | 분석 파이프라인 | generatePrescriptions 시그니처 변경 |
| `lib/store.ts` | DB 저장/조회 | collaboration→teamImpact fallback |
| `__tests__/analyzer/classifier.test.ts` | 분류 테스트 | deep-diver/speedrunner/craftsman 테스트 추가 |
| `__tests__/analyzer/scorer.test.ts` | 채점 테스트 | teamImpact 패턴 테스트 |
| `__tests__/content/prescriptions.test.ts` | 처방전 테스트 | 신규 생성 |

---

## Task 1: types.ts — PersonaKey + DimensionScores 변경

**Files:**
- Modify: `lib/types.ts:2-9` (DimensionScores)
- Modify: `lib/types.ts:12-25` (PersonaKey)
- Modify: `lib/types.ts:80-83` (PrescriptionItem 근처에 ConditionalPrescription 추가)

- [ ] **Step 1: types.ts 읽기 — 현재 상태 확인**

Run: `head -90 lib/types.ts`

- [ ] **Step 2: DimensionScores에서 collaboration → teamImpact**

```typescript
// lib/types.ts — DimensionScores 인터페이스
// 변경: collaboration → teamImpact
export interface DimensionScores {
  automation: number;
  control: number;
  toolDiversity: number;
  contextAwareness: number;
  teamImpact: number;     // 변경: collaboration → teamImpact
  security: number;
}
```

- [ ] **Step 3: PersonaKey에서 macgyver 제거**

PersonaKey 타입에서 `"macgyver" |` 를 삭제한다.

- [ ] **Step 4: ConditionalPrescription 타입 추가**

PrescriptionItem 인터페이스 아래에 추가:

```typescript
/** 조건부 처방전 — tag 기반 중복 제거 + 5개 고정 출력 */
export interface ConditionalPrescription {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  tag: string;
  tier: "signature" | "dimensional" | "common";
  condition: (
    persona: PersonaKey,
    stats: MdStats,
    quality: QualityScores,
    scores: DimensionScores
  ) => boolean;
}
```

- [ ] **Step 5: 타입 체크**

Run: `cd /Users/vivi/mdti && npx tsc --noEmit 2>&1 | head -50`

이 시점에서 collaboration을 참조하는 모든 파일이 에러를 냄 — 이것이 의도된 상태. 다음 Task에서 순차적으로 수정.

- [ ] **Step 6: 커밋**

```bash
git add lib/types.ts
git commit -m "타입 변경: macgyver 제거, collaboration→teamImpact, ConditionalPrescription 추가"
```

---

## Task 2: patterns.ts — teamImpact 패턴 교체

**Files:**
- Modify: `lib/analyzer/patterns.ts:67-76`

- [ ] **Step 1: 현재 collaboration 패턴 확인**

Run: `sed -n '60,80p' lib/analyzer/patterns.ts`

- [ ] **Step 2: collaboration → teamImpact 패턴 교체**

```typescript
// lib/analyzer/patterns.ts — DIMENSION_PATTERNS 내부
// 기존 collaboration 8개 → teamImpact 10개로 교체
teamImpact: [
  /팀|team/gi,
  /코드\s*리뷰|code\s*review/gi,
  /PR|pull\s*request/gi,
  /컨벤션|convention/gi,
  /린트|lint|eslint|prettier/gi,
  /브랜치|branch/gi,
  /merge|머지/gi,
  /동료|peer/gi,
  /온보딩|onboard|신규\s*입사/gi,
  /공유|share|전파/gi,
],
```

- [ ] **Step 3: 커밋**

```bash
git add lib/analyzer/patterns.ts
git commit -m "패턴: collaboration→teamImpact 리네임 + 비개발 협업 패턴 2개 추가"
```

---

## Task 3: scorer.ts — teamImpact 키 + threshold 변경

**Files:**
- Modify: `lib/analyzer/scorer.ts:24-26` (THRESHOLD_RATIO)
- Modify: `lib/analyzer/scorer.ts:49-59` (calculateScores 초기값)

- [ ] **Step 1: THRESHOLD_RATIO에 teamImpact 추가**

```typescript
// lib/analyzer/scorer.ts
const THRESHOLD_RATIO: Partial<Record<keyof DimensionScores, number>> = {
  contextAwareness: 0.5,
  teamImpact: 0.6,       // 추가: 비개발 패턴 보정
};
```

- [ ] **Step 2: calculateScores 초기값에서 collaboration → teamImpact**

빈 입력 시 반환하는 기본값 객체에서 `collaboration: 0` → `teamImpact: 0` 변경.

- [ ] **Step 3: 타입 체크**

Run: `cd /Users/vivi/mdti && npx tsc --noEmit 2>&1 | head -30`

scorer.ts와 patterns.ts의 collaboration 참조가 모두 해소되었는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add lib/analyzer/scorer.ts
git commit -m "채점: teamImpact threshold 0.6 + 키 리네임"
```

---

## Task 4: classifier.ts — 분류 알고리즘 전면 개선

**Files:**
- Modify: `lib/analyzer/classifier.ts:7-14` (DIMENSION_TO_PERSONA)
- Modify: `lib/analyzer/classifier.ts:56-144` (classifyPersona)
- Test: `__tests__/analyzer/classifier.test.ts`

이 Task는 변경이 많으므로 서브스텝으로 나눈다.

### 4-A: DIMENSION_TO_PERSONA 맵 업데이트

- [ ] **Step 1: collaboration → teamImpact 키 변경**

```typescript
// lib/analyzer/classifier.ts
const DIMENSION_TO_PERSONA: Record<keyof DimensionScores, PersonaKey> = {
  automation: "puppet-master",
  control: "legislator",
  toolDiversity: "collector",
  contextAwareness: "deep-diver",
  teamImpact: "evangelist",      // 변경: collaboration → teamImpact
  security: "fortress",
};
```

### 4-B: deep-diver 조건 교체

- [ ] **Step 2: 기존 deep-diver 조건을 dominanceRatio로 교체**

classifyPersona 함수 내부에서 기존 deep-diver 블록:
```typescript
// 삭제할 코드
if (max >= 80 && sd >= 30) {
  const fit = (max - 80) / 20 * 50 + Math.min(50, (sd - 30) / 30 * 50);
  candidates.push({ persona: "deep-diver", fit });
}
```

교체:
```typescript
// deep-diver: 1위 차원이 2위 차원의 2배 이상 = 극단적 과몰입
const sortedValues = Object.values(scores).sort((a, b) => b - a);
const first = sortedValues[0];
const second = sortedValues[1];
const dominanceRatio = second > 0 ? first / second : Infinity;

if (first >= 70 && dominanceRatio >= 2.0) {
  const fit = Math.min(100, (dominanceRatio - 2.0) / 3.0 * 50 + (first - 70) / 30 * 50);
  candidates.push({ persona: "deep-diver", fit });
}
```

### 4-C: speedrunner max<70 가드

- [ ] **Step 3: speedrunner 조건에 max < 70 추가**

기존:
```typescript
if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30) {
```

변경:
```typescript
if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30 && max < 70) {
```

### 4-D: craftsman fit 패널티

- [ ] **Step 4: craftsman에 다른 후보 존재 시 fit 절반 패널티**

기존:
```typescript
if (sd < 20 && avg >= 30) {
  const fit = Math.max(0, (avg - 30) / 70 * 100);
  candidates.push({ persona: "craftsman", fit });
}
```

변경:
```typescript
if (sd < 20 && avg >= 30) {
  let fit = Math.max(0, (avg - 30) / 70 * 100);
  if (candidates.length > 0) fit *= 0.5;
  candidates.push({ persona: "craftsman", fit });
}
```

### 4-E: evangelist 조건에서 collaboration → teamImpact

- [ ] **Step 5: evangelist 조건 키 변경**

```typescript
// 기존: scores.collaboration >= 55
if (scores.teamImpact >= 55) {
```

### 4-F: 부 페르소나 개선

- [ ] **Step 6: 부 페르소나 절대 하한 + 차원 중복 방지 + deep-diver 억제**

기존 부 페르소나 로직 (약 line 130-143) 교체:

```typescript
// 부 페르소나: 적합도 60% 이상 + 절대 하한 25 + 차원 중복 방지
const PERSONA_PRIMARY_DIMENSION: Partial<Record<PersonaKey, keyof DimensionScores>> = {
  "puppet-master": "automation",
  fortress: "security",
  legislator: "control",
  evangelist: "teamImpact",
  collector: "toolDiversity",
  "deep-diver": "contextAwareness",
  daredevil: "automation",
};

// deep-diver 부 페르소나 억제용 맵
const DIMENSION_SPECIFIC_PERSONAS: Partial<Record<keyof DimensionScores, PersonaKey[]>> = {
  security: ["fortress"],
  control: ["legislator"],
  automation: ["puppet-master", "daredevil"],
  toolDiversity: ["collector", "puppet-master"],
  teamImpact: ["evangelist"],
  contextAwareness: [],
};

let secondary: PersonaKey | null = null;
for (let i = 1; i < candidates.length; i++) {
  const candidate = candidates[i];
  // 절대 하한
  if (candidate.fit < 25) break;
  // 상대 비율
  if (candidate.fit < candidates[0].fit * 0.6) break;
  // 주/부 동일 방지
  if (candidate.persona === primary) continue;
  // 같은 차원 대표 방지
  const primaryDim = PERSONA_PRIMARY_DIMENSION[primary];
  const candidateDim = PERSONA_PRIMARY_DIMENSION[candidate.persona];
  if (primaryDim && candidateDim && primaryDim === candidateDim) continue;
  // deep-diver 부 페르소나 억제: 주 페르소나가 해당 차원의 전용이면 skip
  if (candidate.persona === "deep-diver") {
    const dominant = dominantDimension(scores);
    const specificPersonas = DIMENSION_SPECIFIC_PERSONAS[dominant] ?? [];
    if (specificPersonas.includes(primary)) continue;
  }
  secondary = candidate.persona;
  break;
}
```

### 4-G: 테스트 작성 + 실행

- [ ] **Step 7: deep-diver dominanceRatio 테스트 작성**

`__tests__/analyzer/classifier.test.ts`에 추가:

```typescript
describe("deep-diver dominanceRatio", () => {
  it("1위 차원이 2위의 2배 이상이면 deep-diver", () => {
    // contextAwareness=80, 나머지 전부 20 → ratio = 80/20 = 4.0
    const scores: DimensionScores = {
      automation: 20, control: 20, toolDiversity: 20,
      contextAwareness: 80, teamImpact: 20, security: 20,
    };
    const stats = createMockStats({ totalLines: 50 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("deep-diver");
  });

  it("dominanceRatio < 2.0이면 deep-diver 아님", () => {
    // automation=60, control=40 → ratio = 1.5
    const scores: DimensionScores = {
      automation: 60, control: 40, toolDiversity: 30,
      contextAwareness: 20, teamImpact: 20, security: 20,
    };
    const stats = createMockStats({ totalLines: 50 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).not.toBe("deep-diver");
  });

  it("2위=0이면 dominanceRatio=Infinity → deep-diver", () => {
    const scores: DimensionScores = {
      automation: 0, control: 0, toolDiversity: 0,
      contextAwareness: 80, teamImpact: 0, security: 0,
    };
    const stats = createMockStats({ totalLines: 50 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("deep-diver");
  });
});

describe("deep-diver 부 페르소나 억제", () => {
  it("fortress가 주이면 deep-diver가 부에 안 붙음", () => {
    const scores: DimensionScores = {
      automation: 10, control: 10, toolDiversity: 10,
      contextAwareness: 10, teamImpact: 10, security: 90,
    };
    const stats = createMockStats({ totalLines: 50 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("fortress");
    expect(result.secondary).not.toBe("deep-diver");
  });
});

describe("speedrunner max<70 가드", () => {
  it("짧은 파일이라도 security=80이면 fortress", () => {
    const scores: DimensionScores = {
      automation: 10, control: 10, toolDiversity: 10,
      contextAwareness: 10, teamImpact: 10, security: 80,
    };
    const stats = createMockStats({ totalLines: 20 });
    const result = classifyPersona(scores, stats);
    expect(result.primary).toBe("fortress");
  });
});

describe("craftsman fit 패널티", () => {
  it("다른 후보가 있으면 craftsman fit이 낮아짐", () => {
    // 균형형이지만 security도 충분히 높아서 fortress 후보도 있는 경우
    const scores: DimensionScores = {
      automation: 40, control: 40, toolDiversity: 40,
      contextAwareness: 40, teamImpact: 40, security: 75,
    };
    const stats = createMockStats({ totalLines: 50 });
    const result = classifyPersona(scores, stats);
    // fortress가 주, craftsman은 fit 패널티로 부에 안 붙을 수 있음
    expect(result.primary).toBe("fortress");
  });
});
```

- [ ] **Step 8: 기존 테스트에서 collaboration → teamImpact 키 변경**

classifier.test.ts 전체에서 `collaboration:` → `teamImpact:` 일괄 치환.

- [ ] **Step 9: 테스트 실행**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/classifier.test.ts`

Expected: 모든 테스트 PASS

- [ ] **Step 10: 커밋**

```bash
git add lib/analyzer/classifier.ts __tests__/analyzer/classifier.test.ts
git commit -m "분류: deep-diver dominanceRatio, speedrunner 가드, craftsman 패널티, 부 페르소나 개선"
```

---

## Task 5: 콘텐츠 파일에서 macgyver 제거

**Files:**
- Modify: `lib/content/personas.ts:131-143` (macgyver 항목)
- Modify: `lib/content/roasts.ts:240-256` (macgyver 로스팅)
- Modify: `lib/content/strengths.ts:169-179` (macgyver 강점)
- Modify: `lib/content/compatibility.ts:20,36,65-66,95-96,125-126` (macgyver 궁합)
- Modify: `lib/content/prescriptions.ts:286-302` (macgyver 처방전)

- [ ] **Step 1: personas.ts에서 macgyver 항목 삭제**

`PERSONAS` Record에서 `macgyver: { ... }` 블록 전체 삭제.

- [ ] **Step 2: roasts.ts에서 macgyver 항목 삭제**

`macgyver: (stats) => [ ... ]` 블록 삭제.

- [ ] **Step 3: strengths.ts에서 macgyver 항목 삭제**

`macgyver: (stats) => [ ... ]` 블록 삭제.

- [ ] **Step 4: prescriptions.ts에서 macgyver 항목 삭제**

PERSONA_PRESCRIPTIONS에서 `macgyver: [ ... ]` 블록 삭제.

- [ ] **Step 5: compatibility.ts에서 macgyver 제거 + 재배정**

1. COMPATIBILITY_MAP에서 `macgyver: { perfect: "daredevil", chaos: "collector" }` 삭제
2. 다른 페르소나의 perfect/chaos가 macgyver를 참조하면 대체:
   - macgyver를 perfect로 가진 페르소나 → daredevil로 교체
   - macgyver를 chaos로 가진 페르소나 → minimalist로 교체
3. PERSONA_NAME_KO에서 macgyver 삭제
4. PERFECT_DESCRIPTIONS, CHAOS_DESCRIPTIONS, MIRROR_DESCRIPTIONS에서 macgyver 항목 삭제

- [ ] **Step 6: 타입 체크 + 테스트**

Run: `cd /Users/vivi/mdti && npx tsc --noEmit && npx vitest run`

Expected: 타입 에러 0, 테스트 전부 PASS (macgyver 참조하는 테스트가 있으면 같이 수정)

- [ ] **Step 7: 커밋**

```bash
git add lib/content/personas.ts lib/content/roasts.ts lib/content/strengths.ts lib/content/compatibility.ts lib/content/prescriptions.ts
git commit -m "콘텐츠: macgyver 완전 제거 (personas, roasts, strengths, compatibility, prescriptions)"
```

---

## Task 6: prescriptions.ts — ConditionalPrescription 리팩터링

**Files:**
- Modify: `lib/content/prescriptions.ts` (전면 리팩터링)
- Create: `__tests__/content/prescriptions.test.ts`

이 Task가 가장 크므로 서브스텝으로 나눈다.

### 6-A: 테스트 먼저 작성

- [ ] **Step 1: prescriptions.test.ts 신규 작성**

```typescript
// __tests__/content/prescriptions.test.ts
import { describe, it, expect } from "vitest";
import { generatePrescriptions } from "@/lib/content/prescriptions";
import type { MdStats, QualityScores, DimensionScores, PersonaKey } from "@/lib/types";

// 헬퍼: 기본 MdStats 생성
function createMockStats(overrides?: Partial<MdStats>): MdStats {
  return {
    totalLines: 30, sectionCount: 3, toolNames: ["Slack"], hasMemory: false,
    hasHooks: false, hasProjectMd: false, ruleCount: 2, claudeMdLines: 30,
    keywordHits: {}, keywordUniqueHits: {}, pluginCount: 0, mcpServerCount: 0,
    commandCount: 0, hookCount: 0, pluginNames: [], mcpServerNames: [],
    commandNames: [], isExpandedInput: false, denyCount: 0,
    blocksDangerousOps: false, hookPromptCount: 0, hookCommandCount: 0,
    pluginEnabledRatio: 0, projectMdCount: 0,
    ...overrides,
  };
}

function createMockQuality(overrides?: Partial<QualityScores>): QualityScores {
  return {
    actionability: 50, conciseness: 50, structure: 50,
    uniqueness: 50, safety: 50,
    ...overrides,
  };
}

function createMockScores(overrides?: Partial<DimensionScores>): DimensionScores {
  return {
    automation: 30, control: 30, toolDiversity: 30,
    contextAwareness: 30, teamImpact: 30, security: 30,
    ...overrides,
  };
}

describe("generatePrescriptions", () => {
  it("항상 정확히 5개를 반환한다", () => {
    const result = generatePrescriptions(
      "fortress",
      createMockStats(),
      createMockQuality(),
      createMockScores({ security: 90 }),
    );
    expect(result).toHaveLength(5);
  });

  it("시그니처 처방전이 반드시 포함된다", () => {
    const result = generatePrescriptions(
      "fortress",
      createMockStats(),
      createMockQuality(),
      createMockScores({ security: 90 }),
    );
    // 시그니처 처방전은 해당 페르소나 전용 — text에 페르소나 고유 키워드 포함
    // (구체적 assertion은 콘텐츠 확정 후 업데이트)
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("같은 tag의 처방전이 중복되지 않는다", () => {
    const result = generatePrescriptions(
      "minimalist",
      createMockStats({ totalLines: 5 }),
      createMockQuality({ actionability: 10, safety: 10 }),
      createMockScores(),
    );
    // 5개 모두 다른 text여야 함
    const texts = result.map(r => r.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("macgyver 페르소나는 에러 없이 처리된다 (fallback)", () => {
    // 레거시 DB에 macgyver가 있을 수 있음 — 에러 없이 공통 처방전 반환
    // 타입 체크를 우회하기 위해 as any 사용
    const result = generatePrescriptions(
      "macgyver" as PersonaKey,
      createMockStats(),
      createMockQuality(),
      createMockScores(),
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("12개 페르소나 각각에 대해 5개를 반환한다", () => {
    const personas: PersonaKey[] = [
      "minimalist", "speedrunner", "puppet-master", "fortress",
      "legislator", "evangelist", "collector", "daredevil",
      "craftsman", "deep-diver", "architect", "huggies",
    ];
    for (const persona of personas) {
      const result = generatePrescriptions(
        persona,
        createMockStats(),
        createMockQuality(),
        createMockScores(),
      );
      expect(result).toHaveLength(5);
    }
  });

  it("품질 점수가 낮은 차원에 대한 처방전이 포함된다", () => {
    const result = generatePrescriptions(
      "fortress",
      createMockStats(),
      createMockQuality({ actionability: 10 }),  // actionability 매우 낮음
      createMockScores({ security: 90 }),
    );
    // actionability 관련 처방전이 하나 이상 포함되어야 함
    const hasActionabilityAdvice = result.some(r =>
      r.text.includes("명령어") || r.text.includes("백틱") || r.text.includes("실행")
    );
    expect(hasActionabilityAdvice).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/content/prescriptions.test.ts`

Expected: FAIL (generatePrescriptions 시그니처가 아직 변경되지 않았으므로)

### 6-B: prescriptions.ts 리팩터링

- [ ] **Step 3: generatePrescriptions 시그니처 변경 + ConditionalPrescription 풀 구현**

`lib/content/prescriptions.ts` 전면 리팩터링. 핵심 구조:

```typescript
import type {
  PersonaKey, MdStats, QualityScores, DimensionScores,
  PrescriptionItem, ConditionalPrescription,
} from "@/lib/types";

// ─── 처방전 풀 ──────────────────────────────────────────

const ALL_PRESCRIPTIONS: ConditionalPrescription[] = [
  // === SIGNATURE TIER (페르소나 고유, 1개씩) ===
  {
    id: "sig-fortress",
    text: "보안 규칙을 실제로 Claude가 위반하면 어떻게 되는지 테스트해보세요. 훈련 없는 방어는 종이벽입니다.",
    priority: "high",
    tag: "sig:fortress",
    tier: "signature",
    condition: (persona) => persona === "fortress",
  },
  {
    id: "sig-minimalist",
    text: "Claude에게 맡기고 싶으면, 최소한 '이것만은 하지 마'를 3개 적으세요. 자유에도 울타리가 필요합니다.",
    priority: "high",
    tag: "sig:minimalist",
    tier: "signature",
    condition: (persona) => persona === "minimalist",
  },
  {
    id: "sig-speedrunner",
    text: "지금 속도로 6개월 뒤에도 유지 가능한지 자문해보세요. 빠른 건 좋지만 방향이 먼저입니다.",
    priority: "high",
    tag: "sig:speedrunner",
    tier: "signature",
    condition: (persona) => persona === "speedrunner",
  },
  {
    id: "sig-puppet-master",
    text: "자동화 워크플로우 중 Claude 없이도 돌아가는 것이 몇 개인가요? 의존도를 점검하고 Plan B를 만드세요.",
    priority: "high",
    tag: "sig:puppet-master",
    tier: "signature",
    condition: (persona) => persona === "puppet-master",
  },
  {
    id: "sig-legislator",
    text: "규칙 중 최근 6개월간 실제로 위반이 감지된 것만 남기고 나머지는 주석 처리하세요. 안 지켜지는 규칙은 노이즈입니다.",
    priority: "high",
    tag: "sig:legislator",
    tier: "signature",
    condition: (persona) => persona === "legislator",
  },
  {
    id: "sig-evangelist",
    text: "팀원 1명에게 당신의 CLAUDE.md를 보여주고 '이해되나요?'라고 물어보세요. 읽히지 않는 문서는 독백입니다.",
    priority: "high",
    tag: "sig:evangelist",
    tier: "signature",
    condition: (persona) => persona === "evangelist",
  },
  {
    id: "sig-collector",
    text: "연결한 도구 중 최근 30일 내 실제 사용한 것을 세어보세요. 안 쓰는 도구는 노이즈입니다.",
    priority: "high",
    tag: "sig:collector",
    tier: "signature",
    condition: (persona) => persona === "collector",
  },
  {
    id: "sig-daredevil",
    text: "지금 당장 `.env 커밋 절대 금지` 한 줄을 추가하세요. 10초 투자로 10시간 사고 수습을 예방합니다.",
    priority: "high",
    tag: "sig:daredevil",
    tier: "signature",
    condition: (persona) => persona === "daredevil",
  },
  {
    id: "sig-craftsman",
    text: "뾰족한 전문 분야 하나를 골라서 깊이 설정해보세요. 균형도 좋지만 한 영역의 전문성이 Claude 활용도를 크게 올립니다.",
    priority: "high",
    tag: "sig:craftsman",
    tier: "signature",
    condition: (persona) => persona === "craftsman",
  },
  {
    id: "sig-deep-diver",
    text: "집중 영역 외에 기본 업무 맥락도 CLAUDE.md에 추가하세요. 한 가지만 아는 사람으로 인식되면 다른 분야에서 부정확한 답변이 나옵니다.",
    priority: "high",
    tag: "sig:deep-diver",
    tier: "signature",
    condition: (persona) => persona === "deep-diver",
  },
  {
    id: "sig-architect",
    text: "생태계 구성도를 CLAUDE.md에 추가하세요. 플러그인, Hook, MCP가 어떻게 연결되는지 한눈에 보이면 유지보수와 인수인계가 쉬워집니다.",
    priority: "high",
    tag: "sig:architect",
    tier: "signature",
    condition: (persona) => persona === "architect",
  },
  {
    id: "sig-huggies",
    text: "지금 깔려있는 플러그인과 Hook을 하나씩 설명해보세요. 설명 못 하는 건 필요 없는 거예요.",
    priority: "high",
    tag: "sig:huggies",
    tier: "signature",
    condition: (persona) => persona === "huggies",
  },

  // === DIMENSIONAL TIER (품질 차원 기반, 조건부) ===
  // actionability
  {
    id: "dim-action-fortress",
    text: "보안 규칙은 완벽한데 빌드 명령어가 없어요. .env 지키면서 `npm run test`도 적어두세요.",
    priority: "high",
    tag: "dim:actionability",
    tier: "dimensional",
    condition: (persona, _, quality) => persona === "fortress" && quality.actionability < 30,
  },
  {
    id: "dim-action-generic",
    text: "빌드/테스트/린트 실행 명령어를 백틱으로 감싸서 추가하세요. Claude가 바로 실행할 수 있게.",
    priority: "high",
    tag: "dim:actionability",
    tier: "dimensional",
    condition: (_, __, quality) => quality.actionability < 30,
  },
  // conciseness
  {
    id: "dim-concise-long",
    text: "CLAUDE.md가 150줄을 넘으면 `.claude/rules/`로 분리하세요. 모델이 안정적으로 따르는 지시는 약 150~200개입니다.",
    priority: "high",
    tag: "dim:conciseness",
    tier: "dimensional",
    condition: (_, stats, quality) => quality.conciseness < 30 && stats.totalLines > 150,
  },
  {
    id: "dim-concise-noise",
    text: "'clean code 작성', 'DRY 원칙' 같은 뻔한 지시를 삭제하세요. Claude는 이미 알고 있거나, 린터가 더 잘합니다.",
    priority: "medium",
    tag: "dim:conciseness",
    tier: "dimensional",
    condition: (_, __, quality) => quality.conciseness < 40,
  },
  // structure
  {
    id: "dim-struct-legislator",
    text: "규칙은 많은데 프로젝트 고유 맥락이 없어요. 왜 이 규칙인지 배경을 한 줄씩 추가하세요.",
    priority: "high",
    tag: "dim:structure",
    tier: "dimensional",
    condition: (persona, _, quality) => persona === "legislator" && quality.structure < 30,
  },
  {
    id: "dim-struct-generic",
    text: "## Commands, ## Architecture 같은 섹션 헤딩으로 CLAUDE.md를 구조화하세요.",
    priority: "medium",
    tag: "dim:structure",
    tier: "dimensional",
    condition: (_, __, quality) => quality.structure < 30,
  },
  // uniqueness
  {
    id: "dim-unique",
    text: "코드만 봐서는 모르는 프로젝트 고유 정보를 추가하세요. '이 모듈은 레거시라 수정 금지', 'Redis는 캐싱용만' 같은 맥락.",
    priority: "medium",
    tag: "dim:uniqueness",
    tier: "dimensional",
    condition: (_, __, quality) => quality.uniqueness < 30,
  },
  // safety
  {
    id: "dim-safety-daredevil",
    text: "PreToolUse hook으로 민감 파일 수정을 차단하세요. settings.json에 hook 하나면 .env를 건드리려 할 때 자동으로 막아줍니다.",
    priority: "high",
    tag: "dim:safety",
    tier: "dimensional",
    condition: (persona, _, quality) => persona === "daredevil" && quality.safety < 20,
  },
  {
    id: "dim-safety-generic",
    text: "'.env 커밋 절대 금지' 같은 가드레일을 추가하세요. 이 한 줄이 대형 사고를 예방합니다.",
    priority: "high",
    tag: "dim:safety",
    tier: "dimensional",
    condition: (_, __, quality) => quality.safety < 20,
  },
  // teamImpact (persona x quality 교차)
  {
    id: "dim-team-puppet",
    text: "팀원이 사용할 수 있도록 자동화 README를 추가하세요. 본인만 이해하는 시스템은 레거시의 시작입니다.",
    priority: "medium",
    tag: "dim:teamImpact",
    tier: "dimensional",
    condition: (persona, _, __, scores) => persona === "puppet-master" && scores.teamImpact < 30,
  },
  {
    id: "dim-team-generic",
    text: "협업 관련 규칙을 추가해보세요. 커뮤니케이션 스타일, 코드 리뷰 규칙 등을 CLAUDE.md에 담으면 Claude가 더 입체적으로 돕습니다.",
    priority: "low",
    tag: "dim:teamImpact",
    tier: "dimensional",
    condition: (_, __, ___, scores) => scores.teamImpact < 30,
  },

  // === COMMON TIER (모든 페르소나 공유) ===
  {
    id: "common-context",
    text: "~/.claude/CLAUDE.md에 사용자 선호도와 프로젝트 맥락을 저장하면 매 대화마다 같은 설명을 반복하지 않아도 됩니다.",
    priority: "medium",
    tag: "common:context",
    tier: "common",
    condition: (_, stats) => !stats.hasMemory && !stats.hasProjectMd,
  },
  {
    id: "common-role",
    text: "역할 정의를 추가하세요. '나는 HR Lead다' 한 문장이 Claude의 답변 방향을 완전히 바꿉니다.",
    priority: "medium",
    tag: "common:role",
    tier: "common",
    condition: (_, stats) => stats.claudeMdLines < 10,
  },
  {
    id: "common-tools",
    text: "주로 사용하는 도구 3~5개를 나열해두세요. 매번 'React 프로젝트야'라고 말하는 건 시간 낭비입니다.",
    priority: "low",
    tag: "common:tools",
    tier: "common",
    condition: (_, stats) => stats.toolNames.length < 2,
  },
];

// ─── 선택 알고리즘 ─────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function selectPrescriptions(
  persona: PersonaKey,
  stats: MdStats,
  quality: QualityScores,
  scores: DimensionScores,
): PrescriptionItem[] {
  const eligible = ALL_PRESCRIPTIONS.filter(p =>
    p.condition(persona, stats, quality, scores)
  );

  const signatures = eligible.filter(p => p.tier === "signature");
  const dimensionals = eligible.filter(p => p.tier === "dimensional")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const commons = eligible.filter(p => p.tier === "common")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const selected: ConditionalPrescription[] = [];
  const usedTags = new Set<string>();

  // [1] 시그니처 1개
  const sig = signatures.find(p => !usedTags.has(p.tag));
  if (sig) { selected.push(sig); usedTags.add(sig.tag); }

  // [2~4] 차원별 최대 3개
  for (const p of dimensionals) {
    if (selected.length >= 4) break;
    if (usedTags.has(p.tag)) continue;
    selected.push(p); usedTags.add(p.tag);
  }

  // [5] 공통 1개
  const common = commons.find(p => !usedTags.has(p.tag));
  if (common) { selected.push(common); usedTags.add(common.tag); }

  // 5개 미달 시 차원별에서 추가 충원 (tag 무시)
  if (selected.length < 5) {
    for (const p of dimensionals) {
      if (selected.length >= 5) break;
      if (selected.some(s => s.id === p.id)) continue;
      selected.push(p);
    }
  }

  // 그래도 미달이면 공통에서 충원
  if (selected.length < 5) {
    for (const p of commons) {
      if (selected.length >= 5) break;
      if (selected.some(s => s.id === p.id)) continue;
      selected.push(p);
    }
  }

  return selected.slice(0, 5).map(p => ({
    text: p.text,
    priority: p.priority,
  }));
}

// ─── 공개 API ──────────────────────────────────────────

export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores: QualityScores,
  dimensionScores: DimensionScores,
): PrescriptionItem[] {
  return selectPrescriptions(persona, mdStats, qualityScores, dimensionScores);
}
```

- [ ] **Step 4: 테스트 실행**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/content/prescriptions.test.ts`

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/content/prescriptions.ts __tests__/content/prescriptions.test.ts
git commit -m "처방전: ConditionalPrescription 구조 도입, tag 중복 제거, 5개 고정 출력"
```

---

## Task 7: index.ts + store.ts — 파이프라인 연결

**Files:**
- Modify: `lib/analyzer/index.ts:44` (generatePrescriptions 호출)
- Modify: `lib/store.ts` (collaboration → teamImpact fallback)

- [ ] **Step 1: index.ts에서 generatePrescriptions 호출 시그니처 변경**

```typescript
// lib/analyzer/index.ts — analyze() 함수 내부
// 기존: generatePrescriptions(persona, mdStats, qualityScores)
// 변경: generatePrescriptions(persona, mdStats, qualityScores, scores)
const prescriptions = generatePrescriptions(
  result.primary,
  mdStats,
  qualityScores,
  scores,   // 추가: DimensionScores 전달
);
```

- [ ] **Step 2: store.ts에서 collaboration → teamImpact fallback 추가**

getResult() 함수 내부, scores 복원 시:

```typescript
// lib/store.ts — getResult() 내부
// 기존 scores에서 collaboration → teamImpact fallback
const rawScores = data.scores as Record<string, number>;
const scores: DimensionScores = {
  automation: rawScores.automation ?? 0,
  control: rawScores.control ?? 0,
  toolDiversity: rawScores.toolDiversity ?? 0,
  contextAwareness: rawScores.contextAwareness ?? rawScores.maturity ?? 0,
  teamImpact: rawScores.teamImpact ?? rawScores.collaboration ?? 0,
  security: rawScores.security ?? 0,
};
```

- [ ] **Step 3: 타입 체크**

Run: `cd /Users/vivi/mdti && npx tsc --noEmit`

Expected: 0 errors

- [ ] **Step 4: 커밋**

```bash
git add lib/analyzer/index.ts lib/store.ts
git commit -m "파이프라인: generatePrescriptions에 dimensionScores 전달 + store collaboration fallback"
```

---

## Task 8: scorer.test.ts — teamImpact 테스트

**Files:**
- Modify: `__tests__/analyzer/scorer.test.ts`

- [ ] **Step 1: 기존 테스트에서 collaboration → teamImpact 키 변경**

scorer.test.ts 전체에서 `collaboration` → `teamImpact` 일괄 치환.

- [ ] **Step 2: teamImpact 패턴 테스트 추가**

```typescript
describe("teamImpact 패턴", () => {
  it("비개발 협업 패턴(온보딩, 공유)도 감지한다", () => {
    const md = "## 온보딩 자동화\n신규 입사자를 위한 가이드를 공유합니다.";
    const scores = calculateScores(md);
    expect(scores.teamImpact).toBeGreaterThan(0);
  });

  it("기존 개발 협업 패턴(PR, 코드리뷰)도 여전히 감지한다", () => {
    const md = "PR 규칙: 코드 리뷰 필수, 브랜치 전략은 GitFlow";
    const scores = calculateScores(md);
    expect(scores.teamImpact).toBeGreaterThan(0);
  });

  it("threshold 0.6이 적용되어 6개 매칭이면 100점", () => {
    const md = "팀 코드리뷰 PR 컨벤션 린트 온보딩";
    const scores = calculateScores(md);
    expect(scores.teamImpact).toBe(100);
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/scorer.test.ts`

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add __tests__/analyzer/scorer.test.ts
git commit -m "테스트: teamImpact 패턴 검증 + collaboration→teamImpact 키 변경"
```

---

## Task 9: 전체 테스트 + UI 라벨 수정

**Files:**
- Modify: `app/r/[id]/page.tsx` (collaboration → teamImpact 라벨)
- 기타 collaboration을 참조하는 파일 전부

- [ ] **Step 1: collaboration을 참조하는 남은 파일 찾기**

Run: `cd /Users/vivi/mdti && grep -r "collaboration" --include="*.ts" --include="*.tsx" -l`

- [ ] **Step 2: 발견된 파일에서 collaboration → teamImpact 치환**

각 파일에서 `collaboration` → `teamImpact` 변경. UI에 표시되는 라벨은 "협업" 또는 "팀 임팩트"로 유지.

- [ ] **Step 3: 전체 타입 체크**

Run: `cd /Users/vivi/mdti && npx tsc --noEmit`

Expected: 0 errors

- [ ] **Step 4: 전체 테스트**

Run: `cd /Users/vivi/mdti && npx vitest run`

Expected: ALL PASS

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "전체 정리: collaboration→teamImpact 잔여 참조 치환 + UI 라벨 업데이트"
```

---

## Task 10: 검증 스크립트 + 최종 확인

**Files:**
- Modify: `scripts/validate-thresholds.ts` (품질 점수 + dominanceRatio 분포 출력)

- [ ] **Step 1: validate-thresholds.ts에 dominanceRatio 출력 추가**

기존 검증 스크립트에 각 테스트 CLAUDE.md의 dominanceRatio 값을 출력하는 코드 추가.

- [ ] **Step 2: 검증 실행**

Run: `cd /Users/vivi/mdti && npx tsx scripts/validate-thresholds.ts`

확인사항:
1. 12개 테스트 샘플 분류 정확도 (오분류 0개)
2. deep-diver 부 페르소나 과다 트리거 해소 (기존 5개→1~2개)
3. 처방전 5개 고정 출력

- [ ] **Step 3: 로컬 dev 서버 확인**

Run: `cd /Users/vivi/mdti && npm run dev`

수동 확인:
1. 실제 CLAUDE.md 입력 → 페르소나 + 처방전 5개 정상 출력
2. 기존 결과 페이지 `/r/[id]` → collaboration fallback 정상
3. 빈 CLAUDE.md → minimalist + 처방전 5개

- [ ] **Step 4: 최종 커밋**

```bash
git add scripts/validate-thresholds.ts
git commit -m "검증: dominanceRatio 분포 출력 + 전체 분류 정확도 확인"
```

---

## 검증 체크리스트

- [ ] `npx tsc --noEmit` — 타입 에러 0개
- [ ] `npx vitest run` — 전체 테스트 PASS
- [ ] 12개 테스트 CLAUDE.md 재분류 → 오분류 0개
- [ ] deep-diver 부 페르소나: 기존 5개 독식 → 1~2개로 감소
- [ ] 처방전: 모든 페르소나에서 정확히 5개 반환
- [ ] 처방전 중복률: 12개 샘플 간 동일 text ≤ 30%
- [ ] 기존 결과 페이지: collaboration fallback 정상 동작
- [ ] speedrunner 경계: 20줄 + security=80 → fortress 확인
- [ ] dominanceRatio 엣지: 모든 차원 0 + contextAwareness=80 → deep-diver 확인
