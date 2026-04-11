/** 분석 차원 7개 — 각 0~100 점수 */
export interface DimensionScores {
    automation: number;
    control: number;
    toolDiversity: number;
    contextAwareness: number;
    teamImpact: number;
    security: number;
    agentOrchestration: number;
}
/** 12가지 페르소나 키 */
export type PersonaKey = "puppet-master" | "speedrunner" | "fortress" | "minimalist" | "collector" | "legislator" | "craftsman" | "deep-diver" | "evangelist" | "architect" | "huggies" | "daredevil";
/** 페르소나 정의 */
export interface PersonaDefinition {
    key: PersonaKey;
    nameKo: string;
    nameEn: string;
    emoji: string;
    tagline: string;
    description: string;
}
/** CLAUDE.md 파일 통계 */
export interface MdStats {
    totalLines: number;
    sectionCount: number;
    toolNames: string[];
    hasMemory: boolean;
    hasHooks: boolean;
    hasProjectMd: boolean;
    ruleCount: number;
    claudeMdLines: number;
    keywordHits: Record<string, number>;
    keywordUniqueHits: Record<string, number>;
    /** 확장 수집 시 추가 신호 */
    pluginCount: number;
    mcpServerCount: number;
    commandCount: number;
    hookCount: number;
    skillCount: number;
    agentCount: number;
    pluginNames: string[];
    mcpServerNames: string[];
    commandNames: string[];
    hasRoleDefinition: boolean;
    isExpandedInput: boolean;
    /** 심층 분석 신호 (확장 수집 시) */
    denyCount: number;
    blocksDangerousOps: boolean;
    hookPromptCount: number;
    hookCommandCount: number;
    pluginEnabledRatio: number;
    projectMdCount: number;
}
/** 로스팅 아이템 — 찌르는 한 마디 */
export interface RoastItem {
    text: string;
    detail: string;
    color: "red" | "orange" | "blue";
}
/** 강점 아이템 */
export interface StrengthItem {
    text: string;
}
/** 처방전 아이템 */
export interface PrescriptionItem {
    text: string;
    priority: "high" | "medium" | "low";
}
/** 조건부 처방전 — tag 기반 중복 제거 + 5개 고정 출력 */
export interface ConditionalPrescription {
    id: string;
    text: string;
    priority: "high" | "medium" | "low";
    tag: string;
    tier: "signature" | "dimensional" | "common";
    condition: (persona: PersonaKey, stats: MdStats, quality: QualityScores, scores: DimensionScores) => boolean;
}
/** 궁합 정보 */
export interface CompatInfo {
    type: "perfect" | "chaos";
    targetPersona: PersonaKey;
    description: string;
}
/** .md력 티어 키 */
export type TierKey = "egg" | "sprout" | "sapling" | "tree" | "oak" | "sequoia";
/** .md력 점수 + 티어 */
export interface MdPower {
    score: number;
    tier: TierKey;
    tierEmoji: string;
    tierName: string;
    tierTagline: string;
}
/** 페르소나 분류 결과: 주 + 부 성향 */
export interface PersonaResult {
    primary: PersonaKey;
    secondary: PersonaKey | null;
}
/** md력 품질 5개 차원 — 각 0~100 */
export interface QualityScores {
    actionability: number;
    conciseness: number;
    structure: number;
    uniqueness: number;
    safety: number;
}
/** 분석 결과 전체 */
export interface AnalysisResult {
    persona: PersonaKey;
    secondaryPersona: PersonaKey | null;
    scores: DimensionScores;
    qualityScores: QualityScores;
    roasts: RoastItem[];
    strengths: StrengthItem[];
    prescriptions: PrescriptionItem[];
    mdStats: MdStats;
    mdPower: MdPower;
}
/** DB에 저장된 결과 (ID + 생성일 포함) */
export interface SavedResult extends AnalysisResult {
    id: string;
    createdAt: string;
    isLegacyResult: boolean;
}
/** 전체 사용자 통계 */
export interface GlobalStats {
    totalUsers: number;
    personaCounts: Record<PersonaKey, number>;
    avgLines: number;
    userPercentile: {
        lines: number;
        tools: number;
        complexity: number;
    };
}
/** 차원별 UI 라벨 (레이더 차트, 배지 등에서 사용) */
export declare const DIMENSION_LABELS: Record<keyof DimensionScores, {
    label: string;
    description: string;
}>;
/** 전체 패턴 수 (7차원 합산) */
export declare const TOTAL_PATTERN_COUNT = 104;
//# sourceMappingURL=types.d.ts.map