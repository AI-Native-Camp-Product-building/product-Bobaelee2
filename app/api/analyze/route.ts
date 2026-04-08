/**
 * POST /api/analyze — CLAUDE.md 텍스트를 분석하여 페르소나 + 점수 + 처방전을 반환한다
 *
 * 요청 본문: { "text": "CLAUDE.md 내용" }
 * 응답: { persona, secondaryPersona, scores, prescriptions, roasts, strengths, mdPower, stats }
 */
import { analyze } from "@/lib/analyzer";

/** 입력 텍스트 최대 길이 (100KB) */
const MAX_TEXT_LENGTH = 100_000;

export async function POST(request: Request) {
  let body: { text?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "요청 본문이 유효한 JSON이 아닙니다" },
      { status: 400 },
    );
  }

  const { text } = body;

  if (!text || typeof text !== "string") {
    return Response.json(
      { error: "text 필드가 필요합니다 (string)" },
      { status: 400 },
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `텍스트가 너무 깁니다 (최대 ${MAX_TEXT_LENGTH}자)` },
      { status: 400 },
    );
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return Response.json(
      { error: "빈 텍스트는 분석할 수 없습니다" },
      { status: 400 },
    );
  }

  const result = analyze(trimmed);

  return Response.json({
    persona: {
      primary: result.persona,
      secondary: result.secondaryPersona,
    },
    scores: result.scores,
    qualityScores: result.qualityScores,
    prescriptions: result.prescriptions,
    roasts: result.roasts,
    strengths: result.strengths,
    mdPower: result.mdPower,
    stats: {
      totalLines: result.mdStats.totalLines,
      toolNames: result.mdStats.toolNames,
      hasRoleDefinition: result.mdStats.hasRoleDefinition,
      isExpandedInput: result.mdStats.isExpandedInput,
    },
  });
}
