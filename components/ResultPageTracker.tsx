"use client";

/**
 * 결과 페이지 조회 tracker — 서버 컴포넌트인 /r/[id]에서 사용할 수 있도록 분리
 * 마운트 시 1회만 'result_page_viewed' 이벤트 발행
 * is_own_result: localStorage에 이 id가 있으면 본인이 만든 결과, 없으면 공유 링크 진입으로 판정
 */
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import { isOwnResult } from "@/lib/session-id";

export default function ResultPageTracker({
  id,
  persona,
}: {
  id: string;
  persona: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    track("result_page_viewed", {
      result_id: id,
      persona,
      is_own_result: isOwnResult(id),
    });
  }, [id, persona]);

  return null;
}
