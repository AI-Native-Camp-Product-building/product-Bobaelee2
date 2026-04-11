/**
 * 익명 세션 ID — localStorage 기반
 * 목적: Vercel Analytics 이벤트와 Supabase events/results를 JOIN할 공통 키
 * 개인정보 아님 (순수 난수 UUID). localStorage 지우면 새 세션으로 잡힘.
 */

const SID_KEY = "mdti_sid";
const OWN_RESULTS_KEY = "mdti_own_results";

/** 현재 브라우저의 세션 ID를 가져오거나 새로 생성 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/** 이 세션이 만든 결과 ID를 기록 (최대 50개 유지) */
export function rememberOwnResult(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(OWN_RESULTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(id)) {
      list.push(id);
      if (list.length > 50) list.shift();
      localStorage.setItem(OWN_RESULTS_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
}

/** 이 세션이 만든 결과인지 판정 — share_link 진입 판별용 */
export function isOwnResult(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(OWN_RESULTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(id);
  } catch {
    return false;
  }
}
