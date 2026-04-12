# mdTI v2: 5축 조합형 성향 분류 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 12 고정 페르소나 + MD력 점수 시스템을 5축 이분법 조합형 (32타입) + 고유 페르소나 + 모듈형 위트/탐험으로 전면 교체

**Architecture:** `packages/analyzer/src/`의 분석 엔진을 5축 이분법 판정으로 전면 리팩터. 기존 7차원 연속 점수(0-100) → 5축 A/B 이분법 판정. 기존 패턴 감지(`patterns.ts`)는 시그널 소스로 재사용하되, 패턴을 5축에 매핑하는 태깅 추가. 콘텐츠는 32개 고유 페르소나 + 10개 모듈 블록 이중 구조. UI는 펜타곤 레이더 + 페르소나 히어로 + 캐릭터 서사.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Supabase, Tailwind CSS 4

**스펙:** `docs/superpowers/specs/2026-04-12-persona-identity-redesign.md`

---

## 파일 구조 (변경 맵)

### 신규 생성
| 파일 | 역할 |
|------|------|
| `packages/analyzer/src/v2-types.ts` | v2 타입 (AxisKey, AxisDirection, TypeCode, AxisScores, V2AnalysisResult 등) |
| `packages/analyzer/src/analyzer/axis-scorer.ts` | 5축 이분법 판정 (패턴 시그널 → 축별 A/B 판정) |
| `packages/analyzer/src/analyzer/type-classifier.ts` | 5축 판정 결과 → 5글자 타입 코드 생성 |
| `packages/analyzer/src/content/v2-personas.ts` | 32개 고유 페르소나 (이름 + 한줄 + 캐릭터 서사) |
| `packages/analyzer/src/content/v2-modules.ts` | 10개 축별 모듈 블록 (위트 + 탐험) |
| `packages/analyzer/src/content/v2-compatibility.ts` | 타입 코드 기반 궁합 |
| `__tests__/analyzer/axis-scorer.test.ts` | 5축 판정 테스트 |
| `__tests__/analyzer/type-classifier.test.ts` | 타입 코드 생성 테스트 |
| `__tests__/v2-integration.test.ts` | v2 전체 파이프라인 통합 테스트 |
| `components/PentagonChart.tsx` | 5축 펜타곤 레이더 (RadarChart.tsx 대체) |
| `components/CharacterNarrative.tsx` | 캐릭터 서사 섹션 |
| `components/WitSection.tsx` | 모듈형 위트 섹션 |
| `components/ExplorationSection.tsx` | 모듈형 탐험 제안 섹션 |

### 주요 수정
| 파일 | 변경 내용 |
|------|----------|
| `packages/analyzer/src/analyzer/patterns.ts` | 기존 패턴에 `axis` 태그 추가 (어떤 축의 어떤 방향 시그널인지) |
| `packages/analyzer/src/analyzer/index.ts` | v2 분석 파이프라인 추가 (`analyzeV2`) |
| `packages/analyzer/src/index.ts` | v2 exports 추가 |
| `components/ResultHero.tsx` | 페르소나 이름 + 한줄 + 하기스/하네스 뱃지 |
| `app/r/[id]/page.tsx` | 결과 페이지 전면 재구성 |
| `app/api/analyze/route.ts` | v2 분석 호출 |
| `app/api/results/route.ts` | v2 결과 저장/조회 |

### 제거 (Phase 6)
| 파일 | 이유 |
|------|------|
| `packages/analyzer/src/analyzer/power.ts` | MD력 점수 폐기 |
| `packages/analyzer/src/analyzer/quality.ts` | 품질 점수 폐기 |
| `components/BattlePower.tsx` | MD력 UI |
| `components/MdPowerSection.tsx` | MD력 섹션 |
| `components/StatsSection.tsx` | 퍼센타일/통계 UI |

---

## Task 1: v2 타입 정의

**Files:**
- Create: `packages/analyzer/src/v2-types.ts`
- Test: `__tests__/types.test.ts` (기존 파일에 v2 타입 테스트 추가)

- [ ] **Step 1: v2 타입 파일 작성**

```typescript
// packages/analyzer/src/v2-types.ts

/** 5축 키 */
export type AxisKey = 'harness' | 'control' | 'verbose' | 'plan' | 'structure';

/** 각 축의 양방향 */
export type AxisDirection = {
  harness: 'G' | 'H';    // 하기스(발산) / 하네스(수렴)
  control: 'R' | 'D';    // 통제(Restrict) / 위임(Delegate)
  verbose: 'V' | 'C';    // 장황(Verbose) / 간결(Concise)
  plan: 'P' | 'X';       // 설계(Plan) / 실행(eXecute)
  structure: 'S' | 'F';  // 구조화(Structured) / 자유형(Freeform)
};

/** 5글자 타입 코드 (예: "GRVPS", "HDCXF") */
export type TypeCode = string;

/** 축별 시그널 카운트 + 판정 */
export interface AxisJudgment {
  axis: AxisKey;
  aCount: number;         // A방향 시그널 수
  bCount: number;         // B방향 시그널 수
  direction: string;      // 판정된 방향 (A 또는 B의 글자)
  confidence: number;     // 판정 확신도 (0.5~1.0, 0.5이면 동점)
}

/** 5축 전체 판정 결과 */
export interface AxisScores {
  judgments: Record<AxisKey, AxisJudgment>;
  typeCode: TypeCode;
}

/** 32개 고유 페르소나 정의 */
export interface V2PersonaDefinition {
  typeCode: TypeCode;
  name: string;           // 페르소나 이름 (예: "카오스 엔지니어")
  tagline: string;        // 한줄 정체성
  narrative: string;      // 캐릭터 서사 (2-3문장, 축 간 상호작용)
  emoji: string;
}

/** 축별 모듈 콘텐츠 블록 */
export interface ModuleBlock {
  axis: AxisKey;
  direction: string;      // A 또는 B 글자
  wit: string;            // 위트 ("~한 적 없나요?" 포맷)
  exploration: string;    // 탐험 제안
}

/** v2 분석 결과 */
export interface V2AnalysisResult {
  typeCode: TypeCode;
  axisScores: AxisScores;
  persona: V2PersonaDefinition;
  witItems: string[];          // 선택된 위트 2-3개
  explorationItems: string[];  // 선택된 탐험 3개
  mdStats: import('./types.js').MdStats;  // 기존 MdStats 재사용
}

/** 축 라벨 (UI용) */
export const AXIS_LABELS: Record<AxisKey, { a: string; b: string; aLabel: string; bLabel: string }> = {
  harness:   { a: 'G', b: 'H', aLabel: '하기스', bLabel: '하네스' },
  control:   { a: 'R', b: 'D', aLabel: '통제',   bLabel: '위임' },
  verbose:   { a: 'V', b: 'C', aLabel: '장황',   bLabel: '간결' },
  plan:      { a: 'P', b: 'X', aLabel: '설계',   bLabel: '실행' },
  structure: { a: 'S', b: 'F', aLabel: '구조화', bLabel: '자유형' },
};

/** 축 순서 (타입 코드 생성 시) */
export const AXIS_ORDER: AxisKey[] = ['harness', 'control', 'verbose', 'plan', 'structure'];
```

