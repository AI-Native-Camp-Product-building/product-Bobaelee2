"use client";

/**
 * 궁합 결과 공유 버튼 컴포넌트
 * LinkedIn 공유 + 링크 복사 기능
 */
import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";

interface MatchShareButtonProps {
  id1: string;
  id2: string;
  emoji1: string;
  name1: string;
  emoji2: string;
  name2: string;
  matchLabel: string;
  matchEmoji: string;
}

export default function MatchShareButton({
  id1,
  id2,
  emoji1,
  name1,
  emoji2,
  name2,
  matchLabel,
  matchEmoji,
}: MatchShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const matchUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/match/${id1}/vs/${id2}`
      : `https://mdti.dev/match/${id1}/vs/${id2}`;

  const shareText =
    `${emoji1} ${name1} × ${emoji2} ${name2}\n` +
    `궁합 결과: ${matchEmoji} ${matchLabel}\n\n` +
    `나도 궁합 확인하기 →`;

  /** LinkedIn: 공유 멘트 클립보드 복사 → 공유창 열기 */
  const handleLinkedIn = useCallback(async () => {
    track("result_shared", { channel: "linkedin", result_id: `${id1}_vs_${id2}` });
    try {
      await navigator.clipboard.writeText(shareText);
    } catch { /* ignore */ }
    const encodedUrl = encodeURIComponent(matchUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [shareText, matchUrl, id1, id2]);

  /** 링크 + 공유 멘트 클립보드 복사 */
  const handleCopyLink = useCallback(async () => {
    track("result_shared", { channel: "copy_link", result_id: `${id1}_vs_${id2}` });
    try {
      await navigator.clipboard.writeText(`${shareText}\n${matchUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(matchUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* 클립보드 API 불가 환경 */
      }
    }
  }, [shareText, matchUrl, id1, id2]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-claude-cream text-center">
        궁합 결과 공유하기
      </p>
      <p className="text-xs text-claude-light/50 text-center">
        공유 멘트가 클립보드에 복사됩니다. ⌘V로 붙여넣으세요!
      </p>

      <div className="flex gap-3">
        {/* LinkedIn */}
        <button
          type="button"
          onClick={handleLinkedIn}
          className="flex-1 py-3 rounded-xl bg-[#0A66C2] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </button>

        {/* 링크 복사 */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2"
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
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              링크 복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}
