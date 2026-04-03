"use client";

/**
 * CLAUDE.md 입력 텍스트에어리어 컴포넌트
 * OS 자동 감지 + Mac/Windows/Linux 수집 스크립트
 */
import { useState, useEffect } from "react";

interface MdInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type OS = "mac" | "windows" | "linux";

/** Mac: pbcopy */
const MAC_CMD = `pbcopy < <(
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

/** Windows: PowerShell */
const WIN_CMD = `$ErrorActionPreference="SilentlyContinue"
$out = ""
$home = $env:USERPROFILE
foreach ($f in "$home\\.claude\\CLAUDE.md","$home\\.claude\\settings.json") {
  if (Test-Path $f) { $out += "=== $(Split-Path $f -Leaf) ===\`n$(Get-Content $f -Raw)\`n" }
}
if (Test-Path "$home\\.claude\\mcp_settings.json") {
  $j = Get-Content "$home\\.claude\\mcp_settings.json" -Raw | ConvertFrom-Json
  foreach ($s in $j.mcpServers.PSObject.Properties) {
    if ($s.Value.env) { $s.Value.env = @{REDACTED="***"} }
  }
  $out += "=== mcp_settings.json ===\`n$($j | ConvertTo-Json -Depth 5)\`n"
}
$cmds = Get-ChildItem "$home\\.claude\\commands\\*.md" -ErrorAction SilentlyContinue | ForEach-Object { $_.BaseName }
if ($cmds) { $out += "=== commands ===\`n$($cmds -join "\`n")\`n" }
Get-ChildItem "$home\\.claude\\projects" -Recurse -Filter "MEMORY.md" -ErrorAction SilentlyContinue | ForEach-Object {
  $out += "=== PROJECT MEMORY ===\`n$(Get-Content $_.FullName -Raw)\`n"
}
Get-ChildItem "$home" -Recurse -Depth 2 -Include "CLAUDE.md","AGENTS.md" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\.claude\\\\|node_modules|\\.git' } | ForEach-Object {
  $out += "=== $($_.FullName) ===\`n$(Get-Content $_.FullName -Raw)\`n"
}
$out -replace '[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}','***EMAIL***' \\
  -replace '(xoxb-|xoxp-|sk-|ghp_|gho_|Bearer )[\\w-]+','$1***' \\
  -replace 'AKfycb[\\w-]+','***DEPLOY_ID***' \\
  -replace 'ntn_[\\w-]+','***NOTION***' | Set-Clipboard`;

/** Linux: xclip */
const LINUX_CMD = MAC_CMD.replace("pbcopy", "xclip -selection clipboard");

const COMMANDS: Record<OS, string> = { mac: MAC_CMD, windows: WIN_CMD, linux: LINUX_CMD };
const OS_LABELS: Record<OS, string> = { mac: "Mac", windows: "Windows", linux: "Linux" };
const PASTE_HINT: Record<OS, string> = {
  mac: "⌘V",
  windows: "Ctrl+V",
  linux: "Ctrl+Shift+V",
};

function detectOS(): OS {
  if (typeof navigator === "undefined") return "mac";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "mac";
}

export default function MdInput({ value, onChange, disabled }: MdInputProps) {
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<OS>("mac");

  useEffect(() => { setOs(detectOS()); }, []);

  const currentCmd = COMMANDS[os];

  /** 수집 스크립트를 클립보드에 복사 */
  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(currentCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 무시
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 안내 + OS 선택 + 복사 버튼 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-claude-light/70">
            터미널에서 설정을 복사하세요:
          </span>
          {/* OS 토글 */}
          <div className="flex rounded-md overflow-hidden border border-claude-light/20">
            {(["mac", "windows", "linux"] as OS[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => { setOs(o); setCopied(false); }}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  os === o
                    ? "bg-claude-orange/20 text-claude-orange"
                    : "text-claude-light/40 hover:text-claude-light/60"
                }`}
              >
                {OS_LABELS[o]}
              </button>
            ))}
          </div>
        </div>
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
            {copied ? "복사됨!" : `${OS_LABELS[os]}용 수집 스크립트 복사 (API 키 자동 마스킹)`}
          </code>
        </button>

        {/* 사용법 안내 */}
        <div className="text-xs text-claude-light/40 leading-relaxed flex flex-col gap-1">
          <p><span className="text-claude-orange/70 font-medium">1.</span> 위 버튼으로 스크립트 복사</p>
          <p><span className="text-claude-orange/70 font-medium">2.</span> {os === "windows" ? "PowerShell" : "터미널"}에 붙여넣기 후 Enter <span className="text-claude-orange font-bold">(터미널 화면에 아무것도 안 뜨는 게 정상!)</span></p>
          <p><span className="text-claude-orange/70 font-medium">3.</span> 아래 입력창에 <span className="text-claude-cream/60">{PASTE_HINT[os]}</span> 붙여넣기</p>
          <p className="text-claude-light/30 mt-0.5">API 키·토큰·이메일은 자동 마스킹됩니다</p>
        </div>
      </div>

      {/* 텍스트에어리어 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`위 스크립트를 ${os === "windows" ? "PowerShell" : "터미널"}에서 실행한 뒤 여기에 붙여넣기 하세요...`}
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
