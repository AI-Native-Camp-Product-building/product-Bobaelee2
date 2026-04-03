/**
 * 13개 페르소나별 샘플 입력 → analyze() → 결과(로스팅/강점/처방전) 출력
 * 사용법: npx tsx scripts/review-all-personas.ts > scripts/persona-review.md
 */

import { analyze } from "../lib/analyzer/index";

const SAMPLES: Record<string, string> = {
  // 1. minimalist — totalLines ≤ 10, 평균 < 20
  minimalist: `=== CLAUDE.md ===
# 설정
- 한국어로 답변`,

  // 2. speedrunner — totalLines ≤ 30, control < 25, contextAwareness < 30
  speedrunner: `=== CLAUDE.md ===
# 프로젝트
## 언어
- 한국어로 답변
## 도구
- Slack, Notion, GitHub 사용
- Google Sheets 연동
## 스타일
- 간결하게 답변
- 코드 먼저, 설명은 나중에
- 불필요한 주석 달지 마`,

  // 3. fortress — security >= 70
  fortress: `=== CLAUDE.md ===
# 보안 규칙
## 민감 정보 보호
- .env 파일 절대 커밋 금지
- API 키, 토큰 노출 절대 금지
- credential 파일 커밋하지 마라
- password를 코드에 하드코딩 금지
- sensitive 데이터는 환경변수로 관리
- 암호화 필수
## 권한 관리
- auth 토큰은 서버사이드에서만 처리
- permission 변경 시 반드시 확인
## 커밋 규칙
- git push 전에 민감 정보 포함 여부 반드시 확인
- 실수로 커밋했으면 즉시 키 변경`,

  // 4. legislator — control >= 75
  legislator: `=== CLAUDE.md ===
# 필수 규칙
## 언어
- 반드시 한국어로 답변
- 절대 영어로 답변하지 마라
- 코드 주석도 항상 한국어
## 코드 규칙
- MUST: 모든 함수에 타입 명시
- NEVER: any 타입 사용 금지
- ALWAYS: 에러 핸들링 필수
- IMPORTANT: 테스트 없이 커밋 금지
- CRITICAL: 프로덕션 DB 직접 접근 금지
## 커밋 규칙
- 반드시 컨벤셔널 커밋 형식
- 절대 force push 금지
- 항상 PR 리뷰 후 머지
- 주의: main 브랜치 직접 커밋 금지
## 응답 규칙
- 반드시 확인 후 실행
- 금지: 추측으로 답변
- 필수: 근거 제시
- WARNING: 파일 삭제 전 반드시 확인`,

  // 5. evangelist — collaboration >= 55
  evangelist: `=== CLAUDE.md ===
# 팀 협업 규칙
## 코드 리뷰
- 모든 코드는 코드 리뷰 필수
- PR 없이 머지 금지
- pull request 템플릿 사용
## 컨벤션
- 팀 컨벤션 문서 준수
- lint 통과 필수
- eslint + prettier 설정 따를 것
## 브랜치 전략
- branch 이름: feature/*, bugfix/*, hotfix/*
- merge 전 최소 1명 리뷰
- 동료 승인 없이 배포 금지
## 팀 커뮤니케이션
- 팀 채널에 작업 내용 공유
- peer 피드백 적극 반영
## 도구
- Slack, Notion, GitHub 사용`,

  // 6. puppet-master — automation >= 70, toolDiversity >= 70
  "puppet-master": `=== CLAUDE.md ===
# 자동화 시스템
## 훅 설정
- PostToolUse hook으로 자동 실행
- PreToolUse hook으로 검증
- cron 스케줄: 매일 09:00
- 자동화 스크립트 배포
- webhook 연동
- bot 자동 응답
- pipeline 구성
## 도구
- Slack 연동
- Notion 문서화
- GitHub 코드 관리
- Google Sheets 데이터
- Supabase DB
- Vercel 배포
- Linear 이슈
- Figma 디자인
- Sentry 모니터링
- Docker 컨테이너`,

  // 7. daredevil — automation >= 50, security < 20
  daredevil: `=== CLAUDE.md ===
# 프로젝트 설정
## 자동화
- hook 설정으로 자동 배포
- cron 스케줄 관리
- bot 자동 응답
- deploy 스크립트 자동 실행
- pipeline 구성
- webhook 연동
## 도구
- Slack, Notion 사용
## 스타일
- 빠르게 실행
- 질문하지 말고 바로 해`,

  // 8. macgyver — automation >= 65, toolDiversity < 30
  macgyver: `=== CLAUDE.md ===
# 자동화 설정
## 스크립트
- PostToolUse hook으로 자동 실행
- cron 스케줄 매일 실행
- 자동화 script로 배포
- webhook 연동
- bot 자동 응답
- pipeline 구성
- deploy 자동화
- launchd 설정
## 규칙
- 모든 작업은 스크립트로 처리`,

  // 9. collector — toolDiversity >= 70, automation < 40
  collector: `=== CLAUDE.md ===
# 사용 도구
- Slack 팀 소통
- Notion 문서화
- GitHub 코드 관리
- Google Sheets 데이터
- Supabase DB
- Vercel 배포
- Linear 이슈
- Figma 디자인
- Jira 프로젝트
- Confluence 위키
- Docker 컨테이너
- AWS 인프라
- Sentry 모니터링
- Stripe 결제
## 언어
- 한국어로 답변`,

  // 10. craftsman — stdDev < 20, avg >= 30
  craftsman: `=== CLAUDE.md ===
# 프로젝트 규칙
## 자동화
- hook 설정
- cron 스케줄
- 자동 배포
## 보안
- .env 커밋 금지
- API 키 보호
- token 관리
## 도구
- Slack, Notion, GitHub
- Supabase, Vercel
## 협업
- 팀 코드 리뷰
- PR 기반 전략
- 컨벤션 준수
## 컨텍스트
- memory 관리
- session 유지
- context 관리
## 규칙
- 반드시 확인 후 진행
- MUST verify
- NEVER skip review`,

  // 11. deep-diver — max >= 80, stdDev >= 30
  "deep-diver": `=== CLAUDE.md ===
# 컨텍스트 관리 전문
## 메모리
- memory 파일 체계적 관리
- 세션 간 컨텍스트 유지
- feedback 루프 구축
- .claude/rules 분리 사용
- @./imports.md 활용
- CLAUDE.local.md 분리
- compact 주기적 실행
- subagent 위임 활용
## 세션
- session 시작/종료 관리
- 프로젝트 CLAUDE.md 분리`,

  // 12. architect — 확장 입력, eco >= 25, hookCount >= 5
  architect: `=== CLAUDE.md ===
# 프로젝트 규칙
## 언어
- 한국어로 답변
## 자동화
- hook으로 자동화
- deploy 스크립트

=== settings.json ===
{
  "permissions": {
    "deny": ["Bash(rm -rf *)"],
    "defaultMode": "auto"
  },
  "hooks": {
    "PreToolUse": [{"matcher": "Edit", "hooks": [{"type": "prompt", "prompt": "check"}]}],
    "PostToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "echo ok"}]}],
    "SessionEnd": [{"matcher": "", "hooks": [{"type": "command", "command": "bash log.sh"}]}],
    "SessionStart": [{"matcher": "", "hooks": [{"type": "command", "command": "bash init.sh"}]}],
    "Stop": [{"matcher": ".*", "hooks": [{"type": "command", "command": "node report.js"}]}]
  },
  "enabledPlugins": {
    "superpowers@official": true,
    "hookify@official": true,
    "session-wrap@official": true,
    "slack@official": true,
    "context7@official": true,
    "skill-creator@official": true,
    "commit-commands@official": true,
    "playwright@official": true,
    "code-review@official": true,
    "frontend-design@official": true,
    "security-guidance@official": true,
    "plugin-dev@official": true
  }
}

=== mcp_settings.json ===
{
  "mcpServers": {
    "slack": {"command": "npx"},
    "notion": {"command": "npx"},
    "google": {"command": "npx"},
    "github": {"command": "npx"},
    "sentry": {"command": "npx"}
  }
}

=== commands ===
arrange
deploy
review
test
onboard
migrate
sync
backup`,

  // 13. huggies — 확장 입력, 10 <= eco < 25, hookCount >= 2
  huggies: `=== CLAUDE.md ===
# 프로젝트 규칙
## 언어
- 한국어로 답변
## 도구
- Slack, Notion 사용

=== settings.json ===
{
  "permissions": {
    "defaultMode": "auto"
  },
  "hooks": {
    "PreToolUse": [{"matcher": "Edit", "hooks": [{"type": "prompt", "prompt": "check env"}]}],
    "PostToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "echo done"}]}]
  },
  "enabledPlugins": {
    "superpowers@official": true,
    "hookify@official": true,
    "slack@official": true,
    "context7@official": true,
    "session-wrap@official": true
  }
}

=== mcp_settings.json ===
{
  "mcpServers": {
    "slack": {"command": "npx"},
    "notion": {"command": "npx"}
  }
}

=== commands ===
deploy
review
sync`,
};

