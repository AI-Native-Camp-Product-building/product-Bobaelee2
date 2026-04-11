/**
 * 페르소나별 로스팅 생성기
 *
 * 톤 설계 원칙 (2026-04-10 재정립):
 * - 관찰은 날카롭게 유지하되, 사용자에 대한 판단/라벨링은 피한다
 * - "상황에 대한 지적" OK / "사람에 대한 단정" NO
 * - 강점은 StrengthSection이 별도로 공급하므로 로스팅은 제 본업(예리한 관찰)에 집중
 *
 * "톡 쏘는 맛"과 "개인 공격"의 차이:
 * ✓ "Claude 장애 공지 뜨면 심장 먼저 멈추는 사람" — 상황 관찰
 * ✗ "기저귀 단계인 걸 본인만 몰라요" — 사람 단정
 */
import type { PersonaKey, MdStats, RoastItem } from "../types.js";
/**
 * 페르소나와 통계를 기반으로 3개의 로스팅을 생성한다
 */
export declare function generateRoasts(persona: PersonaKey, mdStats: MdStats): RoastItem[];
//# sourceMappingURL=roasts.d.ts.map