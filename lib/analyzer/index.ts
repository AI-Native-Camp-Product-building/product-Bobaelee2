/**
 * CLAUDE.md 분석 통합 진입점
 * v1: scorer → classifier → content 생성 파이프라인
 * v2: 5축 이분법 조합형 (32타입) 파이프라인
 */
import type { AnalysisResult } from "@/lib/types";
import type { V2AnalysisResult } from "@/lib/v2-types";
import { calculateScores, extractMdStats } from "./scorer";
import { classifyPersona } from "./classifier";
import { calculateQualityScores } from "./quality";
import { generateRoasts } from "@/lib/content/roasts";
import { generateStrengths } from "@/lib/content/strengths";
import { generatePrescriptions } from "@/lib/content/prescriptions";
import { calculateMdPower } from "./power";
import { scoreAxes } from "./axis-scorer";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import { getWitItems, getExplorationItems } from "@/lib/content/v2-modules";

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

/**
 * v2 분석 — 4축 조합형 성향 분류
 *
 * 처리 순서:
 * 1. extractMdStats — 기존 파일 통계 추출 (재사용)
 * 2. scoreAxes — 4축 이분법 판정 (harness, control, verbose, structure)
 * 3. getPersonaByTypeCode — 16개 페르소나 중 매칭
 * 4. getWitItems / getExplorationItems — 모듈 콘텐츠 선택
 */
export function analyzeV2(md: string): V2AnalysisResult {
  // 1. 기존 MdStats 추출 (패턴 감지 재사용)
  const mdStats = extractMdStats(md);

  // 2. 4축 판정
  const axisScores = scoreAxes(md, mdStats);

  // 3. 페르소나 조회
  const persona = getPersonaByTypeCode(axisScores.typeCode);
  if (!persona) {
    throw new Error(`Unknown type code: ${axisScores.typeCode}`);
  }

  // 4. 모듈 콘텐츠 선택
  const witItems = getWitItems(axisScores.typeCode, axisScores.judgments);
  const explorationItems = getExplorationItems(axisScores.typeCode, axisScores.judgments);

  return {
    typeCode: axisScores.typeCode,
    axisScores,
    persona,
    witItems,
    explorationItems,
    mdStats,
  };
}
