/**
 * 위트 섹션 — "~한 적 없나요?" 포맷의 공감 질문
 */
export default function WitSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-bg-card rounded-2xl p-6">
      <h2 className="text-lg font-bold text-claude-cream mb-4">😏 솔직히 말하면</h2>
      <div className="flex flex-col gap-3">
        {items.map((wit, i) => (
          <p key={i} className="text-sm text-claude-light/80 italic bg-bg-primary/50 rounded-xl p-4">
            {wit}
          </p>
        ))}
      </div>
    </section>
  );
}