- [ ] **Step 2: 타입 임포트 테스트**

`__tests__/types.test.ts`에 추가:

```typescript
import { AXIS_LABELS, AXIS_ORDER } from '../packages/analyzer/src/v2-types';

describe('v2 types', () => {
  test('AXIS_ORDER는 5개 축', () => {
    expect(AXIS_ORDER).toHaveLength(5);
  });

  test('AXIS_LABELS는 모든 축에 대해 a/b 라벨 보유', () => {
    for (const axis of AXIS_ORDER) {
      expect(AXIS_LABELS[axis]).toHaveProperty('a');
      expect(AXIS_LABELS[axis]).toHaveProperty('b');
      expect(AXIS_LABELS[axis]).toHaveProperty('aLabel');
      expect(AXIS_LABELS[axis]).toHaveProperty('bLabel');
    }
  });
});
```

- [ ] **Step 3: 테스트 실행 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/types.test.ts`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add packages/analyzer/src/v2-types.ts __tests__/types.test.ts
git commit -m "feat: v2 타입 정의 (5축 이분법, 32타입 코드)"
```

---

## Task 2: 패턴에 축 태그 매핑 추가

**Files:**
- Modify: `packages/analyzer/src/analyzer/patterns.ts`
- Test: `__tests__/analyzer/patterns.test.ts`

- [ ] **Step 1: 축 매핑 타입 추가**

`patterns.ts` 상단에 추가:

```typescript
import type { AxisKey } from '../v2-types.js';

/** 패턴 → 축 매핑. 하나의 패턴이 여러 축의 시그널이 될 수 있음 */
export interface AxisMapping {
  axis: AxisKey;
  direction: 'a' | 'b';  // a = 첫 번째 방향, b = 두 번째 방향
}

/** 기존 7차원 패턴에 대한 5축 매핑 테이블 */
export const PATTERN_AXIS_MAP: Record<string, AxisMapping[]> = {};
```

- [ ] **Step 2: 7차원 → 5축 매핑 작성**

`PATTERN_AXIS_MAP`에 기존 `DIMENSION_PATTERNS`의 각 패턴을 5축으로 매핑. 핵심 매핑 원칙:

```typescript
// 매핑 원칙:
// - automation 패턴 → plan축 X(실행) 또는 harness축 H(수렴) (자동화 = 실행 중심 또는 시스템 구축)
// - control 패턴 → control축 R(통제) (NEVER/MUST = 통제)
// - toolDiversity 패턴 → harness축 G(발산) (도구 다양성 = 탐색)
// - contextAwareness 패턴 → plan축 P(설계) 또는 harness축 H(수렴) (맥락 설계 = 선행 설계)
// - teamImpact 패턴 → (축에서 제외, 별도 처리 또는 무시)
// - security 패턴 → control축 R(통제) (보안 = 통제의 한 형태)
// - agentOrchestration 패턴 → harness축 H(수렴) + plan축 P(설계)

// 예시 (실제 패턴키는 patterns.ts의 DIMENSION_PATTERNS에서 확인):
export const PATTERN_AXIS_MAP: Record<string, AxisMapping[]> = {
  // automation 패턴들
  'hooks': [{ axis: 'harness', direction: 'b' }],        // hooks = 하네스(수렴)
  'cron': [{ axis: 'plan', direction: 'b' }],             // cron = 실행(X)
  'scripts': [{ axis: 'plan', direction: 'b' }],
  // control 패턴들
  'never': [{ axis: 'control', direction: 'a' }],         // NEVER = 통제(R)
  'must': [{ axis: 'control', direction: 'a' }],
  'always': [{ axis: 'control', direction: 'a' }],
  // toolDiversity 패턴들
  'slack': [{ axis: 'harness', direction: 'a' }],         // 외부 도구 = 하기스(발산)
  'notion': [{ axis: 'harness', direction: 'a' }],
  // contextAwareness 패턴들
  'import': [{ axis: 'plan', direction: 'a' }, { axis: 'harness', direction: 'b' }],  // @import = 설계(P) + 하네스(수렴)
  'memory': [{ axis: 'plan', direction: 'a' }],
  // agentOrchestration 패턴들
  'agent': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  // ... (전체 패턴에 대해 매핑 필요 — 패턴 키는 DIMENSION_PATTERNS에서 가져옴)
};
```

> **Note:** 실제 구현 시 `DIMENSION_PATTERNS`의 모든 패턴 키를 순회하며 매핑해야 함. 매핑이 없는 패턴은 어떤 축에도 기여하지 않음.

- [ ] **Step 3: 축별 시그널 카운트 함수 작성**

```typescript
/**
 * 텍스트에서 5축별 시그널 수를 카운트
 * 기존 countUniqueSignals()를 재사용하되, 결과를 5축으로 재분류
 */
export function countAxisSignals(
  text: string,
  stats: import('../types.js').MdStats
): Record<import('../v2-types.js').AxisKey, { a: number; b: number }> {
  // 기존 7차원 unique signal 감지 결과를 순회
  // 각 감지된 패턴키를 PATTERN_AXIS_MAP에서 조회
  // 해당 축의 a 또는 b 카운터 증가
  // ...
}
```

- [ ] **Step 4: verbose(장황/간결) 축 — 줄 수 기반 판정 함수**

```typescript
/**
 * 장황/간결 축은 패턴이 아니라 줄 수로 판정
 */
export function judgeVerboseAxis(stats: import('../types.js').MdStats): { a: number; b: number } {
  const threshold = stats.isExpandedInput ? 100 : 30;
  // a = 장황(V), b = 간결(C)
  // totalLines > threshold → a 시그널 증가, 아니면 b 시그널 증가
  return stats.claudeMdLines > threshold
    ? { a: 1, b: 0 }
    : { a: 0, b: 1 };
}
```

- [ ] **Step 5: structure(구조화/자유형) 축 — 구조 분석 함수**

```typescript
/**
 * 구조화/자유형 축은 헤딩/리스트 비율로 판정
 */
export function judgeStructureAxis(text: string): { a: number; b: number } {
  const lines = text.split('\n');
  const headingCount = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  const listCount = lines.filter(l => /^\s*[-*]\s/.test(l) || /^\s*\d+\.\s/.test(l)).length;
  const listRatio = lines.length > 0 ? listCount / lines.length : 0;

  // 헤딩 3개 이상 또는 리스트 비율 20% 이상 → 구조화(S)
  const isStructured = headingCount >= 3 || listRatio >= 0.2;
  return isStructured ? { a: 1, b: 0 } : { a: 0, b: 1 };
}
```

