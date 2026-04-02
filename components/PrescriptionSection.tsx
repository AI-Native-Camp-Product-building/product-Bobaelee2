/**
 * 처방전 섹션
 * MD 업그레이드 처방전을 우선순위 배지와 함께 표시
 */
import type { PrescriptionItem } from "@/lib/types";

interface PrescriptionSectionProps {
  prescriptions: PrescriptionItem[];
}

/** 우선순위별 배지 설정 */
const PRIORITY_CONFIG = {
  high: {
    label: "시급",
    colorClass: "text-roast-red",
    borderClass: "border-roast-red/50",
  },
  medium: {
    label: "권장",
    colorClass: "text-claude-orange",
    borderClass: "border-claude-orange/50",
  },
  low: {
    label: "참고",
    colorClass: "text-strength-blue",
    borderClass: "border-strength-blue/50",
  },
} as const;

export default function PrescriptionSection({ prescriptions }: PrescriptionSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <h2 className="text-xl font-bold text-rx-green">
        🛠️ MD 업그레이드 처방전
      </h2>

      {/* 처방전 목록 */}
      <div className="flex flex-col gap-2.5">
        {prescriptions.map((item, i) => {
          const config = PRIORITY_CONFIG[item.priority];

          return (
            <div key={i} className="bg-bg-card rounded-xl p-4 flex items-start gap-3">
              {/* 우선순위 배지 */}
              <span
                className={`shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded border ${config.colorClass} ${config.borderClass}`}
              >
                {config.label}
              </span>

              {/* 처방 내용 */}
              <p className="text-sm text-claude-cream leading-relaxed">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
