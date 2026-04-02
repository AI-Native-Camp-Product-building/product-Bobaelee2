/**
 * 로스팅 섹션
 * 불편한 진실 3개를 색상 구분 카드로 표시
 */
import type { RoastItem } from "@/lib/types";

interface RoastSectionProps {
  roasts: RoastItem[];
}

/** 색상별 왼쪽 테두리 클래스 */
const BORDER_COLORS: Record<RoastItem["color"], string> = {
  red: "border-l-roast-red",
  orange: "border-l-claude-orange",
  blue: "border-l-strength-blue",
};

/** 색상별 텍스트 클래스 */
const TEXT_COLORS: Record<RoastItem["color"], string> = {
  red: "text-roast-red",
  orange: "text-claude-orange",
  blue: "text-strength-blue",
};

export default function RoastSection({ roasts }: RoastSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <h2 className="text-xl font-bold text-roast-red">
        🔥 당신의 MD가 말해주는 불편한 진실
      </h2>

      {/* 로스팅 카드 목록 */}
      <div className="flex flex-col gap-3">
        {roasts.map((roast, i) => (
          <div
            key={i}
            className={`bg-bg-card rounded-xl p-4 border-l-4 ${BORDER_COLORS[roast.color]}`}
          >
            <p className={`font-semibold text-sm mb-1 ${TEXT_COLORS[roast.color]}`}>
              {roast.text}
            </p>
            <p className="text-xs text-claude-light/70 leading-relaxed">
              {roast.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
