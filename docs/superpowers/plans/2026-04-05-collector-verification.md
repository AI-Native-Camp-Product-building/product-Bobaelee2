# 수집기 스크립트 전면 검증 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 12개 페르소나별 병렬 에이전트로 수집기의 수집 범위 + 패턴 정확도를 검증하고, 발견된 문제를 즉시 수정한다.

**Architecture:** Phase 1에서 12개 병렬 에이전트가 각 페르소나 관점으로 수집기를 감사하여 리포트를 산출한다. Phase 2에서 리포트를 종합하고 심각도별로 우선순위화하여 patterns.ts / scorer.ts / MdInput.tsx를 수정한다. Phase 3에서 기존 테스트 + 새 테스트로 검증한다.

**Tech Stack:** TypeScript, Vitest, 정규식 (RegExp)

---

## Phase 1: 12개 페르소나별 병렬 감사

### Task 1: 12개 병렬 에이전트 실행

각 에이전트는 동일한 구조의 프롬프트를 받되, 담당 페르소나와 핵심 분류 조건이 다르다.

**에이전트 공통 읽기 파일:**
- `components/MdInput.tsx` 18~70줄 (Mac/Windows 수집 스크립트)
- `lib/analyzer/patterns.ts` (6차원 패턴 + 확장 신호 추출)
- `lib/analyzer/classifier.ts` (분류 조건 + 임계값)
- `lib/analyzer/scorer.ts` (점수 계산 + 확장 보정)
- `lib/types.ts` (타입 정의)

**에이전트 공통 프롬프트 템플릿:**

```
당신은 mdti 수집기 검증 전문가입니다. "{페르소나명}" 페르소나 관점에서 수집기를 감사하세요.

## 담당 페르소나
- 이름: {페르소나명}
- 핵심 분류 조건: {조건}
- 관련 차원: {차원명}

## 수행 사항

1. **전형적 사용자 프로필 정의**: 이 페르소나로 분류될 전형적인 Claude Code 사용자를 구체적으로 상상하세요.
   - 어떤 역할/직군인가
   - CLAUDE.md에 어떤 내용을 작성할 것인가 (구체적 예시 3~5줄)
   - settings.json에 어떤 설정이 있을 것인가
   - mcp_settings.json에 어떤 MCP 서버가 있을 것인가
   - commands/에 어떤 커스텀 명령어가 있을 것인가
   - 프로젝트별 CLAUDE.md/AGENTS.md에 뭐가 있을 것인가

2. **수집 범위 검증**: 현재 수집 스크립트(MAC_CMD/WIN_CMD)가 해당 사용자의 신호를 제대로 수집하는지 확인하세요.
   - 수집 대상 파일 목록 vs 해당 사용자가 갖고 있을 파일
   - 수집 안 되는 중요 파일/경로가 있는지
   - 마스킹 규칙이 분석에 필요한 신호까지 지우는지

3. **패턴 정확도 검증**: 해당 페르소나의 핵심 차원 패턴이 전형적 사용자의 텍스트를 잡아내는지 확인하세요.
   - 패턴이 못 잡는 표현/키워드 식별
   - 다른 차원으로 오분류될 수 있는 키워드 식별
   - 분류 임계값이 적절한지 판단

4. **산출물**: 아래 포맷으로 보고하세요.

## 산출물 포맷

```
페르소나: {이름}
전형적 사용자: (1~2줄 프로필)

### 수집 누락 (수집 스크립트가 아예 안 긁는 데이터)
- (항목별 나열, 없으면 "없음")

### 패턴 누락 (수집은 되지만 정규식이 못 잡는 신호)
- (구체적 키워드/표현 + 어떤 차원에 추가해야 하는지)

### 오탐 위험 (엉뚱한 매칭 가능성)
- (구체적 시나리오)

### 개선 제안
- (구체적인 패턴 추가/수정/삭제안, 정규식 포함)

### 심각도: [high / medium / low]
(high = 이 페르소나 분류 자체가 불가능한 수준의 누락)
(medium = 분류는 되지만 정확도가 떨어지는 누락)
(low = 있으면 좋지만 없어도 분류에 큰 영향 없음)
```
```

