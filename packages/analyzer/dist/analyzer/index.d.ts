/**
 * CLAUDE.md 분석 통합 진입점
 * scorer → classifier → content 생성 파이프라인을 조합한다
 */
import type { AnalysisResult } from "../types.js";
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
export declare function analyze(md: string): AnalysisResult;
//# sourceMappingURL=index.d.ts.map