- [ ] **Step 6: control 축 — permissions mode 시그널 추가**

```typescript
/**
 * 통제/위임 축에 permissions mode 시그널 추가
 */
export function judgeControlFromSettings(text: string): { a: number; b: number } {
  // settings.json에서 permissions 모드 감지
  const hasBypass = /bypassPermissions|"auto"/i.test(text);
  const hasPlan = /"plan"|"default"/i.test(text);
  const denyCount = (text.match(/deny/gi) || []).length;

  let a = denyCount > 0 ? 1 : 0;  // deny rules → 통제(R)
  if (hasPlan) a += 1;
  let b = hasBypass ? 1 : 0;      // bypass/auto → 위임(D)

  return { a, b };
}
```

- [ ] **Step 7: 패턴 태그 매핑 테스트 작성**

```typescript
// __tests__/analyzer/patterns.test.ts에 추가
import { countAxisSignals, judgeVerboseAxis, judgeStructureAxis } from '../../packages/analyzer/src/analyzer/patterns';

describe('v2 axis signal counting', () => {
  test('NEVER 키워드는 control축 R 시그널', () => {
    // ... countAxisSignals 호출 후 control.a > 0 확인
  });

  test('장황 축은 줄 수 기반', () => {
    const longStats = { claudeMdLines: 50, isExpandedInput: false } as any;
    const shortStats = { claudeMdLines: 10, isExpandedInput: false } as any;
    expect(judgeVerboseAxis(longStats).a).toBe(1);  // 장황
    expect(judgeVerboseAxis(shortStats).b).toBe(1);  // 간결
  });

  test('구조화 축은 헤딩/리스트 기반', () => {
    const structured = '# Title\n## Section\n- item1\n- item2\n- item3';
    const freeform = 'just some text\nwithout any structure\nflat flat flat';
    expect(judgeStructureAxis(structured).a).toBe(1);   // 구조화
    expect(judgeStructureAxis(freeform).b).toBe(1);      // 자유형
  });
});
```

- [ ] **Step 8: 테스트 실행 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/patterns.test.ts`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add packages/analyzer/src/analyzer/patterns.ts __tests__/analyzer/patterns.test.ts
git commit -m "feat: 기존 패턴에 5축 매핑 태그 추가 + 축별 시그널 카운트 함수"
```

---

## Task 3: 5축 이분법 스코어러

**Files:**
- Create: `packages/analyzer/src/analyzer/axis-scorer.ts`
- Test: `__tests__/analyzer/axis-scorer.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```typescript
// __tests__/analyzer/axis-scorer.test.ts
import { scoreAxes } from '../../packages/analyzer/src/analyzer/axis-scorer';
import type { MdStats } from '../../packages/analyzer/src/types';

const mockStats = (overrides: Partial<MdStats> = {}): MdStats => ({
  totalLines: 50,
  claudeMdLines: 50,
  sectionCount: 3,
  toolNames: [],
  hasMemory: false,
  hasHooks: false,
  hasProjectMd: false,
  ruleCount: 0,
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
});

describe('scoreAxes', () => {
  test('NEVER 많은 텍스트는 control축 R(통제)', () => {
    const text = 'NEVER do this\nNEVER do that\nMUST follow rules\nALWAYS check';
    const result = scoreAxes(text, mockStats());
    expect(result.judgments.control.direction).toBe('R');
  });

  test('짧은 CLAUDE.md는 verbose축 C(간결)', () => {
    const text = '# Rules\n- be nice\n- be fast';
    const result = scoreAxes(text, mockStats({ claudeMdLines: 3 }));
    expect(result.judgments.verbose.direction).toBe('C');
  });

  test('헤딩이 많은 텍스트는 structure축 S(구조화)', () => {
    const text = '# Title\n## A\ncontent\n## B\ncontent\n## C\ncontent';
    const result = scoreAxes(text, mockStats());
    expect(result.judgments.structure.direction).toBe('S');
  });

  test('typeCode는 5글자', () => {
    const text = 'some text';
    const result = scoreAxes(text, mockStats());
    expect(result.typeCode).toHaveLength(5);
  });
});
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/axis-scorer.test.ts`
Expected: FAIL (모듈 미존재)

- [ ] **Step 3: axis-scorer.ts 구현**

```typescript
// packages/analyzer/src/analyzer/axis-scorer.ts
import type { MdStats } from '../types.js';
import type { AxisKey, AxisJudgment, AxisScores, TypeCode } from '../v2-types.js';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types.js';
import {
  countAxisSignals,
  judgeVerboseAxis,
  judgeStructureAxis,
  judgeControlFromSettings,
} from './patterns.js';

/**
 * 텍스트와 통계를 받아 5축 이분법 판정 수행
 */
