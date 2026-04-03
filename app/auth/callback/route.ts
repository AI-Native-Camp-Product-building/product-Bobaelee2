/**
 * GitHub OAuth 콜백 핸들러
 * Supabase Auth가 리다이렉트한 code를 세션으로 교환
 */
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 시 메인으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=auth`);
}
