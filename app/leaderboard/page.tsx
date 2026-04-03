"use client";

/**
 * .md력 리더보드 페이지
 * 랭킹 테이블 + 티어 분포
 */
import { useEffect, useState } from "react";
import { PERSONAS } from "@/lib/content/personas";
import ClaudeScouter from "@/components/ClaudeScouter";
import { getAllTiers } from "@/lib/analyzer/power";
import type { PersonaKey } from "@/lib/types";

interface RankingEntry {
  rank: number;
  nickname: string;
  title: string | null;
  organization: string | null;
  linkedinUrl: string | null;
  statusMessage: string | null;
  role: string | null;
  persona: PersonaKey;
  mdPower: number;
  tier: string;
  delta: number | null;
}

interface LeaderboardData {
  rankings: RankingEntry[];
  totalCount: number;
  tierDistribution: Record<string, number>;
}

const TIER_EMOJI: Record<string, string> = {
  sequoia: "🌋", oak: "🏔️", tree: "🌳",
  sapling: "🌿", sprout: "🌱", egg: "🥚",
};

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTiers = getAllTiers();

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        {/* 헤더 */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1 className="text-3xl font-black tagline-sparkle inline-flex items-center gap-3">
            <ClaudeScouter size={40} />
            <span className="tagline-gradient">.md력 리더보드</span>
          </h1>
          <p className="text-sm text-claude-light/50 mt-1">
            {data ? `${data.totalCount}명 참여 중` : "불러오는 중..."}
          </p>
        </div>

        {/* 티어 범례 */}
        <div className="flex justify-center gap-2 flex-wrap">
          {allTiers.map((tier) => (
            <span
              key={tier.key}
              className="text-xs bg-bg-card rounded-full px-2.5 py-1 text-claude-light/60 flex items-center gap-1"
            >
              {tier.emoji}
              <span>{tier.name}</span>
              {data?.tierDistribution[tier.key] != null && (
                <span className="text-claude-light/30">({data.tierDistribution[tier.key]})</span>
              )}
            </span>
          ))}
        </div>

        {/* 랭킹 테이블 */}
        {loading ? (
          <div className="text-center text-claude-light/40 py-12">불러오는 중...</div>
        ) : !data || data.rankings.length === 0 ? (
          <div className="bg-bg-card rounded-xl p-8 text-center">
            <p className="text-4xl mb-3">🏜️</p>
            <p className="text-claude-cream font-bold">아직 아무도 등록하지 않았어요</p>
            <p className="text-sm text-claude-light/50 mt-1">
              .md 분석 후 리더보드에 등록하세요!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.rankings.map((entry) => {
              const personaDef = PERSONAS[entry.persona];
              return (
                <div
                  key={entry.rank}
                  className="bg-bg-card rounded-xl p-3 flex items-center gap-3 border border-claude-light/5"
                >
                  {/* 순위 */}
                  <span className={`text-lg font-black w-8 text-center shrink-0 ${
                    entry.rank === 1 ? "text-compat-gold" :
                    entry.rank === 2 ? "text-claude-light/70" :
                    entry.rank === 3 ? "text-claude-orange/70" :
                    "text-claude-light/30"
                  }`}>
                    {entry.rank}
                  </span>

                  {/* 이름 + 직무 + 상태 메시지 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-claude-cream truncate">
                        {entry.nickname}
                      </span>
                      {entry.linkedinUrl && (
                        <a
                          href={entry.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A66C2] hover:opacity-80 shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                            <rect x="2" y="9" width="4" height="12"/>
                            <circle cx="4" cy="4" r="2"/>
                          </svg>
                        </a>
                      )}
                      {entry.title && (
                        <span className="text-xs bg-bg-elevated rounded px-1.5 py-0.5 text-claude-light/50 shrink-0">{entry.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.organization && (
                        <span className="text-xs text-claude-light/30 truncate">{entry.organization}</span>
                      )}
                      {entry.statusMessage && (
                        <span className="text-xs text-claude-light/40 italic truncate">&ldquo;{entry.statusMessage}&rdquo;</span>
                      )}
                    </div>
                  </div>

                  {/* 티어 */}
                  <span className="text-lg shrink-0" title={entry.tier}>
                    {TIER_EMOJI[entry.tier] ?? "🥚"}
                  </span>

                  {/* 점수 + 변화량 */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-compat-gold">{entry.mdPower}</span>
                    {entry.delta != null && entry.delta !== 0 && (
                      <p className={`text-xs font-bold ${entry.delta > 0 ? "text-rx-green" : "text-roast-red"}`}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
