/**
 * /profile 레이아웃 — 인증 필요 페이지이므로 정적 프리렌더링 방지
 * Supabase 클라이언트 생성 시 환경변수가 빌드 타임에 없으면 에러 발생 방지
 */

export const dynamic = "force-dynamic";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
