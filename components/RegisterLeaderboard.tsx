"use client";

/**
 * 리더보드 등록/갱신 버튼
 * 비로그인 → GitHub 로그인 유도
 * 로그인 → 등록 또는 점수 갱신
 */
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { MdPower } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

interface Props {
  resultId: string;
  mdPower: MdPower;
}

export default function RegisterLeaderboard({ resultId, mdPower }: Props) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({ id: u.id, name: u.user_metadata?.name ?? "" });
        // 기존 등록 여부 확인
        fetch("/api/leaderboard/profile")
          .then((r) => r.json())
          .then((data) => setRegistered(data.registered))
          .catch(() => {});
      }
    });
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/r/${resultId}` },
    });
  };

  const handleRegister = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          nickname: user.name,
          role: "non-dev",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setDelta(data.delta);
        setRegistered(true);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="bg-bg-card rounded-xl p-4 text-center border border-rx-green/20">
        <p className="text-rx-green font-bold text-sm">
          ✓ 리더보드에 등록되었습니다!
          {delta != null && delta !== 0 && (
            <span className={delta > 0 ? " text-rx-green" : " text-roast-red"}>
              {" "}(Δ {delta > 0 ? `+${delta}` : delta})
            </span>
          )}
        </p>
        <a href="/leaderboard" className="text-xs text-claude-orange hover:underline mt-1 inline-block">
          리더보드 보기 →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl p-4 flex flex-col items-center gap-3 border border-claude-light/10">
      <p className="text-xs text-claude-light/50">
        {mdPower.tierEmoji} {mdPower.tierName} · .md력 {mdPower.score}
      </p>

      {!user ? (
        <button
          onClick={handleLogin}
          className="w-full py-2.5 rounded-xl bg-[#24292f] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub로 로그인하여 리더보드 등록
        </button>
      ) : (
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-claude-orange text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "등록 중..." : registered ? "점수 갱신하기" : "리더보드에 등록하기"}
        </button>
      )}
    </div>
  );
}
