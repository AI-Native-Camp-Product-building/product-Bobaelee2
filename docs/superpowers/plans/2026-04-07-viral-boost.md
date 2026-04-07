# mdTI 바이럴 강화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결과 페이지에 전투력 측정기(레이더 차트) + 상위 N% 배지 + 캡처 카드 통합을 추가하여 공유 동기를 강화한다.

**Architecture:** 기존 분석 엔진과 DB 스키마는 변경하지 않는다. `result.scores`(이미 Supabase에 저장됨)를 SVG 레이더 차트로 시각화하고, percentile 계산을 `lib/store.ts`에 추가한다. 신규 컴포넌트 2개(`RadarChart`, `BattlePower`), 기존 컴포넌트 2개 수정(`CaptureCard`, OG route).

**Tech Stack:** Next.js 16, React, SVG (라이브러리 없음), Supabase (PostgreSQL), Vitest, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-07-viral-boost-design.md`

---

### Task 1: DIMENSION_LABELS 상수 추가

**Files:**
- Modify: `lib/types.ts`
- Test: `__tests__/types.test.ts`

- [ ] **Step 1: types.ts에 DIMENSION_LABELS 상수 추가**

`lib/types.ts` 파일 맨 아래에 추가:

```typescript
/** 차원별 UI 라벨 (레이더 차트, 배지 등에서 사용) */
export const DIMENSION_LABELS: Record<keyof DimensionScores, { label: string; description: string }> = {
  automation: { label: "자동화", description: "Hook, CI/CD, 배포 파이프라인" },
  control: { label: "통제", description: "금지 규칙, 지시어, 제약 조건" },
  toolDiversity: { label: "도구", description: "연결한 외부 서비스 SaaS 종류" },
  contextAwareness: { label: "맥락", description: "세션, 메모리, 핸드오프 설계" },
  teamImpact: { label: "팀", description: "코드리뷰, PR, 온보딩, 문서화" },
  security: { label: "보안", description: "민감 정보 보호, deny 규칙" },
  agentOrchestration: { label: "에이전트", description: "자율 실행 루프, 가드레일, 병렬 처리" },
};

