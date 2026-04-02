/**
 * 결과 저장/조회 + 글로벌 통계 API 라우트
 * POST /api/results — 분석 결과 저장, id 반환
 * GET  /api/results?id=xxx — 단일 결과 조회
 * GET  /api/results — 전체 글로벌 통계 반환
 */
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";
import type { AnalysisResult, GlobalStats, PersonaKey } from "@/lib/types";

/** 분석 결과를 DB에 저장하고 id 반환 */
export async function POST(request: Request) {
  const body: AnalysisResult = await request.json();

  const id = nanoid(10);

  // results 테이블에 삽입 (mdStats → md_stats 변환)
  const { error: insertError } = await supabase.from("results").insert({
    id,
    persona: body.persona,
    scores: body.scores,
    roasts: body.roasts,
    strengths: body.strengths,
    prescriptions: body.prescriptions,
    md_stats: body.mdStats,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // persona_stats 업서트 — 카운트 + 라인/툴 합산
  const { error: upsertError } = await supabase.rpc("upsert_persona_stat", {
    p_persona: body.persona,
    p_lines: body.mdStats.totalLines,
    p_tools: body.mdStats.toolNames.length,
  }).maybeSingle();

  // RPC가 없을 경우 수동 업서트 fallback
  if (upsertError) {
    await supabase
      .from("persona_stats")
      .upsert(
        {
          persona: body.persona,
          count: 1,
          total_lines: body.mdStats.totalLines,
          total_tools: body.mdStats.toolNames.length,
        },
        { onConflict: "persona", ignoreDuplicates: false }
      );
  }

  return Response.json({ id });
}

/** 결과 조회 또는 전체 통계 반환 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // 단일 결과 조회
  if (id) {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return Response.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
    }

    // DB 컬럼 md_stats → camelCase 변환
    const result = {
      id: data.id,
      persona: data.persona,
      scores: data.scores,
      roasts: data.roasts,
      strengths: data.strengths,
      prescriptions: data.prescriptions,
      mdStats: data.md_stats,
      createdAt: data.created_at,
    };

    return Response.json(result);
  }

  // 전체 글로벌 통계 반환
  const [resultsRes, statsRes] = await Promise.all([
    supabase.from("results").select("id", { count: "exact", head: true }),
    supabase.from("persona_stats").select("*"),
  ]);

  const totalUsers = resultsRes.count ?? 0;
  const stats = statsRes.data ?? [];

  // 페르소나별 카운트 집계
  const personaCounts = {} as Record<PersonaKey, number>;
  let totalLines = 0;

  for (const row of stats) {
    personaCounts[row.persona as PersonaKey] = row.count;
    totalLines += Number(row.total_lines ?? 0);
  }

  const avgLines = totalUsers > 0 ? Math.round(totalLines / totalUsers) : 0;

  const globalStats: GlobalStats = {
    totalUsers,
    personaCounts,
    avgLines,
    userPercentile: {
      lines: 50,
      tools: 50,
      complexity: 50,
    },
  };

  return Response.json(globalStats);
}
