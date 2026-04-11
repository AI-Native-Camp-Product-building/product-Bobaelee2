/**
 * 제품 애널리틱스 dual-write 래퍼
 * - Vercel Analytics: 대시보드·트래픽 소스·디바이스 집계
 * - Supabase `events`: SQL 퍼널·K-factor·페르소나별 공유율
 *
 * 원칙
 * 1. 원본 텍스트/파일명/자유 입력 prop 금지 — 타입으로 강제
 * 2. best-effort — 실패해도 사용자 플로우 차단 금지
 * 3. SSR 안전 — window/localStorage 접근 전 가드
 */

import { track as vercelTrack } from "@vercel/analytics";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { getSessionId } from "@/lib/session-id";

/** prop 값은 원시 타입만 허용 — 자유 텍스트 유출 방지 */
export type EventProps = Record<string, string | number | boolean | null>;

/** 제품에서 실제로 쓰는 이벤트 이름을 타입으로 제한 */
export type EventName =
  | "analysis_started"
  | "analysis_completed"
  | "analysis_failed"
  | "result_shared"
  | "result_page_viewed"
  | "post_result_action";

const MAX_STRING_LEN = 100;

/** 문자열 prop 길이 제한 — 혹시라도 길게 들어온 값 차단 */
function sanitize(props: EventProps): EventProps {
  const out: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === "string" && v.length > MAX_STRING_LEN) {
      out[k] = v.slice(0, MAX_STRING_LEN);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** 디바이스 bucket — raw UA는 저장하지 않음 */
function detectUaBucket(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

/** URL에서 UTM 파라미터 추출 */
function parseUtm(search: string): Record<string, string> | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const utm: Record<string, string> = {};
    for (const key of ["source", "medium", "campaign", "term", "content"]) {
      const v = params.get(`utm_${key}`);
      if (v) utm[key] = v.slice(0, MAX_STRING_LEN);
    }
    return Object.keys(utm).length > 0 ? utm : null;
  } catch {
    return null;
  }
}

/**
 * 이벤트를 Vercel과 Supabase 양쪽에 기록
 * fire-and-forget: await 필요 없음
 */
export function track(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;

  const session_id = getSessionId();
  if (!session_id) return;

  const clean = sanitize(props);

  // 1) Vercel Analytics — session_id까지 동일 prop으로 보냄
  try {
    vercelTrack(name, { ...clean, session_id });
  } catch {
    /* ignore */
  }

  // 2) Supabase — SQL 분석용 장기 저장소 (best-effort, 실패 무시)
  try {
    const supabase = createSupabaseBrowser();
    void supabase
      .from("events")
      .insert({
        session_id,
        name,
        props: clean,
        referrer: document.referrer || null,
        utm: parseUtm(window.location.search),
        ua_bucket: detectUaBucket(),
      })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === "development") {
          console.warn("[analytics] supabase insert failed:", error.message);
        }
      });
  } catch {
    /* ignore */
  }
}

/** md 텍스트 길이를 prop-safe한 bucket으로 변환 */
export function mdSizeBucket(length: number): string {
  if (length < 500) return "<500";
  if (length < 2000) return "500-2k";
  if (length < 5000) return "2k-5k";
  if (length < 20000) return "5k-20k";
  return ">20k";
}
