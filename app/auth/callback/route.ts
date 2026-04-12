/**
 * GitHub OAuth 콜백 핸들러
 * Supabase Auth PKCE flow — code를 세션으로 교환
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

    console.error("Auth exchange error:", error.message);
  }

  // code 없거나 교환 실패 시
  return NextResponse.redirect(`${origin}/?error=auth`);
}
