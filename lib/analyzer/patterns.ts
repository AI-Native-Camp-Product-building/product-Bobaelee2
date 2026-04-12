/**
 * 7개 차원별 패턴 정의 및 도구명 추출 유틸리티
 * 각 RegExp는 CLAUDE.md 텍스트에서 해당 차원의 신호를 감지한다
 */

import type { AxisKey } from '../v2-types';

/** 차원별 정규식 패턴 목록 */
export const DIMENSION_PATTERNS: Record<string, RegExp[]> = {
  // 자동화 성향 — 스크립트, 봇, 배포 자동화 관련 키워드
  automation: [
    /hooks?[^a-z]/gi,
    /cron|schedule|스케줄/gi,
    /자동|auto(?:mat)/gi,
    /script|스크립트/gi,
    /deploy|배포/gi,
    /bot|봇/gi,
    /pipeline|파이프라인/gi,
    /webhook/gi,
    /ci[\\/\-]?cd|github[\s._-]?action/gi,
    /workflow|trigger|트리거/gi,
    /pre-commit|husky/gi,
    /terraform|ansible|pulumi/gi,
    /clasp\s+push/gi,
    /rollback|복구/gi,                        // agentOrchestration에서 이동 — 운영 자동화
    /반드시.*후.*배포|deploy.*후.*반드시/gi,    // agentOrchestration에서 이동 — 배포 절차
  ],

  // 제어 성향 — AI 사용 스타일 제어 (응답 형식, 코딩 스타일, 행동 제약)
  // 보안 맥락(커밋/secret/.env/token/push)은 negative lookahead로 제외
  control: [
    // 응답/출력 형식 제어
    /한국어로|korean|영어로|english/gi,
    /간결하게|짧게|concise|brief/gi,
    /이모지|emoji/gi,
    /마크다운|markdown|포맷/gi,
    // 코딩 스타일 강제 (teamImpact에서 이동: 팀 협업보다 스타일 규칙)
    /컨벤션|convention|naming/gi,
    /린트|lint|eslint|prettier/gi,
    /타입.*annotation|타입.*주석/gi,
    /주석.*필수|comment.*필수/gi,
    // 행동 제약 (보안/배포 맥락 제외)
    /확인.*후.*진행|승인.*후.*진행|before.*proceed/gi,
    /DO\s*NOT(?!.*secret)(?!.*\.env)(?!.*token)(?!.*credential)/gi,
    /(?<!커밋.{0,30})(?<!\.env.{0,30})(?<!push.{0,30})(?<!secret.{0,30})(?<!token.{0,30})금지(?!.{0,30}커밋)(?!.{0,30}\.env)(?!.{0,30}push)(?!.{0,30}secret)(?!.{0,30}token)/gi,
    /MUST(?!.*commit)(?!.*secret)(?!.*\.env)(?!.*token)/gi,
    // 비개발자도 쓰는 제어 표현
    /형식|format|양식/gi,
    /톤|tone|말투/gi,
    /대상.*설명|쉽게.*설명/gi,
  ],

  // 도구 다양성 — 사용하는 외부 서비스/SaaS 종류 (프로그래밍 언어/프레임워크 제외)
  toolDiversity: [
    /slack/gi,
    /notion/gi,
    /google\s*sheets?/gi,
    /google\s*(drive|calendar|workspace)/gi,
    /github/gi,
    /supabase/gi,
    /vercel/gi,
    /linear/gi,
    /figma/gi,
    /jira/gi,
    /confluence/gi,
    /docker/gi,
    /aws|gcp|azure/gi,
    /sentry|datadog|grafana/gi,
    /stripe|paddle/gi,
    /trello|asana|monday/gi,
    /airtable|miro|excalidraw/gi,
    /postman|insomnia/gi,
    /cloudflare|railway/gi,
    /zapier|n8n\b/gi,
  ],

  // 컨텍스트 관리 — 메모리, 세션, 피드백 등 컨텍스트 관리 성향
  contextAwareness: [
    /memory|메모리/gi,
    /프로젝트.*CLAUDE|project.*claude/gi,
    /컨텍스트|context/gi,
    /세션|session/gi,
    /피드백|feedback/gi,
    /\.claude\/rules/gi,
    /@[\.\~\/][^\s]+\.md/g,
    /CLAUDE\.local\.md/gi,
    /compact|컴팩트/gi,
    /subagent|서브에이전트|task\(/gi,
    /handoff|핸드오프|이전\s*세션/gi,
    /요약|summarize|히스토리/gi,
    /프로젝트|project/gi,
    /배경|background/gi,
  ],

  // 팀 임팩트 — 팀 기여, 코드 리뷰, 온보딩, 지식 공유
  // convention/lint는 코딩 스타일 강제(→control), documentation은 팀 맥락으로 한정
  teamImpact: [
    /팀|team/gi,
    /코드\s*리뷰|code\s*review/gi,
    /\bPR\b|pull\s*request/gi,
    /브랜치|branch/gi,
    /merge|머지/gi,
    /동료|peer/gi,
    /온보딩|onboard|신규\s*입사/gi,
    /공유|share|전파/gi,
    /팀.*문서|docs.*contribut|CONTRIBUTING/gi,
    /멘토|mentor/gi,
    /리뷰어|reviewer|CODEOWNERS/gi,
    /스탠드업|standup|회고|retro/gi,
    /회의|meeting|미팅/gi,
    /주간.*보고|팀.*리포트|보고서/gi,
  ],

  // 보안 의식 — 민감 정보 보호, 환경 변수, 인증 관련
  security: [
    /\.env/gi,
    /api\s*키|api.?key|\btoken\b|토큰/gi,
    /민감|sensitive|\bsecret\b/gi,
    /비밀번호|password|credential/gi,
    /커밋.*금��|커밋.*하지/gi,
    /권한|permission|\bauth\b/gi,
    /암호화|encrypt/gi,
    /보���|security/gi,
    /gitignore|deny|차단/gi,
    /취약|vulnerability|CVE/gi,
    /실수로.*커밋|실패.*경험/gi,              // agentOrchestration에서 이동 — 보안 실수 언급
  ],

  // 자율 에이전트 오케스트레이션 — 에이전트 루프, 가드레일, 자율 판단 위임
  agentOrchestration: [
    // 자율 실행 구조
    /autonomous|자율\s*에이전트|agent\s*loop/gi,
    /iteration|이터레이션|반복\s*실행/gi,
    /fresh\s*(instance|context)|clean\s*context/gi,
    // 안전장치
    /stop\s*condition|중단\s*조건/gi,
    /dry[\s-]?run|사전\s*테스트/gi,
    // 메모리 아키텍처
    /progress\.txt|progress\s*log/gi,
    /cross[\s-]?iteration|이전\s*이터레이션/gi,
    /pattern\s*consolidat|패턴\s*축적/gi,
    // 스코프/위임
    /한\s*번에\s*하나|one\s*(story|task)\s*per/gi,
    /context\s*window|컨텍스트\s*윈도우/gi,
    /병렬\s*(에이전트|처리|실행)|parallel\s*agent/gi,
    /권한\s*위임|자율.*실행.*확인\s*불필요/gi,
    // 신규 — 일반 사용자도 히트 가능한 패턴
    /알아서|스스로\s*판단/gi,
    /자동.*모드|auto.*mode/gi,
    /에이전트|agent(?!s\.md)/gi,
  ],
};

// --- v2 5축 매핑 ---

/** 패턴 → 5축 매핑 방향 */
export interface AxisMapping {
  axis: AxisKey;
  direction: 'a' | 'b';  // a = 첫 번째 방향, b = 두 번째 방향
}

/**
 * 각 차원의 패턴을 v2 5축에 매핑한다.
 * 키 형식: "차원명:인덱스" (예: "automation:0")
 *
 * 매핑 규칙:
 * - automation → harness:b (하네스/수렴) hooks/pipeline/workflow류, plan:b (실행) script/deploy/cron류
 * - control → control:a (통제/R)
 * - toolDiversity → harness:a (하기스/발산)
 * - contextAwareness → plan:a (설계/P) 및/또는 harness:b (하네스/수렴)
 * - teamImpact → 매핑 안함
 * - security → control:a (통제/R)
 * - agentOrchestration → harness:b (하네스/수렴) + plan:a (설계/P)
 */
export const PATTERN_AXIS_MAP: Record<string, AxisMapping[]> = {
  // --- automation (15개) ---
  // 0: hooks?[^a-z] → harness:b (수렴 — 빌드 자동화)
  'automation:0': [{ axis: 'harness', direction: 'b' }],
  // 1: cron|schedule|스케줄 → plan:b (실행)
  'automation:1': [{ axis: 'plan', direction: 'b' }],
  // 2: 자동|auto(?:mat) → plan:b (실행)
  'automation:2': [{ axis: 'plan', direction: 'b' }],
  // 3: script|스크립트 → plan:b (실행)
  'automation:3': [{ axis: 'plan', direction: 'b' }],
  // 4: deploy|배포 → plan:b (실행)
  'automation:4': [{ axis: 'plan', direction: 'b' }],
  // 5: bot|봇 → harness:b (수렴 — 봇 구축)
  'automation:5': [{ axis: 'harness', direction: 'b' }],
  // 6: pipeline|파이프라인 → harness:b (수렴)
  'automation:6': [{ axis: 'harness', direction: 'b' }],
  // 7: webhook → harness:b (수렴)
  'automation:7': [{ axis: 'harness', direction: 'b' }],
  // 8: ci/cd|github action → harness:b (수렴)
  'automation:8': [{ axis: 'harness', direction: 'b' }],
  // 9: workflow|trigger|트리거 → harness:b (수렴)
  'automation:9': [{ axis: 'harness', direction: 'b' }],
  // 10: pre-commit|husky → harness:b (수렴)
  'automation:10': [{ axis: 'harness', direction: 'b' }],
  // 11: terraform|ansible|pulumi → harness:b (수렴)
  'automation:11': [{ axis: 'harness', direction: 'b' }],
  // 12: clasp push → plan:b (실행/배포)
  'automation:12': [{ axis: 'plan', direction: 'b' }],
  // 13: rollback|복구 → plan:b (실행/운영)
  'automation:13': [{ axis: 'plan', direction: 'b' }],
  // 14: 반드시.*후.*배포 → plan:b (실행/배포 절차)
  'automation:14': [{ axis: 'plan', direction: 'b' }],

  // --- control (15개) → control:a (통제/R) ---
  'control:0': [{ axis: 'control', direction: 'a' }],
  'control:1': [{ axis: 'control', direction: 'a' }],
  'control:2': [{ axis: 'control', direction: 'a' }],
  'control:3': [{ axis: 'control', direction: 'a' }],
  'control:4': [{ axis: 'control', direction: 'a' }],
  'control:5': [{ axis: 'control', direction: 'a' }],
  'control:6': [{ axis: 'control', direction: 'a' }],
  'control:7': [{ axis: 'control', direction: 'a' }],
  'control:8': [{ axis: 'control', direction: 'a' }],
  'control:9': [{ axis: 'control', direction: 'a' }],
  'control:10': [{ axis: 'control', direction: 'a' }],
  'control:11': [{ axis: 'control', direction: 'a' }],
  'control:12': [{ axis: 'control', direction: 'a' }],
  'control:13': [{ axis: 'control', direction: 'a' }],
  'control:14': [{ axis: 'control', direction: 'a' }],

  // --- toolDiversity (20개) → harness:a (하기스/발산) ---
  'toolDiversity:0': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:1': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:2': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:3': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:4': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:5': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:6': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:7': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:8': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:9': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:10': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:11': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:12': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:13': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:14': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:15': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:16': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:17': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:18': [{ axis: 'harness', direction: 'a' }],
  'toolDiversity:19': [{ axis: 'harness', direction: 'a' }],

  // --- contextAwareness (14개) → plan:a (설계/P) 및/또는 harness:b (하네스/수렴) ---
  // 0: memory|메모리 → plan:a (설계)
  'contextAwareness:0': [{ axis: 'plan', direction: 'a' }],
  // 1: 프로젝트.*CLAUDE → plan:a (설계) + harness:b (수렴)
  'contextAwareness:1': [{ axis: 'plan', direction: 'a' }, { axis: 'harness', direction: 'b' }],
  // 2: 컨텍스트|context → plan:a (설계)
  'contextAwareness:2': [{ axis: 'plan', direction: 'a' }],
  // 3: 세션|session → plan:a (설계)
  'contextAwareness:3': [{ axis: 'plan', direction: 'a' }],
  // 4: 피드백|feedback → plan:a (설계)
  'contextAwareness:4': [{ axis: 'plan', direction: 'a' }],
  // 5: .claude/rules → harness:b (수렴)
  'contextAwareness:5': [{ axis: 'harness', direction: 'b' }],
  // 6: @참조.md → plan:a (설계)
  'contextAwareness:6': [{ axis: 'plan', direction: 'a' }],
  // 7: CLAUDE.local.md → harness:b (수렴)
  'contextAwareness:7': [{ axis: 'harness', direction: 'b' }],
  // 8: compact|컴팩트 → plan:a (설계)
  'contextAwareness:8': [{ axis: 'plan', direction: 'a' }],
  // 9: subagent|서브에이전트 → harness:b (수렴)
  'contextAwareness:9': [{ axis: 'harness', direction: 'b' }],
  // 10: handoff|핸드오프 → plan:a (설계)
  'contextAwareness:10': [{ axis: 'plan', direction: 'a' }],
  // 11: 요약|summarize → plan:a (설계)
  'contextAwareness:11': [{ axis: 'plan', direction: 'a' }],
  // 12: 프로젝트|project → plan:a (설계)
  'contextAwareness:12': [{ axis: 'plan', direction: 'a' }],
  // 13: 배경|background → plan:a (설계)
  'contextAwareness:13': [{ axis: 'plan', direction: 'a' }],

  // --- teamImpact (14개) → 매핑 안함 (skip) ---
  // teamImpact 패턴은 v2 5축에 매핑하지 않는다

  // --- security (11개) → control:a (통제/R) ---
  'security:0': [{ axis: 'control', direction: 'a' }],
  'security:1': [{ axis: 'control', direction: 'a' }],
  'security:2': [{ axis: 'control', direction: 'a' }],
  'security:3': [{ axis: 'control', direction: 'a' }],
  'security:4': [{ axis: 'control', direction: 'a' }],
  'security:5': [{ axis: 'control', direction: 'a' }],
  'security:6': [{ axis: 'control', direction: 'a' }],
  'security:7': [{ axis: 'control', direction: 'a' }],
  'security:8': [{ axis: 'control', direction: 'a' }],
  'security:9': [{ axis: 'control', direction: 'a' }],
  'security:10': [{ axis: 'control', direction: 'a' }],

  // --- agentOrchestration (15개) → harness:b (하네스/수렴) + plan:a (설계/P) ---
  'agentOrchestration:0': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:1': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:2': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:3': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:4': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:5': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:6': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:7': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:8': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:9': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:10': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:11': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:12': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:13': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
  'agentOrchestration:14': [{ axis: 'harness', direction: 'b' }, { axis: 'plan', direction: 'a' }],
};

/**
 * 텍스트에서 v2 5축별 시그널 수를 카운트한다.
 * DIMENSION_PATTERNS의 각 패턴을 PATTERN_AXIS_MAP을 통해 5축으로 변환한다.
 */
export function countAxisSignals(
  text: string,
  stats: import('../types').MdStats
): Record<AxisKey, { a: number; b: number }> {
  // 초기 카운트
  const counts: Record<AxisKey, { a: number; b: number }> = {
    harness: { a: 0, b: 0 },
    control: { a: 0, b: 0 },
    verbose: { a: 0, b: 0 },
    plan: { a: 0, b: 0 },
  };

  // DIMENSION_PATTERNS 순회
  for (const [dim, patterns] of Object.entries(DIMENSION_PATTERNS)) {
    for (let i = 0; i < patterns.length; i++) {
      const key = `${dim}:${i}`;
      const mappings = PATTERN_AXIS_MAP[key];
      if (!mappings) continue;

      const pattern = new RegExp(patterns[i].source, patterns[i].flags);
      if (pattern.test(text)) {
        for (const mapping of mappings) {
          counts[mapping.axis][mapping.direction] += 1;
        }
      }
    }
  }

  // 확장 입력 보너스 시그널
  if (stats.isExpandedInput) {
    // 플러그인 수 → harness:a (많을수록 하기스/탐색 성향)
    if (stats.pluginCount >= 5) counts.harness.a += 1;
    // Hook 수 → harness:b (많을수록 하네스/구축 성향)
    if (stats.hookCount >= 3) counts.harness.b += 1;
    // 직접 만든 스킬 → harness:b (구축)
    if (stats.userSkillCount >= 2) counts.harness.b += 1;
    // MCP 서버 다수 → harness:a (탐색)
    if (stats.mcpServerCount >= 3) counts.harness.a += 1;
  }

  return counts;
}

/**
 * verbose 축 판정 — CLAUDE.md 줄 수 기반
 * 긴 텍스트(threshold 초과) → a(장황/V), 짧은 텍스트 → b(간결/C)
 */
export function judgeVerboseAxis(stats: import('../types').MdStats): { a: number; b: number } {
  const threshold = stats.isExpandedInput ? 100 : 30;
  return stats.claudeMdLines > threshold
    ? { a: 1, b: 0 }
    : { a: 0, b: 1 };
}

/**
 * structure 축 판정 — 헤딩/리스트 비율 기반
 * 헤딩 3개 이상 또는 리스트 비율 20% 이상 → a(구조화/S), 아니면 → b(자유형/F)
 */
export function judgeStructureAxis(text: string): { a: number; b: number } {
  const lines = text.split('\n');
  const headingCount = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  const listCount = lines.filter(l => /^\s*[-*]\s/.test(l) || /^\s*\d+\.\s/.test(l)).length;
  const listRatio = lines.length > 0 ? listCount / lines.length : 0;
  const isStructured = headingCount >= 3 || listRatio >= 0.2;
  return isStructured ? { a: 1, b: 0 } : { a: 0, b: 1 };
}

/**
 * control 축 보조 판정 — settings.json 분석 기반
 * deny 규칙/plan 모드 → a(통제/R), bypass/auto 모드 → b(위임/D)
 */
export function judgeControlFromSettings(text: string): { a: number; b: number } {
  const hasBypass = /bypassPermissions|"auto"/i.test(text);
  const hasPlan = /"plan"|"default"/i.test(text);
  const denyCount = (text.match(/deny/gi) || []).length;
  let a = denyCount > 0 ? 1 : 0;
  if (hasPlan) a += 1;
  let b = hasBypass ? 1 : 0;
  return { a, b };
}

/**
 * 텍스트에서 패턴 목록의 총 매칭 횟수를 센다 (통계 표시용)
 * @param text 분석할 텍스트
 * @param patterns 정규식 패턴 배열
 * @returns 총 매칭 횟수
 */
export function countPatternMatches(text: string, patterns: RegExp[]): number {
  if (!text) return 0;

  let total = 0;
  for (const pattern of patterns) {
    // 글로벌 플래그 초기화 (lastIndex 리셋)
    const cloned = new RegExp(pattern.source, pattern.flags);
    const matches = text.match(cloned);
    if (matches) {
      total += matches.length;
    }
  }
  return total;
}

/**
 * 텍스트에서 매칭되는 고유 패턴 수를 센다 (점수 산출용)
 * 각 패턴은 매칭 여부(0 또는 1)만 카운트 — 반복 횟수 무시
 * @param text 분석할 텍스트
 * @param patterns 정규식 패턴 배열
 * @returns 매칭된 고유 패턴 수
 */
export function countUniqueSignals(text: string, patterns: RegExp[]): number {
  if (!text) return 0;

  let total = 0;
  for (const pattern of patterns) {
    const cloned = new RegExp(pattern.source, pattern.flags);
    if (cloned.test(text)) total += 1;
  }
  return total;
}

/** 도구명 → 감지 패턴 매핑 */
export const TOOL_NAMES: Record<string, RegExp> = {
  Slack: /slack/gi,
  Notion: /notion/gi,
  "Google Sheets": /google\s*sheets?/gi,
  "Google Drive": /google\s*drive/gi,
  "Google Calendar": /google\s*calendar/gi,
  GitHub: /github/gi,
  Supabase: /supabase/gi,
  Vercel: /vercel/gi,
  Linear: /linear/gi,
  Figma: /figma/gi,
  Jira: /jira/gi,
  Confluence: /confluence/gi,
  Docker: /docker/gi,
  "AWS/GCP/Azure": /aws|gcp|azure/gi,
  Trello: /trello/gi,
  Asana: /asana/gi,
  Airtable: /airtable/gi,
  Miro: /miro/gi,
  Postman: /postman/gi,
  Cloudflare: /cloudflare/gi,
  "Next.js": /next\.?js/gi,
  Python: /python/gi,
  "Node.js": /node\.?js|nodejs/gi,
};

/**
 * 텍스트에서 언급된 도구 이름 목록을 추출한다
 * @param text 분석할 텍스트
 * @returns 감지된 도구명 배열 (중복 없음)
 */
export function extractToolNames(text: string): string[] {
  if (!text) return [];

  const found: string[] = [];
  for (const [name, pattern] of Object.entries(TOOL_NAMES)) {
    const cloned = new RegExp(pattern.source, pattern.flags);
    if (cloned.test(text)) {
      found.push(name);
    }
  }
  return found;
}

// --- 확장 수집 입력 파싱 유틸리티 ---

/**
 * 전체 수집 입력인지 감지한다 (=== settings.json === 등 구분자 존재 여부)
 */
export function isExpandedInput(text: string): boolean {
  return /^===\s+(settings\.json|mcp_settings\.json|commands|PROJECT MEMORY|.*AGENTS\.md)/m.test(text);
}

/**
 * settings.json의 enabledPlugins에서 활성화된(true) 플러그인 이름을 추출한다
 */
export function extractEnabledPlugins(text: string): string[] {
  const plugins: string[] = [];
  // "pluginName@marketplace": true 패턴 매칭
  const matches = text.matchAll(/"([^"]+)@[^"]+"\s*:\s*true/g);
  for (const m of matches) {
    plugins.push(m[1]);
  }
  return plugins;
}

