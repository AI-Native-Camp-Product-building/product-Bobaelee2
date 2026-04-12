/**
 * 하네스 레벨 뱃지
 * "당신의 하네스 레벨" — v1의 로데오/하기스 비유 부활
 */
import type { HarnessLevel } from '@/lib/content/harness-level';

interface HarnessLevelBadgeProps {
  level: HarnessLevel;
}

export default function HarnessLevelBadge({ level }: HarnessLevelBadgeProps) {
  return (
    <section className="bg-bg-card rounded-2xl p-5 border border-claude-light/10">
      <p className="text-xs text-claude-light/40 mb-3 font-medium">당신의 하네스 레벨</p>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{level.emoji}</span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-black text-claude-cream">{level.title}</p>
          <p className="text-xs text-claude-light/60 leading-relaxed">{level.description}</p>
        </div>
      </div>
    </section>
  );
}
