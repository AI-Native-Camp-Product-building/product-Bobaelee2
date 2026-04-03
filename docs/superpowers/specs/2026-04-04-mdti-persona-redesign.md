# mdTI 페르소나 재설계 스펙

## Context

현재 mdTI 13개 페르소나 시스템에 분류 정확도와 콘텐츠 차별화 문제가 있다.

**문제 요약:**
1. macgyver 오분류 — 조건(automation≥65, toolDiversity<30)이 비현실적, 이미 코드에서 제거
2. deep-diver 과다 트리거 — max≥80 && sd≥30 조건이 "한 차원만 높은 사람"을 전부 포착 → 6개 페르소나의 부 페르소나를 독식
3. collaboration 차원 개발자 편향 — PR/코드리뷰/브랜치 8개 키워드로만 측정, 비개발자(HR Lead, PM) 협업 감지 불가
4. 처방전 70% 중복 — 13개 중 11개에 동일 처방전 반복 (컨텍스트 관리, 빌드 명령어, 가드레일)
5. daredevil/macgyver 로스팅 동일 — "보험 없이 스카이다이빙" 비유 중복

**설계 프로세스:** 3라운드 에이전트 토론 (데이터 분석가 × 분류 설계자 × 바이럴 전략가)
- Round 1: 독립 제안 (3명 병렬)
- Round 2: 교차 반박 (각자 다른 2명의 제안을 검증)
- Round 3: 합의 도출

**범위:** 분류 로직 + 콘텐츠(로스팅/처방전) 재설계. B2B baseline 분리는 별도 스펙.

**콘텐츠 톤:** 현재 톤("찔리지만 공감되는" 로스팅, 구어체 처방전) 그대로 유지. 바뀌는 건 배관(분류 로직, 처방전 구조)이지, 사용자가 보는 톤과 세계관은 불변.

---

## 핵심 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| 페르소나 수 | 13 → **12** (macgyver 완전 제거) | 분류 로직에서 도달 불가능한 유령 노드. Git history에서 복구 가능 |
| deep-diver 조건 | stdDev → **dominanceRatio ≥ 2.0** | 자기 충족적 조건, 다른 페르소나 변경에 비의존 |
| collaboration 리네임 | → **teamImpact** (내부) | 비개발 협업 신호 포괄. 사용자 대면 이름("협업")은 유지 |
| evangelist 이름 | "협업 전도사" **유지** | "팀 빌더"보다 밈 가능성 높음. "기술 에반젤리스트" 이미 보편적 용어 |
| 처방전 구조 | 정적 목록 → **ConditionalPrescription + 5개 고정** | tag 기반 중복 제거로 70% → 0% 목표 |
| 비개발자 처리 | 분류 로직 불변 + **콘텐츠 톤 변환** | 역할 감지를 분류에 넣으면 차원 혼합 + 오분류 리스크 |
| macgyver 이스터에그 | **없음** | 도달 불가능한 콘텐츠 = 테스트 사각지대 + 유지보수 부채 |
| minimalist/speedrunner | **분리 유지** | 심리적 동기가 다름 (게으름의 미학 vs 실행력 도파민) |

---

## 최종 페르소나 목록 (12개)

