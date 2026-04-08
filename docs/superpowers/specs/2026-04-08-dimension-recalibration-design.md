# mdTI 차원 재교정 설계

## Context

mdTI의 7차원 평가 엔진에 구조적 문제가 발견되어 재교정한다.

**발견된 문제 (3개 병렬 분석 에이전트 + 벤치마크 42개 레포 분석):**

1. **control ↔ security 차원 겹침**: control 패턴이 "어조"(반드시/금지/MUST)를 측정하여 보안 규칙이 control에도 점수를 줌. deny 규칙이 security +9, control +12 이중 가산
2. **automation ↔ agentOrchestration 경계 불명확**: 포함 관계(에이전트 ⊂ 자동화). 오분류 패턴 2건 (patterns.ts:132-133)
3. **임계값 비현실적**: 벤치마크 42개 레포 분석 결과 — toolDiversity 최대 21점(진입 70), security 중위값 0(진입 70), agentOrchestration 75%가 0점
4. **페르소나 편중**: 벤치마크에서 evangelist 40% + legislator 21% = 61%가 2개 페르소나에 집중
5. **비개발자 결과 무의미**: 대부분 차원 0점 → minimalist 블랙홀
6. **확장 보정 불균형**: teamImpact/agentOrchestration에 확장 보정 +0

**접근법**: 7차원 구조 유지 + 측정 방식(패턴/임계값/보정) 교체. 페르소나 12개 유지, 차원 내 레벨/성향으로 분기.

**범위**: patterns.ts, scorer.ts, classifier.ts, types.ts(라벨만), prescriptions.ts(톤 변환), 수집 스크립트. 콘텐츠(roasts/strengths), UI 컴포넌트 구조, DB 스키마는 변경 없음.

---

## 핵심 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| 차원 수 | 7개 유지 | 겹침의 원인은 "측정 방식"이지 "차원 정의"가 아님. 차원 자체는 개념적으로 구분됨 |
| 페르소나 수 | 12개 유지 | 같은 차원 안에서 레벨/성향으로 분기 (fortress vs legislator 등) |
| 비개발자 | 전면 지원 | 차원 라벨 + 패턴 + 처방전 톤 변환 |
| architect/huggies | B경로(확장 입력) 전용 유지 | 대신 수집 스크립트가 충분한 데이터를 수집하도록 보강 |
| 임계값 근거 | 벤치마크 42개 레포 분석 | 직감 기반 → 데이터 기반 전환 |
| DB 호환 | 고려 안 함 | 사용자 거의 없음 |

---

## 벤치마크 데이터

GitHub 스타 상위 프로젝트 42개의 CLAUDE.md를 현재 엔진으로 분석한 결과:

### 차원별 점수 분포

| 차원 | min | p25 | 중위 | 평균 | p75 | p90 | max |
|------|-----|-----|------|------|-----|-----|-----|
| automation | 0 | 20 | 30 | 32 | 40 | 50 | 70 |
| control | 0 | 14 | 29 | 37 | 57 | 71 | 86 |
| toolDiversity | 0 | 0 | 7 | 6 | 7 | 14 | 21 |
| contextAwareness | 0 | 0 | 17 | 16 | 33 | 33 | 83 |
| teamImpact | 0 | 22 | 33 | 40 | 56 | 67 | 89 |
| security | 0 | 0 | 0 | 13 | 14 | 43 | 71 |
| agentOrchestration | 0 | 0 | 0 | 2 | 0 | 13 | 13 |

### 현행 페르소나 분포

| 페르소나 | 수 | 비율 |
|----------|-----|------|
| evangelist | 17 | 40% |
| legislator | 9 | 21% |
| minimalist | 4 | 10% |
| daredevil | 4 | 10% |
| puppet-master | 3 | 7% (전부 fallback) |
| fortress | 2 | 5% |
| deep-diver | 2 | 5% |
| craftsman | 1 | 2% |
| collector | 0 | 0% |
| architect | 0 | 0% |
| huggies | 0 | 0% |
| speedrunner | 0 | 0% |

