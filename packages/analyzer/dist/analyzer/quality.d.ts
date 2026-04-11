/**
 * md력 품질 5개 차원 측정 엔진
 * 성향(scorer.ts)과 완전 분리 — md력은 순수 CLAUDE.md 품질만 평가
 */
import type { QualityScores, MdStats } from "../types.js";
/**
 * 5개 품질 차원을 통합 계산한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @param stats extractMdStats로 추출한 통계
 * @returns QualityScores (각 차원 0~100)
 */
export declare function calculateQualityScores(md: string, stats: MdStats): QualityScores;
//# sourceMappingURL=quality.d.ts.map