| # | Key | 한글명 | 분류 조건 | 변경사항 |
|---|-----|--------|-----------|----------|
| 1 | `minimalist` | CLAUDE.md 3줄러 | totalLines ≤ 10 && avg < 20, 또는 max < 25 | 유지 |
| 2 | `speedrunner` | 손이 빠른 무법자 | totalLines ≤ 30 && control < 25 && ctx < 30 && **max < 70** | max<70 가드 추가 |
| 3 | `puppet-master` | 봇 농장주 | automation ≥ 70 && toolDiversity ≥ 70 | 유지 |
| 4 | `fortress` | 보안 편집증 환자 | security ≥ 70 | 유지 |
| 5 | `legislator` | 규칙 제왕 | control ≥ 75 | 유지 |
| 6 | `evangelist` | 협업 전도사 | **teamImpact ≥ 55** | 차원 재정의 (패턴 변경) |
| 7 | `collector` | 플러그인 수집가 | toolDiversity ≥ 70 && automation < 40 | 유지 |
| 8 | `daredevil` | 위험물 취급자 | automation ≥ 50 && security < 20 (gap 기반) | 유지 |
| 9 | `craftsman` | 조용한 장인 | sd < 20 && avg ≥ 30 | **다른 후보 존재 시 fit × 0.5** |
| 10 | `deep-diver` | 과몰입러 | **dominanceRatio ≥ 2.0** | 조건 전면 교체 |
| 11 | `architect` | 로데오 마스터 | expanded && eco ≥ 25 && hooks ≥ 5 | 유지 |
| 12 | `huggies` | 하기스 아키텍트 | expanded && eco ≥ 10 && hooks ≥ 2 | 유지 |
| ~~13~~ | ~~`macgyver`~~ | ~~맥가이버~~ | ~~제거~~ | **코드+콘텐츠+타입 모두 삭제** |

---

## 차원 변경: collaboration → teamImpact

### 변경 전

```typescript
collaboration: [
  /팀|team/gi,
  /코드\s*리뷰|code\s*review/gi,
  /PR|pull\s*request/gi,
  /컨벤션|convention/gi,
  /린트|lint|eslint|prettier/gi,
  /브랜치|branch/gi,
  /merge|머지/gi,
  /동료|peer/gi,
]
```

8개 패턴, threshold = ceil(8 × 0.7) = 6, 전부 개발자 키워드.

### 변경 후

```typescript
teamImpact: [
  // 기존 유지 (개발 협업)
  /팀|team/gi,
  /코드\s*리뷰|code\s*review/gi,
  /PR|pull\s*request/gi,
  /컨벤션|convention/gi,
  /린트|lint|eslint|prettier/gi,
  /브랜치|branch/gi,
  /merge|머지/gi,
  /동료|peer/gi,
  // 신규 추가 (비개발 협업)
  /온보딩|onboard|신규\s*입사/gi,
  /공유|share|전파/gi,
]
```

10개 패턴, THRESHOLD_RATIO: **0.6** (기존 0.7에서 하향) → threshold = ceil(10 × 0.6) = 6.

threshold를 0.6으로 하향하는 이유: 패턴이 8→10으로 늘어나면 0.7 기준 threshold가 6→7로 올라가, 기존에 collaboration 100점이던 사용자의 점수가 역전될 수 있음. 0.6이면 threshold = 6으로 유지되어 기존 점수 호환성 보장.

### DimensionScores 타입 변경

```typescript
// 변경 전
export interface DimensionScores {
  automation: number;
  control: number;
  toolDiversity: number;
  contextAwareness: number;
  collaboration: number;  // 삭제
  security: number;
}

// 변경 후
export interface DimensionScores {
  automation: number;
  control: number;
  toolDiversity: number;
  contextAwareness: number;
  teamImpact: number;     // 추가
  security: number;
}
```

### DB 하위호환

`results` 테이블의 `scores` jsonb 컬럼에 기존 `collaboration` 키가 저장되어 있음.
- `getResult()`에서 `scores.collaboration`을 `scores.teamImpact`로 매핑하는 fallback 추가
- 새 결과는 `teamImpact` 키로 저장
- 기존 결과는 `isLegacyResult` 플래그와 무관 (레거시 판정은 quality_scores null 여부)

```typescript
// store.ts — getResult() 내부
const rawScores = data.scores;
const scores: DimensionScores = {
  ...rawScores,
  teamImpact: rawScores.teamImpact ?? rawScores.collaboration ?? 0,
};
```

---

## 분류 알고리즘 변경 (`classifier.ts`)

### deep-diver 조건 전면 교체

```typescript
// 변경 전
if (max >= 80 && sd >= 30) {
  const fit = (max - 80) / 20 * 50 + Math.min(50, (sd - 30) / 30 * 50);
  candidates.push({ persona: "deep-diver", fit });
}

// 변경 후
const sortedValues = Object.values(scores).sort((a, b) => b - a);
const first = sortedValues[0];
const second = sortedValues[1];
const dominanceRatio = second > 0 ? first / second : Infinity;

if (first >= 70 && dominanceRatio >= 2.0) {
  const fit = Math.min(100, (dominanceRatio - 2.0) / 3.0 * 50 + (first - 70) / 30 * 50);
  candidates.push({ persona: "deep-diver", fit });
}
```