벤치마크 데이터: `scripts/samples/benchmark-claudes.txt` (42개 레포), `scripts/samples/benchmark-repos.csv`
분석 스크립트: `scripts/analyze-benchmarks.ts`

---

## 변경 1: control 패턴 재설계 — "어조"에서 "주제"로

### 문제

```
"반드시 .env 파일은 커밋 금지"
→ control +1 (반드시) + security +2 (.env, 커밋금지)
```

control 패턴의 `/금지/`, `/반드시/`, `/MUST/` 등이 **주제 무관하게** 모든 강한 지시어를 감지.

### 해결: "AI 사용 스타일 제어"로 재정의

control이 측정해야 할 것: "Claude에게 어떤 방식으로 일하라고 지시하는가" — 응답 형식, 코딩 스타일, 행동 제약

```typescript
control: [
  // 응답/출력 형식 제어
  /한국어로|korean|영어로|english/gi,
  /간결하게|짧게|concise|brief/gi,
  /이모지|emoji/gi,
  /마크다운|markdown|포맷/gi,

  // 코딩 스타일 강제
  /컨벤션|convention|naming/gi,
  /타입|type.*annotation|타입.*주석/gi,
  /주석|comment.*필수/gi,

  // 행동 제약 (보안/배포 맥락 제외 — negative lookahead)
  /확인.*후|승인.*후|before.*proceed/gi,
  /DO\s*NOT|FORBIDDEN|PROHIBITED/gi,
  /금지(?!.*커밋)(?!.*\.env)(?!.*push)(?!.*secret)/gi,
  /MUST(?!.*commit)(?!.*secret)(?!.*\.env)(?!.*token)/gi,

  // 비개발자도 쓰는 제어 표현
  /형식|format|양식/gi,
  /톤|tone|말투/gi,
  /대상.*설명|쉽게.*설명/gi,
]
```

패턴 수: 10 → ~14개. negative lookahead로 보안 맥락의 "금지/MUST"는 제외.

### deny 이중 가산 해소 (scorer.ts)

```typescript
// 변경 전: deny가 security +9, control +12 이중 가산
if (sig.hasDenyRules) result.security += Math.min(sig.denyCount * 3, 9);
if (sig.hasDenyRules) result.control += Math.min(sig.denyCount * 3, 12);

// 변경 후: deny는 security에만 귀속
if (sig.hasDenyRules) result.security += Math.min(sig.denyCount * 3, 12);
// control에서 deny 제거, defaultMode 관련만 유지
if (!sig.defaultModeIsAuto) result.control += 8;
```

### blocksDangerousOps 이중 가산 해소

```typescript
// 변경 전: blocksDangerousOps가 security +12, control +6 이중 가산
// 변경 후: security에만 귀속
if (sig.blocksDangerousOps) result.security += 12;
```

---

## 변경 2: automation ↔ agentOrchestration 경계 정리

### 경계 재정의

| | automation | agentOrchestration |
|--|-----------|-------------------|
| 의미 | 반복 작업을 기계가 대신 실행 | Claude가 스스로 판단하고 실행 |
| 키워드 | hook, cron, CI/CD, deploy, script, bot | autonomous, agent loop, stop condition, defaultMode:auto |
| 비유 | 컨베이어 벨트 | 자율주행차 |

### 패턴 재배치

agentOrchestration에서 automation으로 이동:
- `/rollback|복구/gi` — 운영 자동화
- `/반드시.*후.*배포|deploy.*후.*반드시/gi` — 배포 절차

agentOrchestration에서 security로 이동:
- `/실수로.*커밋|실패.*경험/gi` — 보안 실수 언급

agentOrchestration에 신규 추가 (일반 사용자 도달 가능):
- `/알아서|자율|스스로\s*판단/gi` — "Claude가 알아서 해"
- `/자동.*모드|auto.*mode/gi` — defaultMode 언급
- `/에이전트|agent(?!s\.md)/gi` — AGENTS.md 파일명 제외

