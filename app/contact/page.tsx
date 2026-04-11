"use client";

/**
 * Contact / 피드백 페이지
 * .mdTI 테마 적용 피드백 폼
 */
import { useState } from "react";

type FeedbackType = "bug" | "feature" | "general";

const TYPES: { key: FeedbackType; label: string; emoji: string }[] = [
  { key: "general", label: "일반 의견", emoji: "💬" },
  { key: "feature", label: "기능 제안", emoji: "💡" },
  { key: "bug", label: "버그 제보", emoji: "🐛" },
];

export default function ContactPage() {
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, email: email || null }),
      });
      if (res.ok) setSubmitted(true);
    } catch { /* ignore */ }
    setSending(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-bg-primary px-4 py-16">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6 text-center">
          <span className="text-6xl">🎉</span>
          <h1 className="text-2xl font-black text-claude-cream">감사합니다!</h1>
          <p className="text-sm text-claude-light/60">소중한 의견이 전달되었습니다.</p>
          <a
            href="/"
            className="px-6 py-3 rounded-xl bg-claude-orange text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
          >
            돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-black tagline-sparkle inline-block">
            <span className="tagline-gradient">Contact</span>
          </h1>
          <p className="text-sm text-claude-light/50 mt-2">
            .mdTI에 대한 의견, 버그 제보, 기능 제안을 보내주세요.
          </p>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 flex flex-col gap-5 border border-claude-light/10">
          {/* 유형 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-claude-cream">유형</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    type === t.key
                      ? "bg-claude-orange/20 text-claude-orange border border-claude-orange/40"
                      : "bg-bg-elevated text-claude-light/50 border border-claude-light/20 hover:text-claude-light/70"
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 메시지 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-claude-cream">
              메시지 <span className="text-roast-red">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="자유롭게 적어주세요..."
              rows={5}
              className="w-full rounded-xl bg-bg-elevated border border-claude-light/20 text-claude-cream placeholder:text-claude-light/30 p-4 text-sm resize-none focus:outline-none focus:border-claude-orange/60 transition-colors"
            />
          </div>

          {/* 이메일 (선택) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-claude-cream">
              이메일 <span className="text-claude-light/40 text-xs">(선택 — 답변받고 싶으시면)</span>
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full rounded-xl bg-bg-elevated border border-claude-light/20 text-claude-cream placeholder:text-claude-light/30 p-3 text-sm focus:outline-none focus:border-claude-orange/60 transition-colors"
            />
          </div>

          {/* 제출 */}
          <button
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
            className="w-full py-3.5 rounded-xl bg-claude-orange text-bg-primary font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "보내는 중..." : "보내기"}
          </button>
        </div>
      </div>
    </main>
  );
}