**변경 의미:**
- `max≥80 && sd≥30` → `first≥70 && dominanceRatio≥2.0`
- "1위 차원이 2위 차원의 2배 이상" = "한 영역에 극단적으로 몰입"
- first 임계값을 70으로 낮춘 이유: dominanceRatio 조건이 이미 충분히 강력한 필터

**엣지 케이스:** second = 0이면 dominanceRatio = Infinity → 조건 충족. 이는 의도적임 (나머지 전부 0점이면 극단적 과몰입).

### deep-diver 부 페르소나 억제 가드

```typescript
// 부 페르소나 할당 시
const DIMENSION_PERSONA_MAP: Partial<Record<keyof DimensionScores, PersonaKey[]>> = {
  security: ["fortress"],
  control: ["legislator"],
  automation: ["puppet-master", "daredevil"],
  toolDiversity: ["collector", "puppet-master"],
  teamImpact: ["evangelist"],
  contextAwareness: [],  // deep-diver 자체가 이 차원의 전용
};

// 부 페르소나 후보에서 deep-diver 필터링
if (secondaryCandidate.persona === "deep-diver") {
  const dominant = dominantDimension(scores);
  const specificPersonas = DIMENSION_PERSONA_MAP[dominant] ?? [];
  if (specificPersonas.includes(primary)) {
    // 주 페르소나가 해당 차원의 전용 페르소나이면 deep-diver 부 페르소나 억제
    continue; // 다음 후보로
  }
}
```

**효과:** fortress(security=90) → 부 페르소나에 deep-diver가 안 붙음. 하지만 evangelist(teamImpact=60) + 높은 contextAwareness → deep-diver가 부 페르소나로 정상 부여.

### speedrunner 가드 추가

```typescript
// 변경 전
if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30) {
  candidates.push({ persona: "speedrunner", fit: 50 });
}

// 변경 후
if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30 && max < 70) {
  candidates.push({ persona: "speedrunner", fit: 50 });
}
```

**효과:** 20줄 + security=80 → speedrunner가 아닌 fortress로 분류.

### craftsman fit 패널티

```typescript
if (sd < 20 && avg >= 30) {
  let fit = Math.max(0, (avg - 30) / 70 * 100);
  if (candidates.length > 0) fit *= 0.5;  // 다른 후보가 있으면 절반
  candidates.push({ persona: "craftsman", fit });
}
```

### 부 페르소나 절대 하한

```typescript
// 변경 전
if (candidates[1].fit >= candidates[0].fit * 0.6) {
  secondary = candidates[1].persona;
}

// 변경 후
if (candidates[1].fit >= candidates[0].fit * 0.6 && candidates[1].fit >= 25) {
  secondary = candidates[1].persona;
}
```

### 부 페르소나 차원 중복 방지

```typescript
const PERSONA_PRIMARY_DIMENSION: Partial<Record<PersonaKey, keyof DimensionScores>> = {
  "puppet-master": "automation",
  fortress: "security",
  legislator: "control",
  evangelist: "teamImpact",
  collector: "toolDiversity",
  "deep-diver": "contextAwareness",
  daredevil: "automation",
};

// 부 페르소나 선택 시
const primaryDim = PERSONA_PRIMARY_DIMENSION[primary];
const secondaryDim = PERSONA_PRIMARY_DIMENSION[candidates[i].persona];
if (primaryDim && secondaryDim && primaryDim === secondaryDim) {
  continue; // 같은 차원 대표 페르소나끼리 조합 방지
}
```

**효과:** puppet-master + daredevil (둘 다 automation) 조합 방지. 대신 puppet-master + fortress 같은 의미 있는 조합만 허용.

### macgyver 분기 삭제

classifier.ts에서 macgyver 관련 코드 완전 삭제 (이미 주석 처리된 상태).

