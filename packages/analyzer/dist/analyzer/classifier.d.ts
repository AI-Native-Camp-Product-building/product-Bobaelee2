/**
 * 7개 차원 점수와 통계를 바탕으로 13가지 페르소나를 후보 적합도 기반으로 분류한다
 *
 * 공개 API:
 * - classifyPersona: primary/secondary 페르소나만 리턴 (분석 파이프라인용)
 * - classifyPersonaDebug: 후보별 fit + 등록 이유 + 메타 노트 (투명성 UI용)
 *
 * 두 함수는 buildCandidates 헬퍼를 공유하므로 분류 로직은 단일 출처.
 */
import type { DimensionScores, MdStats, PersonaKey, PersonaResult } from "../types.js";
/** 분류 후보 — fit + 등록 이유 (사람이 읽을 수 있는 한국어) */
export interface ClassificationCandidate {
    persona: PersonaKey;
    fit: number;
    reason: string;
}
/**
 * 분석 점수와 통계를 기반으로 페르소나를 분류한다
 *
 * 후보 적합도 기반 분류:
 * 1. 특수 케이스 (minimalist) 선처리
 * 2. 모든 후보 페르소나에 적합도 점수를 매김
 * 3. 적합도 순 정렬 → 주/부 페르소나 추출
 */
export declare function classifyPersona(scores: DimensionScores, mdStats: MdStats): PersonaResult;
/** 분류 디버그 정보 — 투명성 UI용 */
export interface ClassificationDebug {
    primary: PersonaKey;
    secondary: PersonaKey | null;
    /** 적합도 내림차순 정렬된 후보 리스트 (모든 등록 후보) */
    candidates: ClassificationCandidate[];
    /** 메타 노트: 입력 경로 등 분류에 영향을 준 컨텍스트 */
    notes: string[];
    /** 특수 케이스로 분기됐다면 그 이유 (minimalist 단축 경로) */
    shortCircuitReason: string | null;
    /** 후보 0개로 fallback 경로를 탔는지 */
    fallbackUsed: boolean;
}
/**
 * 분류 과정의 디버그 정보를 반환한다 — 투명성 UI에서 "이 분류가 어떻게 나왔나요?" 표시용
 *
 * 동일 입력에 대해 classifyPersona와 같은 primary/secondary를 보장한다 (buildCandidates 공유).
 */
export declare function classifyPersonaDebug(scores: DimensionScores, mdStats: MdStats): ClassificationDebug;
//# sourceMappingURL=classifier.d.ts.map