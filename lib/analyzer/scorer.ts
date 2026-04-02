/**
 * CLAUDE.md 텍스트를 받아 6개 차원 점수와 통계를 계산한다
 */
import type { DimensionScores, MdStats } from "@/lib/types";
import { DIMENSION_PATTERNS, countPatternMatches, extractToolNames } from "./patterns";

/**
 * 각 차원의 정규화 기준값 (이 횟수면 100점 만점)
 * 실제 CLAUDE.md 샘플 기반으로 설정한 임계값
 */
const THRESHOLDS: Record<keyof DimensionScores, number> = {
  automation: 10,
  control: 12,
  toolDiversity: 8,
  maturity: 15,
  collaboration: 6,
  security: 8,
};

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
      maturity: 0,
      collaboration: 0,
      security: 0,
    };
  }

  const dimensions = Object.keys(THRESHOLDS) as (keyof DimensionScores)[];
  const result = {} as DimensionScores;

  for (const dim of dimensions) {
    const patterns = DIMENSION_PATTERNS[dim];
    const count = countPatternMatches(md, patterns);
    result[dim] = normalize(count, THRESHOLDS[dim]);
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

  return {
    totalLines,
    sectionCount,
    toolNames,
    hasMemory,
    hasHooks,
    hasProjectMd,
    ruleCount,
    keywordHits,
  };
}
