# md력 품질 측정 엔진 재설계 스펙

## Context

현재 md력은 성향 점수 합산(0~600) + 에코시스템 보너스(0~250) + 심층 보너스(0~150) = 1000으로 계산.
문제: "길고 도구 많은 md"가 높은 점수를 받음. 실행 가능성, 간결성, 구조화 같은 **품질**을 측정하지 않음.

이 스펙은 md력을 **5개 품질 차원 기반**으로 전환한다.

### 핵심 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| md력 = 순수 품질 | 에코시스템 보너스 폐지 | CLAUDE.md 3줄 + 플러그인 20개 = md력 높은 건 부적절 |
| 생태계 = 별도 지표 | 다음 스펙으로 분리 | MdStats에 데이터 이미 저장됨, B2B에서 활용 |
| 간결성 단일 기준 | 15~50줄 스위트 스팟 | 150~200개 지시 한계는 역할 무관. 길면 분리가 안 된 신호 |
| 동일 가중치 | 5차원 각 100점 | 데이터 없이 차등 가중치는 근거 없음. 나중에 조정 가능 |
| 프론트엔드 제외 | 백엔드만 이번 스펙 | 레이더 차트가 현재 없음 → 신규 생성은 별도 스펙 |

### 근거 출처

- Anthropic 공식: "이 줄이 없으면 실수가 생기나? 아니면 삭제"
- HumanLayer 연구: "모델이 안정적으로 따르는 지시 ≈ 150~200개"
- Builder.io 가이드: "핵심은 root md에, 상세는 @import 또는 .claude/rules/로 분리"
- 커뮤니티 합의: "린터가 할 일을 md에 쓰지 마라"

---

## 아키텍처

### 접근법: 별도 파일 분리 (접근법 A)

```
quality.ts (신규) — 5개 품질 차원 측정
power.ts (수정)  — QualityScores 입력으로 시그니처 변경, 에코 보너스 삭제
scorer.ts        — 성향 점수 (변경 없음)
```

성향(mdTI)과 품질(md력)이 완전 분리. 각각 독립적으로 발전 가능.

### 파이프라인 변경

```
analyze(md) →
  calculateScores(md)                    ← 성향 (변경 없음)
  extractMdStats(md)                     ← 통계 (변경 없음)
  classifyPersona(scores, mdStats)       ← 페르소나 (변경 없음)
  calculateQualityScores(md, mdStats)    ← ★ 신규
  generatePrescriptions(persona, mdStats, qualityScores)  ← qualityScores 추가
  calculateMdPower(qualityScores, mdStats)  ← scores → qualityScores
```

---

## 데이터 모델

### QualityScores 타입 (`types.ts`)

```typescript
export interface QualityScores {
  actionability: number;    // 실행 가능성 (0~100)
  conciseness: number;      // 간결성 (0~100)
  structure: number;        // 구조화 (0~100)
  uniqueness: number;       // 맥락 독점성 (0~100)
  safety: number;           // 방어력 (0~100)
}
```

### AnalysisResult 변경 (`types.ts`)

```typescript
// AnalysisResult — analyze() 반환용. 새 결과는 절대 레거시가 아니므로 플래그 없음.
export interface AnalysisResult {
  // ... 기존 필드 유지 ...
  qualityScores: QualityScores;     // ★ 추가: 품질 점수
}

// SavedResult — getResult() 반환용. DB 조회 시 레거시 판정 플래그 포함.
export interface SavedResult extends AnalysisResult {
  id: string;
  createdAt: string;
  isLegacyResult: boolean;          // ★ 추가: DB에 quality_scores가 null이면 true
}
```

- `qualityScores`: 새 결과는 실제 계산값, 기존 결과는 fallback `{ 0, 0, 0, 0, 0 }`
- `isLegacyResult`: `store.ts`의 `getResult()`에서 `data.quality_scores === null`로 판정. `analyze()`에는 이 필드가 없으므로 `saveResult()`도 건드릴 필요 없음

