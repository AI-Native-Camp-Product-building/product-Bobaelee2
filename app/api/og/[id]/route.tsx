/**
 * OG 이미지 동적 생성 라우트 (Edge Runtime)
 * 결과 ID 기반으로 LinkedIn 최적화 1200×630 카드 생성
 * v1: 12페르소나 + md력 통계
 * v2: 32타입 + 타입코드 + 5축 라벨
 * Next.js 15+: params는 Promise — 반드시 await 사용
 */
import { ImageResponse } from "next/og";
import { getResult, getPercentiles } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import { AXIS_LABELS, AXIS_ORDER } from "@/lib/v2-types";
import type { MdStats } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;

  const result = await getResult(id);
  const percentile = result ? await getPercentiles(id) : null;

  // v2 결과 감지
  const isV2 = !!result?.typeCode && !!result?.axisScores;
  const v2Persona = isV2 ? getPersonaByTypeCode(result!.typeCode!) : null;

  if (isV2 && v2Persona && result) {
    // --- v2 OG 이미지 ---
    const isHarness = result.typeCode![0] === 'H';
    const axisLabels = AXIS_ORDER.map(axis => {
      const judgment = result.axisScores!.judgments[axis];
      const labels = AXIS_LABELS[axis];
      return judgment.direction === labels.a ? labels.aLabel : labels.bLabel;
    });

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
            background: "#0a0a0b",
            gap: "20px",
            padding: "60px",
            position: "relative",
          }}
        >
          {/* 배경 장식 */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: isHarness
                ? "rgba(168, 85, 247, 0.08)"
                : "rgba(245, 158, 11, 0.08)",
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
              color: "#c0f0fb",
              letterSpacing: "-1px",
            }}
          >
            MDTI
          </div>

          {/* 하기스/하네스 뱃지 */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "36px",
              right: "60px",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "16px",
              fontWeight: 600,
              background: isHarness
                ? "rgba(168, 85, 247, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
              color: isHarness ? "#c084fc" : "#fbbf24",
              border: `1px solid ${isHarness ? "rgba(168,85,247,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
          >
            {isHarness ? "🔧 하네스" : "🧸 하기스"}
          </div>

          {/* 이모지 */}
          <div style={{ fontSize: "90px", lineHeight: "1" }}>
            {v2Persona.emoji}
          </div>

          {/* 페르소나 이름 */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              color: "#ffea00",
              letterSpacing: "-2px",
            }}
          >
            {v2Persona.name}
          </div>

          {/* 타입코드 */}
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              fontWeight: 700,
              color: "rgba(245, 230, 211, 0.5)",
              letterSpacing: "8px",
            }}
          >
            {result.typeCode}
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: "20px",
              color: "#fafafa",
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: "1.5",
            }}
          >
            &ldquo;{v2Persona.tagline}&rdquo;
          </div>

          {/* 5축 라벨 가로 배치 */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            {axisLabels.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.06)",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "rgba(245, 230, 211, 0.7)",
                }}
              >
                {label}
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
            나도 .md 털어보기 → mdti.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // --- v1 OG 이미지 (기존 유지) ---
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
            background: "rgba(192, 240, 251, 0.08)",
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
            background: "rgba(192, 240, 251, 0.05)",
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
            color: "#c0f0fb",
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
            color: "#ffea00",
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
            color: "#fafafa",
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
                  color: "#ffea00",
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

        {/* 상위 N% 배지 */}
        {percentile && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#c0f0fb",
            }}
          >
            <span>🏆 md력 상위 {percentile.mdPowerPercentile}%</span>
          </div>
        )}

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
