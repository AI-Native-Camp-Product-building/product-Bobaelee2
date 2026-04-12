/**
 * 하네스 레벨 뱃지
 * "당신의 하네스 레벨" — v1의 로데오/하기스 비유 부활
 * 내 레벨 강조 + 전체 5단계 로드맵
 */
import type { HarnessLevel } from '@/lib/content/harness-level';

interface HarnessLevelBadgeProps {
  level: HarnessLevel;
}

/** 5단계 레벨 로드맵 */
const LEVEL_ROADMAP = [
  { emoji: '🥚', title: '갓부화', hint: 'Claude Code 깔긴 했다' },
  { emoji: '👶', title: '하기스', hint: '남이 만든 거 퍼다 쓰는 단계' },
  { emoji: '🧲', title: '하네스 수집가', hint: '좋은 거 고르는 눈이 생긴 단계' },
  { emoji: '🐴', title: '목장 견습생', hint: '직접 만들기 시작한 단계' },
  { emoji: '🤠', title: '로데오급', hint: '깎아서 남한테 나눠주는 단계' },
];

export default function HarnessLevelBadge({ level }: HarnessLevelBadgeProps) {
  return (
    <section className="bg-bg-card rounded-2xl p-5 border border-claude-light/10 flex flex-col gap-4">
      {/* 내 레벨 */}
      <div>
        <p className="text-xs text-claude-light/40 mb-3 font-medium">당신의 하네스 레벨</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{level.emoji}</span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-black text-claude-cream">{level.title}</p>
            <p className="text-xs text-claude-light/60 leading-relaxed">{level.description}</p>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="w-full h-px bg-claude-light/10" />

      {/* 하네스 레벨이 뭔가요? */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-claude-light/40 font-medium">하네스 레벨이 뭔가요?</p>
        <p className="text-xs text-claude-light/50 leading-relaxed">
          AI 에이전트를 다루는 장비를 &ldquo;하네스&rdquo;라고 부릅니다.
          남이 만든 하네스를 쓰는 단계에서, 직접 깎아서 나눠주는 단계까지 — 당신은 지금 어디쯤인가요?
        </p>

        {/* 4단계 로드맵 */}
        <div className="flex flex-col gap-1.5 mt-1">
          {LEVEL_ROADMAP.map((step) => {
            const isMe = step.title === level.title;
            return (
              <div
                key={step.title}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isMe
                    ? 'bg-claude-orange/15 border border-claude-orange/30'
                    : 'opacity-40'
                }`}
              >
                <span className="text-base">{step.emoji}</span>
                <span className={`font-bold ${isMe ? 'text-claude-orange' : 'text-claude-light/60'}`}>
                  {step.title}
                </span>
                <span className="text-claude-light/40 ml-auto">{step.hint}</span>
                {isMe && <span className="text-claude-orange font-black ml-1">← 여기</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
