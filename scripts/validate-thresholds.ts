/**
 * 임계값 검증 스크립트
 * 내장 샘플 + scripts/samples/*.md 파일로 점수 분포를 검증한다.
 *
 * 사용법: npx tsx scripts/validate-thresholds.ts
 *
 * 출력: 차원별 점수 분포, 페르소나 분포, 70점 이상 도달률, 쏠림 경고
 */

import { calculateScores, extractMdStats } from "../lib/analyzer/scorer";
import { classifyPersona } from "../lib/analyzer/classifier";
import { DIMENSION_PATTERNS } from "../lib/analyzer/patterns";
import type { DimensionScores, PersonaResult } from "../lib/types";
import * as fs from "fs";
import * as path from "path";

// === 내장 샘플 (기존 테스트에서 재사용) ===

const SAMPLES: Record<string, string> = {
  "자동화 특화": `# 자동화 설정
## 훅 설정
- PostToolUse hook으로 자동 실행
- PreToolUse hook으로 검증
- cron 스케줄: 매일 09:00
- 자동화 스크립트 배포
- webhook 연동
- bot 자동 응답
- pipeline 구성
- launchd 설정
- clasp push 자동화
- deploy 스크립트
## 봇 관리
- Slack bot 자동 응답
- 자동 schedule 관리
- 스크립트로 자동 처리`,

  "보안 특화": `# 보안 규칙
- .env 파일 절대 커밋 금지
- API 키 노출 금지
- token 관리 필수
- 민감 정보 보안
- password 절대 커밋하지 마라
- credential 보호
- 암호화 필수
- 권한 관리
- sensitive 데이터 보호
- auth 토큰 외부 노출 금지`,

  "최소 MD": `안녕하세요`,

  "파워유저": `# 프로젝트 규칙
## 자동화
- PostToolUse hook 설정
- cron 스케줄로 자동 deploy
- webhook으로 자동화 pipeline
- bot 자동 응답 script
## 보안
- .env 파일 절대 커밋 금지
- API 키 token 관리 필수
- 민감 정보 보안 유지
- credential 노출 금지
## 도구
- Slack, Notion, GitHub 사용
- Google Sheets 연동
- Supabase DB 관리
- Vercel 배포
## 협업
- 팀 코드 리뷰 필수
- PR 기반 브랜치 전략
- 컨벤션 lint 준수
## 메모리
- memory/session 관리
- 컨텍스트 유지
## 규칙
- 반드시 확인 후 진행
- MUST verify before push
- NEVER skip review
- ALWAYS write in Korean`,

  "통제 특화": `# 필수 규칙
- 절대 영어로 답변하지 마라
- 반드시 확인 후 실행
- 금지: 파일 삭제
- MUST: 한국어 사용
- NEVER: 무단 push
- ALWAYS: 테스트 먼저
- IMPORTANT: 코드 리뷰 필수
- CRITICAL: 배포 전 승인
- 규칙 위반 시 경고
- 주의: 민감 파일 수정 금지`,

  "협업 특화": `# 팀 규칙
## 코드 리뷰
- 코드 리뷰 필수
- PR 기반 워크플로우
- 컨벤션 준수
- lint 통과 필수
## 브랜치
- branch 전략: git flow
- merge 전 리뷰 필수
## 팀 협업
- 팀 회의 기록
- 동료 피드백 반영
- peer review 문화`,

  "도구 수집가": `# 사용 도구
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
- Stripe 결제`,

  "확장 입력": `=== CLAUDE.md ===
# 프로젝트 규칙
## 언어
- 항상 한국어로 답변한다
## 태도
- 모르는 것은 솔직히 모른다고 말한다

=== settings.json ===
{
  "permissions": {
    "allow": ["mcp__claude_ai_Notion__*"],
    "deny": ["Bash(rm -rf *)", "Bash(git push --force *)"],
    "defaultMode": "auto"
  },
  "hooks": {
    "PreToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "prompt", "prompt": "check env"}]}],
    "PostToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "echo done"}]}],
    "SessionEnd": [{"matcher": "", "hooks": [{"type": "command", "command": "bash log.sh"}]}],
    "Stop": [{"matcher": ".*", "hooks": [{"type": "command", "command": "node report.js"}]}]
  },
  "statusLine": {"type": "command", "command": "bash statusline.sh"},
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "hookify@claude-plugins-official": true,
    "session-wrap@team-attention-plugins": true,
    "slack@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "commit-commands@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "code-review@claude-plugins-official": false,
    "feature-dev@claude-plugins-official": false
  }
}

=== mcp_settings.json ===
{
  "mcpServers": {
    "slack": {"command": "npx"},
    "notion": {"command": "npx"},
    "google-workspace": {"command": "npx"},
    "greeting-ats": {"command": "node"}
  }
}

=== commands ===
arrange
phone-screening
ps
onboard
github-invite
pr-gen
squash
dalgona

=== PROJECT MEMORY ===
# 사용자 설정
## 프로젝트
- HRbot GAS 프로젝트

=== /Users/vivi/CLAUDE.md ===
# 프로젝트 규칙
## 자주 쓰는 도구
- Slack, Notion

=== /Users/vivi/mdti/CLAUDE.md ===
@AGENTS.md`,
};

