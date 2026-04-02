/**
 * 결과 페이지 — 서버 컴포넌트
 * Supabase에서 결과를 조회하고 각 섹션 컴포넌트를 렌더링한다
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PERSONAS } from "@/lib/content/personas";
import { getCompatibility } from "@/lib/content/compatibility";
import type { SavedResult, GlobalStats, PersonaKey } from "@/lib/types";
import ResultHero from "@/components/ResultHero";
import RoastSection from "@/components/RoastSection";
import StrengthSection from "@/components/StrengthSection";
import CompatSection from "@/components/CompatSection";
import PrescriptionSection from "@/components/PrescriptionSection";
import StatsSection from "@/components/StatsSection";
import ShareButton from "@/components/ShareButton";

type Props = {
  params: Promise<{ id: string }>;
};

/** DB에서 결과 조회 */
async function getResult(id: string): Promise<SavedResult | null> {
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    persona: data.persona as PersonaKey,
    scores: data.scores,
    roasts: data.roasts,
    strengths: data.strengths,
    prescriptions: data.prescriptions,
    mdStats: data.md_stats,
    createdAt: data.created_at,
  };
}

/** 글로벌 통계 조회 */
async function getGlobalStats(): Promise<GlobalStats> {
  const [resultsRes, statsRes] = await Promise.all([
    supabase.from("results").select("id", { count: "exact", head: true }),
    supabase.from("persona_stats").select("*"),
  ]);

  const totalUsers = resultsRes.count ?? 0;
  const stats = statsRes.data ?? [];

  const personaCounts = {} as Record<PersonaKey, number>;
  let totalLines = 0;

  for (const row of stats) {
    personaCounts[row.persona as PersonaKey] = row.count;
    totalLines += Number(row.total_lines ?? 0);
  }

  return {
    totalUsers,
    personaCounts,
    avgLines: totalUsers > 0 ? Math.round(totalLines / totalUsers) : 0,
    userPercentile: { lines: 50, tools: 50, complexity: 50 },
  };
}

/** OG 메타데이터 동적 생성 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);

  if (!result) {
    return { title: "결과를 찾을 수 없습니다 — MDTI" };
  }

  const persona = PERSONAS[result.persona];
  const title = `${persona.emoji} 나는 ${persona.nameKo} — MDTI`;
  const description = `"${persona.tagline}" 나도 CLAUDE.md 털어보기 →`;
  const ogImageUrl = `/api/og/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/** 결과 페이지 본문 */
export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  // 결과 + 글로벌 통계 병렬 조회
  const [result, globalStats] = await Promise.all([
    getResult(id),
    getGlobalStats(),
  ]);

  if (!result) {
    notFound();
  }

  const personaDef = PERSONAS[result.persona];
  const compat = getCompatibility(result.persona);

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        {/* 페르소나 히어로 */}
        <ResultHero persona={personaDef} />

        {/* 로스팅 섹션 */}
        <RoastSection roasts={result.roasts} />

        {/* 강점 섹션 */}
        <StrengthSection strengths={result.strengths} />

        {/* 궁합 섹션 */}
        <CompatSection myPersona={result.persona} compat={compat} />

        {/* 처방전 섹션 */}
        <PrescriptionSection prescriptions={result.prescriptions} />

        {/* 통계 섹션 */}
        <StatsSection
          mdStats={result.mdStats}
          globalStats={globalStats}
          persona={result.persona}
        />

        {/* 공유 버튼 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-claude-cream text-center">
            결과 공유하기
          </h2>
          <ShareButton id={id} persona={result.persona} />
        </section>

        {/* 나도 털리기 CTA */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            나도 털리기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