### 확장 보정 추가 (scorer.ts)

```typescript
// agentOrchestration — 현재 +0 → 추가
if (sig.defaultModeIsAuto) result.agentOrchestration += 15;
if (sig.hookTypePromptCount >= 2) result.agentOrchestration += 8;
const skillCount = extractSkillCount(md);
if (skillCount >= 5) result.agentOrchestration += 12;
else if (skillCount >= 2) result.agentOrchestration += 6;

// teamImpact — 현재 +0 → 추가
if (sig.projectMdCount >= 3) result.teamImpact += 8;
```

### 수집 스크립트 보강

skills/ 디렉토리 목록과 AGENTS.md 내용을 수집에 추가:

```bash
echo "=== skills ==="
ls ~/.claude/skills/ 2>/dev/null | head -20
echo "=== AGENTS.md ==="
cat AGENTS.md 2>/dev/null | head -50
```

scorer.ts에서 skills 섹션 파싱 함수 추가:

```typescript
export function extractSkillCount(text: string): number {
  const skillSection = text.match(/===\s*skills\s*===\n([\s\S]*?)(?:===|$)/);
  if (!skillSection) return 0;
  return skillSection[1].trim().split("\n").filter(l => l.trim()).length;
}
```

---

## 변경 3: 벤치마크 기반 임계값 교정

### 3-1. 정규화 threshold

```typescript
const THRESHOLD_RATIO: Partial<Record<keyof DimensionScores, number>> = {
  toolDiversity: 0.3,         // 20개 중 6개 → 만점
  agentOrchestration: 0.3,    // ~16개 중 5개 → 만점
  contextAwareness: 0.4,      // 12개 중 5개 → 만점
  teamImpact: 0.5,            // 14개 중 7개 → 만점
  security: 0.5,              // 10개 중 5개 → 만점
  control: 0.7,               // 유지 (패턴 재설계로 점수 자연 하락)
};
const DEFAULT_RATIO = 0.6;    // automation: 15개 중 9개 → 만점
```

### 3-2. 페르소나 진입 임계값

벤치마크 percentile 기반 (threshold 재조정 후 예상 점수 반영):

```typescript
// puppet-master
scores.automation >= 55 && scores.toolDiversity >= 40   // 기존 70, 70

// fortress
scores.security >= 55                                    // 기존 70

// legislator
scores.control >= 55                                     // 기존 75

// collector
scores.toolDiversity >= 45 && scores.automation < 30     // 기존 70, <40

// evangelist
scores.teamImpact >= 50                                  // 기존 55

// daredevil
scores.automation >= 45 && scores.security < 20          // 기존 50, <20

// craftsman — 유지
sd < 20 && avg >= 30

// deep-diver — 유지
first >= 70 && dominanceRatio >= 2.0

// architect
eco >= 20 && hookCount >= 3                              // 기존 25, 5

// huggies
eco >= 8 && hookCount >= 1                               // 기존 10, 2
```

### 3-3. fit 공식 재조정

진입 임계값이 낮아졌으므로 fit 범위를 맞춤:

```typescript
// 예: fortress
// 변경 전: (security - 70) / 30 * 100
// 변경 후: (security - 55) / 45 * 100

// 예: puppet-master
// 변경 전: (auto - 70) / 30 * 50 + (tool - 70) / 30 * 50
// 변경 후: (auto - 55) / 45 * 50 + (tool - 40) / 60 * 50
```

---

## 변경 4: 비개발자 지원

### 4-1. 비개발자 감지

```typescript
function isNonDevProfile(stats: MdStats, scores: DimensionScores): boolean {
  return (
    stats.hasRoleDefinition &&
    scores.automation < 20 &&
    scores.security < 20 &&
    scores.agentOrchestration < 10
  );
}
```

