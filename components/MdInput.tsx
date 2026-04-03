"use client";

/**
 * CLAUDE.md 입력 텍스트에어리어 컴포넌트
 * 전체 설정 수집 스크립트 복사 + 로딩 비활성화 상태 지원
 */
import { useState } from "react";

interface MdInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** 설정 수집 스크립트: CLAUDE.md + AGENTS.md + settings.json + MCP(env 마스킹) + 명령어 + MEMORY */
const COLLECT_CMD = `pbcopy < <(
  for f in ~/.claude/CLAUDE.md ~/.claude/settings.json; do
    [ -f "$f" ] && echo "=== $(basename "$f") ===" && cat "$f" && echo ""
  done
  [ -f ~/.claude/mcp_settings.json ] && echo "=== mcp_settings.json ===" && \\
    python3 -c "
import json,sys
with open(sys.argv[1]) as f: d=json.load(f)
for s in d.get('mcpServers',{}).values():
  if 'env' in s: s['env']={k:'***REDACTED***' for k in s['env']}
print(json.dumps(d,indent=2,ensure_ascii=False))
" ~/.claude/mcp_settings.json && echo ""
  echo "=== commands ===" && ls ~/.claude/commands/*.md 2>/dev/null | xargs -I{} basename {} .md; echo ""
  find ~/.claude/projects -name "MEMORY.md" 2>/dev/null | while read f; do
    echo "=== PROJECT MEMORY ===" && cat "$f" && echo ""
  done
  find ~ -maxdepth 3 \\( -name "CLAUDE.md" -o -name "AGENTS.md" \\) \\
    -not -path "*/.claude/*" -not -path "*/node_modules/*" \\
    -not -path "*/.git/*" 2>/dev/null | \\
    while read f; do echo "=== $f ===" && cat "$f" && echo ""; done
) | sed -E \\
  -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/***EMAIL***/g' \\
  -e 's/(xoxb-|xoxp-|sk-|ghp_|gho_|Bearer )[A-Za-z0-9_-]+/\\1***/g' \\
  -e 's/AKfycb[A-Za-z0-9_-]+/***DEPLOY_ID***/g' \\
  -e 's/ntn_[A-Za-z0-9_-]+/***NOTION***/g'`;

export default function MdInput({ value, onChange, disabled }: MdInputProps) {
  const [copied, setCopied] = useState(false);

  /** 수집 스크립트를 클립보드에 복사 */
  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(COLLECT_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 무시
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 안내 + 복사 버튼 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-claude-light/70">
          터미널에서 설정을 복사하세요:
        </span>
        <button
          type="button"
          onClick={handleCopyCommand}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-bg-elevated text-xs text-claude-cream font-mono border border-claude-light/20 hover:border-claude-orange/50 transition-colors disabled:opacity-40 w-full"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rx-green shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <code className="text-claude-orange truncate">
            {copied ? "복사됨!" : "수집 스크립트 복사 (API 키 자동 마스킹)"}
          </code>
        </button>

        {/* 사용법 안내 */}
        <div className="text-xs text-claude-light/40 leading-relaxed flex flex-col gap-1">
          <p><span className="text-claude-orange/70 font-medium">1.</span> 위 버튼으로 스크립트 복사</p>
          <p><span className="text-claude-orange/70 font-medium">2.</span> 터미널에 붙여넣기 후 Enter (화면에 아무것도 안 뜨는 게 정상!)</p>
          <p><span className="text-claude-orange/70 font-medium">3.</span> 아래 입력창에 <span className="text-claude-cream/60">⌘V</span> 붙여넣기</p>
          <p className="text-claude-light/30 mt-0.5">API 키·토큰·이메일은 자동 마스킹됩니다</p>
        </div>
      </div>

      {/* 텍스트에어리어 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="위 스크립트를 터미널에서 실행한 뒤 여기에 붙여넣기 하세요..."
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
