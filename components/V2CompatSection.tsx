/**
 * v2 페르소나 궁합 섹션
 * 최적 궁합(soulmate), 보완 관계(complement), 최악 궁합(nemesis) 3개 블록
 */
import type { V2CompatItem } from '@/lib/content/v2-compatibility';

interface V2CompatSectionProps {
  /** 내 페르소나 이모지 */
  myEmoji: string;
  /** 궁합 정보 배열 (soulmate, complement, nemesis 순) */
  compat: V2CompatItem[];
}

/** 궁합 타입별 스타일 설정 */
const COMPAT_CONFIG = {
  soulmate: {
    label: '최적 궁합',
    emoji: '💙',
    colorClass: 'text-strength-blue',
    borderClass: 'border-strength-blue/30',
    bgClass: 'bg-strength-blue/5',
  },
  complement: {
    label: '보완 관계',
    emoji: '💛',
    colorClass: 'text-compat-gold',
    borderClass: 'border-compat-gold/30',
    bgClass: 'bg-compat-gold/5',
  },
  nemesis: {
    label: '최악 궁합',
    emoji: '💥',
    colorClass: 'text-roast-red',
    borderClass: 'border-roast-red/30',
    bgClass: 'bg-roast-red/5',
  },
} as const;

export default function V2CompatSection({ myEmoji, compat }: V2CompatSectionProps) {
  if (compat.length === 0) return null;

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
                <span className="text-2xl">{myEmoji}</span>
                <span className="text-claude-light/50 text-sm">×</span>
                <span className="text-2xl">{item.targetEmoji}</span>
                <span className="text-sm text-claude-cream font-medium">
                  {item.targetName}
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
