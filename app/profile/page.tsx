"use client";

/**
 * 내 정보 페이지
 * GitHub 로그인 + 프로필 수정 + 탈퇴
 */
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

interface ProfileData {
  nickname: string;
  title: string;
  organization: string;
  statusMessage: string;
  role: string;
  linkedinUrl: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; name: string; avatarUrl: string } | null>(null);
  const [registered, setRegistered] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nickname: "", title: "", organization: "",
    statusMessage: "", role: "non-dev", linkedinUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 세션 확인 (onAuthStateChange로 OAuth 리다이렉트 후 세션도 감지)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !user) {
        const u = session.user;
        setUser({
          id: u.id,
          name: u.user_metadata?.name ?? u.email ?? "",
          avatarUrl: u.user_metadata?.avatar_url ?? "",
        });
      }
    });

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          id: u.id,
          name: u.user_metadata?.name ?? u.email ?? "",
          avatarUrl: u.user_metadata?.avatar_url ?? "",
        });
        // 프로필 조회
        fetch("/api/leaderboard/profile")
          .then((r) => r.json())
          .then((data) => {
            if (data.registered) {
              setRegistered(true);
              setProfile({
                nickname: data.profile.nickname ?? "",
                title: data.profile.title ?? "",
                organization: data.profile.organization ?? "",
                statusMessage: data.profile.statusMessage ?? "",
                role: data.profile.role ?? "non-dev",
                linkedinUrl: data.profile.linkedinUrl ?? "",
              });
            } else {
              setProfile((prev) => ({
                ...prev,
                nickname: data.user?.name ?? "",
              }));
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // GitHub 로그인
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });

    // signInWithOAuth는 자동 리다이렉트하지만, 실패 시 수동 리다이렉트
    if (data?.url) {
      window.location.href = data.url;
    }
    if (error) {
      console.error("OAuth error:", error.message);
      alert("로그인에 실패했습니다: " + error.message);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRegistered(false);
  };

  // 프로필 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/leaderboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // 탈퇴
  const handleDelete = async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) return;
    await fetch("/api/leaderboard/profile", { method: "DELETE" });
    await supabase.auth.signOut();
    setUser(null);
    setRegistered(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-claude-light/40">불러오는 중...</p>
      </main>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <main className="min-h-screen bg-bg-primary px-4 py-16">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <h1 className="text-2xl font-black text-claude-cream">👤 내 정보</h1>
          <p className="text-sm text-claude-light/50 text-center">
            리더보드 참여 및 프로필 관리를 위해<br />GitHub 로그인이 필요합니다.
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 rounded-xl bg-[#24292f] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub로 로그인
          </button>
        </div>
      </main>
    );
  }

  // 로그인 상태
  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-black text-claude-cream">프로필 수정</h1>
        <p className="text-sm text-claude-light/50">리더보드와 프로필 페이지에 반영됩니다.</p>

        <div className="flex flex-col gap-4">
          {/* 이름 */}
          <Field label="이름" required>
            <input
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              maxLength={20}
              className="input-field"
            />
          </Field>

          {/* 직급 */}
          <Field label="직급" required>
            <input
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              placeholder="예: Frontend Developer"
              className="input-field"
            />
          </Field>

          {/* 소속 */}
          <Field label="소속" required>
            <input
              value={profile.organization}
              onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
              className="input-field"
            />
          </Field>

          {/* 상태 메시지 */}
          <Field label="상태 메시지" hint="선택">
            <div className="relative">
              <input
                value={profile.statusMessage}
                onChange={(e) => setProfile({ ...profile, statusMessage: e.target.value.slice(0, 150) })}
                placeholder="한마디"
                maxLength={150}
                className="input-field pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-claude-light/30">
                {profile.statusMessage.length}/150
              </span>
            </div>
          </Field>

          {/* 역할 */}
          <Field label="역할" required>
            <div className="flex gap-2">
              {[
                { key: "non-dev", label: "✨ 비개발자" },
                { key: "dev", label: "💻 개발자" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setProfile({ ...profile, role: opt.key })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile.role === opt.key
                      ? "bg-claude-orange/20 text-claude-orange border border-claude-orange/40"
                      : "bg-bg-elevated text-claude-light/50 border border-claude-light/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* LinkedIn */}
          <Field label="LinkedIn" hint="선택">
            <input
              value={profile.linkedinUrl}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
              placeholder="https://www.linkedin.com/in/..."
              className="input-field"
            />
          </Field>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving || !profile.nickname}
            className="w-full py-3 rounded-xl bg-claude-orange text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saved ? "✓ 저장됨!" : saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="text-sm text-claude-light/40 hover:text-claude-light/60 transition-colors"
        >
          로그아웃
        </button>

        {/* 탈퇴 */}
        {registered && (
          <div className="border-t border-claude-light/10 pt-4 mt-4">
            <p className="text-sm font-bold text-roast-red mb-1">탈퇴</p>
            <p className="text-xs text-claude-light/40 mb-3">
              계정을 삭제하면 모든 사용량 데이터와 배지가 함께 삭제되며, 복구할 수 없습니다.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg border border-roast-red/50 text-roast-red text-sm font-bold hover:bg-roast-red/10 transition-colors"
            >
              계정 삭제
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          background: #333;
          border: 1px solid rgba(232, 221, 211, 0.15);
          color: #F5E6D3;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus {
          border-color: rgba(217, 119, 87, 0.5);
        }
        .input-field::placeholder {
          color: rgba(232, 221, 211, 0.3);
        }
      `}</style>
    </main>
  );
}

/** 폼 필드 래퍼 */
function Field({ label, hint, required, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-claude-cream">
        {label}
        {required && <span className="text-roast-red ml-0.5">*</span>}
        {hint && <span className="text-claude-light/40 text-xs ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
