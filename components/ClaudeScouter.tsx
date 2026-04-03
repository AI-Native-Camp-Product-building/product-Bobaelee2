"use client";

/**
 * Claude 전투력 측정기 아이콘
 * 드래곤볼 스카우터 + 슈퍼사이어인 아우라 이펙트
 */
export default function ClaudeScouter({ size = 80 }: { size?: number }) {
  return (
    <div
      className="claude-scouter inline-flex items-center justify-center relative"
      style={{ width: size * 1.8, height: size * 1.8 }}
    >
      {/* 아우라 이펙트 레이어들 */}
      <div className="aura-outer" />
      <div className="aura-inner" />
      <div className="aura-sparks">
        <span className="spark s1" />
        <span className="spark s2" />
        <span className="spark s3" />
        <span className="spark s4" />
        <span className="spark s5" />
        <span className="spark s6" />
      </div>

      {/* Claude 본체 */}
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 claude-power-up"
        style={{ width: size, height: size }}
        shapeRendering="crispEdges"
      >
        {/* 왼쪽 귀 */}
        <rect x="14" y="10" width="14" height="14" rx="3" fill="#D97757" />
        {/* 오른쪽 귀 */}
        <rect x="52" y="10" width="14" height="14" rx="3" fill="#D97757" />

        {/* 메인 바디 */}
        <rect x="10" y="20" width="60" height="50" rx="10" fill="#D97757" />

        {/* 눈 — 좌 (스카우터 쪽이라 약간 빛남) */}
        <rect x="24" y="38" width="10" height="12" rx="2" fill="#1a1a1a" />
        <rect x="25" y="39" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />

        {/* 눈 — 우 */}
        <rect x="46" y="38" width="10" height="12" rx="2" fill="#1a1a1a" />
        <rect x="47" y="39" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />

        {/* 스카우터 — 왼쪽 눈 위에 장착 */}
        {/* 스카우터 본체 (귀에서 눈까지) */}
        <rect x="10" y="30" width="4" height="8" rx="1" fill="#e84393" />
        <rect x="14" y="32" width="8" height="4" rx="1" fill="#e84393" />
        {/* 스카우터 렌즈 (눈 앞 반투명) */}
        <rect x="20" y="34" width="14" height="16" rx="3" fill="rgba(232, 67, 147, 0.35)" />
        <rect x="20" y="34" width="14" height="16" rx="3" stroke="#e84393" strokeWidth="1.5" fill="none" />
        {/* 렌즈 반사광 */}
        <rect x="22" y="36" width="4" height="3" rx="1" fill="rgba(255,255,255,0.25)" />
        {/* 스카우터 숫자 표시 */}
        <text x="27" y="47" fontSize="6" fill="#ff6b9d" fontFamily="monospace" textAnchor="middle" fontWeight="bold">!</text>

        {/* 다리 */}
        <rect x="22" y="68" width="12" height="10" rx="3" fill="#D97757" />
        <rect x="46" y="68" width="12" height="10" rx="3" fill="#D97757" />
      </svg>

      <style jsx>{`
        .claude-scouter {
          position: relative;
        }

        /* 슈퍼사이어인 외부 아우라 */
        .aura-outer {
          position: absolute;
          top: 5%;
          left: 10%;
          width: 80%;
          height: 90%;
          border-radius: 40% 40% 35% 35%;
          background: radial-gradient(ellipse at center,
            rgba(255, 215, 0, 0.15) 0%,
            rgba(255, 165, 0, 0.08) 40%,
            transparent 70%
          );
          animation: aura-pulse 1.5s ease-in-out infinite;
          z-index: 1;
        }

        /* 내부 아우라 (더 밝은) */
        .aura-inner {
          position: absolute;
          top: 15%;
          left: 20%;
          width: 60%;
          height: 70%;
          border-radius: 40% 40% 30% 30%;
          background: radial-gradient(ellipse at center,
            rgba(255, 215, 0, 0.25) 0%,
            rgba(217, 119, 87, 0.15) 50%,
            transparent 70%
          );
          animation: aura-pulse 1.2s ease-in-out infinite reverse;
          z-index: 2;
        }

        /* 아우라 맥동 */
        @keyframes aura-pulse {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.6; }
          50% { transform: scaleY(1.15) scaleX(1.05); opacity: 1; }
        }

        /* 스파크 (번개/기 파편) */
        .aura-sparks {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          pointer-events: none;
        }

        .spark {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ffd700;
          border-radius: 50%;
          box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.8);
          animation: spark-float 2s ease-in-out infinite;
        }

        .s1 { top: 20%; left: 15%; animation-delay: 0s; }
        .s2 { top: 10%; left: 55%; animation-delay: 0.3s; }
        .s3 { top: 35%; left: 80%; animation-delay: 0.6s; }
        .s4 { top: 60%; left: 10%; animation-delay: 0.9s; }
        .s5 { top: 15%; left: 75%; animation-delay: 1.2s; }
        .s6 { top: 45%; left: 85%; animation-delay: 1.5s; }

        @keyframes spark-float {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-8px) scale(1);
          }
          80% {
            opacity: 0.6;
            transform: translateY(-20px) scale(0.8);
          }
        }

        /* Claude 본체 미세 떨림 (기 충전 느낌) */
        .claude-power-up {
          animation: power-tremble 0.15s linear infinite;
        }

        @keyframes power-tremble {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 0.5px); }
          50% { transform: translate(0.5px, -0.5px); }
          75% { transform: translate(-0.5px, -0.5px); }
          100% { transform: translate(0.5px, 0); }
        }
      `}</style>
    </div>
  );
}
