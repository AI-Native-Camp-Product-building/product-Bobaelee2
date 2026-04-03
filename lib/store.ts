/**
 * 결과 저장소 — Supabase 없으면 메모리, 있으면 Supabase 사용
 * 로컬 개발 시 환경변수 없이도 전체 플로우 동작
 */
import type { AnalysisResult, SavedResult, PersonaKey, QualityScores } from "@/lib/types";
import { calculateMdPower } from "@/lib/analyzer/power";

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
    isLegacyResult: false,
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
    secondary_persona: result.secondaryPersona,
    scores: result.scores,
    quality_scores: result.qualityScores,
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

  // DB 호환: 기존 결과의 maturity를 contextAwareness로 매핑
  const rawScores = data.scores;
  const scores = {
    ...rawScores,
    contextAwareness: rawScores.contextAwareness ?? rawScores.maturity ?? 0,
    // collaboration → teamImpact fallback for legacy data
    teamImpact: rawScores.teamImpact ?? rawScores.collaboration ?? 0,
  };
  // maturity 키가 남아있으면 제거 (타입 정합성)
  if ("maturity" in scores) delete (scores as Record<string, unknown>).maturity;
  // collaboration 키가 남아있으면 제거 (타입 정합성)
  if ("collaboration" in scores) delete (scores as Record<string, unknown>).collaboration;

  const mdStats = data.md_stats;

  // quality_scores가 null이면 기존(레거시) 결과
  const rawQuality = (data as Record<string, unknown>).quality_scores;
  const isLegacyResult = rawQuality === null || rawQuality === undefined;
  const qualityScores: QualityScores = (rawQuality as QualityScores) ?? {
    actionability: 0, conciseness: 0, structure: 0, uniqueness: 0, safety: 0,
  };

  return {
    id: data.id,
    persona: data.persona as PersonaKey,
    secondaryPersona: (data as Record<string, unknown>).secondary_persona as PersonaKey | null ?? null,
    scores,
    qualityScores,
    roasts: data.roasts,
    strengths: data.strengths,
    prescriptions: data.prescriptions,
    mdStats,
    mdPower: calculateMdPower(qualityScores, mdStats),
    createdAt: data.created_at,
    isLegacyResult,
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
