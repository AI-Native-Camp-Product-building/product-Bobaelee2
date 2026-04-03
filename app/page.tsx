"use client";

/**
 * MDTI 랜딩 페이지
 * CLAUDE.md 입력 → 클라이언트 분석 → 결과 저장 → 결과 페이지로 이동
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyze } from "@/lib/analyzer";
import PrivacyBadge from "@/components/PrivacyBadge";
import MdInput from "@/components/MdInput";
import ClaudeIcon from "@/components/ClaudeIcon";

export default function HomePage() {
  const router = useRouter();
  const [md, setMd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** CLAUDE.md 분석 후 결과 페이지로 이동 */
  const handleSubmit = async () => {
    if (!md.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. 클라이언트 사이드 분석 (MD 텍스트는 브라우저를 떠나지 않음)
      const result = analyze(md);

      // 2. 분석 결과를 서버에 저장 (MD 원본은 전송하지 않음)
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!res.ok) {
        throw new Error("결과 저장에 실패했습니다");
      }

      const { id } = await res.json();

      // 3. 결과 페이지로 이동
      router.push(`/r/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg flex flex-col gap-8">
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-black tracking-tight flex items-center gap-3">
            <ClaudeIcon size={52} />
            <span>
              <span className="text-claude-cream/60 font-mono">.</span>
              <span className="text-claude-cream/60 font-mono">md</span>
              <span className="text-claude-orange">TI</span>
            </span>
          </h1>
          <p className="text-xl font-bold leading-snug tagline-sparkle">
            <span className="tagline-gradient">.md가 당신에게 하고 싶었던 말</span>
          </p>
          <PrivacyBadge />
        </div>

        {/* 입력 영역 */}
        <div className="bg-bg-card rounded-2xl p-6 flex flex-col gap-6 border border-claude-light/10">
          <MdInput value={md} onChange={setMd} disabled={loading} />

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-roast-red text-center">{error}</p>
          )}

          {/* 제출 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !md.trim()}
            className="w-full py-3.5 rounded-xl bg-claude-orange text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                분석 중...
              </span>
            ) : (
              "내 MD 털어보기"
            )}
          </button>
        </div>

        {/* 푸터 — 통계 */}
        <TotalUsersFooter />
      </div>
    </main>
  );
}

/** 총 사용자 수 표시 비동기 컴포넌트 (클라이언트에서 fetch) */
function TotalUsersFooter() {
  const [total, setTotal] = useState<number | null>(null);

  // 초기 렌더 시 통계 조회
  if (total === null) {
    fetch("/api/results")
      .then((r) => r.json())
      .then((data) => setTotal(data.totalUsers ?? 0))
      .catch(() => setTotal(0));
  }

  return (
    <p className="text-center text-sm text-claude-light/50">
      {total === null
        ? "통계 불러오는 중..."
        : `지금까지 ${total.toLocaleString()}명이 털렸습니다`}
    </p>
  );
}
