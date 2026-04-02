/**
 * 결과 저장/조회 API 라우트
 * POST /api/results — 분석 결과 저장, id 반환
 * GET  /api/results?id=xxx — 단일 결과 조회
 * GET  /api/results — 전체 글로벌 통계 반환
 */
import { nanoid } from "nanoid";
import { saveResult, getResult, getGlobalStats } from "@/lib/store";
import type { AnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  const body: AnalysisResult = await request.json();
  const id = nanoid(10);

  await saveResult(id, body);

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
