/**
 * 궁합 비교 페이지 — 서버 컴포넌트
 * v1(7차원 바 비교) + v2(4축 방향 비교) 모두 지원
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getResult as getResultFromStore } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import { AXIS_LABELS, AXIS_ORDER } from "@/lib/v2-types";
import type { DimensionScores } from "@/lib/types";
import type { AxisScores, AxisKey } from "@/lib/v2-types";
import MatchShareButton from "@/components/MatchShareButton";

type Props = {
  params: Promise<{ id1: string; id2: string }>;
};

/** v1 차원 이름 한글 매핑 */
const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  automation: "자동화 성향",
  control: "제어 성향",
  toolDiversity: "도구 다양성",
  contextAwareness: "컨텍스트 관리",
  teamImpact: "협업 지향",
  security: "보안 의식",
  agentOrchestration: "에이전트 오케스트레이션",
};

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[];

/** 축별 한글 라벨 (UI 표시용) */
const AXIS_UI_LABELS: Record<AxisKey, string> = {
  harness: "도구 확장",
  control: "AI 통제",
  verbose: "표현 방식",
  structure: "구조 선호",
};

/** 축 방향별 라벨 (UI 표시용) */
const AXIS_DIRECTION_LABELS: Record<AxisKey, { a: string; b: string }> = {
  harness: { a: "탐색형", b: "구축형" },
  control: { a: "통제형", b: "위임형" },
  verbose: { a: "맥락형", b: "핵심형" },
  structure: { a: "구조화형", b: "자유형" },
};

/** 저장소에서 결과 조회 */
async function getMatchResult(id: string) {
  const result = await getResultFromStore(id);
  if (!result) return null;
  return {
    id: result.id,
    persona: result.persona,
    scores: result.scores,
    typeCode: result.typeCode,
    axisScores: result.axisScores,
  };
}

/** 결과에서 이모지와 이름 추출 (v2 우선, v1 폴백) */
function getPersonaInfo(result: { persona: string; typeCode: string | null }) {
  // v2: typeCode가 있으면 v2 페르소나 사용
  if (result.typeCode) {
    const v2Persona = getPersonaByTypeCode(result.typeCode);
    if (v2Persona) {
      return { emoji: v2Persona.emoji, name: v2Persona.name };
    }
  }
  // v1 폴백
  const v1Persona = PERSONAS[result.persona as keyof typeof PERSONAS];
  if (v1Persona) {
    return { emoji: v1Persona.emoji, name: v1Persona.nameKo };
  }
  return { emoji: "?", name: "알 수 없음" };
}

/** v1: 점수 차이 기반 궁합 판정 */
function judgeMatchV1(scores1: DimensionScores, scores2: DimensionScores) {
  const diffs = DIMENSION_KEYS.map((k) => Math.abs(scores1[k] - scores2[k]));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff < 15) {
    return {
      emoji: "\uD83E\uDE9E",
      label: "거울 같은 사이",
      description: "거의 모든 차원에서 비슷한 성향. 서로를 보면 나를 보는 것 같다.",
    };
  }
  if (avgDiff < 30) {
    return {
      emoji: "\uD83D\uDC99",
      label: "환상의 파트너",
      description: "적당한 차이가 서로를 보완해준다. 함께하면 최강의 조합.",
    };
  }
  return {
    emoji: "\uD83D\uDCA5",
    label: "극과 극",
    description: "성향 차이가 크다. 충돌도 잦겠지만, 그래서 더 자극이 되는 사이.",
  };
}

/** v2: 축 방향 일치 수 기반 궁합 판정 */
function judgeMatchV2(axis1: AxisScores, axis2: AxisScores) {
  let sameCount = 0;
  for (const axis of AXIS_ORDER) {
    if (axis1.judgments[axis].direction === axis2.judgments[axis].direction) {
      sameCount++;
    }
  }

  if (sameCount >= 3) {
    return {
      emoji: "\uD83E\uDE9E",
      label: "거울 같은 사이",
      description: `4개 축 중 ${sameCount}개가 같은 방향. 서로를 보면 나를 보는 것 같다.`,
      sameCount,
    };
  }
  if (sameCount === 2) {
    return {
      emoji: "\uD83D\uDC99",
      label: "환상의 파트너",
      description: "반은 같고 반은 다르다. 적당한 차이가 서로를 보완해주는 최강의 조합.",
      sameCount,
    };
  }
  return {
    emoji: "\uD83D\uDCA5",
    label: "극과 극",
    description: `4개 축 중 ${sameCount}개만 일치. 정반대 성향이지만, 그래서 더 자극이 되는 사이.`,
    sameCount,
  };
}

/** 축 방향의 라벨 반환 */
function getDirectionLabel(axis: AxisKey, direction: string): string {
  const labels = AXIS_DIRECTION_LABELS[axis];
  const axisInfo = AXIS_LABELS[axis];
  return direction === axisInfo.a ? labels.a : labels.b;
}

