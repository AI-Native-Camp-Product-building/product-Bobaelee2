/**
 * 결과 저장/조회 API 라우트
 * POST /api/results — 분석 결과 저장, id 반환
 * GET  /api/results?id=xxx — 단일 결과 조회
 * GET  /api/results — 전체 글로벌 통계 반환
 */
import { nanoid } from "nanoid";
import { saveResult, getResult, getGlobalStats } from "@/lib/store";
import type { AnalysisResult } from "@/lib/types";

type PostBody = AnalysisResult & { sessionId?: string | null };

// 기본 UUID 형식 검증 (신뢰 경계에서 1회만 — 악의적 세션으로 DB 오염 방지)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body: PostBody = await request.json();
  const id = nanoid(10);

  const { sessionId, ...result } = body;
  const validSessionId =
    typeof sessionId === "string" && UUID_RE.test(sessionId) ? sessionId : null;

  await saveResult(id, result, validSessionId);

  return Response.json({ id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const result = await getResult(id);
    if (!result) {
      return Response.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
    }
    return Response.json(result);
  }

  const stats = await getGlobalStats();
  return Response.json(stats);
}
