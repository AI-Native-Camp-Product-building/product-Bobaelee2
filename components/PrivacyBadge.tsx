/**
 * 프라이버시 보호 배지
 * 브라우저 외부로 데이터가 나가지 않음을 시각적으로 안내
 */
export default function PrivacyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated text-sm text-claude-light border border-claude-light/20">
      {/* 자물쇠 아이콘 */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-rx-green"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      분석은 100% 내 브라우저에서. 원본은 어디에도 전송되지 않아요.
    </span>
  );
}