### DB 마이그레이션 (`supabase/migrations/005_quality_scores.sql`)

```sql
ALTER TABLE results ADD COLUMN IF NOT EXISTS quality_scores jsonb;
```

### 리더보드 초기화 (`scripts/reset-leaderboard.sql` — 배포 후 수동 1회)

```sql
-- md력 점수 산정 기준 변경으로 인한 리더보드 1회 초기화
-- 사용자 프로필은 유지, 점수만 리셋. 재분석 시 새 품질 기반 점수로 갱신.
UPDATE leaderboard_scores SET md_power = 0, tier = 'egg', prev_power = 0;
```

마이그레이션과 분리하는 이유: 마이그레이션은 자동 실행되므로 일회성 운영 작업이 재실행될 위험.

---

## 품질 측정 엔진 (`lib/analyzer/quality.ts`)

### 차원 1: Actionability (실행 가능성) — 0~100

| 항목 | 감지 방법 | 배점 |
|------|-----------|------|
| 백틱 커맨드 | `` `npm run test` `` 같은 인라인/코드블록 명령어 (중복 제거) | 5개+ → 40, 3개+ → 30, 1개+ → 15 |
| 아키텍처 경로 | `/src/services/` → 비즈니스 로직` 같은 경로+역할 | 3개+ → 25, 1개+ → 10 |
| 검증 루프 | "반드시 test 실행 후 commit", "before push" 패턴 | 있으면 +20 |
| 환경 설정 | .env 설명 + 서비스 의존성 | 둘 다 → 15, 하나 → 7 |

### 차원 2: Conciseness (간결성) — 0~100

| 항목 | 로직 | 배점 |
|------|------|------|
| 길이 (역U자 커브) | ≤5줄 → 10, ≤15줄 → 30, **15~50줄 → 50** (스위트 스팟), ≤80줄 → 45, ≤150줄 → 30, ≤250줄 → 15, 251줄+ → 5 | 최대 50 |
| 노이즈 감점 | clean code, DRY/SOLID/KISS, 주석을 달아, indent/spacing, 깔끔하게, 정중하게, 친절하게, 자세하게, 상세하게 | 패턴당 -5, 최대 -30 |
| 밀도 보너스 | actionabilityScore / 줄 수 × 30 | 최대 20 |
| 분리 보너스 | @import, .claude/rules/, CLAUDE.local.md 사용 | 각 +10, 최대 30 |

> **참고**: 6~15줄짜리가 내용 없이 길이 점수 30점을 받을 수 있으나, 다른 4개 차원이 0이면 총 md력이 60점(Egg)이라 티어에 영향 없음. 데이터 쌓인 후 밀도 보너스 비중 상향 검토 가능.

### 차원 3: Structure (구조화) — 0~100

| 항목 | 로직 | 배점 |
|------|------|------|
| 섹션 헤딩 | 6개+ → 30, 3개+ → 25, 1개+ → 10. 표준 섹션명 보너스 +5 | 최대 35 |
| 리스트 구조 | 리스트 비율 20~60% → 25, 10~80% → 15, 그 외 → 5 | 최대 25 |
| 우선순위 마킹 | IMPORTANT/MUST 비율 ≤5% → 20, ≤10% → 10, 남발 → 5 | 최대 20 |
| 계층 구조 | H1+H2+H3 모두 → 20, H1+H2 또는 H2×3 → 10 | 최대 20 |

### 차원 4: Uniqueness (맥락 독점성) — 0~100

| 항목 | 로직 | 배점 |
|------|------|------|
| 구체적 금지 | "NEVER modify /src/legacy/" 같은 파일/모듈 지정 | 3개+ → 30, 1개+ → 15 |
| 워크플로우 규칙 | 브랜치 전략, PR 리뷰 절차, 배포 프로세스 | 있으면 25 |
| 환경 제약 | "캐싱용만", "직접 접근 금지", "대신 사용" | 3개+ → 25, 1개+ → 15 |
| 도구 맥락 | "Slack → 팀 소통" 같은 용도 설명 (이름만 나열 ≠ 맥락) | 3개+ → 20, 1개+ → 10 |

### 차원 간 의도적 중복: 검증 루프

Actionability의 "검증 루프"(+20)와 Safety의 "검증 의무화"(+25)는 비슷한 패턴을 감지한다.
예: "변경 후 반드시 typecheck 실행" → Actionability +20 + Safety +25 = 45점.

**이것은 의도적이다.** 검증 루프는 실행 가능성(Claude가 실행할 구체적 명령)과 방어력(실수 방지 가드레일) 두 관점에서 모두 가치가 있다. 각 차원 만점의 20~25%이므로 점수 밸런스 상 과도하지 않다.

### 차원 5: Safety (방어력) — 0~100

| 항목 | 로직 | 배점 |
|------|------|------|
| 구체적 금지 규칙 | "절대/NEVER" + 대상 | 6개+ → 35, 3개+ → 25, 1개+ → 15 |
| 민감 정보 보호 | .env/API key + 금지 동사 조합 | 조합 → 25, 키워드만 → 10 |
| 검증 의무화 | "반드시 test/lint 실행", "before commit" | 있으면 25 |
| 확장 데이터 보너스 | denyCount, blocksDangerousOps, hookPromptCount | 최대 15 (isExpandedInput일 때만) |

### 통합 함수

```typescript
export function calculateQualityScores(md: string, stats: MdStats): QualityScores
```

빈 텍스트 → `{ actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0 }`.

---

## power.ts 변경

### 시그니처

```typescript
// 현행
export function calculateMdPower(scores: DimensionScores, stats: MdStats): MdPower

