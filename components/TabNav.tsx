"use client";

/**
 * 상단 탭 네비게이션
 * MD 분석 | .md력 | 내 정보
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "🔬 .mdTI" },
  { href: "/leaderboard", label: "🏆 .md력" },
  { href: "/profile", label: "👤 내 정보" },
  { href: "/contact", label: "✉️ Contact" },
];

export default function TabNav() {
  const pathname = usePathname();

  // 결과 페이지에서도 탭 표시

  return (
    <nav className="w-full max-w-lg mx-auto px-4 pt-4">
      <div className="flex rounded-xl bg-bg-card border border-claude-light/10 overflow-hidden">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 text-center py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-claude-orange/20 text-claude-orange border-b-2 border-claude-orange"
                  : "text-claude-light/50 hover:text-claude-light/70"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
