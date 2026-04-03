/**
 * CLAUDE.md 텍스트를 받아 6개 차원 점수와 통계를 계산한다
 */
import type { DimensionScores, MdStats } from "@/lib/types";
import {
  DIMENSION_PATTERNS,
  countPatternMatches,
  countUniqueSignals,
  extractToolNames,
  isExpandedInput,
  extractEnabledPlugins,
  extractMcpServerNames,
  extractCommandNames,
  countHooks,
  extractExpandedSignals,
} from "./patterns";

/**
 * 각 차원의 정규화 기준값 — 패턴 수의 70%를 만점 기준으로 자동 계산
 * 고유 신호 카운팅이므로 만점 = 패턴 종류 수, 70%는 일부 패턴이 해당 없는 경우 허용
 */
const THRESHOLDS: Record<keyof DimensionScores, number> = {} as Record<keyof DimensionScores, number>;
for (const dim of Object.keys(DIMENSION_PATTERNS) as (keyof DimensionScores)[]) {
  THRESHOLDS[dim] = Math.ceil(DIMENSION_PATTERNS[dim].length * 0.7);
}

/**
 * 원시 매칭 횟수를 0~100 점수로 정규화한다
 * @param count 원시 매칭 횟수
 * @param threshold 100점 기준 임계값
 */
