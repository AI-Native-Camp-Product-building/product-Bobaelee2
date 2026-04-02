/**
 * 궁합 비교 페이지 — 서버 컴포넌트
 * 두 결과 ID를 받아 페르소나와 6개 차원 점수를 비교한다
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getResult as getResultFromStore } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import type { DimensionScores, PersonaKey } from "@/lib/types";

type Props = {
  params: Promise<{ id1: string; id2: string }>;
};

/** 차원 이름 한글 매핑 */
const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  automation: "자동화 성향",
  control: "제어 성향",
  toolDiversity: "도구 다양성",
  maturity: "MD 성숙도",
  collaboration: "협업 지향",
  security: "보안 의식",
};

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[];

/** 저장소에서 결과 조회 */
async function getMatchResult(id: string) {
  const result = await getResultFromStore(id);
  if (!result) return null;
  return {
    id: result.id,
    persona: result.persona,
    scores: result.scores,
  };
}

/** 점수 차이 기반 궁합 판정 */
function judgeMatch(scores1: DimensionScores, scores2: DimensionScores): {
  label: string;
  description: string;
  emoji: string;
} {
  const diffs = DIMENSION_KEYS.map((k) => Math.abs(scores1[k] - scores2[k]));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff < 15) {
    return {
      emoji: "🪞",
      label: "거울 같은 사이",
      description: "거의 모든 차원에서 비슷한 성향. 서로를 보면 나를 보는 것 같다.",
    };
  }

  if (avgDiff < 30) {
    return {
      emoji: "💙",
      label: "환상의 파트너",
      description: "적당한 차이가 서로를 보완해준다. 함께하면 최강의 조합.",
    };
  }

  return {
    emoji: "💥",
    label: "극과 극",
    description: "성향 차이가 크다. 충돌도 잦겠지만, 그래서 더 자극이 되는 사이.",
  };
}

export default async function MatchPage({ params }: Props) {
  const { id1, id2 } = await params;

  // 두 결과 병렬 조회
  const [result1, result2] = await Promise.all([
    getMatchResult(id1),
    getMatchResult(id2),
  ]);

  if (!result1 || !result2) {
    notFound();
  }

  const persona1 = PERSONAS[result1.persona];
  const persona2 = PERSONAS[result2.persona];
  const match = judgeMatch(result1.scores, result2.scores);
  const isSameType = result1.persona === result2.persona;

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-10">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <p className="text-sm text-claude-light/50 mb-2">MDTI 궁합 비교</p>
          <h1 className="text-2xl font-black text-claude-cream">
            CLAUDE.md 궁합 결과
          </h1>
        </div>

        {/* VS 레이아웃 */}
        <div className="bg-bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{persona1.emoji}</span>
              <p className="text-base font-bold text-compat-gold text-center">
                {persona1.nameKo}
              </p>
              <p className="text-xs text-claude-light/50 text-center">
                {persona1.nameEn}
              </p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-claude-orange">VS</span>
            </div>

            {/* 오른쪽 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{persona2.emoji}</span>
              <p className="text-base font-bold text-compat-gold text-center">
                {persona2.nameKo}
              </p>
              <p className="text-xs text-claude-light/50 text-center">
                {persona2.nameEn}
              </p>
            </div>
          </div>

          {/* 동일 타입 여부 */}
          {isSameType && (
            <div className="mt-4 py-2 px-3 rounded-lg bg-claude-orange/10 border border-claude-orange/30 text-center">
              <p className="text-sm text-claude-orange font-medium">
                🎭 둘 다 {persona1.nameKo}! 거울을 보는 기분이겠군요.
              </p>
            </div>
          )}
        </div>

        {/* 궁합 판정 결과 */}
        <div className="bg-bg-card rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">{match.emoji}</span>
          <p className="text-xl font-black text-compat-gold">{match.label}</p>
          <p className="text-sm text-claude-light/70 leading-relaxed max-w-xs">
            {match.description}
          </p>
        </div>

        {/* 6개 차원 비교 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-claude-cream">
            차원별 비교
          </h2>

          <div className="flex flex-col gap-3">
            {DIMENSION_KEYS.map((key) => {
              const score1 = result1.scores[key];
              const score2 = result2.scores[key];

              return (
                <div key={key} className="bg-bg-card rounded-xl p-4 flex flex-col gap-2">
                  {/* 차원 이름 */}
                  <p className="text-xs text-claude-light/60 font-medium">
                    {DIMENSION_LABELS[key]}
                  </p>

                  {/* 바 비교 */}
                  <div className="flex flex-col gap-1.5">
                    {/* 왼쪽 (result1) */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-4 text-center">{persona1.emoji}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-claude-orange"
                          style={{ width: `${score1}%` }}
                        />
                      </div>
                      <span className="text-xs text-claude-light/60 w-8 text-right">
                        {score1}
                      </span>
                    </div>

                    {/* 오른쪽 (result2) */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-4 text-center">{persona2.emoji}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-strength-blue"
                          style={{ width: `${score2}%` }}
                        />
                      </div>
                      <span className="text-xs text-claude-light/60 w-8 text-right">
                        {score2}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 나도 해보기 CTA */}
        <div className="text-center pb-8 flex flex-col items-center gap-3">
          <p className="text-sm text-claude-light/50">
            내 CLAUDE.md도 분석해볼까?
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            나도 해보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
