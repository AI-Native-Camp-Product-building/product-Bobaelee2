"use client";

/**
 * 소셜 공유용 캡쳐 카드
 * 히어로 + 대표 로스팅 + 핵심 통계를 하나의 카드로 렌더링
 * html2canvas로 이미지화하여 다운로드/공유
 */
import { useRef, useState, useCallback } from "react";
import type { PersonaDefinition, RoastItem, MdStats } from "@/lib/types";

interface CaptureCardProps {
  persona: PersonaDefinition;
  roasts: RoastItem[];
  mdStats: MdStats;
  id: string;
}

export default function CaptureCard({ persona, roasts, mdStats, id }: CaptureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [showCard, setShowCard] = useState(false);

  /** 카드 캡쳐 후 다운로드 */
  const handleCapture = useCallback(async () => {
    // 카드를 먼저 보이게 한 뒤 캡쳐
    setShowCard(true);
    setCapturing(true);

    // DOM 업데이트 대기
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = cardRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 다운로드 트리거
      const link = document.createElement("a");
      link.download = `mdti-${persona.key}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback: OG 이미지 다운로드
      const link = document.createElement("a");
      link.href = `/api/og/${id}`;
      link.download = `mdti-${persona.key}.png`;
      link.click();
    } finally {
      setCapturing(false);
      setShowCard(false);
    }
  }, [persona.key, id]);

  /** 클립보드에 이미지 복사 (모바일 미지원 시 다운로드 fallback) */
  const handleCopyImage = useCallback(async () => {
    setShowCard(true);
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = cardRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
        } catch {
          // clipboard API 미지원 시 다운로드
          const link = document.createElement("a");
          link.download = `mdti-${persona.key}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      }, "image/png");
    } catch {
      // fallback
    } finally {
      setCapturing(false);
      setShowCard(false);
    }
  }, [persona.key]);

  const totalEcosystem = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.toolNames.length;
  const firstRoast = roasts[0];

  return (
    <>
      {/* 캡쳐 버튼 영역 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-claude-cream text-center">
          결과 캡쳐하기
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing}
            className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {capturing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                캡쳐 중...
              </span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                이미지 저장
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={capturing}
            className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            이미지 복사
          </button>
        </div>
      </section>

      {/* 캡쳐 대상 카드 — 캡쳐 시에만 렌더링 (화면 밖) */}
      {showCard && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
          }}
        >
          <div
            ref={cardRef}
            style={{
              width: "440px",
              padding: "40px 32px",
              background: "#1a1a1a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {/* MDTI 로고 */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "rgba(245,230,211,0.5)", fontSize: "14px", fontWeight: 700, fontFamily: "monospace" }}>.md</span>
              <span style={{ color: "#D97757", fontSize: "14px", fontWeight: 900 }}>TI</span>
            </div>

            {/* 이모지 */}
            <div style={{ fontSize: "72px", lineHeight: "1" }}>{persona.emoji}</div>

            {/* 페르소나 이름 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffd700", letterSpacing: "-1px" }}>
                {persona.nameKo}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(245,230,211,0.5)", marginTop: "4px" }}>
                {persona.nameEn}
              </div>
            </div>

            {/* 태그라인 */}
            <div style={{
              fontSize: "14px",
              color: "#F5E6D3",
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: "340px",
              lineHeight: "1.6",
            }}>
              &ldquo;{persona.tagline}&rdquo;
            </div>

            {/* 대표 로스팅 */}
            {firstRoast && (
              <div style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "16px",
                width: "100%",
                borderLeft: "3px solid #ef4444",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "6px" }}>
                  🔥 {firstRoast.text}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(245,230,211,0.65)", lineHeight: "1.6" }}>
                  {firstRoast.detail}
                </div>
              </div>
            )}

            {/* 통계 */}
            <div style={{
              display: "flex",
              gap: "12px",
              width: "100%",
              justifyContent: "center",
            }}>
              {[
                { label: "줄 수", value: String(mdStats.totalLines) },
                { label: mdStats.isExpandedInput ? "에코시스템" : "도구", value: mdStats.isExpandedInput ? String(totalEcosystem) : `${mdStats.toolNames.length}` },
                { label: "규칙", value: String(mdStats.ruleCount) },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  textAlign: "center",
                  flex: 1,
                }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#ffd700" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(245,230,211,0.4)", marginTop: "2px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* 워터마크 */}
            <div style={{ fontSize: "11px", color: "rgba(245,230,211,0.25)", marginTop: "4px" }}>
              나도 털어보기 → mdti.dev
            </div>
          </div>
        </div>
      )}
    </>
  );
}
