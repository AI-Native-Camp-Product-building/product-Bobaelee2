# mdti 분석 아키텍처

> 최종 업데이트: 2026-04-05

## 전체 파이프라인

```
수집 스크립트 → 클립보드 → textarea 붙여넣기
    → calculateScores (7차원 패턴 매칭)
    → extractMdStats (통계 추출)
    → classifyPersona (12개 페르소나 분류)
    → calculateQualityScores (5차원 품질)
    → generateRoasts / Strengths / Prescriptions (콘텐츠)
    → calculateMdPower (md력 점수 + 티어)
    → Supabase 저장 (결과 객체만, 원본 미전송)
```

## 1단계: 수집

사용자가 터미널에서 수집 스크립트를 실행하면 클립보드에 복사됨. Mac / Windows 지원.

| 수집 대상 | 경로 | 비고 |
|----------|------|------|
| 글로벌 CLAUDE.md | `~/.claude/CLAUDE.md` | |
| settings.json | `~/.claude/settings.json` | hook, deny, 플러그인 |
| mcp_settings.json | `~/.claude/mcp_settings.json` | env 값은 `***REDACTED***` 마스킹 |
| 커스텀 명령어 | `~/.claude/commands/*.md` | 파일명만 (재귀 수집) |
| 프로젝트 메모리 | `~/.claude/projects/**/MEMORY.md` | |
| 프로젝트 CLAUDE.md | 홈 디렉토리 3단계 이내 | `.claude/`, `node_modules/`, `.git/` 제외 |
| AGENTS.md | 홈 디렉토리 3단계 이내 | 동일 |

마스킹: 이메일, Slack 토큰(xoxb-/xoxp-), API 키(sk-/ghp_/gho_), GAS Deploy ID, Notion 토큰.

수집된 텍스트는 `=== 구분자 ===` 형식으로 섹션이 구분됨.

### A경로 vs B경로

- **A경로**: CLAUDE.md 텍스트만 직접 붙여넣기
- **B경로**: 수집 스크립트 실행 결과 붙여넣기 (확장 입력)

`isExpandedInput()` 함수가 `=== settings.json ===` 등 구분자로 B경로를 자동 감지.

## 2단계: 점수 계산 (7차원 × 94개 패턴)

전체 텍스트를 대상으로 정규식 패턴 매칭. 각 패턴은 **있다/없다(0/1)**만 카운트 — 반복 횟수 무시, 다양성만 측정.

| 차원 | 패턴 수 | threshold 비율 | 측정하는 것 |
|------|--------|---------------|------------|
| automation | 13 | 0.7 | hook, deploy, CI/CD, bot, terraform |
| control | 10 | 0.7 | 금지, MUST, DO NOT, mandatory, 규칙 |
| toolDiversity | 20 | 0.7 | Slack, Notion, Miro, Airtable 등 SaaS |
| contextAwareness | 12 | 0.5 | memory, session, compact, handoff |
| teamImpact | 14 | 0.6 | PR, 코드리뷰, 온보딩, 멘토, 문서화 |
| security | 10 | 0.7 | .env, token, deny, 암호화, 취약점 |
| agentOrchestration | 15 | 0.5 | 자율실행, stop조건, 이터레이션, 패턴축적 |

**점수 정규화**: `normalize(고유신호수, threshold) = min(100, round(count / threshold * 100))`

**B경로 보정** (확장 입력일 때만):
- security: blocksDangerousOps +12, denyCount×3 최대+9, PreToolUse hook +6
- automation: PostToolUse +8, SessionHooks +5, command hook 2개+ → +6
- control: denyCount×3 최대+12, blocksDangerousOps +6, !autoMode +6
- contextAwareness: statusLine +5, marketplaces +3, pluginRatio +6, projectMd +6
- toolDiversity: MCP 서버 3개+ → +10, 1개+ → +5

## 3단계: 페르소나 분류 (12개)

7차원 점수 → 후보별 적합도(fit) 계산 → 정렬 → 주/부 페르소나 선택.