---

## 처방전 아키텍처 (`prescriptions.ts`)

### 현재 문제

```
현재: universalChecks(6개) + qualityChecks(5개) + PERSONA_PRESCRIPTIONS(3개)
결과: 5~14개, 페르소나 간 70% 중복
```

### 새 구조: ConditionalPrescription

```typescript
interface ConditionalPrescription {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  tag: string;           // 중복 제거용 (같은 tag = 같은 맥락)
  tier: "signature" | "dimensional" | "common";
  condition: (
    persona: PersonaKey,
    stats: MdStats,
    quality: QualityScores,
    scores: DimensionScores
  ) => boolean;
}
```

### 선택 알고리즘 (5개 고정)

```typescript
function selectPrescriptions(
  persona: PersonaKey,
  stats: MdStats,
  quality: QualityScores,
  scores: DimensionScores
): PrescriptionItem[] {
  // 1. 모든 처방전 중 condition 통과한 것만 필터
  const eligible = ALL_PRESCRIPTIONS.filter(p =>
    p.condition(persona, stats, quality, scores)
  );

  // 2. tier별 분리
  const signatures = eligible.filter(p => p.tier === "signature");
  const dimensionals = eligible.filter(p => p.tier === "dimensional");
  const commons = eligible.filter(p => p.tier === "common");

  // 3. tag 중복 제거하며 5개 선택
  const selected: ConditionalPrescription[] = [];
  const usedTags = new Set<string>();

  // [1] 시그니처 1개 (해당 페르소나 전용)
  const sig = signatures.find(p => !usedTags.has(p.tag));
  if (sig) { selected.push(sig); usedTags.add(sig.tag); }

  // [2~4] 차원별 3개 (priority 순, tag 중복 제거)
  for (const p of dimensionals.sort(byPriority)) {
    if (selected.length >= 4) break;
    if (usedTags.has(p.tag)) continue;
    selected.push(p); usedTags.add(p.tag);
  }

  // [5] 공통 1개
  const common = commons.find(p => !usedTags.has(p.tag));
  if (common) { selected.push(common); usedTags.add(common.tag); }

  // 5개 미달 시 dimensional에서 추가 충원
  for (const p of dimensionals) {
    if (selected.length >= 5) break;
    if (usedTags.has(p.tag)) continue;
    selected.push(p); usedTags.add(p.tag);
  }

  return selected.map(toOutputFormat);
}
```

### 처방전 예시 — persona × quality 교차

```typescript
// signature tier — fortress 전용
{
  id: "sig-fortress-wall",
  text: "보안 규칙이 {ruleCount}개인데, 실제로 Claude가 위반하면 어떻게 되는지 검증해본 적 있나요? 훈련 없는 방어는 종이벽입니다.",
  priority: "high",
  tag: "sig:fortress",
  tier: "signature",
  condition: (persona) => persona === "fortress",
},

// dimensional tier — fortress + actionability 낮음 (교차)
{
  id: "dim-fortress-action",
  text: "보안 규칙은 완벽한데 빌드 명령어가 없어요. .env 지키면서 `npm run test`도 적어두세요.",
  priority: "high",
  tag: "dim:actionability",
  tier: "dimensional",
  condition: (persona, _, quality) =>
    persona === "fortress" && quality.actionability < 30,
},

// dimensional tier — 범용, actionability 낮은 누구에게나
{
  id: "dim-action-backtick",
  text: "빌드/테스트 명령어를 백틱으로 감싸서 추가하세요. Claude가 바로 실행할 수 있게.",
  priority: "medium",
  tag: "dim:actionability",
  tier: "dimensional",
  condition: (_, __, quality) => quality.actionability < 30,
},
```

위 예시에서 fortress 사용자에게는 `dim-fortress-action`이 선택되고, `dim-action-backtick`은 같은 tag(`dim:actionability`)이므로 중복 제거됨. 비-fortress 사용자에게는 `dim-action-backtick`이 선택됨.

### generatePrescriptions 시그니처 변경