/**
 * mcp_settings.json 또는 settings.json에서 MCP 서버 이름을 추출한다
 */
export function extractMcpServerNames(text: string): string[] {
  const servers: string[] = [];
  // mcpServers 블록 내 키 이름 매칭 — 중첩 깊이 추적으로 블록 전체를 캡처
  const mcpStart = text.match(/"mcpServers"\s*:\s*\{/);
  if (mcpStart && mcpStart.index !== undefined) {
    let depth = 1;
    const startIdx = mcpStart.index + mcpStart[0].length;
    let endIdx = startIdx;
    for (let i = startIdx; i < text.length && depth > 0; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") depth--;
      endIdx = i;
    }
    const mcpContent = text.slice(startIdx, endIdx);
    // 최상위 키만 추출 (깊이 0에서 "키": { 패턴)
    const keyMatches = mcpContent.matchAll(/"([^"]+)"\s*:\s*\{/g);
    for (const m of keyMatches) {
      servers.push(m[1]);
    }
  }
  // MCP 도구 권한에서도 추출: mcp__서버명__* 패턴
  const mcpPermMatches = text.matchAll(/mcp__([^_]+?)__/g);
  const fromPerms = new Set<string>();
  for (const m of mcpPermMatches) {
    fromPerms.add(m[1].replace(/_/g, " "));
  }
  return [...new Set([...servers, ...fromPerms])];
}

