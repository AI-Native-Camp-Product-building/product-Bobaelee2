/**
 * 피드백 저장 API
 * POST — 피드백 접수
 */
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, message, email } = body;

  if (!message?.trim()) {
    return Response.json({ error: "메시지를 입력해주세요" }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").insert({
    type: type ?? "general",
    message: message.trim(),
    email: email ?? null,
  });

  if (error) {
    // 테이블이 없으면 무시 (로그만)
    console.error("Feedback save error:", error.message);
  }

  return Response.json({ success: true });
}