```typescript
// 변경 전
export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores?: QualityScores
): PrescriptionItem[]

// 변경 후
export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores: QualityScores,
  dimensionScores: DimensionScores
): PrescriptionItem[]
```

`qualityScores`를 optional → required로 변경. `dimensionScores` 추가. 하위호환: 기존 결과 조회 시 fallback `{0,0,0,0,0}` + 기본 DimensionScores 제공.

---

## 콘텐츠 원칙

### 로스팅 차별화 규칙

1. **데이터 인용 필수**: 각 로스팅에 사용자의 실제 수치 1개 이상 삽입 (`{score}점`, `{n}개`, `{ratio}%`)
2. **심리 관통**: 행동이 아니라 "왜 그렇게 하는지"를 찌름 (같은 "가드레일 없음"이라도 minimalist는 게으름, daredevil은 자신감)
3. **비유 세계관**: 각 페르소나 전용 비유 체계, 다른 페르소나와 교차 금지

### 페르소나별 비유 세계관

| 페르소나 | 세계관 | 전용 키워드 |
|----------|--------|-------------|
| minimalist | 선(禅) 수행자 | 방치, 백지위임, 게으름의 미학 |
| speedrunner | 스피드러너 게이머 | 기술부채, TODO 무덤, '나중에' |
| fortress | 중세 성주 | 편집증, 감시탑, 이중잠금 |
| legislator | 입법부 의원 | 관료제, 헌법, 규칙의 규칙 |
| evangelist | 포교사 | 전도사, 포교, 문서화 강박 |
| puppet-master | 인형극 연출가 | 의존증, 리모컨, 장애=사망 |
| daredevil | 스턴트맨 | 안전벨트, 낙하산, 보험 |
| collector | 골동품 수집가 | 창고, 수집벽, 먼지 쌓인 |
| craftsman | 동네 만능 수리점 | 무난, 평균의 함정, 특색 없는 |
| deep-diver | 심해 탐사가 | 우물, 터널, 지표면 모름 |
| architect | 우주정거장 설계사 | OS, 우주정거장, 오버엔지니어링 |
| huggies | 첫 등산 초보자 | 첫걸음, 기저귀, 성장통 |

### 캐치프레이즈 (SNS 공유용)

| 페르소나 | 캐치프레이즈 |
|----------|-------------|
| minimalist | Claude야 알아서 해 |
| speedrunner | '나중에 리팩토링'이라 말한 지 6개월 |
| fortress | API 키가 꿈에 나오는 사람 |
| legislator | CLAUDE.md가 취업규칙보다 긴 사람 |
| evangelist | 혼자서 PR 올리고 혼자서 리뷰하는 사람 |
| puppet-master | Claude 장애 공지에 심장 멈추는 사람 |
| daredevil | production에 YOLO 커밋하는 사람 |
| collector | MCP 12개 연결, 쓰는 건 2개 |
| craftsman | 모든 게 적당해서 오히려 불안한 사람 |
| deep-diver | AST까지 파는데 옆 팀 이름은 모르는 사람 |
| architect | CLAUDE.md 위에 CLAUDE.md를 import하는 사람 |
| huggies | # TODO: 나중에 제대로 쓰기 — 3개월 전 |

### 비개발자 톤 변환

분류 로직은 불변. 비개발 패턴 감지 시 처방전 텍스트에서 용어 치환:

| 개발자 용어 | 범용 치환 |
|-------------|-----------|
| 커밋 | 변경 사항 저장 |
| 디버깅 | 문제 해결 |
| 린트 | 자동 검수 |
| 코드리뷰 | 동료 검토 |
| PR | 변경 요청 |

구현: `prescriptions.ts` 출력 시 `isNonDevProfile(stats)` 체크 후 텍스트 후처리.
`isNonDevProfile` 판정: security와 automation이 높지만 collaboration(개발 키워드)이 낮고, toolDiversity에 Slack/Notion/Calendar 같은 비개발 도구가 주를 이루는 경우.

---

## 파일 변경 목록