**12개 에이전트 매핑:**

| # | 페르소나 | 핵심 조건 | 관련 차원 |
|---|---------|----------|----------|
| 1 | minimalist | totalLines ≤ 10 && avg < 20, 또는 max < 25 | 전체 (낮은 점수) |
| 2 | puppet-master | automation ≥ 70 && toolDiversity ≥ 70 | automation, toolDiversity |
| 3 | daredevil | automation ≥ 50 && security < 20 | automation (높), security (낮) |
| 4 | fortress | security ≥ 70 | security |
| 5 | legislator | control ≥ 75 | control |
| 6 | evangelist | teamImpact ≥ 55 | teamImpact |
| 7 | collector | toolDiversity ≥ 70 && automation < 40 | toolDiversity |
| 8 | speedrunner | totalLines ≤ 30 && control < 25 && contextAwareness < 30 && max < 70 | 전체 (중간 이하) |
| 9 | craftsman | stdDev < 20 && avg ≥ 30 | 전체 (균형) |
| 10 | deep-diver | 1위 ≥ 70 && dominanceRatio ≥ 2.0 | 지배 차원 1개 |
| 11 | architect | 확장입력 && eco ≥ 25 && hooks ≥ 5 | B경로 에코시스템 |
| 12 | huggies | 확장입력 && eco ≥ 10 && hooks ≥ 2 | B경로 에코시스템 |

- [ ] **Step 1: 12개 에이전트를 동시에 병렬 실행한다**

Agent 도구로 12개를 한 번에 호출. 각 에이전트는 위 5개 파일을 읽고 분석한 뒤 산출물 포맷으로 보고.

- [ ] **Step 2: 12개 에이전트 결과를 수집하고 종합 리포트를 작성한다**

모든 에이전트 결과를 모아서:
1. 심각도별 분류 (high → medium → low)
2. 여러 에이전트가 공통으로 지적한 항목 식별
3. 개선 항목을 "수집 스크립트 수정" / "패턴 추가/수정" / "분류 로직 수정"으로 분류

---

## Phase 2: 개선 구현

### Task 2: 패턴 누락 수정 (patterns.ts)

Phase 1에서 발견된 패턴 누락을 수정한다.

**Files:**
- Modify: `lib/analyzer/patterns.ts` — DIMENSION_PATTERNS에 누락 패턴 추가
- Test: `__tests__/analyzer/patterns.test.ts`

- [ ] **Step 1: Phase 1 리포트에서 "패턴 누락" 항목 중 high/medium을 추출한다**

각 항목의 구체적 정규식을 확인하고, 기존 패턴과 중복/충돌 여부를 점검한다.

- [ ] **Step 2: 누락 패턴에 대한 테스트를 먼저 작성한다**

```typescript
// __tests__/analyzer/patterns.test.ts에 추가
describe("Phase 1 검증에서 발견된 누락 패턴", () => {
  it("각 누락 키워드가 해당 차원에서 매칭되어야 한다", () => {
    // Phase 1 리포트의 구체적 키워드로 테스트 작성
    // 예: expect(countUniqueSignals("workflow", DIMENSION_PATTERNS.automation)).toBe(1);
  });
});
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/patterns.test.ts`
Expected: 새로 추가한 테스트가 FAIL

- [ ] **Step 4: DIMENSION_PATTERNS에 누락 패턴을 추가한다**

Phase 1 리포트의 개선 제안에 따라 정규식을 추가한다. 각 패턴은:
- 기존 패턴과 중복되지 않을 것
- 오탐 범위가 좁을 것 (가능한 한 specific하게)
- 한국어/영어 모두 고려

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/patterns.test.ts`
Expected: ALL PASS

- [ ] **Step 6: 커밋**

```bash
cd /Users/vivi/mdti
git add lib/analyzer/patterns.ts __tests__/analyzer/patterns.test.ts
git commit -m "패턴 누락 수정: Phase 1 검증 결과 반영"
```

### Task 3: 수집 스크립트 개선 (MdInput.tsx)

Phase 1에서 발견된 수집 범위 누락을 수정한다.

**Files:**
- Modify: `components/MdInput.tsx` — MAC_CMD / WIN_CMD 수집 대상 확장
- Test: `__tests__/analyzer/expanded-input.test.ts`

- [ ] **Step 1: Phase 1 리포트에서 "수집 누락" 항목 중 high/medium을 추출한다**

수집 대상에 추가할 파일/경로를 확인한다.

- [ ] **Step 2: 수집 스크립트 수정이 필요한 경우, 확장 입력 파서 테스트를 먼저 작성한다**

새로운 구분자나 섹션이 추가되면 `isExpandedInput()` 및 관련 파서에 테스트를 추가한다.

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/expanded-input.test.ts`
Expected: 새 테스트 FAIL

