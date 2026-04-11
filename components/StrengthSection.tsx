/**
 * 강점 섹션
 *
 * 진짜 대단한 점 3개를 색상 카드로 표시 — RoastSection과 시각 무게를 1:1로 맞춤.
 *
 * 톤 설계: mdti는 "🔥 로스팅(찌르기) + 💎 강점(안아주기)" 2섹션 짝궁이에요.
 * 두 섹션이 시각적으로 동등한 무게를 가져야 사용자가 양쪽을 모두 받아들임.
 */
import type { StrengthItem } from "@/lib/types";

interface StrengthSectionProps {
  strengths: StrengthItem[];
}

/** 색상별 좌측 보더 + 텍스트 — strength 팔레트 (cyan/deep-blue/green) */
const STRENGTH_COLORS = [
  {
    border: "border-l-strength-blue",
    text: "text-strength-blue",
  },
  {
    border: "border-l-strength-cyan-deep",
    text: "text-strength-cyan-deep",
  },
  {
    border: "border-l-rx-green",
    text: "text-rx-green",
  },
] as const;

/** 본문 첫 문장을 제목으로, 나머지를 디테일로 분리. 단일 문장이면 전체를 제목으로. */
function splitTitleDetail(text: string): { title: string; detail: string | null } {
  // 첫 마침표/느낌표/물음표 위치를 찾아서 분리
  // (`[\s\S]*`로 dotall 플래그 없이도 줄바꿈 포함)
  const match = text.match(/^([^.!?]*[.!?])\s*([\s\S]*)$/);
  if (!match || !match[2]) {
    return { title: text, detail: null };
  }
  return { title: match[1].trim(), detail: match[2].trim() };
}

export default function StrengthSection({ strengths }: StrengthSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <h2 className="text-xl font-bold text-strength-blue">
        💎 근데 진짜 대단한 점
      </h2>

      {/* 강점 카드 목록 — RoastSection과 동일 구조 */}
      <div className="flex flex-col gap-3">
        {strengths.map((item, i) => {
          const palette = STRENGTH_COLORS[i % STRENGTH_COLORS.length];
          const { title, detail } = splitTitleDetail(item.text);
          return (
            <div
              key={i}
              className={`bg-bg-card rounded-xl p-4 border-l-4 ${palette.border}`}
            >
              <p className={`font-semibold text-sm mb-1 ${palette.text}`}>
                {title}
              </p>
              {detail && (
                <p className="text-xs text-claude-light/70 leading-relaxed">
                  {detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
