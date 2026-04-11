/**
 * 조건부 처방전 시스템
 * ConditionalPrescription 기반으로 페르소나 × 품질 × 통계를 교차해
 * 항상 정확히 5개의 처방전을 선택한다
 */
import type { PersonaKey, MdStats, PrescriptionItem, QualityScores, DimensionScores } from "../types.js";
export declare function generatePrescriptions(persona: PersonaKey, mdStats: MdStats, qualityScores: QualityScores, dimensionScores: DimensionScores): PrescriptionItem[];
//# sourceMappingURL=prescriptions.d.ts.map