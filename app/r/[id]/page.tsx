/**
 * 결과 페이지 — 서버 컴포넌트
 * Supabase에서 결과를 조회하고 각 섹션 컴포넌트를 렌더링한다
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getResult, getGlobalStats } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getCompatibility } from "@/lib/content/compatibility";
import type { PersonaKey } from "@/lib/types";
import ResultHero from "@/components/ResultHero";
import RoastSection from "@/components/RoastSection";
import StrengthSection from "@/components/StrengthSection";
import CompatSection from "@/components/CompatSection";
import PrescriptionSection from "@/components/PrescriptionSection";
import StatsSection from "@/components/StatsSection";
import ShareButton from "@/components/ShareButton";
import CaptureCard from "@/components/CaptureCard";
import ExpandedAnalysis from "@/components/ExpandedAnalysis";
import MdPowerSection from "@/components/MdPowerSection";

type Props = {
  params: Promise<{ id: string }>;
};

/** OG 메타데이터 동적 생성 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);

  if (!result) {
    return { title: "결과를 찾을 수 없습니다 — MDTI" };
  }

  const persona = PERSONAS[result.persona];
  const title = `${persona.emoji} 나는 ${persona.nameKo} — MDTI`;
  const description = `"${persona.tagline}" 나도 .md 털어보기 →`;
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

        {/* 확장 분석 결과 (전체 수집 시에만 표시) */}
        <ExpandedAnalysis mdStats={result.mdStats} />

        {/* 로스팅 섹션 */}
        <RoastSection roasts={result.roasts} />

        {/* 강점 섹션 */}
        <StrengthSection strengths={result.strengths} />

        {/* 궁합 섹션 */}
        <CompatSection myPersona={result.persona} compat={compat} />

        {/* .md력 측정 결과 */}
        <MdPowerSection
          mdPower={result.mdPower}
          totalUsers={globalStats.totalUsers}
        />

        {/* 처방전 섹션 */}
        <PrescriptionSection prescriptions={result.prescriptions} />

        {/* 통계 섹션 */}
        <StatsSection
          mdStats={result.mdStats}
          globalStats={globalStats}
          persona={result.persona}
        />

        {/* 캡쳐 카드 */}
        <CaptureCard
          persona={personaDef}
          roasts={result.roasts}
          mdStats={result.mdStats}
          id={id}
        />

        {/* 공유 버튼 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-claude-cream text-center">
            결과 공유하기
          </h2>
          <ShareButton id={id} persona={result.persona} />
        </section>

        {/* 하단 CTA */}
        <div className="text-center pb-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            나도 털리기 →
          </Link>
          <Link
            href="/"
            className="text-sm text-claude-cream/40 hover:text-claude-cream/60 transition-colors"
          >
            ← 다시 분석하기
          </Link>
        </div>
      </div>
    </main>
  );
}
