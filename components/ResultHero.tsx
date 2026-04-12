/**
 * 결과 페이지 히어로 섹션
 * v1: 페르소나 이모지, 한글/영문 이름, 태그라인, 설명
 * v2: 페르소나 이모지, 이름, 태그라인, 하기스/하네스 뱃지
 */
import type { PersonaDefinition } from "@/lib/types";

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