| 파일 | 변경 범위 |
|------|-----------|
| `lib/types.ts` | PersonaKey에서 `macgyver` 제거. DimensionScores에서 `collaboration` → `teamImpact`. ConditionalPrescription 타입 추가 |
| `lib/analyzer/patterns.ts` | `collaboration` → `teamImpact` 패턴 배열 교체 (8→10개) |
| `lib/analyzer/scorer.ts` | `collaboration` → `teamImpact` 키 변경. THRESHOLD_RATIO에 `teamImpact: 0.6` 추가 |
| `lib/analyzer/classifier.ts` | macgyver 분기 삭제. deep-diver 조건 교체 (dominanceRatio). speedrunner max<70 가드. craftsman fit 패널티. 부 페르소나 절대하한+차원중복방지. DIMENSION_TO_PERSONA fallback 업데이트 |
| `lib/content/personas.ts` | macgyver 항목 삭제 |
| `lib/content/roasts.ts` | macgyver 항목 삭제 |
| `lib/content/strengths.ts` | macgyver 항목 삭제 |
| `lib/content/prescriptions.ts` | 전면 리팩터링: ConditionalPrescription 구조 도입, selectPrescriptions 알고리즘, tag 중복 제거, 5개 고정 출력. generatePrescriptions 시그니처 변경 |
| `lib/content/compatibility.ts` | macgyver 제거, evangelist 궁합 재배정 |
| `lib/analyzer/index.ts` | analyze() 파이프라인에서 generatePrescriptions 호출 시 dimensionScores 추가 전달 |
| `lib/store.ts` | scores 조회 시 collaboration → teamImpact fallback |
| `app/r/[id]/page.tsx` | scores 표시에서 collaboration → teamImpact 라벨 변경 |
| `__tests__/analyzer/classifier.test.ts` | macgyver 테스트 제거. deep-diver 경계 케이스 추가 (dominanceRatio 2.0, 2위=0). speedrunner max<70 테스트. 부 페르소나 차원 중복 방지 테스트 |
| `__tests__/analyzer/scorer.test.ts` | teamImpact 패턴 10개 매칭 테스트. THRESHOLD_RATIO 0.6 검증 |
| `__tests__/content/prescriptions.test.ts` | 5개 고정 출력 검증. tag 중복 제거 검증. signature 처방전 보장 검증 |

---

## 구현 순서

1. `types.ts` — PersonaKey에서 macgyver 삭제 + collaboration → teamImpact + ConditionalPrescription 타입
2. `patterns.ts` — teamImpact 패턴 배열
3. `scorer.ts` — teamImpact 키 + THRESHOLD_RATIO 0.6
4. `classifier.ts` — macgyver 삭제 + deep-diver dominanceRatio + speedrunner 가드 + craftsman 패널티 + 부 페르소나 개선
5. `personas.ts` + `roasts.ts` + `strengths.ts` + `compatibility.ts` — macgyver 콘텐츠 삭제
6. `prescriptions.ts` — ConditionalPrescription 전면 리팩터링
7. `index.ts` — generatePrescriptions 호출 시그니처 업데이트
8. `store.ts` + `app/r/[id]/page.tsx` — collaboration → teamImpact fallback + UI
9. 테스트 전체 업데이트
10. `npm run test:run` — 전체 통과 확인
11. 검증 스크립트 (validate-thresholds.ts) 확장 — dominanceRatio 분포 출력

## 검증 방법

1. `npm run test:run` — 전체 테스트 통과
2. `npx tsx scripts/validate-thresholds.ts` — 12개 테스트 CLAUDE.md로 분류 확인, deep-diver 부 페르소나 과다 트리거 해소 (5개→1~2개)
3. 처방전 중복률 검증: 12개 샘플의 처방전을 비교하여 동일 text 비율 ≤ 30% (현재 70%)
4. 로컬 `npm run dev` → 실제 CLAUDE.md 입력 → 분류 + 처방전 5개 정상 출력
5. speedrunner 경계: 20줄 + security=80 → fortress 분류 확인
6. dominanceRatio 엣지: 모든 차원 0 + contextAwareness=80 → deep-diver 확인
7. 기존 결과 `/r/[id]` → collaboration 키 fallback 정상 동작 확인
