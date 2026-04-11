/** 티어 정의 */
const TIERS = [
    { key: "sequoia", emoji: "🌋", name: "Sequoia", tagline: "하네스를 길들인 자", min: 800 },
    { key: "oak", emoji: "🏔️", name: "Oak", tagline: "팀의 .md 기준점", min: 600 },
    { key: "tree", emoji: "🌳", name: "Tree", tagline: "주변에서 물어보는 수준", min: 400 },
    { key: "sapling", emoji: "🌿", name: "Sapling", tagline: "기본기 장착", min: 250 },
    { key: "sprout", emoji: "🌱", name: "Sprout", tagline: "시작은 했다", min: 100 },
    { key: "egg", emoji: "🥚", name: "Egg", tagline: ".md가 뭐예요?", min: 0 },
];
/**
 * .md력 점수를 계산한다 (0~1000)
 * 5개 품질 차원 합산(0~500) × 2 + 에이전트 오케스트레이션 보너스 = 0~1000
 */
export function calculateMdPower(quality, stats, dimensionScores) {
    const baseScore = Object.values(quality).reduce((a, b) => a + b, 0);
    // 자율 에이전트 오케스트레이션 보너스: 50점 이상이면 최대 +50 가산
    const agentBonus = dimensionScores?.agentOrchestration
        ? Math.min(50, Math.max(0, dimensionScores.agentOrchestration - 50) * 1)
        : 0;
    const score = Math.min(1000, Math.max(0, baseScore * 2 + agentBonus));
    const tierDef = TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
    return {
        score,
        tier: tierDef.key,
        tierEmoji: tierDef.emoji,
        tierName: tierDef.name,
        tierTagline: tierDef.tagline,
    };
}
/**
 * 티어 정의 목록을 반환한다 (UI에서 전체 티어 표시용)
 */
export function getAllTiers() {
    return TIERS;
}
//# sourceMappingURL=power.js.map