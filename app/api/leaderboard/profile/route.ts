/**
 * 프로필 API
 * GET    — 내 프로필 + 순위 조회
 * POST   — 프로필 첫 등록
 * PATCH  — 프로필 수정
 * DELETE — 탈퇴 (프로필 + 점수 삭제)
 */
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("leaderboard_profiles")
    .select("*, leaderboard_scores(*)")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return Response.json({ registered: false, user: { id: user.id, name: user.user_metadata?.name, avatarUrl: user.user_metadata?.avatar_url } });
  }

  // 순위 계산
  const { count: higherCount } = await supabase
    .from("leaderboard_scores")
    .select("*", { count: "exact", head: true })
    .gt("md_power", profile.leaderboard_scores?.md_power ?? 0);

  const rank = (higherCount ?? 0) + 1;

  return Response.json({
    registered: true,
    profile: {
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      title: profile.title,
      organization: profile.organization,
      statusMessage: profile.status_message,
      role: profile.role,
      linkedinUrl: profile.linkedin_url,
    },
    score: profile.leaderboard_scores ? {
      mdPower: profile.leaderboard_scores.md_power,
      tier: profile.leaderboard_scores.tier,
      persona: profile.leaderboard_scores.persona,
      prevPower: profile.leaderboard_scores.prev_power,
      rank,
    } : null,
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname, title, organization, statusMessage, role, linkedinUrl } = body;

  const { error } = await supabase
    .from("leaderboard_profiles")
    .insert({
      user_id: user.id,
      nickname: nickname || user.user_metadata?.name || "익명",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      title: title ?? null,
      organization: organization ?? null,
      status_message: statusMessage ?? null,
      role: role ?? "non-dev",
      linkedin_url: linkedinUrl ?? null,
    });

  if (error) {
    // 이미 존재하면 PATCH로 fallback
    if (error.code === "23505") {
      const { error: updateError } = await supabase
        .from("leaderboard_profiles")
        .update({
          nickname, title, organization,
          status_message: statusMessage, role,
          linkedin_url: linkedinUrl,
        })
        .eq("user_id", user.id);

      if (updateError) return Response.json({ error: "프로필 수정 실패" }, { status: 500 });
      return Response.json({ success: true });
    }
    return Response.json({ error: "프로필 생성 실패" }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname, title, organization, statusMessage, role, linkedinUrl } = body;

  const { error } = await supabase
    .from("leaderboard_profiles")
    .update({
      nickname,
      title,
      organization,
      status_message: statusMessage,
      role,
      linkedin_url: linkedinUrl,
    })
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "프로필 수정 실패" }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 점수 먼저 삭제 (FK 제약)
  await supabase.from("leaderboard_scores").delete().eq("user_id", user.id);
  await supabase.from("leaderboard_profiles").delete().eq("user_id", user.id);

  return Response.json({ success: true });
}
