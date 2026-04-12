/**
 * 탐험 제안 섹션 — 반대 축 방향의 제안으로 성장 유도
 */
export default function ExplorationSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-bg-card rounded-2xl p-6">
      <h2 className="text-lg font-bold text-claude-cream mb-4">🧭 이것도 해보면 재밌을 걸</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-claude-light/80 pl-4 border-l-2 border-claude-orange/40">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
