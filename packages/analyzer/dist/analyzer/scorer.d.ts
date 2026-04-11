/**
 * CLAUDE.md 텍스트를 받아 6개 차원 점수와 통계를 계산한다
 */
import type { DimensionScores, MdStats } from "../types.js";
/**
 * CLAUDE.md 텍스트에서 6개 차원 점수를 계산한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns DimensionScores (각 차원 0~100)
 */
export declare function calculateScores(md: string): DimensionScores;
/**
 * CLAUDE.md 텍스트에서 통계 정보를 추출한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns MdStats 객체
 */
export declare function extractMdStats(md: string): MdStats;
/**
 * 비개발자 프로파일인지 판정한다
 * 역할 정의가 있으면서 개발자 특화 차원이 전부 낮은 경우
 */
export declare function isNonDevProfile(stats: MdStats, scores: DimensionScores): boolean;
//# sourceMappingURL=scorer.d.ts.map