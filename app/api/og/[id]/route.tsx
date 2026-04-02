/**
 * OG 이미지 동적 생성 라우트 (Edge Runtime)
 * 결과 ID 기반으로 LinkedIn 최적화 1200×630 카드 생성
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { ImageResponse } from "next/og";
import { getResult } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import type { MdStats } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;

  const result = await getResult(id);

  const persona = result
    ? PERSONAS[result.persona]
    : PERSONAS["craftsman"];

  const mdStats: MdStats | null = result?.mdStats ?? null;
  const toolCount = mdStats?.toolNames?.length ?? 0;
  const ruleCount = mdStats?.ruleCount ?? 0;
  const totalLines = mdStats?.totalLines ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "1200px",
          height: "630px",
          background: "#1a1a1a",
          gap: "24px",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* 배경 장식 원 */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(217, 119, 87, 0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(217, 119, 87, 0.05)",
          }}
        />

        {/* MDTI 로고 */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "36px",
            left: "60px",
            fontSize: "22px",
            fontWeight: 900,
            color: "#D97757",
            letterSpacing: "-1px",
          }}
        >
          MDTI
        </div>

        {/* 이모지 */}
        <div style={{ fontSize: "100px", lineHeight: "1" }}>
          {persona.emoji}
        </div>

        {/* 한글 이름 */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#ffd700",
            letterSpacing: "-2px",
          }}
        >
          {persona.nameKo}
        </div>

        {/* 영문 이름 */}
        <div
          style={{
            fontSize: "24px",
            color: "rgba(245, 230, 211, 0.6)",
            fontWeight: 500,
          }}
        >
          {persona.nameEn}
        </div>

        {/* 태그라인 */}
        <div
          style={{
            fontSize: "20px",
            color: "#F5E6D3",
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: "1.5",
            marginTop: "4px",
          }}
        >
          &ldquo;{persona.tagline}&rdquo;
        </div>

        {/* 통계 3개 */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "16px",
          }}
        >
          {[
            { label: "줄 수", value: String(totalLines) },
            { label: "도구", value: `${toolCount}개` },
            { label: "규칙", value: `${ruleCount}개` },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "16px 28px",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#ffd700",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(245, 230, 211, 0.5)",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* 하단 푸터 */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            right: "60px",
            fontSize: "16px",
            color: "rgba(245, 230, 211, 0.35)",
          }}
        >
          mdti.dev
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
