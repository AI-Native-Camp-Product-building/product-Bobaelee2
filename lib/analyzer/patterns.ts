/**
 * 6개 차원별 패턴 정의 및 도구명 추출 유틸리티
 * 각 RegExp는 CLAUDE.md 텍스트에서 해당 차원의 신호를 감지한다
 */

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
  ],

  // 제어 성향 — 금지, 규칙, 경고 등 강한 지시어
  control: [
    /금지|하지\s*말?|절대/gi,
    /반드시|필수|항상/gi,
    /확인.*후|승인/gi,
    /절대.*안|안.*됨|하면\s*안/gi,
    /MUST|NEVER|ALWAYS/gi,
    /IMPORTANT|CRITICAL/gi,
    /DO\s*NOT|FORBIDDEN|PROHIBITED/gi,
    /mandatory|required|SHALL\s*NOT/gi,
    /규칙|\brule\b/gi,
    /주의|경고|WARNING|제약|constraints?/gi,
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
  ],

  // 팀 임팩트 — 팀 기여, 코드 리뷰, 컨벤션, 온보딩, 지식 공유
  teamImpact: [
    /팀|team/gi,
    /코드\s*리뷰|code\s*review/gi,
    /\bPR\b|pull\s*request/gi,
    /컨벤션|convention/gi,
    /린트|lint|eslint|prettier/gi,
    /브랜치|branch/gi,
    /merge|머지/gi,
    /동료|peer/gi,
    /온보딩|onboard|신규\s*입사/gi,
    /공유|share|전파/gi,
    /문서화|documentation/gi,
    /멘토|mentor/gi,
    /리뷰어|reviewer|CODEOWNERS/gi,
    /스탠드업|standup|회고|retro/gi,
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
  ],
};

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
