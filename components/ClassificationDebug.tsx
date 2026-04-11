"use client";

/**
 * 분류 투명성 섹션
 *
 * "이 분류가 어떻게 나왔나요?" 클릭 → collapsible로 펼쳐서 다음을 보여준다:
 * - 7-차원 점수 표 (정렬: 높은 순)
 * - 등록된 후보 페르소나의 fit 순위와 등록 이유
 * - 메타 노트 (B경로 사용 여부, fallback 사용 여부 등)
 *
 * classifier.ts가 pure function이라 클라이언트 사이드에서 재계산.
 * DB 스키마 변경 없음, 기존 결과 페이지에 그대로 추가 가능.
 */
import { useMemo, useState } from "react";
import type { DimensionScores, MdStats, PersonaKey } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { classifyPersonaDebug } from "@/lib/analyzer/classifier";
import { PERSONAS } from "@/lib/content/personas";

interface ClassificationDebugProps {
  scores: DimensionScores;
  mdStats: MdStats;
}

export default function ClassificationDebug({ scores, mdStats }: ClassificationDebugProps) {
  const [open, setOpen] = useState(false);

  // 클라이언트 사이드 재계산 — props 변화 시에만 재실행
  const debug = useMemo(() => classifyPersonaDebug(scores, mdStats), [scores, mdStats]);

  // 차원을 점수 내림차순으로 정렬해서 표시
  const sortedDims = useMemo(() => {
    return (Object.entries(scores) as [keyof DimensionScores, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [scores]);

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="self-start text-xs text-claude-light/60 hover:text-claude-light underline underline-offset-2 transition-colors"
        aria-expanded={open}
      >
        🔍 이 분류가 어떻게 나왔나요? {open ? "닫기" : "펼치기"}
      </button>

      {open && (
        <div className="bg-bg-card rounded-xl p-4 flex flex-col gap-5 text-xs text-claude-light/80">
          {/* 메타 노트 */}
          {debug.notes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="font-semibold text-claude-light/90">📋 입력 컨텍스트</div>
              {debug.notes.map((note, i) => (
                <div key={i} className="text-claude-light/60 leading-relaxed">
                  {note}
                </div>
              ))}
            </div>
          )}

          {/* 7-차원 점수 표 */}
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold text-claude-light/90">📊 7-차원 점수 (높은 순)</div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1">
              {sortedDims.map(([dim, score]) => (
                <DimensionRow key={dim} dim={dim} score={score} />
              ))}
            </div>
          </div>

          {/* 특수 케이스 단축 분기 */}
          {debug.shortCircuitReason && (
            <div className="flex flex-col gap-1.5">
              <div className="font-semibold text-claude-light/90">⚡ 단축 분기</div>
              <div className="bg-bg-primary rounded-lg p-3 leading-relaxed">
                <div className="text-claude-orange font-semibold mb-1">
                  → {PERSONAS[debug.primary].nameKo} ({debug.primary})
                </div>
                <div className="text-claude-light/60">{debug.shortCircuitReason}</div>
              </div>
            </div>
          )}

          {/* fallback 사용 안내 */}
          {debug.fallbackUsed && (
            <div className="flex flex-col gap-1.5">
              <div className="font-semibold text-claude-light/90">⚠️ Fallback</div>
              <div className="text-claude-light/60 leading-relaxed">
                후보 페르소나가 0개라 가장 높은 차원 기반으로 분류했어요. 점수가 전반적으로 낮으면 분류 정확도가 떨어질 수 있습니다.
              </div>
            </div>
          )}

          {/* 등록된 후보 리스트 */}
          {debug.candidates.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="font-semibold text-claude-light/90">
                🏆 등록된 후보 ({debug.candidates.length}개, fit 내림차순)
              </div>
              <div className="flex flex-col gap-2">
                {debug.candidates.map((c, i) => (
                  <CandidateRow
                    key={`${c.persona}-${i}`}
                    rank={i + 1}
                    persona={c.persona}
                    fit={c.fit}
                    reason={c.reason}
                    isPrimary={c.persona === debug.primary}
                    isSecondary={c.persona === debug.secondary}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 면책 안내 */}
          <div className="text-claude-light/40 leading-relaxed border-t border-claude-light/10 pt-3">
            분류 로직은 lib/analyzer/classifier.ts에서 확인 가능. 이상하다고 느껴지면{" "}
            <a href="/contact" className="underline">피드백</a>으로 알려주세요 — 대부분의 분류
            기준은 사용자 데이터로 보정됩니다.
          </div>
        </div>
      )}
    </section>
  );
}

/** 차원 점수 한 줄 — 라벨 + 막대 + 숫자 */
function DimensionRow({ dim, score }: { dim: keyof DimensionScores; score: number }) {
  const label = DIMENSION_LABELS[dim].label;
  return (
    <>
      <div className="text-claude-light/70">{label}</div>
      <div className="w-24 self-center">
        <div className="h-1.5 rounded-full bg-bg-primary overflow-hidden">
          <div
            className="h-full bg-claude-orange"
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      </div>
      <div className="text-right tabular-nums text-claude-light/90">{score.toFixed(0)}</div>
    </>
  );
}

/** 후보 페르소나 한 카드 — 순위, 이름, fit, 등록 이유 */
function CandidateRow({
  rank,
  persona,
  fit,
  reason,
  isPrimary,
  isSecondary,
}: {
  rank: number;
  persona: PersonaKey;
  fit: number;
  reason: string;
  isPrimary: boolean;
  isSecondary: boolean;
}) {
  const def = PERSONAS[persona];
  const badge = isPrimary ? "주" : isSecondary ? "부" : null;

  return (
    <div
      className={
        "rounded-lg p-3 flex flex-col gap-1 " +
        (isPrimary
          ? "bg-claude-orange/10 border border-claude-orange/30"
          : "bg-bg-primary/50")
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-claude-light/40 tabular-nums">#{rank}</span>
        <span>{def.emoji}</span>
        <span className="font-semibold text-claude-light/90">{def.nameKo}</span>
        <span className="text-claude-light/40">({persona})</span>
        {badge && (
          <span
            className={
              "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold " +
              (isPrimary
                ? "bg-claude-orange text-bg-primary"
                : "bg-strength-blue/30 text-strength-blue")
            }
          >
            {badge} 페르소나
          </span>
        )}
        {!badge && (
          <span className="ml-auto tabular-nums text-claude-light/60">
            fit {fit.toFixed(1)}
          </span>
        )}
      </div>
      {badge && (
        <div className="tabular-nums text-claude-light/60 text-[10px]">fit {fit.toFixed(1)}</div>
      )}
      <div className="text-claude-light/60 leading-relaxed">{reason}</div>
    </div>
  );
}
