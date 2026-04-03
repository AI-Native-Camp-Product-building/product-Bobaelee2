/**
 * .md력 점수 섹션
 * 티어 이모지 + 점수 + 프로그레스 바 + 상위 % 표시
 */
import type { MdPower } from "@/lib/types";
import { getAllTiers } from "@/lib/analyzer/power";

interface MdPowerSectionProps {
  mdPower: MdPower;
  totalUsers: number;
  rank?: number;
}

export default function MdPowerSection({ mdPower, totalUsers, rank }: MdPowerSectionProps) {
  const percentage = Math.round((mdPower.score / 1000) * 100);
  const allTiers = getAllTiers();

  // 상위 % 추정 (간단 공식: 점수가 높을수록 상위)
  const topPercent = totalUsers > 0 && rank
    ? Math.max(1, Math.round((rank / totalUsers) * 100))
    : Math.max(1, 100 - percentage);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-compat-gold">
        ⚡ .md력 측정 결과
      </h2>

      <div className="bg-bg-card rounded-xl p-6 flex flex-col items-center gap-4">
        {/* 티어 이모지 + 이름 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl">{mdPower.tierEmoji}</span>
          <span className="text-2xl font-black text-compat-gold">{mdPower.tierName}</span>
          <span className="text-xs text-claude-light/50 italic">{mdPower.tierTagline}</span>
        </div>

        {/* 점수 */}
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
                background: `linear-gradient(90deg, #C96A4A, #D97757, #ffd700)`,
              }}
            />
          </div>

          {/* 티어 구간 마커 */}
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

        {/* 상위 % */}
        <p className="text-sm text-claude-light/60">
          상위 <span className="text-claude-orange font-bold">{topPercent}%</span>
          {totalUsers > 0 && (
            <span className="text-claude-light/40"> · 전체 {totalUsers.toLocaleString()}명 중</span>
          )}
        </p>
      </div>
    </section>
  );
}
