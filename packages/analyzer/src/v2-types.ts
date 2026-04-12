/**
 * mdTI v2: 4축 이분법 조합형 타입 시스템
 *
 * 4축: harness(탐색/구축), control(통제/위임), verbose(장황/간결), plan(설계/실행)
 * 각 축의 양방향 조합 → 16타입 (2^4)
 */

/** 4축 키 */
export type AxisKey = 'harness' | 'control' | 'verbose' | 'plan';

/** 각 축의 양방향 */
export type AxisDirection = {
  harness: 'G' | 'H';    // 탐색(Gather) / 구축(Harness)
  control: 'R' | 'D';    // 통제(Restrict) / 위임(Delegate)
  verbose: 'V' | 'C';    // 장황(Verbose) / 간결(Concise)
  plan: 'P' | 'X';       // 설계(Plan) / 실행(eXecute)
};

/** 4글자 타입 코드 (내부용, 사용자 미노출) */
export type TypeCode = string;

/** 축별 시그널 카운트 + 판정 */
export interface AxisJudgment {
  axis: AxisKey;
  aCount: number;         // A방향 시그널 수
  bCount: number;         // B방향 시그널 수
  direction: string;      // 판정된 방향 (A 또는 B의 글자)
  confidence: number;     // 판정 확신도 (0.5~1.0, 0.5이면 동점)
}

/** 4축 전체 판정 결과 */
export interface AxisScores {
  judgments: Record<AxisKey, AxisJudgment>;
  typeCode: TypeCode;
}

/** 16개 고유 페르소나 정의 */
export interface V2PersonaDefinition {
  typeCode: TypeCode;
  name: string;           // 페르소나 이름 (예: "세팅 스나이퍼")
  punchline: string;      // 찔리는 한마디 (예: "MCP 12개 깔아놓고 쓰는 건 3개")
  narrative: string;      // 행동 묘사 (2-3문장, 구체적 행동 기반)
  emoji: string;
}

/** 축별 모듈 콘텐츠 블록 */
export interface ModuleBlock {
  axis: AxisKey;
  direction: string;      // A 또는 B 글자
  wit: string;            // 위트 ("~한 적 없나요?" 포맷)
  exploration: string;    // 탐험 제안
}

/** v2 분석 결과 */
export interface V2AnalysisResult {
  typeCode: TypeCode;
  axisScores: AxisScores;
  persona: V2PersonaDefinition;
  witItems: string[];          // 선택된 위트 2개
  explorationItems: string[];  // 선택된 탐험 2개
  mdStats: import('./types').MdStats;
}

/** 축 라벨 (내부용) */
export const AXIS_LABELS: Record<AxisKey, { a: string; b: string; aLabel: string; bLabel: string }> = {
  harness:   { a: 'G', b: 'H', aLabel: '탐색', bLabel: '구축' },
  control:   { a: 'R', b: 'D', aLabel: '통제', bLabel: '위임' },
  verbose:   { a: 'V', b: 'C', aLabel: '장황', bLabel: '간결' },
  plan:      { a: 'P', b: 'X', aLabel: '설계', bLabel: '실행' },
};

/** 축 순서 (타입 코드 생성 시) */
export const AXIS_ORDER: AxisKey[] = ['harness', 'control', 'verbose', 'plan'];
