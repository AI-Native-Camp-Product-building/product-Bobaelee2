/**
 * 페르소나 궁합 정보 생성기
 * 각 페르소나의 최고 궁합, 최악 궁합을 제공한다
 */
import type { PersonaKey, CompatInfo } from "../types.js";
/**
 * 페르소나에 대한 궁합 정보 2개를 반환한다 (perfect, chaos)
 * @param persona 페르소나 키
 * @returns CompatInfo 배열 (perfect, chaos 순)
 */
export declare function getCompatibility(persona: PersonaKey): CompatInfo[];
//# sourceMappingURL=compatibility.d.ts.map