/**
 * commands 섹션에서 커스텀 명령어 파일명을 추출한다
 */
export function extractCommandNames(text: string): string[] {
  const commands: string[] = [];
  // === commands === 다음 줄부터 다음 === 전까지의 .md 파일명
  const cmdSection = text.match(/===\s*commands\s*===\n([\s\S]*?)(?:===|$)/);
  if (cmdSection) {
    const lines = cmdSection[1].trim().split("\n");
    for (const line of lines) {
      const name = line.trim().replace(/\.md$/, "");
      if (name && name !== "") {
        commands.push(name);
      }
    }
  }
  return commands;
}

/**
 * settings.json의 hooks 섹션에서 hook 이벤트 수를 계산한다
 */
export function countHooks(text: string): number {
  let count = 0;
  const hookEvents = text.matchAll(/"(PreToolUse|PostToolUse|PreSendMessage|PostSendMessage|SessionEnd|SessionStart|Stop)"\s*:/g);
  for (const _ of hookEvents) {
    count++;
  }
  return count;
}

// --- 구조화된 데이터 심층 분석 ---

/** 확장 입력에서 차원별 보너스 점수를 계산한다 */
export interface ExpandedSignals {
  // 보안 신호
  hasDenyRules: boolean;           // permissions.deny가 있는지
  denyCount: number;               // deny 규칙 수
  blocksDangerousOps: boolean;     // rm -rf, force push 등 차단 여부
  hasPreToolUseHook: boolean;      // PreToolUse hook (실수 사전 차단)
  defaultModeIsAuto: boolean;      // defaultMode: "auto" 여부
  // 자동화 신호
  hasPostToolUseHook: boolean;     // PostToolUse hook (후처리 자동화)
  hasSessionHooks: boolean;        // SessionEnd/SessionStart/Stop hook
  hookTypePromptCount: number;     // "type": "prompt" hook 수 (AI 판단 hook)
  hookTypeCommandCount: number;    // "type": "command" hook 수 (셸 실행 hook)
  // 성숙도 신호
  hasStatusLine: boolean;          // 커스텀 statusLine 설정
  hasMultipleMarketplaces: boolean;// 여러 플러그인 마켓플레이스 사용
  pluginEnabledRatio: number;      // 활성/설치 비율 (선별적 사용 = 성숙)
  projectMdCount: number;          // 프로젝트별 CLAUDE.md 파일 수
}

