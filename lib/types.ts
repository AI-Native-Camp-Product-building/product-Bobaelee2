/** 분석 차원 6개 — 각 0~100 점수 */
export interface DimensionScores {
  automation: number;           // 자동화 성향
  control: number;              // 제어 성향
  toolDiversity: number;        // 도구 다양성
  contextAwareness: number;     // 컨텍스트 관리 (구 maturity)
  collaboration: number;        // 협업 지향
  security: number;             // 보안 의식
}

/** 13가지 페르소나 키 */
export type PersonaKey =
  | "puppet-master"
  | "speedrunner"
  | "fortress"
  | "minimalist"
  | "collector"
  | "legislator"
  | "craftsman"
  | "deep-diver"
  | "evangelist"
  | "architect"
  | "huggies"
  | "macgyver"
  | "daredevil";

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
  claudeMdLines: number;                         // CLAUDE.md 섹션의 줄 수 (A경로: totalLines, B경로: 섹션만)
  keywordHits: Record<string, number>;          // 반복 카운트 (통계 표시용 — "총 23회 출현")
  keywordUniqueHits: Record<string, number>;    // 고유 신호 수 (점수 산출 기준 — "7종류 감지")
  /** 확장 수집 시 추가 신호 */
  pluginCount: number;         // 활성화된 플러그인 수
  mcpServerCount: number;      // 연동된 MCP 서버 수
  commandCount: number;        // 커스텀 슬래시 명령어 수
  hookCount: number;           // 설정된 hook 수
  pluginNames: string[];       // 활성화된 플러그인 이름 목록
  mcpServerNames: string[];    // MCP 서버 이름 목록
  commandNames: string[];      // 커스텀 명령어 이름 목록
  isExpandedInput: boolean;    // 전체 수집 데이터 여부
  /** 심층 분석 신호 (확장 수집 시) */
  denyCount: number;           // deny 규칙 수
  blocksDangerousOps: boolean; // rm -rf, force push 등 차단 여부
  hookPromptCount: number;     // AI 판단 hook 수
  hookCommandCount: number;    // 셸 실행 hook 수
  pluginEnabledRatio: number;  // 플러그인 활성/설치 비율
  projectMdCount: number;      // 프로젝트별 CLAUDE.md 수
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

/** .md력 티어 키 */
export type TierKey = "egg" | "sprout" | "sapling" | "tree" | "oak" | "sequoia";

/** .md력 점수 + 티어 */
export interface MdPower {
  score: number;      // 0~1000
  tier: TierKey;
  tierEmoji: string;
  tierName: string;
  tierTagline: string;
}

/** 페르소나 분류 결과: 주 + 부 성향 */
export interface PersonaResult {
  primary: PersonaKey;
  secondary: PersonaKey | null;  // 적합도 차이가 크면 null
}

/** md력 품질 5개 차원 — 각 0~100 */
export interface QualityScores {
  actionability: number;      // 실행 가능성
  conciseness: number;        // 간결성
  structure: number;          // 구조화
  uniqueness: number;         // 맥락 독점성
  safety: number;             // 방어력
}

/** 분석 결과 전체 */
export interface AnalysisResult {
  persona: PersonaKey;                    // 주 페르소나 (하위호환)
  secondaryPersona: PersonaKey | null;    // 부 페르소나
  scores: DimensionScores;
  qualityScores: QualityScores;           // md력 품질 점수
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
  isLegacyResult: boolean;    // DB에 quality_scores가 null이면 true
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