export function scoreAxes(text: string, stats: MdStats): AxisScores {
  // 1. 패턴 기반 시그널 카운트 (harness, control, plan 축)
  const patternSignals = countAxisSignals(text, stats);

  // 2. 줄 수 기반 (verbose 축)
  const verboseSignals = judgeVerboseAxis(stats);

  // 3. 구조 기반 (structure 축)
  const structureSignals = judgeStructureAxis(text);

  // 4. settings 기반 (control 축 보강)
  const settingsSignals = judgeControlFromSettings(text);

  // 5. 각 축별 판정 조합
  const judgments: Record<AxisKey, AxisJudgment> = {} as any;

  for (const axis of AXIS_ORDER) {
    let aCount = patternSignals[axis]?.a ?? 0;
    let bCount = patternSignals[axis]?.b ?? 0;

    // 축별 특수 시그널 합산
    if (axis === 'verbose') {
      aCount += verboseSignals.a;
      bCount += verboseSignals.b;
    }
    if (axis === 'structure') {
      aCount += structureSignals.a;
      bCount += structureSignals.b;
    }
    if (axis === 'control') {
      aCount += settingsSignals.a;
      bCount += settingsSignals.b;
    }

    const total = aCount + bCount;
    const direction = aCount >= bCount
      ? AXIS_LABELS[axis].a
      : AXIS_LABELS[axis].b;
    const confidence = total > 0
      ? Math.max(aCount, bCount) / total
      : 0.5;

    judgments[axis] = { axis, aCount, bCount, direction, confidence };
  }

  // 6. 타입 코드 생성
  const typeCode: TypeCode = AXIS_ORDER.map(axis => judgments[axis].direction).join('');

  return { judgments, typeCode };
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/axis-scorer.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/analyzer/src/analyzer/axis-scorer.ts __tests__/analyzer/axis-scorer.test.ts
git commit -m "feat: 5축 이분법 스코어러 구현"
```

---

## Task 4: 32개 고유 페르소나 정의

**Files:**
- Create: `packages/analyzer/src/content/v2-personas.ts`
- Test: `__tests__/v2-personas.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```typescript
// __tests__/v2-personas.test.ts
import { V2_PERSONAS, getPersonaByTypeCode } from '../packages/analyzer/src/content/v2-personas';

describe('v2 personas', () => {
  test('32개 페르소나 정의 존재', () => {
    expect(Object.keys(V2_PERSONAS)).toHaveLength(32);
  });

  test('모든 페르소나에 name, tagline, narrative, emoji 존재', () => {
    for (const [code, persona] of Object.entries(V2_PERSONAS)) {
      expect(persona.name).toBeTruthy();
      expect(persona.tagline).toBeTruthy();
      expect(persona.narrative).toBeTruthy();
      expect(persona.emoji).toBeTruthy();
      expect(code).toHaveLength(5);
    }
  });

  test('getPersonaByTypeCode로 조회 가능', () => {
    const persona = getPersonaByTypeCode('HDCXF');
    expect(persona).toBeDefined();
    expect(persona?.name).toBe('카오스 엔지니어');
  });
});
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/v2-personas.test.ts`

- [ ] **Step 3: 32개 페르소나 작성**

```typescript
// packages/analyzer/src/content/v2-personas.ts
import type { V2PersonaDefinition } from '../v2-types.js';

/**
 * 32개 고유 페르소나 — 5축 조합별 이름 + 한줄 + 캐릭터 서사
 *
 * 타입 코드 순서: harness(G/H) + control(R/D) + verbose(V/C) + plan(P/X) + structure(S/F)
 */
export const V2_PERSONAS: Record<string, V2PersonaDefinition> = {
  // === 하기스(G) 계열 — 16개 ===
  'GRVPS': {
    typeCode: 'GRVPS',
    name: '매뉴얼 콜렉터',
    tagline: '세상의 모든 가이드를 정리해둔 사람',
    narrative: '남이 만든 좋은 것을 찾아내고, 빠짐없이 세팅하고, 완벽하게 문서화한다. 직접 만들지 않았을 뿐 — 당신의 정리 능력 자체가 이미 하나의 시스템이다.',
    emoji: '📚',
  },
  'GRVPF': {
    typeCode: 'GRVPF',
    name: '탐색의 설계자',
    tagline: '아이디어는 넘치고 정리는 머릿속에',
    narrative: '새로운 가능성을 찾아다니며 꼼꼼하게 규칙까지 세우지만, 문서는 자유분방하다. 머릿속에는 완벽한 지도가 있는데 밖으로 꺼내면 약간 카오스. 근데 본인은 그게 편하다.',
    emoji: '🗺️',
  },
  'GRVXS': {
    typeCode: 'GRVXS',
    name: '체계적 실험가',
    tagline: '해보면서 정리하는 사람',
    narrative: '이것저것 시도하면서도 기록은 체계적이다. 실험은 넓게, 정리는 깔끔하게. 당신의 CLAUDE.md는 실험 노트처럼 깔끔하게 쌓여간다.',
    emoji: '🧪',
  },
  'GRVXF': {
    typeCode: 'GRVXF',
    name: '자유로운 탐험가',
    tagline: '가보지 않은 길이 재밌는 사람',
    narrative: '규칙도 많고 설명도 길지만 형식에는 얽매이지 않는다. 실행하며 배우고, 배운 건 자기만의 방식으로 적어둔다. 정돈되진 않았지만 살아있는 문서.',
    emoji: '🌊',
  },
  'GDVPS': {
    typeCode: 'GDVPS',
    name: '위임형 큐레이터',
    tagline: 'AI를 믿고, 좋은 것만 골라놓은 사람',
    narrative: '좋은 도구를 찾아서 세팅하되, AI에게는 자유를 준다. 맥락은 충분히 주지만 통제는 최소한. 당신의 CLAUDE.md는 가이드북이지 규칙집이 아니다.',
    emoji: '🎯',
  },
  'GDVPF': {
    typeCode: 'GDVPF',
    name: '흐름의 사상가',
    tagline: '생각을 풀어놓으면 그게 설계가 되는 사람',
    narrative: '장황하게 써놓지만 규칙은 아니다. 맥락과 의도를 풍부하게 전달하고, AI가 알아서 하길 기대한다. 형식보다 의미, 통제보다 소통.',
    emoji: '💭',
  },
  'GDVXS': {
    typeCode: 'GDVXS',
    name: '실용적 브리퍼',
    tagline: '충분히 알려주고 AI가 하게 두는 사람',
    narrative: '풍부한 맥락을 구조적으로 정리해두고, 실행은 AI에게 맡긴다. 사전 설계보다는 돌리면서 다듬는 타입. 문서는 깔끔한데 규칙은 느슨하다.',
    emoji: '📋',
  },
  'GDVXF': {
    typeCode: 'GDVXF',
    name: '의식의 흐름러',
    tagline: '쓰다 보니 장문, 근데 그게 다 맥락',
    narrative: '생각나는 대로 길게 쓰고, 구조는 신경 안 쓰고, 규칙도 별로 없다. 그런데 이상하게 AI가 잘 알아듣는다. 당신의 문서는 편지 같다.',
    emoji: '✉️',
  },
  'GRCPS': {
    typeCode: 'GRCPS',
    name: '미니멀 통제자',
    tagline: '적게 쓰되 규칙은 확실한 사람',
    narrative: '문서는 짧지만 NEVER와 MUST가 정확하다. 꼭 필요한 것만 쓰고, 그 안에서 선은 확실히 긋는다. 간결함 속에 단호함.',
    emoji: '🔒',
  },
  'GRCPF': {
    typeCode: 'GRCPF',
    name: '직감적 파수꾼',
    tagline: '짧지만 빈틈없는, 본능적 방어선',
    narrative: '형식은 없지만 핵심 규칙은 놓치지 않는다. 구조 없이 몇 줄 적어놨는데 그게 다 가드레일이다. 최소한의 문서, 최대한의 통제.',
    emoji: '🛡️',
  },
  'GRCXS': {
    typeCode: 'GRCXS',
    name: '효율의 수호자',
    tagline: '짧고 체계적이고, 선은 명확한 사람',
    narrative: '간결하게 쓰되 구조적이고, 규칙은 지키면서 실행 중심이다. 적은 줄 수 안에 놀라운 밀도. 실용주의와 통제의 교차점.',
    emoji: '⚡',
  },
  'GRCXF': {
    typeCode: 'GRCXF',
    name: '스파르탄',
    tagline: '말은 적고 규칙은 칼같은 사람',
    narrative: '3줄 안에 NEVER가 2개. 형식? 불필요. 설계? 실행이 설계다. 최소한의 말로 최대한의 경계를 세우는, 스파르타식 AI 사용.',
    emoji: '⚔️',
  },
  'GDCPS': {
    typeCode: 'GDCPS',
    name: '미니멀 설계자',
    tagline: '적게 쓰고, AI를 믿고, 구조는 잡아두는 사람',
    narrative: '간결하지만 체계적이고, 통제보다 위임을 선택한다. 핵심만 담은 깔끔한 설계도를 AI에게 건네고, 알아서 하길 기대한다.',
    emoji: '📐',
  },
  'GDCPF': {
    typeCode: 'GDCPF',
    name: '직관적 위임자',
    tagline: '느낌으로 맡기는데 그게 맞는 사람',
    narrative: '짧고, 자유롭고, 규칙도 없다. 근데 필요한 맥락은 다 있다. 형식을 벗어나면서도 AI가 필요한 건 챙겨주는, 직관의 설계.',
    emoji: '🎩',
  },
  'GDCXS': {
    typeCode: 'GDCXS',
    name: '가벼운 실용주의자',
    tagline: '깔끔하게 정리하고 AI에게 맡기는 사람',
    narrative: '간결하고 구조적이지만 사전 설계보다 실행 중심. 위임형이라 규칙은 느슨. 적은 노력으로 최대 효과를 뽑는 타입.',
    emoji: '🎈',
  },
  'GDCXF': {
    typeCode: 'GDCXF',
    name: '직감의 서퍼',
    tagline: '가볍게 타지만 넘어지지 않는 사람',
    narrative: 'MCP 몇 개면 충분하고, 규칙은 최소한으로, 문서는 3줄이면 된다. AI를 믿고 파도를 타듯이 쓴다. 가벼워 보이지만 — 자기만의 감이 있다.',
    emoji: '🏄',
  },

  // === 하네스(H) 계열 — 16개 ===
  'HRVPS': {
    typeCode: 'HRVPS',
    name: '결계 아키텍트',
    tagline: '빈틈없는 시스템의 설계자',
    narrative: '모든 규칙을 직접 설계하고, 모든 예외를 문서화하고, AI가 넘지 못할 선을 정확히 긋는다. 당신의 CLAUDE.md를 보면 하나의 완성된 운영 매뉴얼이다. 빡빡하지만 — 그래서 신뢰할 수 있다.',
    emoji: '🏰',
  },
  'HRVPF': {
    typeCode: 'HRVPF',
    name: '프리스타일 아키텍트',
    tagline: '체계는 머릿속에, 문서는 자유롭게',
    narrative: '시스템 설계 능력은 확실한데, 문서 형식에는 구애받지 않는다. 규칙은 촘촘하고 맥락은 풍부한데, 읽는 사람은 좀 헤맬 수 있다. 본인은 다 알거든.',
    emoji: '🎨',
  },
  'HRVXS': {
    typeCode: 'HRVXS',
    name: '체계적 감독관',
    tagline: '돌리면서 규칙을 다지는 사람',
    narrative: '실행하면서 검증하고, 검증 결과를 체계적으로 정리한다. 통제와 실행이 동시에 돌아가는, 감독과 선수를 겸하는 타입.',
    emoji: '📊',
  },
  'HRVXF': {
    typeCode: 'HRVXF',
    name: '전장의 지휘관',
    tagline: '규칙은 강하고 형식은 자유로운, 실전형 리더',
    narrative: '전쟁터에서 문서 형식을 따질 여유는 없다. 규칙은 확실하고, 실행은 빠르고, 형식은 상관없다. 결과로 말하는 통제형 실전가.',
    emoji: '⚔️',
  },
  'HDVPS': {
    typeCode: 'HDVPS',
    name: '시스템 철학자',
    tagline: '구조도 맥락도 풍부한, AI와의 대화를 설계하는 사람',
    narrative: '직접 만든 시스템 위에 풍부한 맥락을 올리고, AI에게는 자유를 준다. 통제보다 신뢰, 규칙보다 이해. 당신의 CLAUDE.md는 철학서에 가깝다.',
    emoji: '📖',
  },
  'HDVPF': {
    typeCode: 'HDVPF',
    name: '비전 메이커',
    tagline: '큰 그림을 그리고 AI에게 실현을 맡기는 사람',
    narrative: '장대한 맥락을 자유롭게 풀어놓고, 세부 실행은 AI의 판단에 맡긴다. 형식에 구애받지 않는 비전. 시스템은 직접 지었지만 운전대는 AI에게 넘긴다.',
    emoji: '🔮',
  },
  'HDVXS': {
    typeCode: 'HDVXS',
    name: '데이터 장인',
    tagline: '실행하며 쌓고, 쌓은 걸 체계적으로 정리하는 사람',
    narrative: '풍부한 맥락을 주되 결과를 보면서 다듬는다. 위임하지만 방치하지 않는다. 검증과 축적의 루프가 체계적으로 돌아가는 시스템.',
    emoji: '🔬',
  },
  'HDVXF': {
    typeCode: 'HDVXF',
    name: '자유로운 오케스트레이터',
    tagline: '풍부하게 맡기고, 자유롭게 돌리는 사람',
    narrative: '맥락은 넘치게 주고, 통제는 내려놓고, 형식도 자유롭다. 시스템은 직접 지었지만 그 안에서는 모든 것이 유동적. 혼돈 속의 질서.',
    emoji: '🌀',
  },
  'HRCPS': {
    typeCode: 'HRCPS',
    name: '정밀 기계',
    tagline: '짧고, 정확하고, 빈틈없는 시스템',
    narrative: '직접 만든 시스템, 짧지만 촘촘한 규칙, 깔끔한 구조. 한 줄도 낭비 없이 필요한 것만 담았다. 당신의 CLAUDE.md는 정밀 기계의 도면이다.',
    emoji: '⚙️',
  },
  'HRCPF': {
    typeCode: 'HRCPF',
    name: '은둔 고수',
    tagline: '적게 보여주지만 그 안에 시스템이 다 있는 사람',
    narrative: '문서는 짧고 형식도 자유롭지만, 규칙은 정확하고 시스템은 돌아간다. 겉으로는 단순해 보이는데, 열어보면 정교한 하네스가 숨어있다.',
    emoji: '🥷',
  },
  'HRCXS': {
    typeCode: 'HRCXS',
    name: '실전 엔지니어',
    tagline: '짧고, 통제하고, 체계적으로 실행하는 사람',
    narrative: '간결한 규칙과 체계적 실행의 조합. 사전 설계보다 돌리면서 다지는 타입이지만, 규칙만큼은 확실하다. 실전에서 단련된 시스템.',
    emoji: '🔧',
  },
  'HRCXF': {
    typeCode: 'HRCXF',
    name: '미니멀 하커',
    tagline: '최소한의 코드로 최대한의 통제를 만드는 사람',
    narrative: '짧고 자유롭지만 핵심 hooks는 직접 만들었다. 형식은 없어도 시스템은 돌아가고, 규칙은 적어도 정확하다. 해커의 미학.',
    emoji: '💻',
  },
  'HDCPS': {
    typeCode: 'HDCPS',
    name: '젠 마스터',
    tagline: '적게, 맡기되, 구조는 있는 사람',
    narrative: '간결한 문서, 체계적 구조, 그리고 위임. 필요한 것만 담아두고 AI에게 넘긴다. 미니멀리즘과 신뢰의 조화. 당신의 시스템은 비어있어서 강하다.',
    emoji: '🧘',
  },
  'HDCPF': {
    typeCode: 'HDCPF',
    name: '무위자연',
    tagline: '아무것도 안 한 것 같은데 시스템이 돌아가는 사람',
    narrative: '짧고, 자유롭고, 규칙도 없고, AI에게 맡긴다. 근데 시스템은 직접 지었다. 물처럼 형태가 없지만 흐름은 정확하다.',
    emoji: '💧',
  },
  'HDCXS': {
    typeCode: 'HDCXS',
    name: '린 빌더',
    tagline: '군더더기 없이 돌리는 사람',
    narrative: '간결, 체계적, 실행 중심, 위임형. 직접 만든 시스템을 최소한의 문서로 운영한다. 낭비 없는 린(lean) 방식. 시스템이 말해주니까 문서가 길 필요 없다.',
    emoji: '🏗️',
  },
  'HDCXF': {
    typeCode: 'HDCXF',
    name: '카오스 엔지니어',
    tagline: '시키면 끝나 있는 시스템의 주인',
    narrative: '당신의 시스템은 정교하게 돌아가는데, 그걸 설명하는 문서는 어디에도 없다. 구조는 머릿속에, 실행은 AI에게, 결과는 알아서 나온다. 주변에서는 대체 어떻게 하는 건지 모르지만 — 잘 된다.',
    emoji: '🌪️',
  },
};

export function getPersonaByTypeCode(typeCode: string): V2PersonaDefinition | undefined {
  return V2_PERSONAS[typeCode];
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/v2-personas.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/analyzer/src/content/v2-personas.ts __tests__/v2-personas.test.ts
git commit -m "feat: 32개 고유 페르소나 정의 (5축 조합형)"
```

---

## Task 5: 모듈형 위트/탐험 블록

**Files:**
- Create: `packages/analyzer/src/content/v2-modules.ts`

- [ ] **Step 1: 모듈 블록 작성**

```typescript
// packages/analyzer/src/content/v2-modules.ts
import type { ModuleBlock, AxisKey } from '../v2-types.js';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 하기스/하네스
  { axis: 'harness', direction: 'G', wit: '이번 주에 깐 MCP가 지난 주에 깐 것보다 많은 적 없나요?', exploration: '자주 쓰는 것 하나만 깊이 파보면 새로운 세계가 열릴 수도' },
  { axis: 'harness', direction: 'H', wit: '설정 다듬다가 하루가 간 적 없나요?', exploration: '가끔은 새로운 도구를 아무 계획 없이 깔아보는 것도 발견이야' },
  // 통제/위임
  { axis: 'control', direction: 'R', wit: 'NEVER 12개 써놓고도 불안해서 한 번 더 확인하러 돌아온 적 없나요?', exploration: '한 번쯤 규칙 없이 AI를 풀어보면 의외의 결과가 나올지도' },
  { axis: 'control', direction: 'D', wit: 'bypass 모드 켜놓고 커피 마시러 갔다가, 뭔가 잘못된 적 없나요?', exploration: '중요한 작업에 가드레일 하나만 걸어보면 밤잠이 편할 수도' },
  // 장황/간결
  { axis: 'verbose', direction: 'V', wit: 'CLAUDE.md 수정하다가 이게 문서인지 자서전인지 헷갈린 적 없나요?', exploration: '한번 핵심 3줄만 남기고 다 지워보면, AI가 의외로 잘할 수도' },
  { axis: 'verbose', direction: 'C', wit: '3줄 쓰고 "이 정도면 충분하지" 했는데, 클로드가 전혀 다른 걸 해온 적 없나요?', exploration: '자주 반복하는 지시가 있다면, 그건 CLAUDE.md에 적어둘 타이밍' },
  // 설계/실행
  { axis: 'plan', direction: 'P', wit: '@import 구조 잡다가 정작 코드는 한 줄도 안 쓴 채로 하루가 간 적 없나요?', exploration: '가끔은 구조 없이 일단 돌려보는 게 더 빠른 발견일 수도' },
  { axis: 'plan', direction: 'X', wit: '일단 돌려보고 고치자 했는데, 고칠 게 산더미가 된 적 없나요?', exploration: '다음 프로젝트는 AGENTS.md부터 써보면 의외로 속도가 날 수도' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S', wit: '헤딩 레벨 정하다가 30분 쓴 적 없나요?', exploration: '다음엔 생각나는 대로 먼저 쓰고 나중에 정리하면 더 빠를 수도' },
  { axis: 'structure', direction: 'F', wit: '나중에 정리해야지 하고 3개월째 산문체인 적 없나요?', exploration: '헤딩 3개만 넣어보면 클로드가 놀랍도록 다르게 행동할 수도' },
];

/**
 * 타입 코드에 맞는 위트 블록 반환 (가장 확신도 높은 2-3개)
 */
export function getWitItems(
  typeCode: string,
  judgments: Record<AxisKey, { direction: string; confidence: number }>
): string[] {
  const AXIS_ORDER: AxisKey[] = ['harness', 'control', 'verbose', 'plan', 'structure'];

  // confidence 높은 순으로 정렬, 상위 3개 선택
  const sorted = AXIS_ORDER
    .map(axis => ({ axis, ...judgments[axis] }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return sorted.map(({ axis, direction }) => {
    const block = MODULE_BLOCKS.find(b => b.axis === axis && b.direction === direction);
    return block?.wit ?? '';
  }).filter(Boolean);
}

/**
 * 탐험 제안 반환 (가장 확신도 높은 3개 축의 반대 방향)
 */
export function getExplorationItems(
  typeCode: string,
  judgments: Record<AxisKey, { direction: string; confidence: number }>
): string[] {
  const AXIS_ORDER: AxisKey[] = ['harness', 'control', 'verbose', 'plan', 'structure'];
  const AXIS_LABELS_LOCAL: Record<AxisKey, { a: string; b: string }> = {
    harness: { a: 'G', b: 'H' },
    control: { a: 'R', b: 'D' },
    verbose: { a: 'V', b: 'C' },
    plan: { a: 'P', b: 'X' },
    structure: { a: 'S', b: 'F' },
  };

  const sorted = AXIS_ORDER
    .map(axis => ({ axis, ...judgments[axis] }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return sorted.map(({ axis, direction }) => {
    // 반대 방향의 탐험 제안
    const labels = AXIS_LABELS_LOCAL[axis];
    const oppositeDirection = direction === labels.a ? labels.b : labels.a;
    const block = MODULE_BLOCKS.find(b => b.axis === axis && b.direction === oppositeDirection);
    return block?.exploration ?? '';
  }).filter(Boolean);
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/analyzer/src/content/v2-modules.ts
git commit -m "feat: 10개 모듈형 위트/탐험 블록"
```

---

## Task 6: v2 분석 파이프라인 통합

**Files:**
- Modify: `packages/analyzer/src/analyzer/index.ts`
- Modify: `packages/analyzer/src/index.ts`
- Test: `__tests__/v2-integration.test.ts`

- [ ] **Step 1: 통합 테스트 작성**

```typescript
// __tests__/v2-integration.test.ts
import { analyzeV2 } from '../packages/analyzer/src/analyzer/index';

describe('v2 full pipeline', () => {
  test('NEVER 많은 장문 구조화 텍스트 → 통제+장황+구조화 판정', () => {
    const text = `# Rules
## Security
- NEVER commit .env
- NEVER expose API keys
- MUST check before push

## Tools
- Slack integration
- Notion integration

## Workflow
- ALWAYS review before merge
- NEVER skip tests`;

    const result = analyzeV2(text);
    expect(result.typeCode).toHaveLength(5);
    expect(result.persona).toBeDefined();
    expect(result.persona.name).toBeTruthy();
    expect(result.witItems.length).toBeGreaterThanOrEqual(2);
    expect(result.explorationItems.length).toBeGreaterThanOrEqual(2);
    // 통제(R), 장황(V), 구조화(S) 기대
    expect(result.axisScores.judgments.control.direction).toBe('R');
    expect(result.axisScores.judgments.structure.direction).toBe('S');
  });

  test('짧은 자유형 텍스트 → 간결+자유형', () => {
    const text = 'just use common sense\nbe helpful';
    const result = analyzeV2(text);
    expect(result.axisScores.judgments.verbose.direction).toBe('C');
    expect(result.axisScores.judgments.structure.direction).toBe('F');
  });
});
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/v2-integration.test.ts`

- [ ] **Step 3: analyzeV2 함수 구현**

`packages/analyzer/src/analyzer/index.ts`에 추가:

```typescript
import type { V2AnalysisResult } from '../v2-types.js';
import { scoreAxes } from './axis-scorer.js';
import { extractMdStats } from './scorer.js';
import { getPersonaByTypeCode } from '../content/v2-personas.js';
import { getWitItems, getExplorationItems } from '../content/v2-modules.js';

/**
 * v2 분석 — 5축 조합형 성향 분류
 */
export function analyzeV2(text: string): V2AnalysisResult {
  // 1. 기존 MdStats 추출 (패턴 감지 재사용)
  const mdStats = extractMdStats(text);

  // 2. 5축 판정
  const axisScores = scoreAxes(text, mdStats);

  // 3. 페르소나 조회
  const persona = getPersonaByTypeCode(axisScores.typeCode);
  if (!persona) {
    throw new Error(`Unknown type code: ${axisScores.typeCode}`);
  }

  // 4. 모듈 콘텐츠 선택
  const witItems = getWitItems(axisScores.typeCode, axisScores.judgments);
  const explorationItems = getExplorationItems(axisScores.typeCode, axisScores.judgments);

  return {
    typeCode: axisScores.typeCode,
    axisScores,
    persona,
    witItems,
    explorationItems,
    mdStats,
  };
}
```

- [ ] **Step 4: index.ts에 v2 export 추가**

`packages/analyzer/src/index.ts`에 추가:

```typescript
// v2 분석 함수
export { analyzeV2 } from './analyzer/index.js';

// v2 타입
export type {
  AxisKey,
  AxisDirection,
  TypeCode,
  AxisJudgment,
  AxisScores,
  V2PersonaDefinition,
  ModuleBlock,
  V2AnalysisResult,
} from './v2-types.js';

export { AXIS_LABELS, AXIS_ORDER } from './v2-types.js';

// v2 콘텐츠
export { V2_PERSONAS, getPersonaByTypeCode } from './content/v2-personas.js';
export { MODULE_BLOCKS } from './content/v2-modules.js';
```

- [ ] **Step 5: 테스트 실행 — PASS 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/v2-integration.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add packages/analyzer/src/analyzer/index.ts packages/analyzer/src/index.ts __tests__/v2-integration.test.ts
git commit -m "feat: v2 분석 파이프라인 통합 (analyzeV2)"
```

---

## Task 7: PentagonChart 컴포넌트

**Files:**
- Create: `components/PentagonChart.tsx`

- [ ] **Step 1: 펜타곤 차트 구현**

```tsx
// components/PentagonChart.tsx
'use client';

import type { AxisScores } from '@mdti/analyzer';
import { AXIS_LABELS, AXIS_ORDER } from '@mdti/analyzer';

interface Props {
  axisScores: AxisScores;
  color?: string;
}

/**
 * 5축 펜타곤 레이더 — 숫자 없이 모양만
 * 각 축의 confidence를 반지름으로, 방향에 따라 색상 변화
 */
export default function PentagonChart({ axisScores, color = '#6366f1' }: Props) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;

  // 5각형 꼭짓점 좌표 (상단 시작, 시계방향)
  const points = AXIS_ORDER.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });

  // 데이터 포인트 (confidence 기반)
  const dataPoints = AXIS_ORDER.map((axis, i) => {
    const confidence = axisScores.judgments[axis].confidence;
    const r = radius * (0.3 + confidence * 0.7); // 최소 30%, 최대 100%
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });

  const gridPolygon = points.map(p => `${p.x},${p.y}`).join(' ');
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 격자 */}
        <polygon points={gridPolygon} fill="none" stroke="#e5e7eb" strokeWidth="1" />

        {/* 데이터 영역 */}
        <polygon points={dataPolygon} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />

        {/* 축 라벨 */}
        {AXIS_ORDER.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const labelR = radius + 28;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          const judgment = axisScores.judgments[axis];
          const labels = AXIS_LABELS[axis];
          const label = judgment.direction === labels.a ? labels.aLabel : labels.bLabel;

          return (
            <text key={axis} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              className="text-xs fill-gray-600 font-medium">
              {label}
            </text>
          );
        })}
      </svg>
      <p className="text-sm text-gray-400">너의 CLAUDE.md 실루엣</p>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/PentagonChart.tsx