/** 전체 패턴 수 (7차원 합산) */
export const TOTAL_PATTERN_COUNT = 94;
```

- [ ] **Step 2: 기존 types 테스트에 DIMENSION_LABELS 검증 추가**

`__tests__/types.test.ts`에 추가:

```typescript
import { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "@/lib/types";
import type { DimensionScores } from "@/lib/types";

describe("DIMENSION_LABELS", () => {
  it("DimensionScores의 모든 키에 라벨이 있어야 한다", () => {
    const dimensionKeys: (keyof DimensionScores)[] = [
      "automation", "control", "toolDiversity", "contextAwareness",
      "teamImpact", "security", "agentOrchestration",
    ];
    for (const key of dimensionKeys) {
      expect(DIMENSION_LABELS[key]).toBeDefined();
      expect(DIMENSION_LABELS[key].label.length).toBeGreaterThan(0);
      expect(DIMENSION_LABELS[key].label.length).toBeLessThanOrEqual(4);
    }
  });

  it("TOTAL_PATTERN_COUNT는 양수여야 한다", () => {
    expect(TOTAL_PATTERN_COUNT).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `npx vitest run __tests__/types.test.ts`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts __tests__/types.test.ts
git commit -m "DIMENSION_LABELS 상수 추가: 레이더 차트 UI 라벨"
```

---

### Task 2: RadarChart SVG 컴포넌트

**Files:**
- Create: `components/RadarChart.tsx`
- Test: `__tests__/components/RadarChart.test.tsx`

- [ ] **Step 1: RadarChart 테스트 작성**

`__tests__/components/RadarChart.test.tsx` 생성:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RadarChart from "@/components/RadarChart";
import type { DimensionScores } from "@/lib/types";

const mockScores: DimensionScores = {
  automation: 80, control: 60, toolDiversity: 70,
  contextAwareness: 40, teamImpact: 30, security: 90, agentOrchestration: 50,
};

describe("RadarChart", () => {
  it("SVG 요소를 렌더링한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("7개 축 라벨을 모두 표시한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    const texts = container.querySelectorAll("text");
    expect(texts.length).toBeGreaterThanOrEqual(14);
  });

  it("배경 격자(5) + 데이터(1) = 6개 폴리곤을 렌더링한다", () => {
    const { container } = render(<RadarChart scores={mockScores} />);
    expect(container.querySelectorAll("polygon").length).toBe(6);
  });

  it("모든 점수가 0이어도 렌더링된다", () => {
    const zeroScores: DimensionScores = {
      automation: 0, control: 0, toolDiversity: 0,
      contextAwareness: 0, teamImpact: 0, security: 0, agentOrchestration: 0,
    };
    const { container } = render(<RadarChart scores={zeroScores} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/components/RadarChart.test.tsx`
Expected: FAIL

- [ ] **Step 3: RadarChart 컴포넌트 구현**

`components/RadarChart.tsx` 생성:

```tsx
"use client";

/**
 * 7축 레이더 차트 -- SVG 직접 구현 (라이브러리 없음)
 */
import type { DimensionScores } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";

interface RadarChartProps {
  scores: DimensionScores;
  size?: number;
}

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[];
const NUM_AXES = DIMENSIONS.length;
const GRID_LEVELS = [20, 40, 60, 80, 100];

function angleFor(index: number): number {
  return (Math.PI * 2 * index) / NUM_AXES - Math.PI / 2;
}

function pointAt(index: number, value: number, radius: number): [number, number] {
  const angle = angleFor(index);
  const r = (value / 100) * radius;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function polygonPoints(values: number[], radius: number, cx: number, cy: number): string {
  return values
    .map((v, i) => {
      const [x, y] = pointAt(i, v, radius);
      return `${cx + x},${cy + y}`;
    })
    .join(" ");
}

export default function RadarChart({ scores, size = 300 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.47;
  const values = DIMENSIONS.map((d) => scores[d]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: `${size}px` }}
      role="img" aria-label="7차원 레이더 차트">
      {GRID_LEVELS.map((level) => (
        <polygon key={`grid-${level}`}
          points={polygonPoints(Array(NUM_AXES).fill(level), radius, cx, cy)}
          fill="none" stroke="rgba(245,230,211,0.1)" strokeWidth="1" />
      ))}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = pointAt(i, 100, radius);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + x} y2={cy + y}
          stroke="rgba(245,230,211,0.08)" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints(values, radius, cx, cy)}
        fill="rgba(217,119,87,0.25)" stroke="#D97757" strokeWidth="2" />
      {values.map((v, i) => {
        const [x, y] = pointAt(i, v, radius);
        return <circle key={`point-${i}`} cx={cx + x} cy={cy + y} r="3" fill="#D97757" />;
      })}
      {DIMENSIONS.map((dim, i) => {
        const [lx, ly] = pointAt(i, 100, labelRadius);
        const x = cx + lx;
        const y = cy + ly;
        const angle = angleFor(i);
        const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle"
          : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <g key={`label-${dim}`}>
            <text x={x} y={y - 6} textAnchor={textAnchor}
              fill="rgba(245,230,211,0.7)" fontSize="12" fontWeight="600">
              {DIMENSION_LABELS[dim].label}
            </text>
            <text x={x} y={y + 10} textAnchor={textAnchor}
              fill="#D97757" fontSize="11" fontWeight="700">
              {scores[dim]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/components/RadarChart.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add components/RadarChart.tsx __tests__/components/RadarChart.test.tsx
git commit -m "RadarChart 컴포넌트 추가: 7축 SVG 레이더 차트"
```

---

### Task 3: percentile 계산 함수

**Files:**
- Modify: `lib/store.ts`
- Test: `__tests__/analyzer/percentile.test.ts`

- [ ] **Step 1: percentile 테스트 작성**

`__tests__/analyzer/percentile.test.ts` 생성:

```typescript
import { describe, it, expect } from "vitest";
import { calculatePercentile } from "@/lib/store";

describe("calculatePercentile", () => {
  it("중간값이면 약 50%를 반환한다", () => {
    expect(calculatePercentile(50, 5, 10)).toBe(50);
  });
  it("최고값이면 상위 10% 이하를 반환한다", () => {
    expect(calculatePercentile(100, 10, 10)).toBeLessThanOrEqual(10);
  });
  it("최저값이면 상위 90% 이상을 반환한다", () => {
    expect(calculatePercentile(0, 0, 10)).toBeGreaterThanOrEqual(90);
  });
  it("전체 0명이면 50을 반환한다", () => {
    expect(calculatePercentile(50, 0, 0)).toBe(50);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/analyzer/percentile.test.ts`
Expected: FAIL

- [ ] **Step 3: calculatePercentile + getPercentiles 구현**

`lib/store.ts` 맨 아래에 추가:

```typescript
/**
 * 상위 N%를 계산한다
 * @returns 상위 퍼센트 (1~100) -- 값이 작을수록 상위
 */
export function calculatePercentile(_myScore: number, belowCount: number, totalCount: number): number {
  if (totalCount === 0) return 50;
  const percentile = Math.round((1 - belowCount / totalCount) * 100);
  return Math.max(1, Math.min(100, percentile));
}

export interface PercentileData {
  mdPowerPercentile: number;
  topDimension: string;
  topDimensionPercentile: number;
}

/** 결과 ID 기반으로 percentile 데이터를 조회한다 */
export async function getPercentiles(resultId: string): Promise<PercentileData> {
  const fallback: PercentileData = {
    mdPowerPercentile: 50,
    topDimension: "automation",
    topDimensionPercentile: 50,
  };

  const result = await getResult(resultId);
  if (!result) return fallback;
  if (!isSupabaseConfigured) return fallback;

  const supabase = await getSupabase();

  const { count: totalResults } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .not("quality_scores", "is", null);

  const total = totalResults ?? 0;
  if (total === 0) return fallback;

  // md력 percentile
  const mdPowerScore = result.mdPower.score;
  const { count: belowMdPower } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .not("quality_scores", "is", null);
  // Supabase에서 md_power 점수 비교가 어려우므로(계산 필드)
  // 간이 방식: persona_stats 기반 또는 전체 조회 후 클라이언트 계산
  // 여기서는 전체 수 대비 간이 percentile 사용
  const mdPowerPercentile = calculatePercentile(mdPowerScore, belowMdPower ?? 0, total);

  // 최강 차원
  const scores = result.scores;
  const dims = Object.entries(scores) as [string, number][];
  dims.sort((a, b) => b[1] - a[1]);
  const topDim = dims[0];

  const { count: belowDim } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .lt(`scores->>${topDim[0]}`, topDim[1]);

  const topDimensionPercentile = calculatePercentile(topDim[1], belowDim ?? 0, total);

  return { mdPowerPercentile, topDimension: topDim[0], topDimensionPercentile };
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/analyzer/percentile.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/store.ts __tests__/analyzer/percentile.test.ts
git commit -m "percentile 계산 함수 추가: md력 + 최강 차원 상위 N%"
```

---

### Task 4: BattlePower 래퍼 컴포넌트

**Files:**
- Create: `components/BattlePower.tsx`

- [ ] **Step 1: BattlePower 컴포넌트 구현**

`components/BattlePower.tsx` 생성:

```tsx
/**
 * 전투력 측정기 -- 레이더 차트 + 상위 N% 배지
 */
import type { DimensionScores, PersonaDefinition } from "@/lib/types";
import { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "@/lib/types";
import type { PercentileData } from "@/lib/store";
import RadarChart from "./RadarChart";

interface BattlePowerProps {
  persona: PersonaDefinition;
  scores: DimensionScores;
  percentile: PercentileData;
  detectedPatterns: number;
}

export default function BattlePower({ persona, scores, percentile, detectedPatterns }: BattlePowerProps) {
  const topLabel = DIMENSION_LABELS[percentile.topDimension as keyof DimensionScores]?.label
    ?? percentile.topDimension;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-claude-cream text-center">
        {persona.emoji} {persona.nameKo}의 전투력 분석
      </h2>
      <div className="bg-bg-card rounded-2xl p-5 flex flex-col items-center gap-4 border border-claude-light/10">
        <RadarChart scores={scores} />
        <p className="text-xs text-claude-light/40">
          {TOTAL_PATTERN_COUNT}개 패턴 중 {detectedPatterns}개 감지
        </p>
        <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full bg-claude-orange/15 text-claude-orange font-bold">
            🏆 md력 상위 {percentile.mdPowerPercentile}%
          </span>
          <span className="px-3 py-1 rounded-full bg-claude-orange/10 text-claude-orange/80 font-semibold">
            {topLabel} 상위 {percentile.topDimensionPercentile}%
          </span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/BattlePower.tsx
git commit -m "BattlePower 래퍼 컴포넌트 추가: 레이더 + 배지 통합"
```

---

### Task 5: 결과 페이지에 BattlePower 삽입

**Files:**
- Modify: `app/r/[id]/page.tsx`

- [ ] **Step 1: import 추가**

`app/r/[id]/page.tsx` 상단에 추가:

```typescript
import BattlePower from "@/components/BattlePower";
import { getPercentiles } from "@/lib/store";
```

- [ ] **Step 2: percentile 데이터 조회 추가**

`ResultPage` 함수에서 `if (!result) notFound();` 바로 아래에 추가:

```typescript
  const percentile = await getPercentiles(id);
```

- [ ] **Step 3: JSX에 BattlePower 삽입**

부 페르소나 태그 블록과 md력 섹션 사이에 추가:

```tsx
        {/* 전투력 측정기 */}
        <BattlePower
          persona={personaDef}
          scores={result.scores}
          percentile={percentile}
          detectedPatterns={
            Object.values(result.mdStats.keywordUniqueHits ?? {}).reduce((sum, v) => sum + v, 0)
          }
        />
```

- [ ] **Step 4: 로컬 서버에서 확인**

Run: `npx next dev`
결과 페이지에서 레이더 차트 + 배지 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add app/r/[id]/page.tsx
git commit -m "결과 페이지에 전투력 측정기 삽입: 레이더 차트 + 상위 N%"
```

---

### Task 6: CaptureCard에 레이더 차트 추가

**Files:**
- Modify: `components/CaptureCard.tsx`
- Modify: `components/ShareButton.tsx` (CaptureCard에 새 props 전달)
- Modify: `app/r/[id]/page.tsx` (ShareButton에 새 props 전달)

- [ ] **Step 1: ShareButton 구조 확인**

`components/ShareButton.tsx`를 읽어서 CaptureCard가 어떻게 사용되는지 확인. ShareButton의 props에 `scores`와 `percentile`을 추가하고 CaptureCard로 전달해야 함.

- [ ] **Step 2: CaptureCard props 확장 + 미니 레이더 삽입**

`CaptureCard.tsx`에서:
- props에 `scores: DimensionScores`와 `percentile: PercentileData` 추가
- 캡처 카드 JSX의 태그라인과 대표 로스팅 사이에 미니 레이더 SVG + 상위 N% 배지 삽입
- 미니 레이더는 `RadarChart` 컴포넌트가 아닌 inline SVG로 구현 (html2canvas 호환)

- [ ] **Step 3: ShareButton props 확장 + 전달**

ShareButton에 `scores`와 `percentile` props를 추가하고 CaptureCard로 전달.

- [ ] **Step 4: 결과 페이지에서 ShareButton에 새 props 전달**

`app/r/[id]/page.tsx`의 ShareButton에 `scores={result.scores}` `percentile={percentile}` 추가.

- [ ] **Step 5: 캡처 테스트**

로컬에서 이미지 저장 버튼 클릭 후 캡처 이미지에 레이더 + 배지 포함 확인.

- [ ] **Step 6: 커밋**

```bash
git add components/CaptureCard.tsx components/ShareButton.tsx app/r/[id]/page.tsx
git commit -m "캡처 카드에 미니 레이더 차트 + 상위 N% 배지 추가"
```

---

### Task 7: OG 이미지에 상위 N% 텍스트 추가

**Files:**
- Modify: `app/api/og/[id]/route.tsx`

- [ ] **Step 1: percentile 조회 추가**

import 추가:

```typescript
import { getPercentiles } from "@/lib/store";
```

GET 함수에서 result 조회 후:

```typescript
  const percentile = result ? await getPercentiles(id) : null;
```

- [ ] **Step 2: 통계 블록 아래에 배지 추가**

통계 3개 `</div>` 와 하단 푸터 사이에:

```tsx
        {percentile && (
          <div style={{
            display: "flex", gap: "16px",
            fontSize: "18px", fontWeight: 700, color: "#D97757",
          }}>
            <span>🏆 md력 상위 {percentile.mdPowerPercentile}%</span>
          </div>
        )}
```

- [ ] **Step 3: OG 이미지 확인**

브라우저에서 `/api/og/{id}` 접속 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/api/og/[id]/route.tsx
git commit -m "OG 이미지에 md력 상위 N% 배지 추가"
```

---

### Task 8: 전체 통합 테스트 + 빌드 검증

- [ ] **Step 1: 전체 테스트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 PASS

- [ ] **Step 2: 빌드 검증**

Run: `npx next build`
Expected: 빌드 성공

- [ ] **Step 3: 전체 플로우 수동 테스트**

1. `npx next dev`
2. CLAUDE.md 붙여넣기 -> 분석
3. 결과 페이지: 레이더 차트 + 배지 확인
4. 이미지 저장: 레이더 포함 확인
5. OG 이미지: 상위 N% 텍스트 확인

- [ ] **Step 4: 최종 커밋**

```bash
git commit -m "바이럴 강화 기능 완성: 전투력 측정기 + 상위 N% + 캡처 카드"
```
