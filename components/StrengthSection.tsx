/**
 * 강점 섹션
 * 진짜 대단한 점 3개를 ✦ 불릿으로 표시
 */
import type { StrengthItem } from "@/lib/types";

interface StrengthSectionProps {
  strengths: StrengthItem[];
}

export default function StrengthSection({ strengths }: StrengthSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <h2 className="text-xl font-bold text-strength-blue">
        💎 근데 진짜 대단한 점
      </h2>

      {/* 강점 목록 */}
      <div className="bg-bg-card rounded-xl p-5 flex flex-col gap-3">
        {strengths.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* ✦ 불릿 */}
            <span className="text-strength-blue text-base mt-0.5 shrink-0">✦</span>
            <p className="text-sm text-claude-cream leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
