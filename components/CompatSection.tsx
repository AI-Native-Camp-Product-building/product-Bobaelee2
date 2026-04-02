/**
 * 궁합 섹션
 * 최고 궁합(perfect), 최악 궁합(chaos), 거울 궁합(mirror) 3개 블록
 */
import type { CompatInfo, PersonaKey } from "@/lib/types";
import { PERSONAS } from "@/lib/content/personas";

interface CompatSectionProps {
  /** 내 페르소나 키 */
  myPersona: PersonaKey;
  /** 궁합 정보 배열 (perfect, chaos, mirror 순) */
  compat: CompatInfo[];
}

/** 궁합 타입별 설정 */
const COMPAT_CONFIG = {
  perfect: {
    label: "최고 궁합",
    emoji: "💙",
    colorClass: "text-strength-blue",
    borderClass: "border-strength-blue/30",
    bgClass: "bg-strength-blue/5",
  },
  chaos: {
    label: "최악 궁합",
    emoji: "💥",
    colorClass: "text-roast-red",
    borderClass: "border-roast-red/30",
    bgClass: "bg-roast-red/5",
  },
  mirror: {
    label: "거울 궁합",
    emoji: "🪞",
    colorClass: "text-claude-orange",
    borderClass: "border-claude-orange/30",
    bgClass: "bg-claude-orange/5",
  },
} as const;

export default function CompatSection({ myPersona, compat }: CompatSectionProps) {
  const myDef = PERSONAS[myPersona];

  return (
    <section className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <h2 className="text-xl font-bold text-compat-gold">
        🤝 페르소나 궁합
      </h2>

      {/* 궁합 블록 목록 */}
      <div className="flex flex-col gap-3">
        {compat.map((item) => {
          const config = COMPAT_CONFIG[item.type];
          const targetDef = PERSONAS[item.targetPersona];

          return (
            <div
              key={item.type}
              className={`rounded-xl p-4 border ${config.borderClass} ${config.bgClass}`}
            >
              {/* 레이블 */}
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${config.colorClass}`}>
                {config.emoji} {config.label}
              </p>

              {/* 이모지 + 이름 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{myDef.emoji}</span>
                <span className="text-claude-light/50 text-sm">+</span>
                <span className="text-2xl">{targetDef.emoji}</span>
                <span className="text-sm text-claude-cream font-medium">
                  {myDef.nameKo} × {targetDef.nameKo}
                </span>
              </div>

              {/* 설명 */}
              <p className="text-xs text-claude-light/70 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
