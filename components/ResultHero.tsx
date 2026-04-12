/**
 * 결과 페이지 히어로 섹션
 * v1: 페르소나 이모지, 한글/영문 이름, 태그라인, 설명
 * v2: 페르소나 이모지, 이름, 태그라인, 하기스/하네스 뱃지
 */
import type { PersonaDefinition } from "@/lib/types";
import type { V2PersonaDefinition } from "@/lib/v2-types";

interface ResultHeroProps {
  persona: PersonaDefinition;
}

export default function ResultHero({ persona }: ResultHeroProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-8">
      {/* 페르소나 이모지 */}
      <span className="text-7xl" role="img" aria-label={persona.nameKo}>
        {persona.emoji}
      </span>

      {/* 페르소나 이름 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-compat-gold">
          {persona.nameKo}
        </h1>
        <p className="text-base text-claude-light/70 font-medium">
          {persona.nameEn}
        </p>
      </div>

      {/* 태그라인 */}
      <p className="text-lg text-claude-cream italic leading-snug max-w-xs">
        &ldquo;{persona.tagline}&rdquo;
      </p>

      {/* 상세 설명 */}
      <p className="text-sm text-claude-light/80 leading-relaxed max-w-sm">
        {persona.description}
      </p>
    </div>
  );
}

/** v2 히어로 — 32타입 페르소나 + 하기스/하네스 뱃지 */
interface ResultHeroV2Props {
  persona: V2PersonaDefinition;
  isHarness: boolean;
}

export function ResultHeroV2({ persona, isHarness }: ResultHeroV2Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-8">
      <span className="text-7xl">{persona.emoji}</span>

      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-compat-gold">
          {persona.name}
        </h1>
      </div>

      <p className="text-lg text-claude-cream italic leading-snug max-w-xs">
        &ldquo;{persona.tagline}&rdquo;
      </p>

      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
        isHarness
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }`}>
        {isHarness ? '🔧 하네스' : '🧸 하기스'}
      </span>
    </div>
  );
}
