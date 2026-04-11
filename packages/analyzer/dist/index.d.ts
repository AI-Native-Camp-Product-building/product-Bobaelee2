/**
 * @mdti/analyzer — mdti 분석 엔진
 *
 * 사용법:
 *   import { analyze } from '@mdti/analyzer'
 *   const result = analyze(claudeMdText)
 *
 * 프레임워크 의존성 없음. 순수 TypeScript.
 */
export { analyze } from "./analyzer/index.js";
export type { AnalysisResult, DimensionScores, QualityScores, PersonaKey, PersonaDefinition, PersonaResult, MdPower, TierKey, MdStats, RoastItem, StrengthItem, PrescriptionItem, CompatInfo, } from "./types.js";
export { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "./types.js";
export { PERSONAS } from "./content/personas.js";
export { getCompatibility } from "./content/compatibility.js";
export { calculateScores, extractMdStats } from "./analyzer/scorer.js";
export { classifyPersona } from "./analyzer/classifier.js";
export { calculateQualityScores } from "./analyzer/quality.js";
export { calculateMdPower } from "./analyzer/power.js";
//# sourceMappingURL=index.d.ts.map