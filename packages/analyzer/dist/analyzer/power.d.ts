/**
 * .md력 점수 산출 + 티어 분류
 * 5개 품질 차원 합산 × 2 = 0~1000
 * 에코시스템 보너스 폐지 — 도구 개수 ≠ md 품질
 */
import type { QualityScores, MdStats, MdPower, TierKey, DimensionScores } from "../types.js";
/**
 * .md력 점수를 계산한다 (0~1000)
 * 5개 품질 차원 합산(0~500) × 2 + 에이전트 오케스트레이션 보너스 = 0~1000
 */
export declare function calculateMdPower(quality: QualityScores, stats: MdStats, dimensionScores?: DimensionScores): MdPower;
/**
 * 티어 정의 목록을 반환한다 (UI에서 전체 티어 표시용)
 */
export declare function getAllTiers(): {
    key: TierKey;
    emoji: string;
    name: string;
    tagline: string;
    min: number;
}[];
//# sourceMappingURL=power.d.ts.map