git commit -m "feat: 5축 펜타곤 차트 컴포넌트"
```

---

## Task 8: 결과 페이지 v2 전환

**Files:**
- Create: `components/CharacterNarrative.tsx`
- Create: `components/WitSection.tsx`
- Create: `components/ExplorationSection.tsx`
- Modify: `components/ResultHero.tsx`
- Modify: `app/r/[id]/page.tsx`

- [ ] **Step 1: CharacterNarrative 컴포넌트**

```tsx
// components/CharacterNarrative.tsx
import type { V2PersonaDefinition } from '@mdti/analyzer';

export default function CharacterNarrative({ persona }: { persona: V2PersonaDefinition }) {
  return (
    <section className="my-8 px-4">
      <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
        {persona.narrative}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: WitSection 컴포넌트**

```tsx
// components/WitSection.tsx
export default function WitSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="my-8 px-4">
      <h2 className="text-xl font-bold mb-4">😏 솔직히 말하면</h2>
      <div className="space-y-3">
        {items.map((wit, i) => (
          <p key={i} className="text-gray-600 italic bg-gray-50 rounded-lg p-4">
            {wit}
          </p>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: ExplorationSection 컴포넌트**

```tsx
// components/ExplorationSection.tsx
export default function ExplorationSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="my-8 px-4">
      <h2 className="text-xl font-bold mb-4">🧭 이것도 해보면 재밌을 걸</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-gray-600 pl-4 border-l-2 border-indigo-300">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: ResultHero v2 수정**

`components/ResultHero.tsx`에 v2 모드 추가:

```tsx
// v2 props 추가
interface V2Props {
  persona: import('@mdti/analyzer').V2PersonaDefinition;
  isHarness: boolean;  // 하네스(H)인지 하기스(G)인지
}

// v2 렌더링
export function ResultHeroV2({ persona, isHarness }: V2Props) {
  return (
    <div className="text-center py-8">
      <span className="text-6xl">{persona.emoji}</span>
      <h1 className="text-3xl font-bold mt-4">{persona.name}</h1>
      <p className="text-lg text-gray-500 mt-2">{persona.tagline}</p>
      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${
        isHarness ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {isHarness ? '하네스' : '하기스'}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: 결과 페이지 v2 모드 추가**

`app/r/[id]/page.tsx`에서 v2 결과 감지 및 렌더링:

```tsx
// v2 결과인 경우 (typeCode 존재) v2 렌더링
// 기존 결과인 경우 (persona 존재) 레거시 렌더링

{isV2Result ? (
  <>
    <ResultHeroV2 persona={v2Result.persona} isHarness={v2Result.typeCode[0] === 'H'} />
    <CharacterNarrative persona={v2Result.persona} />
    <PentagonChart axisScores={v2Result.axisScores} />
    <WitSection items={v2Result.witItems} />
    <CompatSection ... />
    <ExplorationSection items={v2Result.explorationItems} />
  </>
) : (
  // 기존 레거시 렌더링 (하위호환)
  <>...</>
)}
```

- [ ] **Step 6: 커밋**

```bash
git add components/CharacterNarrative.tsx components/WitSection.tsx components/ExplorationSection.tsx components/ResultHero.tsx app/r/\\[id\\]/page.tsx
git commit -m "feat: 결과 페이지 v2 전환 (페르소나 히어로 + 캐릭터 서사 + 펜타곤)"
```

---

## Task 9: API & DB 마이그레이션

**Files:**
- Modify: `app/api/analyze/route.ts`
- Modify: `app/api/results/route.ts`
- Modify: `supabase/` (마이그레이션 SQL)

- [ ] **Step 1: Supabase 마이그레이션 SQL**

```sql
-- 기존 필드 nullable 처리 (이미 nullable일 수 있음, 확인 후 적용)
ALTER TABLE results ALTER COLUMN md_power DROP NOT NULL;
ALTER TABLE results ALTER COLUMN quality_scores DROP NOT NULL;
ALTER TABLE results ALTER COLUMN dimension_scores DROP NOT NULL;

-- v2 신규 필드 추가
ALTER TABLE results ADD COLUMN IF NOT EXISTS type_code TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS axis_scores JSONB;
```

- [ ] **Step 2: analyze API에 v2 분석 추가**

`app/api/analyze/route.ts` — `analyzeV2` 호출하여 v2 결과 반환:

```typescript
import { analyzeV2 } from '@mdti/analyzer';

// 기존 analyze() 호출을 analyzeV2()로 전환
// 결과에 typeCode, axisScores 포함
```

- [ ] **Step 3: results API에 v2 결과 저장/조회 추가**

```typescript
// 저장 시 type_code, axis_scores 필드 포함
// 조회 시 type_code 존재하면 v2 결과로 렌더링
```

- [ ] **Step 4: 커밋**

```bash
git add app/api/analyze/route.ts app/api/results/route.ts supabase/
git commit -m "feat: API + DB v2 마이그레이션 (type_code, axis_scores)"
```

---

## Task 10: 레거시 코드 정리 (Phase 2)

> 이 태스크는 v2가 안정화된 후 실행. v1과 v2 공존 기간 동안은 보류.

**Files to remove:**
- `packages/analyzer/src/analyzer/power.ts`
- `packages/analyzer/src/analyzer/quality.ts`
- `components/BattlePower.tsx`
- `components/MdPowerSection.tsx`
- `components/StatsSection.tsx`
- `__tests__/analyzer/power.test.ts`
- `__tests__/analyzer/quality.test.ts`

- [ ] **Step 1: v2 안정화 확인 후 레거시 코드 삭제**
- [ ] **Step 2: 기존 v1 전용 export 제거**
- [ ] **Step 3: 전체 테스트 실행 확인**
- [ ] **Step 4: 커밋**

```bash
git commit -m "chore: v1 레거시 코드 정리 (power, quality, BattlePower 제거)"
```

---

## 실행 요약

| Task | 내용 | 예상 |
|------|------|------|
| 1 | v2 타입 정의 | 기초 |
| 2 | 패턴 축 매핑 | 핵심 — 기존 패턴 → 5축 재분류 |
| 3 | 5축 스코어러 | 핵심 — 이분법 판정 엔진 |
| 4 | 32개 페르소나 | 콘텐츠 — 창작 작업 |
| 5 | 모듈 블록 | 콘텐츠 — 위트/탐험 |
| 6 | 파이프라인 통합 | 핵심 — analyzeV2 |
| 7 | 펜타곤 차트 | UI |
| 8 | 결과 페이지 | UI — 가장 큰 변경 |
| 9 | API + DB | 인프라 |
| 10 | 레거시 정리 | 나중에 |