// 변경
export function calculateMdPower(quality: QualityScores, stats: MdStats): MdPower
```

### 점수 산출

```typescript
const baseScore = Object.values(quality).reduce((a, b) => a + b, 0); // 0~500
const score = Math.min(1000, Math.max(0, baseScore * 2));
```

### 삭제

- `ecosystemBonus()` 함수
- `depthBonus()` 함수
- `DimensionScores` import

### 유지

- `TIERS` 배열 (경계값 동일)
- `getAllTiers()` 함수

---

## store.ts 하위호환

### saveResult

`quality_scores: result.qualityScores` 필드 추가.

### getResult

```typescript
// quality_scores가 null(기존 결과) → 기본값 fallback
const qualityScores = data.quality_scores ?? {
  actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0,
};

// calculateMdPower 호출 변경
mdPower: calculateMdPower(qualityScores, mdStats),
```

---

## 기존 결과 페이지 — 레거시 결과 재분석 유도

### 판정 기준

`store.ts`의 `getResult()`에서 DB의 `quality_scores` 컬럼이 null인지 확인하여 `isLegacyResult: boolean` 플래그를 설정한다. 프론트엔드는 이 플래그만 참조.

```typescript
// store.ts — getResult() 내부
const isLegacyResult = data.quality_scores === null || data.quality_scores === undefined;
const qualityScores = data.quality_scores ?? {
  actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0,
};
// → AnalysisResult에 isLegacyResult, qualityScores 모두 포함
```

`every(v === 0)`으로 판정하지 않는 이유: 빈 CLAUDE.md를 넣으면 진짜 0점인데, 이건 레거시가 아니라 "진짜 0점"이다.

### 분기

- `isLegacyResult === true`: md력 점수 대신 안내 메시지
  - "md력 점수 산정 기준이 개선되었습니다. 다시 분석해서 새 점수를 확인하세요 →"
  - "다시 분석하기" 버튼 → 메인 페이지
- `isLegacyResult === false`: 정상 md력 점수 + 티어 표시

### 바이럴 효과

기존 공유 링크 → "재분석" 클릭 → 새 결과 → 새 링크 공유. 재방문 루프 1회 추가.

---

## prescriptions.ts 확장

### 시그니처

```typescript
export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores?: QualityScores  // optional — 하위호환
): PrescriptionItem[]
```

### qualityChecks 함수

약한 차원(30점 미만)에 대한 구체적 개선 조언:

- actionability < 30: "빌드/테스트 명령어를 백틱으로 감싸서 추가하세요"
- conciseness < 30 && totalLines > 150: "~150개 지시가 한계, @import로 분리하세요"
- conciseness < 40 && totalLines ≤ 150: "'clean code' 같은 뻔한 지시 삭제하세요"
- structure < 30: "## Commands, ## Architecture 같은 헤딩으로 구조화하세요"
- uniqueness < 30: "코드만 봐서는 모르는 프로젝트 고유 정보를 추가하세요"
- safety < 20: "'.env 커밋 절대 금지' 같은 가드레일을 추가하세요"

---

## 이 스펙에서 제외

| 항목 | 이유 | 다음 스펙 |
|------|------|-----------|
| 레이더 차트 (5각형) | 현재 컴포넌트 없음 → 신규 생성 필요 | 프론트엔드 시각화 스펙 |
| 생태계 점수 | md력과 별개 지표 | 생태계 점수 스펙 |
| 리더보드 UI 변경 | 백엔드 우선 배포 | 프론트엔드 스펙 |

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `lib/types.ts` | QualityScores 추가, AnalysisResult에 qualityScores, SavedResult에 isLegacyResult |
| `lib/analyzer/quality.ts` | ★ 신규: 5개 차원 + calculateQualityScores |
| `lib/analyzer/power.ts` | 시그니처 변경, ecosystemBonus/depthBonus 삭제 |
| `lib/analyzer/index.ts` | 파이프라인에 quality 추가, power 호출 변경 |
| `lib/content/prescriptions.ts` | qualityChecks 추가, 시그니처 확장 |
| `lib/store.ts` | quality_scores 저장/조회, fallback |
| `app/r/[id]/page.tsx` | isLegacyResult 분기, 재분석 유도 |
| `supabase/migrations/005_quality_scores.sql` | quality_scores 컬럼 |
| `scripts/reset-leaderboard.sql` | ★ 신규: 리더보드 1회 초기화 |
| `__tests__/analyzer/quality.test.ts` | ★ 신규 |
| `__tests__/analyzer/power.test.ts` | 새 시그니처 |
| `__tests__/analyzer/integration.test.ts` | qualityScores 필드 확인 |

## 구현 순서

1. `types.ts` — QualityScores + AnalysisResult + SavedResult(isLegacyResult) 변경
2. `quality.ts` — 5개 차원 함수 + calculateQualityScores
3. `power.ts` — 시그니처 변경, 보너스 삭제
4. `index.ts` — 파이프라인 업데이트
5. `prescriptions.ts` — qualityChecks + 시그니처 확장
6. `store.ts` + `app/r/[id]/page.tsx` — 한 커밋으로 묶음 (저장/조회 + fallback + isLegacyResult 분기)
7. `005_quality_scores.sql` 생성 (마이그레이션만, 리더보드 초기화는 별도)
8. 테스트: quality.test.ts 신규 + power.test.ts 업데이트 + integration 업데이트
9. 검증 스크립트 확장 (품질 점수 분포 출력)
10. 전체 테스트 실행 + 배포
11. **배포 후 수동 1회**: `scripts/reset-leaderboard.sql` 실행 (리더보드 초기화)

## 검증 방법

1. `npm run test:run` — 전체 테스트 통과
2. `npx tsx scripts/validate-thresholds.ts` — 품질 점수 분포 확인
3. 로컬 `npm run dev` → 실제 CLAUDE.md 입력 → md력이 품질 기반으로 나오는지 확인
4. 기존 결과 `/r/[id]` → "재분석하세요" 안내 표시 확인
5. 빈 md → md력 0점(Egg) 확인