// 실행
for (const [expectedPersona, md] of Object.entries(SAMPLES)) {
  const result = analyze(md);
  const scores = result.scores;
  const quality = result.qualityScores;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`## ${result.persona === expectedPersona ? "✅" : "⚠️"} ${expectedPersona} → 실제: ${result.persona}${result.secondaryPersona ? ` + ${result.secondaryPersona}` : ""}`);
  console.log(`${"=".repeat(70)}`);

  console.log(`\n### 성향 점수`);
  console.log(`auto=${scores.automation} ctrl=${scores.control} tool=${scores.toolDiversity} ctx=${scores.contextAwareness} collab=${scores.teamImpact} sec=${scores.security}`);

  console.log(`\n### 품질 점수 (md력: ${result.mdPower.score}점 ${result.mdPower.tierEmoji} ${result.mdPower.tierName})`);
  console.log(`action=${quality.actionability} concise=${quality.conciseness} struct=${quality.structure} unique=${quality.uniqueness} safety=${quality.safety}`);

  console.log(`\n### 로스팅`);
  result.roasts.forEach((r, i) => {
    console.log(`${i + 1}. [${r.color}] ${r.text}`);
    console.log(`   → ${r.detail}`);
  });

  console.log(`\n### 강점`);
  result.strengths.forEach((s, i) => {
    console.log(`${i + 1}. ${s.text}`);
  });

  console.log(`\n### 처방전`);
  result.prescriptions.forEach((p, i) => {
    console.log(`${i + 1}. [${p.priority}] ${p.text}`);
  });
}
