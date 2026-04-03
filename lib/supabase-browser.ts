/**
 * Supabase 브라우저 클라이언트 (클라이언트 컴포넌트용)
 * @supabase/ssr 기반 — 쿠키 세션 관리로 서버 API와 세션 공유
 */
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
