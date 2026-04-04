# 수집기 스크립트 전면 검증 설계

## 배경

mdti 수집기는 사용자의 CLAUDE.md와 Claude Code 설정 파일을 수집하여 성향 분석의 원본 데이터를 만든다. 수집 범위가 전체 분석 정확도의 상한선을 결정하므로, 수집기가 효과적인지 체계적으로 검증할 필요가 있다.

## 목표

1. **수집 범위 검증** — 12개 페르소나 각각의 관점에서 빠뜨린 신호 식별
2. **파싱 정확도 검증** — 패턴 정규식의 오탐/미탐 발견
3. **개선 즉시 구현** — 발견된 문제를 심각도 기준으로 우선순위화하여 수정

## 현재 수집기 구조

### 수집 경로

- **A경로 (기본)**: 사용자가 CLAUDE.md 텍스트만 직접 붙여넣기
- **B경로 (확장)**: Mac/Windows 쉘 스크립트가 다음을 `=== 구분자 ===` 형식으로 합쳐서 클립보드에 복사
  - `~/.claude/CLAUDE.md`
  - `~/.claude/settings.json`
  - `~/.claude/mcp_settings.json` (env 값 마스킹)
  - `~/.claude/commands/*.md` (파일명만)
  - `~/.claude/projects/**/MEMORY.md`
  - 홈 디렉토리 3단계 이내 `CLAUDE.md` / `AGENTS.md`

### 분석 파이프라인

```
수집 스크립트 → 클립보드 → textarea → analyze()
  ├── calculateScores() — 6차원 패턴 매칭
  ├── extractMdStats() — 기본 통계 + 확장 파서
  ├── classifyPersona() — 12개 페르소나 후보 적합도 분류
  ├── calculateQualityScores() — 5차원 품질 점수
  └── generateRoasts/Strengths/Prescriptions — 콘텐츠 생성
```

### 6차원 패턴 (patterns.ts)

| 차원 | 패턴 수 | 핵심 키워드 |
|------|---------|------------|
| automation | 10 | hooks, cron, 자동, script, deploy, bot, pipeline, webhook, launchd, clasp push |
| control | 8 | 금지, 반드시, MUST, NEVER, ALWAYS, IMPORTANT, 규칙, 주의 |
| toolDiversity | 14 | slack, notion, google, github, supabase, vercel, linear, figma, jira, confluence, docker, aws/gcp/azure, sentry/datadog/grafana, stripe/paddle |
| contextAwareness | 10 | memory, 프로젝트 CLAUDE, 컨텍스트, session, feedback, .claude/rules, @path.md, CLAUDE.local.md, compact, subagent/task() |
| teamImpact | 10 | 팀, 코드 리뷰, PR, convention, lint, branch, merge, 동료, 온보딩, 공유 |
| security | 8 | .env, api key/token, 민감/sensitive/secret, password, 커밋 금지, permission/auth, encrypt, 보안 |

### 12개 페르소나 분류 조건 (classifier.ts)

| 페르소나 | 핵심 조건 |
|---------|----------|
| minimalist | totalLines ≤ 10 && avg < 20, 또는 max < 25 |
| puppet-master | automation ≥ 70 && toolDiversity ≥ 70 |
| daredevil | automation ≥ 50 && security < 20 |
| fortress | security ≥ 70 |
| legislator | control ≥ 75 |
| evangelist | teamImpact ≥ 55 |
| collector | toolDiversity ≥ 70 && automation < 40 |
| speedrunner | totalLines ≤ 30 && control < 25 && contextAwareness < 30 && max < 70 |
| craftsman | stdDev < 20 && avg ≥ 30 |
| deep-diver | 1위 차원 ≥ 70 && dominanceRatio ≥ 2.0 |
| architect | 확장입력 && eco ≥ 25 && hooks ≥ 5 |
| huggies | 확장입력 && eco ≥ 10 && hooks ≥ 2 |

## 검증 설계

### Phase 1: 수집 범위 감사 — 12개 병렬 에이전트

각 페르소나 전담 에이전트가 다음을 수행:

1. 해당 페르소나의 **전형적인 사용자 프로필** 정의
   - 어떤 역할/직군인가
   - CLAUDE.md에 어떤 내용을 쓸 것인가
   - settings.json / mcp_settings.json / commands / 프로젝트 CLAUDE.md에 뭐가 있을 것인가
2. 현재 수집 스크립트가 **해당 사용자의 신호를 제대로 수집하는지** 검증
   - 수집 대상 파일 목록 대비 해당 사용자가 갖고 있을 파일
   - 수집 안 되는 중요 파일이 있는지
3. 현재 패턴이 **수집된 텍스트에서 신호를 잡아내는지** 검증
   - 해당 차원 패턴 목록 대비 전형적 키워드
   - 패턴이 잡지 못하는 표현이 있는지
   - 다른 차원으로 오분류될 수 있는 키워드가 있는지
4. **산출물** 보고

#### 에이전트 산출물 포맷

```
페르소나: [이름]
전형적 사용자: [1~2줄 프로필]
수집 누락: [수집 스크립트가 아예 안 긁는 데이터]
패턴 누락: [수집은 되지만 정규식이 못 잡는 신호]
오탐 위험: [엉뚱한 매칭 가능성]
개선 제안: [구체적인 수정안 — 패턴 추가/수정/삭제]
심각도: [high / medium / low]
```

#### 에이전트 컨텍스트 범위

**공통 (모든 에이전트)**:
- `components/MdInput.tsx` 18~70줄 — Mac/Windows 수집 스크립트
- `lib/analyzer/patterns.ts` — 6차원 패턴 + 확장 신호 추출
- `lib/analyzer/classifier.ts` — 분류 조건 + 임계값

**제외 (읽지 않음)**:
- 콘텐츠 파일 (roasts, strengths, prescriptions)
- UI 컴포넌트 (수집 범위/패턴과 무관)
- Supabase/API 코드

### Phase 2: 종합 + 구현

1. 12개 에이전트 결과를 종합
2. 공통 지적 사항 + 심각도별 우선순위화
3. high/medium 항목에 대해 구체적 개선안 도출
4. 패턴 추가/수정, 수집 스크립트 개선 즉시 구현
5. 기존 테스트 통과 확인

## 범위 외

- UX/접근성 검증 (비개발자 경험) — 이번 검증에서 제외, 별도 진행
- 콘텐츠 품질 (로스팅/처방전 텍스트) — 수집기 검증과 무관
- Supabase 저장/조회 로직 — 수집기 검증과 무관
