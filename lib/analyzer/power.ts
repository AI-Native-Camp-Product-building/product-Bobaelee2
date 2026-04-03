/**
 * .md력 점수 산출 + 티어 분류
 * 6개 차원 점수 + 에코시스템 보너스 + 심층 보너스 = 0~1000
 */
import type { DimensionScores, MdStats, MdPower, TierKey } from "@/lib/types";

/** 티어 정의 */
const TIERS: { key: TierKey; emoji: string; name: string; tagline: string; min: number }[] = [
  { key: "sequoia", emoji: "🌋", name: "Sequoia", tagline: "하네스를 길들인 자", min: 800 },
  { key: "oak", emoji: "🏔️", name: "Oak", tagline: "팀의 .md 기준점", min: 600 },
  { key: "tree", emoji: "🌳", name: "Tree", tagline: "주변에서 물어보는 수준", min: 400 },
  { key: "sapling", emoji: "🌿", name: "Sapling", tagline: "기본기 장착", min: 250 },
  { key: "sprout", emoji: "🌱", name: "Sprout", tagline: "시작은 했다", min: 100 },
  { key: "egg", emoji: "🥚", name: "Egg", tagline: ".md가 뭐예요?", min: 0 },
];

/**
 * 에코시스템 보너스 계산 (0~250)
 */
function ecosystemBonus(stats: MdStats): number {
  if (!stats.isExpandedInput) return 0;

  const pluginBonus = Math.min(stats.pluginCount * 10, 100);
  const mcpBonus = Math.min(stats.mcpServerCount * 15, 75);
  const commandBonus = Math.min(stats.commandCount * 5, 50);
  const hookBonus = Math.min(stats.hookCount * 5, 25);

  return pluginBonus + mcpBonus + commandBonus + hookBonus;
}

/**
 * 심층 신호 보너스 계산 (0~150)
 */
function depthBonus(stats: MdStats): number {
  if (!stats.isExpandedInput) return 0;

  let bonus = 0;
  if (stats.blocksDangerousOps) bonus += 40;
  bonus += Math.min(stats.hookPromptCount * 20, 40);
  bonus += Math.min(stats.hookCommandCount * 10, 30);
  bonus += Math.min(stats.projectMdCount * 10, 40);

  return bonus;
}

/**
 * .md력 점수를 계산한다 (0~1000)
 */
export function calculateMdPower(scores: DimensionScores, stats: MdStats): MdPower {
  // 기본 점수: 6개 차원 합계 (0~600)
  const baseScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // 보너스
  const eco = ecosystemBonus(stats);
  const depth = depthBonus(stats);

  // 총점 (0~1000 클램프)
  const score = Math.min(1000, Math.max(0, baseScore + eco + depth));

  // 티어 결정
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
