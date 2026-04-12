/**
 * 결과 페이지 — 서버 컴포넌트
 * v1 결과 (typeCode 없음): 기존 12페르소나 + md력 렌더링
 * v2 결과 (typeCode 존재): 16타입 행동 묘사형 렌더링
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getResult, getGlobalStats } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getCompatibility } from "@/lib/content/compatibility";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import { getWitItems, getExplorationItems } from "@/lib/content/v2-modules";
import type { PersonaKey } from "@/lib/types";
import ResultHero from "@/components/ResultHero";
import RoastSection from "@/components/RoastSection";
import ClassificationDebug from "@/components/ClassificationDebug";
import StrengthSection from "@/components/StrengthSection";
import CompatSection from "@/components/CompatSection";
import PrescriptionSection from "@/components/PrescriptionSection";
import StatsSection from "@/components/StatsSection";
import ShareButton from "@/components/ShareButton";
import ExpandedAnalysis from "@/components/ExpandedAnalysis";
import ResultPageTracker from "@/components/ResultPageTracker";
import WitSection from "@/components/WitSection";
import ExplorationSection from "@/components/ExplorationSection";
import { getV2Compatibility } from "@/lib/content/v2-compatibility";
import V2CompatSection from "@/components/V2CompatSection";
import { getHarnessLevel } from "@/lib/content/harness-level";
import HarnessLevelBadge from "@/components/HarnessLevelBadge";

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

  const isV2 = !!result.typeCode;
  const v2Persona = isV2 ? getPersonaByTypeCode(result.typeCode!) : null;

  const persona = PERSONAS[result.persona];
  const displayName = v2Persona ? v2Persona.name : persona.nameKo;
  const displayEmoji = v2Persona ? v2Persona.emoji : persona.emoji;
  const displayPunchline = v2Persona ? v2Persona.punchline : persona.tagline;

  const title = `${displayEmoji} ${displayName} — MDTI`;
  const description = `"${displayPunchline}" 나도 .md 털어보기 →`;
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

  const [result, globalStats] = await Promise.all([
    getResult(id),
    getGlobalStats(),
  ]);

  if (!result) {
    notFound();
  }

  const personaDef = PERSONAS[result.persona];
  const secondaryDef = result.secondaryPersona ? PERSONAS[result.secondaryPersona] : null;
  const compat = getCompatibility(result.persona);

  // v2 결과 감지 + 데이터 준비
  const isV2Result = !!result.typeCode && !!result.axisScores;
  const v2PersonaDef = isV2Result ? getPersonaByTypeCode(result.typeCode!) : null;
  const v2WitItems = isV2Result && result.axisScores
    ? getWitItems(result.typeCode!, result.axisScores.judgments)
    : [];
  const v2ExplorationItems = isV2Result && result.axisScores
    ? getExplorationItems(result.typeCode!, result.axisScores.judgments)
    : [];
  const v2Compat = isV2Result ? getV2Compatibility(result.typeCode!) : [];
  const harnessLevel = isV2Result && result.axisScores
    ? getHarnessLevel(result.axisScores.judgments.harness)
    : null;

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8">
      <ResultPageTracker id={id} persona={result.persona} />
      <div className="max-w-lg mx-auto flex flex-col gap-8">

        {isV2Result && v2PersonaDef ? (
          /* ===== v2 렌더링 — 찔리는 한마디 중심 ===== */
          <>
            {/* 1. 찔리는 한마디 — 가장 위, 가장 큼 */}
            <section className="text-center py-10">
              <p className="text-2xl font-black text-claude-cream leading-snug">
                &ldquo;{v2PersonaDef.punchline}&rdquo;
              </p>
            </section>

            {/* 2. 페르소나 이름 + 이모지 */}
            <div className="flex flex-col items-center gap-2 -mt-4">
              <span className="text-5xl">{v2PersonaDef.emoji}</span>
              <h1 className="text-3xl font-black text-compat-gold">
                {v2PersonaDef.name}
              </h1>
            </div>

            {/* 3. 행동 묘사 */}
            <section className="bg-bg-card rounded-2xl p-6">
              <p className="text-base text-claude-cream/90 leading-relaxed">
                {v2PersonaDef.narrative}
              </p>
            </section>

            {/* 3.5. 하네스 레벨 */}
            {harnessLevel && <HarnessLevelBadge level={harnessLevel} />}

            {/* 4. 위트 */}
            <WitSection items={v2WitItems} />

            {/* 5. 탐험 제안 */}
            <ExplorationSection items={v2ExplorationItems} />

            {/* 6. 페르소나 궁합 */}
            <V2CompatSection myEmoji={v2PersonaDef.emoji} compat={v2Compat} />

            {/* 7. 공유 버튼 */}
            <section className="flex flex-col gap-3">
              <ShareButton
                id={id}
                persona={result.persona}
                personaDef={personaDef}
                roasts={result.roasts}
                mdStats={result.mdStats}
                scores={result.scores}
              />
            </section>
          </>
        ) : (
          /* ===== v1 레거시 렌더링 ===== */
          <>
            <ResultHero persona={personaDef} />

            {secondaryDef && (
              <div className="text-center -mt-4">
                <span className="inline-block px-4 py-1.5 rounded-full bg-bg-card text-sm text-claude-light/70">
                  + {secondaryDef.emoji} {secondaryDef.nameKo} 기질
                </span>
              </div>
            )}

            <ClassificationDebug scores={result.scores} mdStats={result.mdStats} />

            <RoastSection roasts={result.roasts} />
            <StrengthSection strengths={result.strengths} />
            <CompatSection myPersona={result.persona} compat={compat} />
            <ExpandedAnalysis mdStats={result.mdStats} />
            <PrescriptionSection prescriptions={result.prescriptions} />
            <StatsSection
              mdStats={result.mdStats}
              globalStats={globalStats}
              persona={result.persona}
            />

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-claude-cream text-center">
                결과 공유하기
              </h2>
              <ShareButton
                id={id}
                persona={result.persona}
                personaDef={personaDef}
                roasts={result.roasts}
                mdStats={result.mdStats}
                scores={result.scores}
              />
            </section>
          </>
        )}

        {/* 하단 CTA — v1/v2 공통 */}
        <div className="text-center pb-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
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