/**
 * 확장 수집 데이터의 skills 섹션에서 스킬 수를 추출한다
 * 섹션이 없거나 비어있으면 0을 반환한다
 */
export function extractSkillCount(text: string): number {
  return extractSkillNames(text).length;
}

/** 스킬 이름 목록을 반환한다 (분류기에서 레지스트리 매칭에 사용) */
export function extractSkillNames(text: string): string[] {
  const skillSection = text.match(/===\s*skills\s*===\n([\s\S]*?)(?=\n===|$)/);
  if (!skillSection) return [];
  return skillSection[1]
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !/^===/.test(l.trim()))
    .map((l) => l.trim());
}

/**
 * 확장 수집 데이터의 agents 섹션에서 에이전트 수를 추출한다
 * ~/.claude/agents 하위의 .md 파일 수에 대응
 */
export function extractAgentCount(text: string): number {
  const section = text.match(/===\s*agents\s*===\n([\s\S]*?)(?=\n===|$)/);
  if (!section) return 0;
  return section[1]
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !/^===/.test(l.trim()))
    .length;
}

/**
 * 플러그인이 설치한 스킬 수를 추출한다 (=== plugin-skills === 섹션)
 * 이 수치를 전체 skillCount에서 빼면 직접 만든 스킬 수를 알 수 있다
 */
