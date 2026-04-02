/**
 * 통계 섹션
 * CLAUDE.md 라인 수, 도구 수, 페르소나 점유율을 3열 그리드로 표시
 */
import type { MdStats, GlobalStats, PersonaKey } from "@/lib/types";

interface StatsSectionProps {
  mdStats: MdStats;
  globalStats: GlobalStats;
  persona: PersonaKey;
}

export default function StatsSection({ mdStats, globalStats, persona }: StatsSectionProps) {
  // 평균 대비 배율 계산
  const avgLines = globalStats.avgLines || 50;
  const lineMultiplier = (mdStats.totalLines / avgLines).toFixed(1);

  // 페르소나 점유율 계산
  const personaCount = globalStats.personaCounts[persona] ?? 0;
  const totalUsers = globalStats.totalUsers || 1;
  const personaPercent =
    personaCount > 0 ? Math.round((personaCount / totalUsers) * 100) : 0;

  const stats = [
    {
      label: "CLAUDE.md 줄 수",
      value: mdStats.totalLines.toLocaleString(),
      sub: `평균의 ${lineMultiplier}배`,
    },
    {
      label: "연동 도구",
      value: mdStats.toolNames.length.toLocaleString(),
      sub: "개",
    },
    {
      label: "같은 페르소나",
      value: `${personaPercent}%`,
      sub: `전체 ${totalUsers.toLocaleString()}명 중`,
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      {/* 통계 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-card rounded-xl p-3 flex flex-col items-center text-center gap-1"
          >
            <span className="text-2xl font-black text-compat-gold">
              {stat.value}
            </span>
            <span className="text-xs text-claude-light/60">{stat.label}</span>
            <span className="text-xs text-claude-light/40">{stat.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
