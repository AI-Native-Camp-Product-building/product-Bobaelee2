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
      {/* 아우라 이펙트 */}
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

      {/* Claude + 스카우터 */}
      <svg
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 claude-power-up"
        style={{ width: size * 1.2, height: size * 1.1 }}
      >
        {/* === Claude 본체 === */}
        {/* 왼쪽 귀 */}
        <rect x="24" y="20" width="14" height="14" rx="3" fill="#D97757" />
        {/* 오른쪽 귀 */}
        <rect x="62" y="20" width="14" height="14" rx="3" fill="#D97757" />
        {/* 메인 바디 */}
        <rect x="20" y="30" width="60" height="50" rx="10" fill="#D97757" />
        {/* 눈 — 좌 */}
        <rect x="34" y="48" width="10" height="12" rx="2" fill="#1a1a1a" />
        <rect x="35" y="49" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
        {/* 눈 — 우 */}
        <rect x="56" y="48" width="10" height="12" rx="2" fill="#1a1a1a" />
        <rect x="57" y="49" width="4" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
        {/* 다리 */}
        <rect x="32" y="78" width="12" height="10" rx="3" fill="#D97757" />
        <rect x="56" y="78" width="12" height="10" rx="3" fill="#D97757" />

        {/* === 스카우터 (드래곤볼 전투력 측정기) === */}

        {/* 이어피스 — 왼쪽 귀에 장착 (흰색 박스) */}
        <rect x="14" y="22" width="10" height="16" rx="3" fill="#e0e0e0" stroke="#aaa" strokeWidth="0.8" />
        <rect x="16" y="24" width="3" height="4" rx="1" fill="#888" />

        {/* 머리 위로 넘어가는 곡선 밴드 */}
        <path
          d="M 19 22 C 19 8, 50 2, 50 12"
          stroke="#e0e0e0"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 19 22 C 19 8, 50 2, 50 12"
          stroke="#ccc"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* 밴드에서 렌즈로 내려오는 암 */}
        <path
          d="M 48 12 L 48 32"
          stroke="#e0e0e0"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 48 12 L 48 32"
          stroke="#ccc"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 렌즈 마운트 (작은 원형 조인트) */}
        <circle cx="48" cy="32" r="3" fill="#ddd" stroke="#aaa" strokeWidth="0.8" />

        {/* 메인 렌즈 — 초록색 반투명 (눈 앞에 위치) */}
        <rect x="38" y="35" width="22" height="28" rx="6" fill="#00ff66" fillOpacity="0.25" />
        <rect x="38" y="35" width="22" height="28" rx="6" stroke="#00ff66" strokeWidth="2" fill="none" className="scouter-lens-glow" />

        {/* 렌즈 내부 — HUD 느낌 */}
        {/* 반사광 */}
        <rect x="41" y="38" width="8" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        {/* 전투력 숫자 */}
        <text x="49" y="52" fontSize="9" fill="#00ff66" fontFamily="monospace" textAnchor="middle" fontWeight="bold" className="scouter-text">.md</text>
        {/* 데이터 바 */}
        <rect x="41" y="55" width="16" height="1.5" rx="0.5" fill="#00ff66" fillOpacity="0.5" />
        <rect x="41" y="58" width="10" height="1.5" rx="0.5" fill="#00ff66" fillOpacity="0.3" />
      </svg>

      <style jsx>{`
        .claude-scouter {
          position: relative;
        }

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

        @keyframes aura-pulse {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.6; }
          50% { transform: scaleY(1.15) scaleX(1.05); opacity: 1; }
        }

        .aura-sparks {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 3;
          pointer-events: none;
        }

        .spark {
          position: absolute;
          width: 3px; height: 3px;
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
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-8px) scale(1); }
          80% { opacity: 0.6; transform: translateY(-20px) scale(0.8); }
        }

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

        /* 렌즈 글로우 애니메이션 */
        .scouter-lens-glow {
          animation: lens-glow 2s ease-in-out infinite;
        }

        @keyframes lens-glow {
          0%, 100% { stroke-opacity: 0.6; filter: drop-shadow(0 0 2px #00ff66); }
          50% { stroke-opacity: 1; filter: drop-shadow(0 0 8px #00ff66); }
        }

        /* 스카우터 텍스트 깜빡임 */
        .scouter-text {
          animation: text-blink 3s ease-in-out infinite;
        }

        @keyframes text-blink {
          0%, 45%, 55%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
