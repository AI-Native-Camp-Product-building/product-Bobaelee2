"use client";

/**
 * 공유 버튼 컴포넌트
 * LinkedIn 공유 + 링크+텍스트 클립보드 복사
 */
import { useState } from "react";
import type { PersonaKey } from "@/lib/types";
import { PERSONAS } from "@/lib/content/personas";

interface ShareButtonProps {
  id: string;
  persona: PersonaKey;
}

export default function ShareButton({ id, persona }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const personaDef = PERSONAS[persona];
  // 공유 URL (프로덕션 도메인 기반)
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${id}`
      : `https://mdti.dev/r/${id}`;

  // 공유 텍스트 (한국어)
  const shareText =
    `내 .md 털었더니 '${personaDef.nameKo}' 나왔다 ㅋㅋ\n` +
    `${personaDef.tagline}\n\n` +
    `나도 털어보기 →`;

  /** LinkedIn 공유 */
  const handleLinkedIn = () => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  /** 링크 + 텍스트 클립보드 복사 */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: URL만 복사
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 클립보드 API 불가 환경
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* LinkedIn 공유 버튼 */}
      <button
        type="button"
        onClick={handleLinkedIn}
        className="w-full py-3 rounded-xl bg-[#0A66C2] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        {/* LinkedIn 아이콘 */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
        LinkedIn에 공유하기
      </button>

      {/* 링크 복사 버튼 */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="w-full py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rx-green">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-rx-green">복사 완료!</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            링크 + 텍스트 복사
          </>
        )}
      </button>
    </div>
  );
}
