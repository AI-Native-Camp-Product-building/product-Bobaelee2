"use client";

import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";

interface MatchInviteButtonProps {
  resultId: string;
}

export default function MatchInviteButton({ resultId }: MatchInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/r/${resultId}`
        : `https://mdti.dev/r/${resultId}`;

    const shareText =
      `내 AI 사용 유형이 궁금하지 않아? 🤔\n` +
      `너도 .md 털고 나랑 궁합 확인해봐!\n\n` +
      inviteUrl;

    track("match_invite_copied", { result_id: resultId });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 클립보드 실패 시 무시
    }
  }, [resultId]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full py-3.5 rounded-xl bg-compat-gold/20 text-compat-gold font-bold text-sm hover:bg-compat-gold/30 transition-colors border border-compat-gold/30"
    >
      {copied ? "✅ 링크 복사 완료! 친구에게 보내세요" : "🔗 궁합 링크 복사하기"}
    </button>
  );
}
