/**
 * CLAUDE.md 분석 통합 진입점
 * scorer → classifier → content 생성 파이프라인을 조합한다
 */
import type { AnalysisResult } from "../types.js";
import { calculateScores, extractMdStats } from "./scorer.js";
import { classifyPersona } from "./classifier.js";
import { calculateQualityScores } from "./quality.js";
import { generateRoasts } from "../content/roasts.js";
import { generateStrengths } from "../content/strengths.js";
import { generatePrescriptions } from "../content/prescriptions.js";
import { calculateMdPower } from "./power.js";

/**
 * CLAUDE.md 텍스트를 받아 완전한 분석 결과를 반환한다
 *
 * 처리 순서:
 * 1. calculateScores — 6개 차원 점수 계산
 * 2. extractMdStats — 파일 통계 추출
 * 3. classifyPersona — 페르소나 분류
 * 4. generateRoasts — 로스팅 생성
 * 5. generateStrengths — 강점 생성
 * 6. generatePrescriptions — 처방전 생성
 *
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns AnalysisResult 완전한 분석 결과
 */
export function analyze(md: string): AnalysisResult {
  // 1. 7개 차원 점수 계산
  const scores = calculateScores(md);

  // 2. 파일 통계 추출
  const mdStats = extractMdStats(md);

  // 3. 페르소나 분류 (주 + 부 페르소나)
  const personaResult = classifyPersona(scores, mdStats);

  // 4. 품질 점수 (md력용)
  const qualityScores = calculateQualityScores(md, mdStats);

  // 5. 콘텐츠 생성 (primary 기반)
  const roasts = generateRoasts(personaResult.primary, mdStats);
  const strengths = generateStrengths(personaResult.primary, mdStats);
  const prescriptions = generatePrescriptions(personaResult.primary, mdStats, qualityScores, scores);

  // 6. .md력 점수 — 품질 기반 + 에이전트 오케스트레이션 보너스
  const mdPower = calculateMdPower(qualityScores, mdStats, scores);

  return {
    persona: personaResult.primary,
    secondaryPersona: personaResult.secondary,
    scores,
    qualityScores,
    roasts,
    strengths,
    prescriptions,
    mdStats,
    mdPower,
  };
}