function normalize(count: number, threshold: number): number {
  const score = Math.round((count / threshold) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * CLAUDE.md 텍스트에서 6개 차원 점수를 계산한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns DimensionScores (각 차원 0~100)
 */
export function calculateScores(md: string): DimensionScores {
  if (!md || md.trim().length === 0) {
    return {
      automation: 0,
      control: 0,
      toolDiversity: 0,
      contextAwareness: 0,
      collaboration: 0,
      security: 0,
    };
  }

  const dimensions = Object.keys(THRESHOLDS) as (keyof DimensionScores)[];
  const result = {} as DimensionScores;

  for (const dim of dimensions) {
    const patterns = DIMENSION_PATTERNS[dim];
    const count = countUniqueSignals(md, patterns);
    result[dim] = normalize(count, THRESHOLDS[dim]);
  }

  // 확장 수집 데이터가 있으면 구조화된 신호로 점수 보정
  if (isExpandedInput(md)) {
    const sig = extractExpandedSignals(md);

    // 보안: deny 규칙, 위험 명령어 차단, PreToolUse hook
    if (sig.blocksDangerousOps) result.security = Math.min(100, result.security + 12);
    if (sig.hasDenyRules) result.security = Math.min(100, result.security + Math.min(sig.denyCount * 3, 9));
    if (sig.hasPreToolUseHook) result.security = Math.min(100, result.security + 6);

    // 자동화: PostToolUse hook, Session hook, hook 유형 다양성
    if (sig.hasPostToolUseHook) result.automation = Math.min(100, result.automation + 8);
    if (sig.hasSessionHooks) result.automation = Math.min(100, result.automation + 5);
    if (sig.hookTypeCommandCount >= 2) result.automation = Math.min(100, result.automation + 6);
    // prompt 타입 hook = AI 판단 활용 → 컨텍스트 관리
    if (sig.hookTypePromptCount >= 1) result.contextAwareness = Math.min(100, result.contextAwareness + 5);

    // 컨텍스트 관리: statusLine, 마켓플레이스, 플러그인 선별 비율, 프로젝트별 CLAUDE.md
    if (sig.hasStatusLine) result.contextAwareness = Math.min(100, result.contextAwareness + 5);
    if (sig.hasMultipleMarketplaces) result.contextAwareness = Math.min(100, result.contextAwareness + 3);
    if (sig.pluginEnabledRatio > 0 && sig.pluginEnabledRatio < 0.5) {
      result.contextAwareness = Math.min(100, result.contextAwareness + 6);
    }
    if (sig.projectMdCount >= 2) result.contextAwareness = Math.min(100, result.contextAwareness + 6);

    // 제어: defaultMode가 auto가 아님 = 수동 승인 선호
    if (!sig.defaultModeIsAuto) result.control = Math.min(100, result.control + 6);

    // 도구 다양성: MCP 서버 수 반영
    const mcpServers = extractMcpServerNames(md);
    if (mcpServers.length >= 3) result.toolDiversity = Math.min(100, result.toolDiversity + 10);
    else if (mcpServers.length >= 1) result.toolDiversity = Math.min(100, result.toolDiversity + 5);
  }

  return result;
}

/**
 * CLAUDE.md 텍스트에서 통계 정보를 추출한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns MdStats 객체
 */
export function extractMdStats(md: string): MdStats {
  if (!md || md.trim().length === 0) {
    return {
      totalLines: 0,
      sectionCount: 0,
      toolNames: [],
      hasMemory: false,
      hasHooks: false,
      hasProjectMd: false,
      ruleCount: 0,
      keywordHits: {},
      pluginCount: 0,
      mcpServerCount: 0,
      commandCount: 0,
      hookCount: 0,
      pluginNames: [],
      mcpServerNames: [],
      commandNames: [],
      isExpandedInput: false,
      denyCount: 0,
      blocksDangerousOps: false,
      hookPromptCount: 0,
      hookCommandCount: 0,
      pluginEnabledRatio: 0,
      projectMdCount: 0,
    };
  }

  const lines = md.split("\n");
  const totalLines = lines.length;

  // ## 또는 # 으로 시작하는 섹션 헤더 수
  const sectionCount = lines.filter((line) => /^#{1,3}\s+/.test(line)).length;

  // 도구명 추출
  const toolNames = extractToolNames(md);

  // memory 또는 메모리 언급 여부
  const hasMemory = /memory|메모리/gi.test(md);

  // hook 언급 여부
  const hasHooks = /hooks?/gi.test(md);

  // project.*claude 또는 CLAUDE.md 언급 여부
  const hasProjectMd = /project.*claude|CLAUDE\.md/gi.test(md);

  // 규칙 수: "- " 또는 숫자로 시작하는 목록 항목 중 금지/필수/반드시/MUST/NEVER 포함
  const ruleLines = lines.filter((line) =>
    /^[\s\-*\d]+/.test(line) &&
    /금지|반드시|필수|항상|절대|MUST|NEVER|ALWAYS|IMPORTANT|CRITICAL/i.test(line)
  );
  const ruleCount = ruleLines.length;

  // 각 차원별 히트 수 기록
  const keywordHits: Record<string, number> = {};
  for (const dim of Object.keys(DIMENSION_PATTERNS)) {
    keywordHits[dim] = countPatternMatches(md, DIMENSION_PATTERNS[dim]);
  }

  // 확장 수집 신호 파싱
  const expanded = isExpandedInput(md);
  const pluginNames = expanded ? extractEnabledPlugins(md) : [];
  const mcpServerNames = expanded ? extractMcpServerNames(md) : [];
  const commandNames = expanded ? extractCommandNames(md) : [];
  const hookCount = expanded ? countHooks(md) : (hasHooks ? 1 : 0);

  // 심층 분석 신호
  const signals = expanded ? extractExpandedSignals(md) : null;

  return {
    totalLines,
    sectionCount,
    toolNames,
    hasMemory,
    hasHooks: hasHooks || hookCount > 0,
    hasProjectMd,
    ruleCount,
    keywordHits,
    pluginCount: pluginNames.length,
    mcpServerCount: mcpServerNames.length,
    commandCount: commandNames.length,
    hookCount,
    pluginNames,
    mcpServerNames,
    commandNames,
    isExpandedInput: expanded,
    denyCount: signals?.denyCount ?? 0,
    blocksDangerousOps: signals?.blocksDangerousOps ?? false,
    hookPromptCount: signals?.hookTypePromptCount ?? 0,
    hookCommandCount: signals?.hookTypeCommandCount ?? 0,
    pluginEnabledRatio: signals?.pluginEnabledRatio ?? 0,
    projectMdCount: signals?.projectMdCount ?? 0,
  };
}
