"use client";

/**
 * CLAUDE.md 입력 텍스트에어리어 컴포넌트
 * pbcopy 명령어 복사 헬퍼 + 로딩 비활성화 상태 지원
 */
import { useState } from "react";

interface MdInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function MdInput({ value, onChange, disabled }: MdInputProps) {
  // 클립보드 복사 성공 여부 상태
  const [copied, setCopied] = useState(false);

  /** pbcopy 명령어를 클립보드에 복사 */
  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText("pbcopy < ~/.claude/CLAUDE.md");
      setCopied(true);
      // 2초 후 원래 텍스트로 복원
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 무시
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 복사 헬퍼 안내 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-claude-light/70">
          터미널에서 CLAUDE.md 내용을 복사하세요:
        </span>
        <button
          type="button"
          onClick={handleCopyCommand}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-elevated text-xs text-claude-cream font-mono border border-claude-light/20 hover:border-claude-orange/50 transition-colors disabled:opacity-40"
        >
          {/* 복사 아이콘 */}
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rx-green">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <code className="text-claude-orange">pbcopy &lt; ~/.claude/CLAUDE.md</code>
        </button>
      </div>

      {/* 텍스트에어리어 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="여기에 CLAUDE.md 내용을 붙여넣기 하세요..."
        rows={12}
        className="w-full rounded-xl bg-bg-elevated border border-claude-light/20 text-claude-cream placeholder:text-claude-light/40 p-4 text-sm font-mono resize-none focus:outline-none focus:border-claude-orange/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* 글자 수 표시 */}
      {value && (
        <p className="text-xs text-claude-light/50 text-right">
          {value.length.toLocaleString()}자 · {value.split("\n").length}줄
        </p>
      )}
    </div>
  );
}
