/**
 * md력 품질 5개 차원 측정 엔진
 * 성향(scorer.ts)과 완전 분리 — md력은 순수 CLAUDE.md 품질만 평가
 */
import type { QualityScores, MdStats } from "@/lib/types";

/**
 * 차원 1: 실행 가능성 (Actionability) — 0~100
 * Claude가 바로 실행할 수 있는 구체적 정보의 존재와 품질
 */
function scoreActionability(md: string, stats: MdStats): number {
  let score = 0;

  // A. 백틱 안의 실행 가능한 커맨드 (최대 40점)
  const inlineCommands = md.match(
    /`[^`]*(?:npm|yarn|pnpm|bun|uv|pip|cargo|make|go |docker|git )[^`]*`/gi
  ) ?? [];
  const codeBlockCommands = md.match(
    /```[\s\S]*?(?:npm|yarn|pnpm|bun|uv|pip|cargo|make|go |docker|git )[\s\S]*?```/gi
  ) ?? [];
  const commandCount = new Set([
    ...inlineCommands.map(c => c.toLowerCase().trim()),
    ...codeBlockCommands.map(c => c.toLowerCase().trim()),
  ]).size;

  if (commandCount >= 5) score += 40;
  else if (commandCount >= 3) score += 30;
  else if (commandCount >= 1) score += 15;

  // B. 아키텍처 경로 + 역할 설명 (최대 25점)
  const pathWithRole = md.match(
    /[`\/](?:src|app|lib|components|pages|handlers?|services?|models?|schemas?|db|api|routes?|middleware|utils?|core)[\/\w]*[`]?\s*[→\-:—]\s*\S+/gi
  ) ?? [];
  const pathOnly = md.match(
    /(?:^|\s)[`\/](?:src|app|lib|components|pages)[\/\w]*/gm
  ) ?? [];
  const archPaths = Math.max(pathWithRole.length, pathOnly.length);

  if (pathWithRole.length >= 3) score += 25;
  else if (archPaths >= 5) score += 25;
  else if (archPaths >= 3) score += 20;
  else if (archPaths >= 1) score += 10;

  // C. 검증 루프 (최대 20점)
  // ※ Safety의 "검증 의무화"와 의도적으로 중복 — 실행 가능성과 방어력 두 관점에서 모두 가치
  const hasVerifyLoop =
    /(?:반드시|항상|always|must)\s.*(?:실행|run|확인|check|verify|typecheck)/gi.test(md) ||
    /before\s+(?:commit|push|merge|ship|considering|submit)/gi.test(md) ||
    /(?:완료|done|finish).*(?:전에|before).*(?:test|lint|typecheck|check)/gi.test(md);
  if (hasVerifyLoop) score += 20;

  // D. 환경 설정 정보 (최대 15점)
  const hasEnvInfo = /(?:env|환경\s*변수|required.*var|\.env)/gi.test(md);
  const hasServiceInfo = /(?:requires?|필요|needs?).*(?:running|실행|서비스|service|started)/gi.test(md);
  if (hasEnvInfo && hasServiceInfo) score += 15;
  else if (hasEnvInfo || hasServiceInfo) score += 7;

  return Math.min(100, score);
}

/**
 * 차원 2: 간결성 (Conciseness) — 0~100
 * 정보 밀도. 짧으면서 실행 가능한 지시가 많으면 높은 점수.
 */
function scoreConciseness(md: string, stats: MdStats, actionabilityScore: number): number {
  let score = 0;

  // A. 길이 점수 — 역U자 커브 (최대 50점)
  // 확장 입력(B경로)에서는 CLAUDE.md 섹션만의 줄 수로 측정
  const lines = stats.claudeMdLines;
  if (lines <= 5) score += 10;
  else if (lines <= 15) score += 30;
  else if (lines <= 50) score += 50;       // 스위트 스팟
  else if (lines <= 80) score += 45;
  else if (lines <= 150) score += 30;
  else if (lines <= 250) score += 15;
  else score += 5;                          // 251줄+ 과잉

  // B. 노이즈 감점 (최대 -30점)
  const trivialPatterns = [
    /clean\s*code|readable|잘\s*작성|가독성\s*높/gi,
    /주석을?\s*달|add\s*comments/gi,
    /indent|spacing|세미콜론|semicolon|tab.*space|space.*tab/gi,
    /좋은\s*코드|good\s*code|best\s*practice/gi,
    /DRY|SOLID|KISS/g,
    /깔끔하게|예쁘게|보기\s*좋게/gi,
    /정중하게|친절하게|공손하게/gi,
    /자세하게|상세하게/gi,
  ];
  let noisePenalty = 0;
  for (const pattern of trivialPatterns) {
    if (pattern.test(md)) noisePenalty += 5;
  }
  score -= Math.min(30, noisePenalty);

  // C. 밀도 보너스 (최대 20점) — CLAUDE.md 줄 수 기준
  if (lines > 0) {
    const density = actionabilityScore / lines;
    score += Math.min(20, Math.round(density * 30));
  }

  // D. 분리 보너스 (최대 30점)
  if (/@[\.\~\/][^\s]+/m.test(md)) score += 10;           // @import 사용
  if (/\.claude\/rules/gi.test(md)) score += 10;          // rules/ 분리
  if (/CLAUDE\.local\.md/gi.test(md)) score += 10;        // local md 분리

  return Math.min(100, Math.max(0, score));
}

/**
 * 차원 3: 구조화 (Structure) — 0~100
 * Claude가 빠르게 파싱할 수 있는 정보 구조
 */
function scoreStructure(md: string, stats: MdStats): number {
  let score = 0;
  const lines = md.split("\n");

  // A. 섹션 헤딩 (최대 35점)
  const headings = lines.filter(l => /^#{1,3}\s+/.test(l));
  if (headings.length >= 6) score += 30;
  else if (headings.length >= 3) score += 25;
  else if (headings.length >= 1) score += 10;

  // 표준 섹션명 보너스
  const standardNames = /commands?|architecture|rules?|style|testing|workflow|setup|환경|명령|규칙|구조/gi;
  if (headings.some(h => standardNames.test(h))) score += 5;
  score = Math.min(35, score);

  // B. 리스트 구조 (최대 25점)
  const listLines = lines.filter(l => /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));
  const listRatio = lines.length > 0 ? listLines.length / lines.length : 0;
  if (listRatio >= 0.2 && listRatio <= 0.6) score += 25;
  else if (listRatio >= 0.1 || listRatio <= 0.8) score += 15;
  else score += 5;

  // C. 우선순위 마킹 (최대 20점)
  const emphasisLines = lines.filter(l =>
    /IMPORTANT|CRITICAL|MUST|NEVER|ALWAYS/i.test(l)
  );
  const emphasisRatio = lines.length > 0 ? emphasisLines.length / lines.length : 0;

  if (emphasisLines.length > 0 && emphasisRatio <= 0.05) score += 20;
  else if (emphasisLines.length > 0 && emphasisRatio <= 0.10) score += 10;
  else if (emphasisLines.length > 0) score += 5;

  // D. 계층 구조 (최대 20점)
  const h1 = headings.filter(h => /^#\s+/.test(h)).length;
  const h2 = headings.filter(h => /^##\s+/.test(h)).length;
  const h3 = headings.filter(h => /^###\s+/.test(h)).length;

  if (h1 >= 1 && h2 >= 1 && h3 >= 1) score += 20;
  else if ((h1 >= 1 && h2 >= 1) || h2 >= 3) score += 10;

  return Math.min(100, score);
}

/**
 * 차원 4: 맥락 독점성 (Uniqueness) — 0~100
 * 코드만 봐서는 알 수 없는 프로젝트 고유 정보
 */
function scoreUniqueness(md: string, stats: MdStats): number {
  let score = 0;

  // A. 프로젝트 고유 함정/주의사항 (최대 30점)
  const specificBans = md.match(
    /(?:절대|NEVER|금지|하지\s*마|DO\s*NOT)[\s\S]{0,30}?(?:[\w가-힣]{3,}\.[\w]+|\/[\w\/]{3,}|[\w가-힣]{3,}\s+(?:파일|모듈|폴더|디렉토리|서비스))/gi
  ) ?? [];
  if (specificBans.length >= 3) score += 30;
  else if (specificBans.length >= 1) score += 15;

  // B. 워크플로우 규칙 (최대 25점)
  const hasWorkflow =
    /(?:branch|브랜치|PR|pull.request|merge|배포|deploy)[\s\S]{0,40}?(?:전략|strategy|규칙|rule|절차|process|flow)/gi.test(md) ||
    /(?:먼저|후에|전에|before|after|then)\s[\s\S]{0,30}?(?:확인|실행|리뷰|review|approve|승인)/gi.test(md);
  if (hasWorkflow) score += 25;

  // C. 환경 특이사항 (최대 25점)
  const constraints = md.match(
    /(?:캐싱용|only\s*(?:for|used)|전용|사용하지\s*않|대신\s*사용|instead\s*of|not\s*use|사용\s*금지|직접\s*(?:접근|호출)\s*금지)/gi
  ) ?? [];
  if (constraints.length >= 3) score += 25;
  else if (constraints.length >= 1) score += 15;

  // D. 도구 맥락 설명 (최대 20점)
  const toolContextPatterns = [
    /(?:slack|notion|github|supabase|vercel|linear|figma|jira|sentry|redis|mcp)[\s\S]{0,30}?(?:용|위해|for|사용|연동|통해|으로|에서|처리)/gi,
    /(?:용|위해|for|사용|연동|통해|으로)[\s\S]{0,30}?(?:slack|notion|github|supabase|vercel|linear|figma|jira|sentry|redis|mcp)/gi,
  ];
  let toolContextCount = 0;
  for (const pattern of toolContextPatterns) {
    toolContextCount += (md.match(pattern) ?? []).length;
  }
  toolContextCount = Math.min(toolContextCount, 10);

  if (toolContextCount >= 3) score += 20;
  else if (toolContextCount >= 1) score += 10;

  return Math.min(100, score);
}

/**
 * 차원 5: 방어력 (Safety) — 0~100
 * 위험한 실수를 방지하는 가드레일
 */
function scoreSafety(md: string, stats: MdStats): number {
  let score = 0;

  // A. 구체적 금지 규칙 (최대 35점)
  const bans = md.match(
    /(?:절대|NEVER|금지|하지\s*마|DO\s*NOT)[\s\S]{0,50}?\S{3,}/gi
  ) ?? [];
  if (bans.length >= 6) score += 35;
  else if (bans.length >= 3) score += 25;
  else if (bans.length >= 1) score += 15;

  // B. 민감 정보 보호 (최대 25점)
  const hasSensitiveWithBan =
    /(?:\.env|api.?key|secret|token|credential|password)[\s\S]{0,30}?(?:절대|NEVER|금지|하지\s*마|커밋|commit|노출|expose)/gi.test(md) ||
    /(?:절대|NEVER|금지|하지\s*마|커밋|commit|노출|expose)[\s\S]{0,30}?(?:\.env|api.?key|secret|token|credential|password)/gi.test(md);
  const hasSensitiveKeyword = /\.env|api.?key|secret|token|credential|password/gi.test(md);

  if (hasSensitiveWithBan) score += 25;
  else if (hasSensitiveKeyword) score += 10;

  // C. 검증 의무화 (최대 25점)
  // ※ Actionability의 "검증 루프"와 의도적으로 중복 — 실행 가능성과 방어력 두 관점에서 모두 가치
  const hasTestGate =
    /(?:반드시|always|must)[\s\S]{0,30}?(?:test|테스트|typecheck|lint|check)/gi.test(md) ||
    /before\s+(?:commit|push|merge|ship|submit)/gi.test(md);
  if (hasTestGate) score += 25;

  // D. 확장 데이터 보너스 (최대 15점) — isExpandedInput일 때만
  if (stats.isExpandedInput) {
    if (stats.denyCount > 0) score += 5;
    if (stats.blocksDangerousOps) score += 5;
    if (stats.hookPromptCount > 0) score += 5;
  }

  return Math.min(100, score);
}

/**
 * 5개 품질 차원을 통합 계산한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @param stats extractMdStats로 추출한 통계
 * @returns QualityScores (각 차원 0~100)
 */
export function calculateQualityScores(md: string, stats: MdStats): QualityScores {
  if (!md || md.trim().length === 0) {
    return { actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0 };
  }

  const actionability = scoreActionability(md, stats);
  const conciseness = scoreConciseness(md, stats, actionability);
  const structure = scoreStructure(md, stats);
  const uniqueness = scoreUniqueness(md, stats);
  const safety = scoreSafety(md, stats);

  return { actionability, conciseness, structure, uniqueness, safety };
}