### 4-2. 비개발자 패턴 추가

```typescript
// teamImpact 추가
/회의|meeting|미팅/gi,
/보고|report|리포트/gi,

// control 추가
/형식|format|양식/gi,
/톤|tone|말투/gi,
/대상.*설명|쉽게.*설명/gi,

// contextAwareness 추가
/프로젝트|project/gi,
/배경|background|맥락/gi,
```

### 4-3. 차원 라벨 변경 (DIMENSION_LABELS)

```typescript
automation:          { label: "자동화",  description: "반복 작업을 자동으로 처리" },
control:             { label: "규칙",    description: "AI에게 지시하는 규칙과 제약" },
toolDiversity:       { label: "도구",    description: "연결한 외부 서비스 종류" },
contextAwareness:    { label: "기억",    description: "대화 맥락과 정보 관리" },
teamImpact:          { label: "협업",    description: "팀과 함께 일하는 방식" },
security:            { label: "보안",    description: "민감 정보 보호 규칙" },
agentOrchestration:  { label: "자율",    description: "AI에게 맡기는 판단 범위" },
```

### 4-4. 처방전 톤 변환

```typescript
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

// prescriptions.ts — 출력 시 후처리
if (isNonDevProfile(stats, scores)) {
  text = DEV_TO_GENERAL.reduce((t, [from, to]) => t.replace(from, to), text);
}
```

---

## 파일 변경 목록

| 파일 | 변경 범위 |
|------|-----------|
| `lib/analyzer/patterns.ts` | control 패턴 전면 교체. agentOrchestration 패턴 재배치 + 신규 추가. automation에 2건 이동. security에 1건 이동. 비개발자 패턴 추가. `extractSkillCount()` 추가 |
| `lib/analyzer/scorer.ts` | THRESHOLD_RATIO 전면 재조정. deny/blocksDangerousOps 이중 가산 해소. agentOrchestration/teamImpact 확장 보정 추가. `isNonDevProfile()` 추가 |
| `lib/analyzer/classifier.ts` | 페르소나 진입 임계값 하향 (fortress 55, legislator 55, puppet-master 55/40 등). fit 공식 재조정. architect 20/3, huggies 8/1 |
| `lib/types.ts` | DIMENSION_LABELS 라벨/설명 변경 (통제→규칙, 맥락→기억, 에이전트→자율) |
| `lib/content/prescriptions.ts` | `isNonDevProfile()` 연동, DEV_TO_GENERAL 용어 치환 후처리 |
| `scripts/analyze-benchmarks.ts` | 이미 작성 완료 (벤치마크 분석) |
| 수집 스크립트 | skills/ 디렉토리 + AGENTS.md 수집 추가 |
| `__tests__/analyzer/patterns.test.ts` | control negative lookahead 테스트, 패턴 재배치 검증 |
| `__tests__/analyzer/scorer.test.ts` | 이중 가산 해소 검증, 새 threshold 검증, 확장 보정 검증 |
| `__tests__/analyzer/classifier.test.ts` | 새 임계값 경계 테스트, architect/huggies 새 조건 테스트 |

---

## 검증 방법

1. `npm run test:run` — 전체 테스트 통과
2. `npx tsx scripts/analyze-benchmarks.ts` — 벤치마크 42개 재분석
   - 페르소나 분포가 evangelist+legislator 61% → 40% 이하로 개선
   - toolDiversity/agentOrchestration 점수 분포가 의미 있는 범위로 이동
   - fortress/collector/puppet-master 출현율 증가
3. Vivi의 CLAUDE.md로 A경로 테스트 → minimalist가 아닌 의미 있는 결과
4. Vivi의 확장 입력으로 B경로 테스트 → architect 또는 huggies 분류 확인
5. 비개발자 샘플 ("나는 마케터입니다. 쉽게 설명해주세요") → 처방전 톤 변환 확인
6. 로컬 `npm run dev` → 실제 화면 테스트