- [ ] **Step 4: MAC_CMD / WIN_CMD 수정 + 필요시 파서 함수 수정**

수집 대상 파일을 추가하고, 해당 섹션의 파서를 patterns.ts에 추가한다.

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/expanded-input.test.ts`
Expected: ALL PASS

- [ ] **Step 6: 커밋**

```bash
cd /Users/vivi/mdti
git add components/MdInput.tsx lib/analyzer/patterns.ts __tests__/analyzer/expanded-input.test.ts
git commit -m "수집 스크립트 개선: Phase 1 검증 결과 반영"
```

### Task 4: 오탐 수정 + 분류 로직 조정

Phase 1에서 발견된 오탐 위험과 분류 임계값 문제를 수정한다.

**Files:**
- Modify: `lib/analyzer/patterns.ts` — 오탐 패턴 수정
- Modify: `lib/analyzer/classifier.ts` — 임계값 조정 (필요시)
- Modify: `lib/analyzer/scorer.ts` — 보정 로직 조정 (필요시)
- Test: `__tests__/analyzer/classifier.test.ts`
- Test: `__tests__/analyzer/scorer.test.ts`

- [ ] **Step 1: Phase 1 리포트에서 "오탐 위험" 항목을 추출한다**

오탐 시나리오를 테스트 케이스로 변환할 수 있는지 확인한다.

- [ ] **Step 2: 오탐 시나리오에 대한 테스트를 작성한다**

```typescript
// 예: "auth"가 security와 toolDiversity 양쪽에서 잡히는 오탐
it("특정 키워드가 의도하지 않은 차원에서 매칭되지 않아야 한다", () => {
  // Phase 1 리포트의 구체적 시나리오로 테스트 작성
});
```

- [ ] **Step 3: 테스트 실행하여 실패 확인 (오탐이 발생하는 것을 확인)**

Run: `cd /Users/vivi/mdti && npx vitest run __tests__/analyzer/classifier.test.ts`

- [ ] **Step 4: 패턴 수정 / 분류 로직 조정**

- 오탐 패턴: 정규식을 더 specific하게 수정
- 임계값: classifier.ts의 조건 수치 조정 (필요시)
- 보정: scorer.ts의 보너스 점수 조정 (필요시)

- [ ] **Step 5: 전체 테스트 실행**

Run: `cd /Users/vivi/mdti && npx vitest run`
Expected: ALL PASS (기존 테스트 포함)

- [ ] **Step 6: 커밋**

```bash
cd /Users/vivi/mdti
git add lib/analyzer/patterns.ts lib/analyzer/classifier.ts lib/analyzer/scorer.ts __tests__/
git commit -m "오탐 수정 + 분류 로직 조정: Phase 1 검증 결과 반영"
```

---

## Phase 3: 최종 검증

### Task 5: 전체 통합 테스트 + 임계값 검증

**Files:**
- Run: `__tests__/analyzer/integration.test.ts`
- Run: `scripts/validate-thresholds.ts`

- [ ] **Step 1: 전체 테스트 스위트 실행**

Run: `cd /Users/vivi/mdti && npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: 임계값 검증 스크립트 실행 (샘플이 있는 경우)**

Run: `cd /Users/vivi/mdti && npx tsx scripts/validate-thresholds.ts`
점수 분포와 페르소나 쏠림이 적절한지 확인한다.

- [ ] **Step 3: 최종 커밋**

```bash
cd /Users/vivi/mdti
git add -A
git commit -m "수집기 전면 검증 완료: 패턴/수집/분류 개선"
```
