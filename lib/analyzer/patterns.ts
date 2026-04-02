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
    /launchd|systemd/gi,
    /clasp\s+push/gi,
  ],

  // 제어 성향 — 금지, 규칙, 경고 등 강한 지시어
  control: [
    /금지|하지\s*마|절대/gi,
    /반드시|필수|항상/gi,
    /확인.*후|승인/gi,
    /절대.*안|안.*됨/gi,
    /MUST|NEVER|ALWAYS/gi,
    /IMPORTANT|CRITICAL/gi,
    /규칙|rule/gi,
    /주의|경고|WARNING/gi,
  ],

  // 도구 다양성 — 사용하는 외부 서비스/툴 종류
  toolDiversity: [
    /slack/gi,
    /notion/gi,
    /google\s*(sheets?|drive|calendar|workspace)/gi,
    /github/gi,
    /supabase/gi,
    /vercel/gi,
    /linear/gi,
    /figma/gi,
    /jira/gi,
    /confluence/gi,
    /docker/gi,
    /aws|gcp|azure/gi,
    /postgres|mysql|redis/gi,
    /graphql|rest\s*api/gi,
    /next\.?js|react|vue|svelte/gi,
    /python|node|go|rust/gi,
    /terraform|kubernetes|k8s/gi,
  ],

  // MD 성숙도 — 구조화 수준, 메모리·컨텍스트 관리 여부
  maturity: [
    /^#{1,3}\s+/gm,
    /memory|메모리/gi,
    /프로젝트.*CLAUDE|project.*claude/gi,
    /피드백|feedback/gi,
    /컨텍스트|context/gi,
    /세션|session/gi,
    /```/g,
    /\|.*\|.*\|/g,
  ],

  // 협업 지향 — 팀워크, 코드 리뷰, 컨벤션 관련
  collaboration: [
    /팀|team/gi,
    /코드\s*리뷰|code\s*review/gi,
    /PR|pull\s*request/gi,
    /컨벤션|convention/gi,
    /린트|lint|eslint|prettier/gi,
    /브랜치|branch/gi,
    /merge|머지/gi,
    /동료|peer/gi,
  ],

  // 보안 의식 — 민감 정보 보호, 환경 변수, 인증 관련
  security: [
    /\.env/gi,
    /api\s*키|api.?key|token|토큰/gi,
    /민감|sensitive|secret/gi,
    /비밀번호|password|credential/gi,
    /커밋.*금지|커밋.*하지/gi,
    /권한|permission|auth/gi,
    /암호화|encrypt/gi,
    /보안|security/gi,
  ],
};

/**
 * 텍스트에서 패턴 목록의 총 매칭 횟수를 센다
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
