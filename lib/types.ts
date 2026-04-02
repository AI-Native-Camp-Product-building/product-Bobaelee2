/** 분석 차원 6개 — 각 0~100 점수 */
export interface DimensionScores {
  automation: number;      // 자동화 성향
  control: number;         // 제어 성향
  toolDiversity: number;   // 도구 다양성
  maturity: number;        // MD 성숙도
  collaboration: number;   // 협업 지향
  security: number;        // 보안 의식
}

/** 8가지 페르소나 키 */
export type PersonaKey =
  | "puppet-master"
  | "speedrunner"
  | "fortress"
  | "minimalist"
  | "collector"
  | "legislator"
  | "craftsman"
  | "deep-diver";

/** 페르소나 정의 */
export interface PersonaDefinition {
  key: PersonaKey;
  nameKo: string;      // 한글 이름 (예: "봇 농장주")
  nameEn: string;      // 영문 이름 (예: "The Puppet Master")
  emoji: string;
  tagline: string;     // 한 줄 설명
  description: string; // 상세 설명
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
  keywordHits: Record<string, number>;
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

/** 궁합 정보 */
export interface CompatInfo {
  type: "perfect" | "chaos" | "mirror";
  targetPersona: PersonaKey;
  description: string;
}

/** 분석 결과 전체 */
export interface AnalysisResult {
  persona: PersonaKey;
  scores: DimensionScores;
  roasts: RoastItem[];
  strengths: StrengthItem[];
  prescriptions: PrescriptionItem[];
  mdStats: MdStats;
}

/** DB에 저장된 결과 (ID + 생성일 포함) */
export interface SavedResult extends AnalysisResult {
  id: string;
  createdAt: string;
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
