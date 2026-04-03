/**
 * 리더보드 API
 * GET  — 랭킹 조회
 * POST — 등록/갱신
 */
import { createSupabaseServer } from "@/lib/supabase-server";
import { getResult } from "@/lib/store";

export async function GET() {
  const supabase = await createSupabaseServer();

  const { data: scores } = await supabase
    .from("leaderboard_scores")
    .select("*, leaderboard_profiles(*)")
    .order("md_power", { ascending: false })
    .limit(50);

  const { count } = await supabase
    .from("leaderboard_scores")
    .select("*", { count: "exact", head: true });

  // 티어 분포
  const { data: tierDist } = await supabase
    .from("leaderboard_scores")
    .select("tier");

  const tierDistribution: Record<string, number> = {};
  tierDist?.forEach((row) => {
    tierDistribution[row.tier] = (tierDistribution[row.tier] ?? 0) + 1;
  });

  const rankings = (scores ?? []).map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    nickname: row.leaderboard_profiles?.nickname ?? "익명",
    avatarUrl: row.leaderboard_profiles?.avatar_url,
    title: row.leaderboard_profiles?.title,
    organization: row.leaderboard_profiles?.organization,
    linkedinUrl: row.leaderboard_profiles?.linkedin_url,
    role: row.leaderboard_profiles?.role,
    persona: row.persona,
    mdPower: row.md_power,
    tier: row.tier,
    prevPower: row.prev_power,
    delta: row.prev_power != null ? row.md_power - row.prev_power : null,
    updatedAt: row.updated_at,
  }));

  return Response.json({
    rankings,
    totalCount: count ?? 0,
    tierDistribution,
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();

  // 인증 확인 (쿠키 → Authorization 헤더 fallback)
  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }
  if (!user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { resultId, nickname, title, organization, role, linkedinUrl } = body;

  if (!resultId) {
    return Response.json({ error: "resultId는 필수입니다" }, { status: 400 });
  }

  // nickname 없으면 GitHub 메타데이터에서 가져오기
  const finalNickname = nickname || user.user_metadata?.preferred_username || user.user_metadata?.name || user.email || "익명";

  // 분석 결과 조회
  const result = await getResult(resultId);
  if (!result) {
    return Response.json({ error: "분석 결과를 찾을 수 없습니다" }, { status: 404 });
  }

  // 프로필 upsert
  const { error: profileError } = await supabase
    .from("leaderboard_profiles")
    .upsert({
      user_id: user.id,
      nickname: finalNickname,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      title: title ?? null,
      organization: organization ?? null,
      role: role ?? "non-dev",
      linkedin_url: linkedinUrl ?? null,
    });

  if (profileError) {
    return Response.json({ error: "프로필 저장 실패" }, { status: 500 });
  }

  // 기존 점수 조회 (prev_power용)
  const { data: existing } = await supabase
    .from("leaderboard_scores")
    .select("md_power")
    .eq("user_id", user.id)
    .single();

  // 점수 upsert
  const { error: scoreError } = await supabase
    .from("leaderboard_scores")
    .upsert({
      user_id: user.id,
      result_id: resultId,
      persona: result.persona,
      md_power: result.mdPower.score,
      tier: result.mdPower.tier,
      prev_power: existing?.md_power ?? null,
      updated_at: new Date().toISOString(),
    });

  if (scoreError) {
    return Response.json({ error: "점수 저장 실패" }, { status: 500 });
  }

  return Response.json({
    success: true,
    mdPower: result.mdPower.score,
    tier: result.mdPower.tier,
    delta: existing ? result.mdPower.score - existing.md_power : null,
  });
}
