"use client";

/**
 * Claude Code 스타일 픽셀아트 아이콘
 * 통통 튀는 바운스 애니메이션
 */
export default function ClaudeIcon({ size = 48 }: { size?: number }) {
  return (
    <div
      className="claude-icon-bounce inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        shapeRendering="crispEdges"
      >
        {/* 왼쪽 귀 */}
        <rect x="14" y="10" width="14" height="14" rx="3" fill="#D97757" />
        {/* 오른쪽 귀 */}
        <rect x="52" y="10" width="14" height="14" rx="3" fill="#D97757" />

        {/* 메인 바디 — 둥근 사각형 */}
        <rect x="10" y="20" width="60" height="50" rx="10" fill="#D97757" />

        {/* 눈 — 좌 (어두운 사각형) */}
        <rect x="24" y="38" width="10" height="12" rx="2" fill="#1a1a1a" />
        {/* 눈 하이라이트 — 좌 */}
        <rect x="25" y="39" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />

        {/* 눈 — 우 (어두운 사각형) */}
        <rect x="46" y="38" width="10" height="12" rx="2" fill="#1a1a1a" />
        {/* 눈 하이라이트 — 우 */}
        <rect x="47" y="39" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />

        {/* 왼쪽 다리 */}
        <rect x="22" y="68" width="12" height="10" rx="3" fill="#D97757" />
        {/* 오른쪽 다리 */}
        <rect x="46" y="68" width="12" height="10" rx="3" fill="#D97757" />
      </svg>
    </div>
  );
}
