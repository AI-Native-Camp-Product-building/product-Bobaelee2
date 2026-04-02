/**
 * Supabase 클라이언트 싱글톤
 * 환경변수 없이 빌드 시에도 import 오류가 나지 않도록 lazy 생성
 */
import { createClient } from "@supabase/supabase-js";

/** Supabase 클라이언트 인스턴스 (런타임에만 유효) */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
);