// === 외부 샘플 로드 ===

function loadExternalSamples(): Record<string, string> {
  const samplesDir = path.join(__dirname, "samples");
  const external: Record<string, string> = {};

  if (!fs.existsSync(samplesDir)) return external;

  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith(".md"));
  for (const f of files) {
    external[`[외부] ${f}`] = fs.readFileSync(path.join(samplesDir, f), "utf-8");
  }
  return external;
}

// === 분석 실행 ===

interface SampleResult {
  name: string;
  scores: DimensionScores;
  persona: PersonaResult;
  totalLines: number;
}

function analyzeSamples(): SampleResult[] {
  const allSamples = { ...SAMPLES, ...loadExternalSamples() };
  const results: SampleResult[] = [];

  for (const [name, md] of Object.entries(allSamples)) {
    const scores = calculateScores(md);
    const stats = extractMdStats(md);
    const persona = classifyPersona(scores, stats);
    results.push({ name, scores, persona, totalLines: stats.totalLines });
  }

  return results;
}

function run() {
  const results = analyzeSamples();
  const externalCount = Object.keys(loadExternalSamples()).length;

  console.log(`\n📊 mdTI 임계값 검증 — ${results.length}개 샘플 (내장 ${results.length - externalCount} + 외부 ${externalCount})`);
  console.log("=".repeat(60));

  // 개별 결과
  console.log("\n📋 개별 분석 결과:");
  for (const r of results) {
    const dims = Object.entries(r.scores)
      .map(([k, v]) => `${k.slice(0, 4)}=${v}`)
      .join(" ");
    const sec = r.persona.secondary ? ` + ${r.persona.secondary}` : "";
    console.log(`  ${r.name.padEnd(16)} → ${r.persona.primary}${sec} | ${dims}`);
  }

  // 차원별 분포
  const dims = Object.keys(DIMENSION_PATTERNS) as (keyof DimensionScores)[];
  console.log("\n📈 차원별 점수 분포:");
  for (const dim of dims) {
    const values = results.map(r => r.scores[dim]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const over70 = values.filter(v => v >= 70).length;
    console.log(`  ${dim.padEnd(18)} avg=${avg.toFixed(0).padStart(3)} | min=${String(min).padStart(3)} | max=${String(max).padStart(3)} | 70+: ${over70}/${results.length}`);
  }

  // 페르소나 분포
  console.log("\n🎭 페르소나 분포:");
  const personaCounts: Record<string, number> = {};
  for (const r of results) {
    personaCounts[r.persona.primary] = (personaCounts[r.persona.primary] ?? 0) + 1;
  }
  const sorted = Object.entries(personaCounts).sort((a, b) => b[1] - a[1]);
  for (const [persona, count] of sorted) {
    const pct = ((count / results.length) * 100).toFixed(0);
    const bar = "█".repeat(Math.round(count / results.length * 20));
    console.log(`  ${persona.padEnd(16)} ${String(count).padStart(2)}명 (${pct.padStart(2)}%) ${bar}`);
  }

  // 쏠림 경고
  console.log("\n⚠️  검증 결과:");
  const maxRatio = sorted[0][1] / results.length;
  if (maxRatio > 0.4) {
    console.log(`  🔴 ${sorted[0][0]}에 ${(maxRatio * 100).toFixed(0)}% 쏠림 — 임계값 조정 필요`);
  } else {
    console.log(`  🟢 페르소나 분포 양호 (최대 ${(maxRatio * 100).toFixed(0)}%)`);
  }

  // 70+ 도달 불가 차원
  for (const dim of dims) {
    const over70 = results.filter(r => r.scores[dim] >= 70).length;
    if (over70 === 0) {
      console.log(`  🟡 ${dim}: 70점 이상 도달자 0명 — threshold(${Math.ceil(DIMENSION_PATTERNS[dim].length * 0.7)}) 하향 검토`);
    }
  }

  // minimalist 비율
  const minimalistCount = personaCounts["minimalist"] ?? 0;
  if (minimalistCount / results.length > 0.5) {
    console.log(`  🔴 minimalist ${((minimalistCount / results.length) * 100).toFixed(0)}% — max<25 기준 하향 검토`);
  }

  console.log("");
}

run();