/** OG 메타데이터 생성 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id1, id2 } = await params;

  const [result1, result2] = await Promise.all([
    getMatchResult(id1),
    getMatchResult(id2),
  ]);

  if (!result1 || !result2) {
    return { title: "궁합 결과를 찾을 수 없습니다 — MDTI" };
  }

  const p1 = getPersonaInfo(result1);
  const p2 = getPersonaInfo(result2);

  return {
    title: `${p1.name} × ${p2.name} 궁합 결과 — MDTI`,
    description: `${p1.emoji} ${p1.name}과(와) ${p2.emoji} ${p2.name}의 .md 궁합을 확인해보세요!`,
    openGraph: {
      title: `${p1.name} × ${p2.name} 궁합 결과 — MDTI`,
      description: `${p1.emoji} ${p1.name}과(와) ${p2.emoji} ${p2.name}의 .md 궁합을 확인해보세요!`,
    },
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

  const p1 = getPersonaInfo(result1);
  const p2 = getPersonaInfo(result2);

  // v2 판정 여부: 둘 다 axisScores가 있으면 v2
  const isV2 = !!(result1.axisScores && result2.axisScores);

  const match = isV2
    ? judgeMatchV2(result1.axisScores!, result2.axisScores!)
    : judgeMatchV1(result1.scores, result2.scores);

  // 동일 타입 체크 (v2: typeCode, v1: persona)
  const isSameType = isV2
    ? result1.typeCode === result2.typeCode
    : result1.persona === result2.persona;

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-10">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <p className="text-sm text-claude-light/50 mb-2">MDTI 궁합 비교</p>
          <h1 className="text-2xl font-black text-claude-cream">
            .md 궁합 결과
          </h1>
        </div>

        {/* VS 레이아웃 */}
        <div className="bg-bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{p1.emoji}</span>
              <p className="text-base font-bold text-compat-gold text-center">
                {p1.name}
              </p>
              {/* v1에만 영문 이름 표시 */}
              {!isV2 && result1.persona && PERSONAS[result1.persona as keyof typeof PERSONAS] && (
                <p className="text-xs text-claude-light/50 text-center">
                  {PERSONAS[result1.persona as keyof typeof PERSONAS].nameEn}
                </p>
              )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-claude-orange">VS</span>
            </div>

            {/* 오른쪽 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{p2.emoji}</span>
              <p className="text-base font-bold text-compat-gold text-center">
                {p2.name}
              </p>
              {!isV2 && result2.persona && PERSONAS[result2.persona as keyof typeof PERSONAS] && (
                <p className="text-xs text-claude-light/50 text-center">
                  {PERSONAS[result2.persona as keyof typeof PERSONAS].nameEn}
                </p>
              )}
            </div>
          </div>

          {/* 동일 타입 여부 */}
          {isSameType && (
            <div className="mt-4 py-2 px-3 rounded-lg bg-claude-orange/10 border border-claude-orange/30 text-center">
              <p className="text-sm text-claude-orange font-medium">
                🎭 둘 다 {p1.name}! 거울을 보는 기분이겠군요.
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

        {/* v2: 4축 방향 비교 */}
        {isV2 && result1.axisScores && result2.axisScores && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-claude-cream">
              축별 비교
            </h2>

            <div className="flex flex-col gap-3">
              {AXIS_ORDER.map((axis) => {
                const j1 = result1.axisScores!.judgments[axis];
                const j2 = result2.axisScores!.judgments[axis];
                const isSame = j1.direction === j2.direction;
                const label1 = getDirectionLabel(axis, j1.direction);
                const label2 = getDirectionLabel(axis, j2.direction);

                return (
                  <div
                    key={axis}
                    className={`rounded-xl p-4 flex flex-col gap-3 border ${
                      isSame
                        ? "bg-emerald-950/30 border-emerald-500/30"
                        : "bg-rose-950/30 border-rose-500/30"
                    }`}
                  >
                    {/* 축 이름 + 일치 표시 */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-claude-light/60">
                        {AXIS_UI_LABELS[axis]}
                      </p>
                      <span className={`text-xs font-bold ${isSame ? "text-emerald-400" : "text-rose-400"}`}>
                        {isSame ? "일치" : "반대"}
                      </span>
                    </div>

                    {/* 양쪽 방향 표시 */}
                    <div className="flex items-center justify-between gap-4">
                      {/* 왼쪽 (person1) */}
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{p1.emoji}</span>
                        <span className="text-sm font-bold text-claude-cream">
                          {label1}
                        </span>
                      </div>

                      {/* 구분선 */}
                      <div className="w-px h-6 bg-claude-light/20" />

                      {/* 오른쪽 (person2) */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-sm font-bold text-claude-cream">
                          {label2}
                        </span>
                        <span className="text-lg">{p2.emoji}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* v1: 7차원 바 비교 */}
        {!isV2 && (
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
                        <span className="text-sm w-4 text-center">{p1.emoji}</span>
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
                        <span className="text-sm w-4 text-center">{p2.emoji}</span>
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
        )}

        {/* 공유 버튼 */}
        <div className="bg-bg-card rounded-2xl p-6">
          <MatchShareButton
            id1={id1}
            id2={id2}
            emoji1={p1.emoji}
            name1={p1.name}
            emoji2={p2.emoji}
            name2={p2.name}
            matchLabel={match.label}
            matchEmoji={match.emoji}
          />
        </div>

        {/* 나도 해보기 CTA */}
        <div className="text-center pb-8 flex flex-col items-center gap-3">
          <p className="text-sm text-claude-light/50">
            내 .md도 분석해볼까?
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
          >
            나도 해보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
