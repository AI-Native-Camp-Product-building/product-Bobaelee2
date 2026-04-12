/**
 * @mdti/analyzer — mdti 분석 엔진
 *
 * 사용법:
 *   import { analyze } from '@mdti/analyzer'
 *   const result = analyze(claudeMdText)
 *
 * 프레임워크 의존성 없음. 순수 TypeScript.
 */

// 핵심 분석 함수
export { analyze, analyzeV2 } from "./analyzer/index.js";

// 타입
export type {
  AnalysisResult,
  DimensionScores,
  QualityScores,
  PersonaKey,
  PersonaDefinition,
  PersonaResult,
  MdPower,
  TierKey,
  MdStats,
  RoastItem,
  StrengthItem,
  PrescriptionItem,
  CompatInfo,
} from "./types.js";

export { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "./types.js";

// 페르소나 정의 (이모지, 이름, 태그라인)
export { PERSONAS } from "./content/personas.js";

// 궁합 데이터
export { getCompatibility } from "./content/compatibility.js";

// 개별 분석 단계 (고급 사용)
export { calculateScores, extractMdStats } from "./analyzer/scorer.js";
export { classifyPersona } from "./analyzer/classifier.js";
export { calculateQualityScores } from "./analyzer/quality.js";
export { calculateMdPower } from "./analyzer/power.js";

// v2 타입
export type {
  AxisKey,
  AxisDirection,
  TypeCode,
  AxisJudgment,
  AxisScores,
  V2PersonaDefinition,
  ModuleBlock,
  V2AnalysisResult,
} from "./v2-types.js";

export { AXIS_LABELS, AXIS_ORDER } from "./v2-types.js";

// v2 콘텐츠
export { V2_PERSONAS, getPersonaByTypeCode } from "./content/v2-personas.js";
export { MODULE_BLOCKS } from "./content/v2-modules.js";
