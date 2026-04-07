"use client";

/**
 * 통합 공유 버튼 컴포넌트
 * 캡처 + SNS 공유를 한 번에 처리
 * LinkedIn/X 클릭 → 이미지 캡처 → 클립보드 복사 → SNS 글쓰기 창 열기
 */
import { useRef, useState, useCallback } from "react";
import type { PersonaKey, PersonaDefinition, RoastItem, MdStats, DimensionScores } from "@/lib/types";
import { PERSONAS } from "@/lib/content/personas";
import { DIMENSION_LABELS } from "@/lib/types";
import type { PercentileData } from "@/lib/store";

interface ShareButtonProps {
  id: string;
  persona: PersonaKey;
  personaDef: PersonaDefinition;
  roasts: RoastItem[];
  mdStats: MdStats;
  scores: DimensionScores;
  percentile: PercentileData;
}

export default function ShareButton({ id, persona, personaDef, roasts, mdStats, scores, percentile }: ShareButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState<string | null>(null); // 'linkedin' | 'x' | 'download' | 'copy' | null
  const [showCard, setShowCard] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${id}`
      : `https://mdti.dev/r/${id}`;

  const shareText =
    `내 .md 털었더니 '${personaDef.nameKo}' 나왔다 ㅋㅋ\n` +
    `${personaDef.tagline}\n\n` +
    `나도 털어보기 →`;

  /** 이미지 캡처 → 클립보드에 텍스트+이미지 복사 (공통 로직) */
  const captureToClipboard = useCallback(async (): Promise<boolean> => {
    setShowCard(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = cardRef.current;
      if (!el) return false;

      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const clipText = `${shareText}\n${shareUrl}`;

      return await new Promise<boolean>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) { resolve(false); return; }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/plain": new Blob([clipText], { type: "text/plain" }),
                "image/png": blob,
              }),
            ]);
            resolve(true);
          } catch {
            // text+image 동시 복사 실패 시 이미지만 시도
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              resolve(true);
            } catch {
              resolve(false);
            }
          }
        }, "image/png");
      });
    } catch {
      return false;
    } finally {
      setShowCard(false);
    }
  }, [shareText, shareUrl]);

  /** LinkedIn: 공유 멘트 클립보드 복사 → OG 카드 포함 공유창 열기 */
  const handleLinkedIn = useCallback(async () => {
    setCapturing("linkedin");
    // 공유 멘트를 클립보드에 복사 (붙여넣기용)
    try {
      await navigator.clipboard.writeText(shareText);
    } catch { /* ignore */ }
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
    setCapturing(null);
  }, [shareText, shareUrl]);

  /** X(Twitter): 캡처 → 클립보드 → 텍스트 프리셋 + 글쓰기 */
  const handleX = useCallback(async () => {
    setCapturing("x");
    await captureToClipboard();
    const encodedText = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(
      `https://twitter.com/compose/tweet?text=${encodedText}`,
      "_blank",
      "noopener,noreferrer"
    );
    setCapturing(null);
  }, [captureToClipboard, shareText, shareUrl]);

  /** 이미지 저장 (다운로드) */
  const handleDownload = useCallback(async () => {
    setShowCard(true);
    setCapturing("download");
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

      const link = document.createElement("a");
      link.download = `mdti-${personaDef.key}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      const link = document.createElement("a");
      link.href = `/api/og/${id}`;
      link.download = `mdti-${personaDef.key}.png`;
      link.click();
    } finally {
      setCapturing(null);
      setShowCard(false);
    }
  }, [personaDef.key, id]);

  /** 링크 + 텍스트 클립보드 복사 */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 클립보드 API 불가 환경
      }
    }
  }, [shareText, shareUrl]);

  const isCapturing = capturing !== null;
  const totalEcosystem = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.toolNames.length;
  const firstRoast = roasts[0];

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* SNS 공유 버튼 — 캡처 + 공유 동시 */}
        <p className="text-xs text-claude-light/50 text-center">
          공유 멘트가 클립보드에 복사됩니다. ⌘V로 붙여넣으세요!
        </p>

        <div className="flex gap-3">
          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleLinkedIn}
            disabled={isCapturing}
            className="flex-1 py-3 rounded-xl bg-[#0A66C2] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {capturing === "linkedin" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                준비 중...
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </>
            )}
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleX}
            disabled={isCapturing}
            className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {capturing === "x" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                준비 중...
              </span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </>
            )}
          </button>
        </div>

        {/* 이미지 저장 + 링크 복사 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isCapturing}
            className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {capturing === "download" ? (
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
            onClick={handleCopyLink}
            disabled={isCapturing}
            className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2 disabled:opacity-40"
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
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                링크 복사
              </>
            )}
          </button>
        </div>
      </div>

      {/* 캡쳐 대상 카드 — 캡쳐 시에만 렌더링 (화면 밖) */}
      {showCard && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
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
            <div style={{ fontSize: "72px", lineHeight: "1" }}>{personaDef.emoji}</div>

            {/* 페르소나 이름 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffd700", letterSpacing: "-1px" }}>
                {personaDef.nameKo}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(245,230,211,0.5)", marginTop: "4px" }}>
                {personaDef.nameEn}
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
              &ldquo;{personaDef.tagline}&rdquo;
            </div>

            {/* 미니 레이더 */}
            <div style={{ width: "200px", height: "200px" }}>
              <svg viewBox="0 0 200 200" width="200" height="200">
                {[20, 40, 60, 80, 100].map((level) => {
                  const pts = Array.from({ length: 7 }, (_, i) => {
                    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
                    const r = (level / 100) * 70;
                    return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`;
                  }).join(" ");
                  return <polygon key={level} points={pts} fill="none" stroke="rgba(245,230,211,0.1)" strokeWidth="1" />;
                })}
                <polygon
                  points={(Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map((dim, i) => {
                    const v = scores[dim];
                    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
                    const r = (v / 100) * 70;
                    return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`;
                  }).join(" ")}
                  fill="rgba(217,119,87,0.3)" stroke="#D97757" strokeWidth="2"
                />
                {(Object.entries(DIMENSION_LABELS) as [keyof DimensionScores, { label: string }][]).map(([, { label }], i) => {
                  const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
                  return (
                    <text key={i} x={100 + Math.cos(a) * 90} y={100 + Math.sin(a) * 90}
                      textAnchor="middle" fill="rgba(245,230,211,0.6)" fontSize="9" fontWeight="600">
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* 상위 N% 배지 */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <span style={{
                padding: "4px 12px", borderRadius: "999px",
                background: "rgba(217,119,87,0.15)", color: "#D97757",
                fontSize: "11px", fontWeight: 700,
              }}>
                🏆 md력 상위 {percentile.mdPowerPercentile}%
              </span>
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
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
              {[
                { label: "줄 수", value: String(mdStats.claudeMdLines) },
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
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#ffd700" }}>{stat.value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(245,230,211,0.4)", marginTop: "2px" }}>{stat.label}</div>
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
