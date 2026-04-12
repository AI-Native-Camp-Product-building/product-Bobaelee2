/**
 * 캐릭터 서사 섹션 — v2 페르소나의 스토리를 보여준다
 */
import type { V2PersonaDefinition } from '@/lib/v2-types';

export default function CharacterNarrative({ persona }: { persona: V2PersonaDefinition }) {
  return (
    <section className="bg-bg-card rounded-2xl p-6">
      <p className="text-base text-claude-cream/90 leading-relaxed whitespace-pre-line">
        {persona.narrative}
      </p>
    </section>
  );
}