| 페르소나 | 핵심 조건 | fit 계산 |
|---------|----------|---------|
| minimalist | totalLines ≤ 10 && avg < 20, 또는 max < 25 | 조건 시 즉시 반환 |
| puppet-master | automation ≥ 70 && toolDiversity ≥ 70 | 초과분 기반 0~100 |
| daredevil | automation ≥ 50 && security < 20 | gap 기반 |
| fortress | security ≥ 70 | 초과분 기반 |
| legislator | control ≥ 75 | 초과분 기반 |
| evangelist | teamImpact ≥ 55 | 초과분 기반 |
| collector | toolDiversity ≥ 70 && automation < 40 | 초과분 기반 |
| speedrunner | totalLines ≤ 30 && control < 25 && contextAwareness < 30 && max < 70 | 고정 50 |
| craftsman | stdDev < 20 && avg ≥ 30 (7차원 전체) | avg 기반, 강한 경쟁자(fit≥15) 있으면 ×0.5 |
| deep-diver | 1위 ≥ 70 && 1위/2위 비율 ≥ 2.0 | 비율 기반, 전용 페르소나 차원이면 ×0.3 |
| architect | B경로 && eco ≥ 25 && hooks ≥ 5 | 고정 95 |
| huggies | B경로 && eco ≥ 10 && hooks ≥ 2 | 고정 80 |

**eco** = pluginCount + mcpServerCount + commandCount

**부 페르소나 선택**: fit ≥ 25이고 1위의 60% 이상이면 secondary로 선택. 같은 차원의 페르소나는 제외.

## 4단계: 콘텐츠 생성

주 페르소나 + 7차원 점수 + 품질 점수 + 통계 → 콘텐츠 생성.

### 로스팅 (3개)
페르소나별 하드코딩된 팩폭. `claudeMdLines`, `toolNames` 등 동적 데이터 삽입.

### 강점 (3개)
페르소나별 하드코딩된 인정. 동적 데이터 삽입.

### 처방전 (5개 고정)
3단계 우선순위로 선택:

1. **시그니처** (12개, 페르소나별 1개) — 최우선 선택
2. **차원별** (품질 약점 + 페르소나 교차) — 두번째
3. **공통** (역할 정의, 도구 나열 등) — 나머지 채움

tag 기반 중복 제거 → 정확히 5개 출력.

**맥락 분기** (agentOrchestration 기반):
- agentOrchestration ≥ 30: "뻔한 지시 삭제" 대신 "가드레일 강화" 처방
- agentOrchestration ≥ 60: "이터레이션 학습 구조 정리" 처방
- agentOrchestration 20~59: "자율 에이전트 도입 고려" 처방

**키워드 기반 판단**:
- 역할 정의 처방: `claudeMdLines`가 짧아도 전체 텍스트에 역할 키워드가 있으면 불표시
- `hasRoleDefinition`: "나는 누구", "역할", "개발자", "PM" 등 키워드 감지

### 궁합 (3개)
페르소나별 하드코딩: 찰떡(perfect) / 환장(chaos) / 거울(mirror).

## 5단계: .md력 점수

```
5개 품질 차원 합산(0~500) × 2 = 기본 점수(0~1000)
+ agentOrchestration ≥ 50이면 최대 +50 보너스
= 최종 점수(0~1000)
```

| 티어 | 점수 |
|------|------|
| 🌋 Sequoia | 800+ |
| 🏔️ Oak | 600~799 |
| 🌳 Tree | 400~599 |
| 🌿 Sapling | 250~399 |
| 🌱 Sprout | 100~249 |
| 🥚 Egg | 0~99 |

## 6단계: 저장

Supabase에 저장되는 것: 페르소나, 점수(7차원+5품질), 로스팅/강점/처방전 텍스트, 통계.
저장되지 않는 것: 원본 CLAUDE.md 텍스트 (클라이언트에서만 분석).

## 파일 구조

```
lib/
├── types.ts                    # DimensionScores(7차원), MdStats, PersonaKey 등 타입
├── analyzer/
│   ├── index.ts                # analyze() 통합 진입점
│   ├── patterns.ts             # 7차원 94개 패턴 + 확장 신호 추출
│   ├── scorer.ts               # calculateScores + extractMdStats
│   ├── classifier.ts           # classifyPersona (12개 후보 적합도)
│   ├── quality.ts              # calculateQualityScores (5차원 품질)
│   └── power.ts                # calculateMdPower (md력 + 티어)
├── content/
│   ├── roasts.ts               # 로스팅 + 강점 + 궁합
│   └── prescriptions.ts        # 조건부 처방전 (시그니처/차원별/공통)
components/
└── MdInput.tsx                 # 수집 스크립트 (MAC_CMD / WIN_CMD)
```
