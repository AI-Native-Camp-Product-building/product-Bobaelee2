/**
 * 결과 저장소 — Supabase 없으면 메모리, 있으면 Supabase 사용
 * 로컬 개발 시 환경변수 없이도 전체 플로우 동작
 */
import type { AnalysisResult, SavedResult, PersonaKey } from "@/lib/types";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// --- 메모리 저장소 (로컬 개발용) ---
const memoryStore = new Map<string, SavedResult>();
const personaCountsMemory = new Map<string, number>();

// --- Supabase 저장소 ---
async function getSupabase() {
  const { supabase } = await import("@/lib/supabase");
  return supabase;
}

/** 결과 저장 */
export async function saveResult(
  id: string,
  result: AnalysisResult
): Promise<void> {
  const saved: SavedResult = {
    ...result,
    id,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    memoryStore.set(id, saved);
    const prev = personaCountsMemory.get(result.persona) ?? 0;
    personaCountsMemory.set(result.persona, prev + 1);
    return;
  }

  const supabase = await getSupabase();
  await supabase.from("results").insert({
    id,
    persona: result.persona,
    scores: result.scores,
    roasts: result.roasts,
    strengths: result.strengths,
    prescriptions: result.prescriptions,
    md_stats: result.mdStats,
  });

  await supabase
    .from("persona_stats")
    .upsert(
      {
        persona: result.persona,
        count: 1,
        total_lines: result.mdStats.totalLines,
        total_tools: result.mdStats.toolNames.length,
      },
      { onConflict: "persona", ignoreDuplicates: false }
    );
}

/** 결과 조회 */
export async function getResult(id: string): Promise<SavedResult | null> {
  if (!isSupabaseConfigured) {
    return memoryStore.get(id) ?? null;
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    persona: data.persona as PersonaKey,
    scores: data.scores,
    roasts: data.roasts,
    strengths: data.strengths,
    prescriptions: data.prescriptions,
    mdStats: data.md_stats,
    createdAt: data.created_at,
  };
}

/** 글로벌 통계 */
export async function getGlobalStats() {
  if (!isSupabaseConfigured) {
    let totalUsers = 0;
    let totalLines = 0;
    const personaCounts = {} as Record<PersonaKey, number>;

    for (const [persona, count] of personaCountsMemory) {
      personaCounts[persona as PersonaKey] = count;
      totalUsers += count;
    }

    for (const saved of memoryStore.values()) {
      totalLines += saved.mdStats.totalLines;
    }

    return {
      totalUsers,
      personaCounts,
      avgLines: totalUsers > 0 ? Math.round(totalLines / totalUsers) : 30,
      userPercentile: { lines: 50, tools: 50, complexity: 50 },
    };
  }

  const supabase = await getSupabase();
  const [resultsRes, statsRes] = await Promise.all([
    supabase.from("results").select("id", { count: "exact", head: true }),
    supabase.from("persona_stats").select("*"),
  ]);

  const totalUsers = resultsRes.count ?? 0;
  const stats = statsRes.data ?? [];
  const personaCounts = {} as Record<PersonaKey, number>;
  let totalLines = 0;

  for (const row of stats) {
    personaCounts[row.persona as PersonaKey] = row.count;
    totalLines += Number(row.total_lines ?? 0);
  }

  return {
    totalUsers,
    personaCounts,
    avgLines: totalUsers > 0 ? Math.round(totalLines / totalUsers) : 30,
    userPercentile: { lines: 50, tools: 50, complexity: 50 },
  };
}
