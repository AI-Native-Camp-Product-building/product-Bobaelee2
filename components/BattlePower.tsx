/**
 * .md력 측정기 — 레이더 차트 + 점수/티어 + 상위 N% 배지 통합
 */
import type { DimensionScores, PersonaDefinition, MdPower } from "@/lib/types";
import { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "@/lib/types";
import { getAllTiers } from "@/lib/analyzer/power";
import type { PercentileData } from "@/lib/store";
import RadarChart from "./RadarChart";

interface BattlePowerProps {
  persona: PersonaDefinition;
  scores: DimensionScores;
  percentile: PercentileData;
  detectedPatterns: number;
  mdPower: MdPower;
  totalUsers: number;
}

export default function BattlePower({
  persona,
  scores,
  percentile,
  detectedPatterns,
  mdPower,
  totalUsers,
}: BattlePowerProps) {
  const topLabel = DIMENSION_LABELS[percentile.topDimension as keyof DimensionScores]?.label
    ?? percentile.topDimension;
  const percentage = Math.round((mdPower.score / 1000) * 100);
  const allTiers = getAllTiers();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-compat-gold text-center">
        ⚡ .md력 측정 결과
      </h2>

      <div className="bg-bg-card rounded-2xl p-5 flex flex-col items-center gap-5 border border-claude-light/10">
        {/* 티어 + 점수 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl">{mdPower.tierEmoji}</span>
          <span className="text-2xl font-black text-compat-gold">{mdPower.tierName}</span>
          <span className="text-xs text-claude-light/50 italic">{mdPower.tierTagline}</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-claude-cream">{mdPower.score}</span>
          <span className="text-sm text-claude-light/40">/ 1000</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full">
          <div className="w-full h-3 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(90deg, #C96A4A, #D97757, #ffd700)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {allTiers.slice().reverse().map((tier) => (
              <span
                key={tier.key}
                className={`text-xs ${mdPower.tier === tier.key ? "text-compat-gold font-bold" : "text-claude-light/30"}`}
                title={`${tier.name}: ${tier.min}+`}
              >
                {tier.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-full h-px bg-claude-light/10" />

        {/* 레이더 차트 */}
        <p className="text-sm text-claude-light/50 font-semibold">
          {persona.emoji} {persona.nameKo}의 성향 분석
        </p>
        <RadarChart scores={scores} />
        <p className="text-xs text-claude-light/40">
          {TOTAL_PATTERN_COUNT}개 패턴 중 {detectedPatterns}개 감지
        </p>

        {/* 상위 N% 배지 */}
        <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full bg-claude-orange/15 text-claude-orange font-bold">
            🏆 md력 상위 {percentile.mdPowerPercentile}%
          </span>
          <span className="px-3 py-1 rounded-full bg-claude-orange/10 text-claude-orange/80 font-semibold">
            {topLabel} 상위 {percentile.topDimensionPercentile}%
          </span>
          {totalUsers > 0 && (
            <span className="text-xs text-claude-light/40">
              전체 {totalUsers.toLocaleString()}명 중
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