export function extractPluginSkillCount(text: string): number {
  const section = text.match(/===\s*plugin-skills\s*===\n([\s\S]*?)(?=\n===|$)/);
  if (!section) return 0;
  return section[1]
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !/^===/.test(l.trim()))
    .length;
}

/**
 * 플러그인이 설치한 에이전트 수를 추출한다 (=== plugin-agents === 섹션)
 */
export function extractPluginAgentCount(text: string): number {
  const section = text.match(/===\s*plugin-agents\s*===\n([\s\S]*?)(?=\n===|$)/);
  if (!section) return 0;
  return section[1]
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !/^===/.test(l.trim()))
    .length;
}

/**
 * 확장 수집 데이터에서 구조화된 신호를 추출한다
 */
export function extractExpandedSignals(text: string): ExpandedSignals {
  // permissions.deny 분석
  const denyMatches = text.match(/"deny"\s*:\s*\[([\s\S]*?)\]/);
  const denyContent = denyMatches?.[1] ?? "";
  const denyItems = denyContent.match(/"[^"]+"/g) ?? [];
  const denyCount = denyItems.length;
  const blocksDangerousOps = /rm\s+-rf|force|reset\s+--hard|checkout\s+\./i.test(denyContent);

  // defaultMode 분석
  const defaultModeIsAuto = /"defaultMode"\s*:\s*"auto"/.test(text);

  // hook 유형 분석
  const hasPreToolUseHook = /"PreToolUse"\s*:/.test(text);
  const hasPostToolUseHook = /"PostToolUse"\s*:/.test(text);
  const hasSessionHooks = /"(SessionEnd|SessionStart|Stop)"\s*:/.test(text);
  const hookTypePromptCount = (text.match(/"type"\s*:\s*"prompt"/g) ?? []).length;
  const hookTypeCommandCount = (text.match(/"type"\s*:\s*"command"/g) ?? []).length;

  // 성숙도 신호
  const hasStatusLine = /"statusLine"\s*:/.test(text);
  const hasMultipleMarketplaces = /"extraKnownMarketplaces"\s*:/.test(text);

  // 플러그인 활성/설치 비율
  const enabledCount = (text.match(/"[^"]+@[^"]+"\s*:\s*true/g) ?? []).length;
  const totalPluginEntries = (text.match(/"[^"]+@[^"]+"\s*:\s*(true|false)/g) ?? []).length;
  const pluginEnabledRatio = totalPluginEntries > 0 ? enabledCount / totalPluginEntries : 0;

  // 프로젝트 CLAUDE.md 파일 수
  const projectMdMatches = text.match(/===\s+\/[^\n]*CLAUDE\.md\s*===/g) ?? [];
  const projectMdCount = projectMdMatches.length;

  return {
    hasDenyRules: denyCount > 0,
    denyCount,
    blocksDangerousOps,
    hasPreToolUseHook,
    defaultModeIsAuto,
    hasPostToolUseHook,
    hasSessionHooks,
    hookTypePromptCount,
    hookTypeCommandCount,
    hasStatusLine,
    hasMultipleMarketplaces,
    pluginEnabledRatio,
    projectMdCount,
  };
}
