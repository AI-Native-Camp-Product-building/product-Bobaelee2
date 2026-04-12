/**
 * mdTI v2: 5축 이분법 조합형 타입 시스템
 *
 * 5축: harness(하기스/하네스), control(통제/위임), verbose(장황/간결),
 *       plan(설계/실행), structure(구조화/자유형)
 * 각 축의 양방향 조합 → 32타입 (2^5)
 */

/** 5축 키 */
export type AxisKey = 'harness' | 'control' | 'verbose' | 'plan' | 'structure';

/** 각 축의 양방향 */
export type AxisDirection = {
  harness: 'G' | 'H';    // 하기스(발산) / 하네스(수렴)
  control: 'R' | 'D';    // 통제(Restrict) / 위임(Delegate)
  verbose: 'V' | 'C';    // 장황(Verbose) / 간결(Concise)
  plan: 'P' | 'X';       // 설계(Plan) / 실행(eXecute)
  structure: 'S' | 'F';  // 구조화(Structured) / 자유형(Freeform)
};

/** 5글자 타입 코드 (예: "GRVPS", "HDCXF") */
export type TypeCode = string;

/** 축별 시그널 카운트 + 판정 */
export interface AxisJudgment {
  axis: AxisKey;
  aCount: number;         // A방향 시그널 수
  bCount: number;         // B방향 시그널 수
  direction: string;      // 판정된 방향 (A 또는 B의 글자)
  confidence: number;     // 판정 확신도 (0.5~1.0, 0.5이면 동점)
}

/** 5축 전체 판정 결과 */
export interface AxisScores {
  judgments: Record<AxisKey, AxisJudgment>;
  typeCode: TypeCode;
}

/** 32개 고유 페르소나 정의 */
export interface V2PersonaDefinition {
  typeCode: TypeCode;
  name: string;           // 페르소나 이름 (예: "카오스 엔지니어")
  tagline: string;        // 한줄 정체성
  narrative: string;      // 캐릭터 서사 (2-3문장, 축 간 상호작용)
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
  witItems: string[];          // 선택된 위트 2-3개
  explorationItems: string[];  // 선택된 탐험 3개
  mdStats: import('./types').MdStats;
}

/** 축 라벨 (UI용) */
export const AXIS_LABELS: Record<AxisKey, { a: string; b: string; aLabel: string; bLabel: string }> = {
  harness:   { a: 'G', b: 'H', aLabel: '하기스', bLabel: '하네스' },
  control:   { a: 'R', b: 'D', aLabel: '통제',   bLabel: '위임' },
  verbose:   { a: 'V', b: 'C', aLabel: '장황',   bLabel: '간결' },
  plan:      { a: 'P', b: 'X', aLabel: '설계',   bLabel: '실행' },
  structure: { a: 'S', b: 'F', aLabel: '구조화', bLabel: '자유형' },
};

/** 축 순서 (타입 코드 생성 시) */
export const AXIS_ORDER: AxisKey[] = ['harness', 'control', 'verbose', 'plan', 'structure'];
