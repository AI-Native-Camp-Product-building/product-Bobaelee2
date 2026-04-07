/**
 * 전투력 측정기 -- 레이더 차트 + 상위 N% 배지
 */
import type { DimensionScores, PersonaDefinition } from "@/lib/types";
import { DIMENSION_LABELS, TOTAL_PATTERN_COUNT } from "@/lib/types";
import type { PercentileData } from "@/lib/store";
import RadarChart from "./RadarChart";

interface BattlePowerProps {
  persona: PersonaDefinition;
  scores: DimensionScores;
  percentile: PercentileData;
  detectedPatterns: number;
}

export default function BattlePower({ persona, scores, percentile, detectedPatterns }: BattlePowerProps) {
  const topLabel = DIMENSION_LABELS[percentile.topDimension as keyof DimensionScores]?.label
    ?? percentile.topDimension;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-claude-cream text-center">
        {persona.emoji} {persona.nameKo}의 전투력 분석
      </h2>
      <div className="bg-bg-card rounded-2xl p-5 flex flex-col items-center gap-4 border border-claude-light/10">
        <RadarChart scores={scores} />
        <p className="text-xs text-claude-light/40">
          {TOTAL_PATTERN_COUNT}개 패턴 중 {detectedPatterns}개 감지
        </p>
        <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full bg-claude-orange/15 text-claude-orange font-bold">
            🏆 md력 상위 {percentile.mdPowerPercentile}%
          </span>
          <span className="px-3 py-1 rounded-full bg-claude-orange/10 text-claude-orange/80 font-semibold">
            {topLabel} 상위 {percentile.topDimensionPercentile}%
          </span>
        </div>
      </div>
    </section>
  );
}
