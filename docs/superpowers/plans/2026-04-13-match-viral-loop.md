# 궁합 바이럴 루프 + md력 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결과 공유 → 상대방 초대 → 분석 → 자동 궁합 비교 → 궁합 결과 공유의 바이럴 루프를 구축하고, v2 확정에 따라 md력/리더보드 관련 코드를 전면 제거한다.

**Architecture:** 초대 페이지(`/match/invite/[id]`)가 티저를 보여주고 분석 폼을 포함한다. 분석 완료 시 localStorage에 inviterId를 저장해두었다가 결과 저장 후 `/match/[id1]/vs/[id2]`로 자동 이동. 궁합 페이지는 v2 축 기반 비교 + 공유 기능을 갖추고, OG 이미지도 궁합 전용을 생성한다.

**Tech Stack:** Next.js 16 (App Router), Supabase, Tailwind CSS 4, @vercel/og (ImageResponse)

---

## 파일 구조

### 삭제할 파일
- `components/BattlePower.tsx` — md력 레이더 + 퍼센타일
- `components/MdPowerSection.tsx` — md력 점수 섹션
- `components/RegisterLeaderboard.tsx` — 리더보드 등록
- `app/leaderboard/page.tsx` — 리더보드 페이지
- `app/api/leaderboard/route.ts` — 리더보드 API
- `app/api/leaderboard/profile/route.ts` — 리더보드 프로필 API

### 생성할 파일
- `app/match/invite/[id]/page.tsx` — 초대 티저 + 분석 폼 (Client Component)
- `components/MatchInviteForm.tsx` — 초대 페이지용 분석 폼 (inviterId 연동)
- `components/MatchShareButton.tsx` — 궁합 결과 전용 공유 버튼
- `app/api/og/match/[id1]/[id2]/route.tsx` — 궁합 OG 이미지

### 수정할 파일
- `app/r/[id]/page.tsx` — md력 제거 + "궁합 보기" CTA 추가
- `app/match/[id1]/vs/[id2]/page.tsx` — v2 축 비교 + 공유 ���능
- `components/TabNav.tsx` — 리더보드 탭 제거
- `components/ShareButton.tsx` — md력 퍼센타일 뱃지 제거
- `app/api/og/[id]/route.tsx` — md력 퍼센타일 뱃지 제거
- `lib/store.ts` — getPercentiles에서 md력 관련 제거 (또는 함수 자체 제거)

---

## Task 1: md력/리더보드 코드 제거

**Files:**
- Delete: `components/BattlePower.tsx`, `components/MdPowerSection.tsx`, `components/RegisterLeaderboard.tsx`
- Delete: `app/leaderboard/page.tsx`, `app/api/leaderboard/route.ts`, `app/api/leaderboard/profile/route.ts`
- Modify: `app/r/[id]/page.tsx`
- Modify: `components/TabNav.tsx`
- Modify: `components/ShareButton.tsx:370-380`
- Modify: `app/api/og/[id]/route.tsx:297`

- [ ] **Step 1: TabNav에서 리더보드 탭 제거**

`components/TabNav.tsx`의 TABS 배열에서 리더보드 항목 제거:

```typescript
const TABS = [
  { href: "/", label: "🔬 .mdTI", action: "rerun" as const },
  { href: "/profile", label: "👤 내 정보", action: "profile" as const },
  { href: "/contact", label: "✉️ Contact", action: "contact" as const },
];
```

- [ ] **Step 2: 결과 페이지(v1)에서 md력 관��� 코드 제거**

`app/r/[id]/page.tsx`에서:
1. import 제거: `BattlePower`, `RegisterLeaderboard`, `getPercentiles`
2. v1 렌더링 블록에서 `BattlePower`, `RegisterLeaderboard` 컴포넌트 호출 제거
3. `isLegacyResult` 분기의 md력 안내 블록 제거
4. `percentile` 변수와 `getPercentiles(id)` 호출 제거
5. `ShareButton`의 `percentile` prop은 빈 객체 또는 타입 수정 필요

```typescript
// import 제거 (이 줄들 삭제)
// import RegisterLeaderboard from "@/components/RegisterLeaderboard";
// import BattlePower from "@/components/BattlePower";

// percentile 호출 제거
// const percentile = await getPercentiles(id);

// v1 렌더링에��� BattlePower + RegisterLeaderboard 블록 전체 제거 (167~193줄)
// 대신 바로 RoastSection으로 연결
```

- [ ] **Step 3: ShareButton에서 md력 퍼센타일 뱃지 제거**

`components/ShareButton.tsx`:
1. `PercentileData` import과 `percentile` prop 제거
2. 캡처 카드 내 md력 상위 뱃지 (370~380줄) 제거
3. `ShareButtonProps` 인터페이스에서 `percentile` 필드 제거

```typescript
interface ShareButtonProps {
  id: string;
  persona: PersonaKey;
  personaDef: PersonaDefinition;
  roasts: RoastItem[];
  mdStats: MdStats;
  scores: DimensionScores;
  // percentile 제거
}
```

캡처 카드에서 md력 뱃지 div 제거 (370~380줄):
```typescript
// 이 블록 전체 삭제:
// <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
//   <span ...>🏆 md력 상위 {percentile.mdPowerPercentile}%</span>
// </div>
```

- [ ] **Step 4: OG 이미지에서 md력 퍼센타일 제거**

`app/api/og/[id]/route.tsx`:
1. v1 OG 이미지의 `getPercentiles` 호출 제거
2. 297줄 근처 md력 상위 뱃지 span 제거

- [ ] **Step 5: 리더보드 파일 삭제**

```bash
rm components/BattlePower.tsx
rm components/MdPowerSection.tsx
rm components/RegisterLeaderboard.tsx
rm app/leaderboard/page.tsx
rm -r app/api/leaderboard/
```

- [ ] **Step 6: dev 서버에서 빌드 에러 없이 동작 확인**

```bash
cd ~/work/products/mdti && npx next dev --port 3000
# /r/{기존결과ID} 접속해서 에러 없는지 확인
# /leaderboard 접속 시 404 확인
```

- [ ] **Step 7: 커밋**

```bash
git add -A && git commit -m "v2 확정에 따라 md��/리더보드 전면 제거"
```

---

## Task 2: 궁합 초대 페이지 — `/match/invite/[id]`

**Files:**
- Create: `app/match/invite/[id]/page.tsx` (Server Component — 메타데이터 + 데이터 fetch)
- Create: `components/MatchInviteForm.tsx` (Client Component — 입력 + 분석 + 리다이렉트)

- [ ] **Step 1: 초대 페이지 서버 컴포넌트 작성**

`app/match/invite/[id]/page.tsx`:
- 초대자의 결과를 DB에서 조회 (getResult)
- v2PersonaDef 또는 v1 personaDef에서 이모지 + 이름 + 찔리는 한마디(punchline/tagline) 추출
- OG 메타데이터 생성 (초대 전용 — "이 사람과 궁합을 확인해보세요")
- MatchInviteForm에 티저 데이터 + inviterId 전달

```typescript
/**
 * 궁합 초대 페이지 — 서버 컴포넌트
 * /match/invite/[id] — 초대자의 티저를 보여주고 분석 폼 제공
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getResult } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import MatchInviteForm from "@/components/MatchInviteForm";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) return { title: "MDTI 궁합" };

  const isV2 = !!result.typeCode;
  const v2Persona = isV2 ? getPersonaByTypeCode(result.typeCode!) : null;
  const displayName = v2Persona ? v2Persona.name : PERSONAS[result.persona].nameKo;
  const displayEmoji = v2Persona ? v2Persona.emoji : PERSONAS[result.persona].emoji;

  const title = `${displayEmoji} ${displayName}와(과) 궁합 확인하기 — MDTI`;
  const description = `이 사람은 '${displayName}' 유형이래요. 당신과의 궁합은? .md를 털어서 확인해보세요!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MatchInvitePage({ params }: Props) {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) notFound();

  const isV2 = !!result.typeCode;
  const v2Persona = isV2 ? getPersonaByTypeCode(result.typeCode!) : null;

  const teaser = {
    inviterId: id,
    emoji: v2Persona?.emoji ?? PERSONAS[result.persona].emoji,
    name: v2Persona?.name ?? PERSONAS[result.persona].nameKo,
    punchline: v2Persona?.punchline ?? PERSONAS[result.persona].tagline,
  };

  return (
    <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-16">
      <MatchInviteForm teaser={teaser} />
    </main>
  );
}
```

- [ ] **Step 2: MatchInviteForm 클라이언트 컴포넌트 작성**

`components/MatchInviteForm.tsx`:
- 상단: 초대자 티저 카드 (이모지 + 이름 + 찔리는 한마디)
- "��� 사람과 궁합 확인하기" 헤더
- MdInput 재사용
- 분석 완료 후 → `/api/results` POST → `/match/{inviterId}/vs/{myId}` 리다이렉트

```typescript
"use client";

/**
 * 궁합 초대 분석 폼
 * 초대자 티저 + 내 .md 입력 → 분석 → 궁합 페이지로 이동
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyze, analyzeV2 } from "@/lib/analyzer";
import { track } from "@/lib/analytics";
import { getSessionId, rememberOwnResult } from "@/lib/session-id";
import MdInput from "@/components/MdInput";
import ClaudeIcon from "@/components/ClaudeIcon";

interface Teaser {
  inviterId: string;
  emoji: string;
  name: string;
  punchline: string;
}

interface MatchInviteFormProps {
  teaser: Teaser;
}

export default function MatchInviteForm({ teaser }: MatchInviteFormProps) {
  const router = useRouter();
  const [md, setMd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!md.trim()) return;
    setLoading(true);
    setError(null);

    track("match_invite_started", { inviter_id: teaser.inviterId });

    try {
      const result = analyze(md);
      const v2Result = analyzeV2(md);

      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result,
          sessionId: getSessionId(),
          typeCode: v2Result.typeCode,
          axisScores: v2Result.axisScores,
        }),
      });

      if (!res.ok) throw new Error("결과 저장에 실��했습니다");

      const { id } = await res.json();
      rememberOwnResult(id);

      track("match_invite_completed", {
        inviter_id: teaser.inviterId,
        my_id: id,
      });

      // 궁합 페���지로 이동 (초대자 vs 나)
      router.push(`/match/${teaser.inviterId}/vs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생��습니다");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-8">
      {/* 로고 */}
      <div className="flex justify-center">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <ClaudeIcon size={36} />
          <span>
            <span className="text-claude-cream/60 font-mono">.md</span>
            <span className="text-claude-orange">TI</span>
          </span>
        </h1>
      </div>

      {/* 초대자 티저 카드 */}
      <div className="bg-bg-card rounded-2xl p-8 flex flex-col items-center gap-4 border border-claude-light/10">
        <span className="text-6xl">{teaser.emoji}</span>
        <p className="text-xl font-black text-compat-gold">{teaser.name}</p>
        <p className="text-base text-claude-cream/70 italic text-center leading-relaxed">
          &ldquo;{teaser.punchline}&rdquo;
        </p>
        <div className="w-full h-px bg-claude-light/10 my-2" />
        <p className="text-sm text-claude-orange font-bold">
          이 사람과 당신의 궁합은? 🤔
        </p>
      </div>

      {/* 분석 입력 */}
      <div className="bg-bg-card rounded-2xl p-6 flex flex-col gap-6 border border-claude-light/10">
        <p className="text-sm text-claude-cream/60 text-center">
          당신의 .md를 붙여넣고 궁합을 확인해보세요
        </p>
        <MdInput value={md} onChange={setMd} disabled={loading} />

        {error && (
          <p className="text-sm text-roast-red text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !md.trim()}
          className="w-full py-3.5 rounded-xl bg-claude-orange text-bg-primary font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              궁합 분석 중...
            </span>
          ) : (
            "궁합 확인하기 →"
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: dev 서버에서 `/match/invite/{기존ID}` 접속 확인**

```bash
# 브라우저에서 http://localhost:3000/match/invite/{기존결과ID} 확인
# 1. 티저 카드가 제대로 렌더링되는지
# 2. .md 입력 → 분석 → /match/{id1}/vs/{id2}로 이동하는지
```

- [ ] **Step 4: 커밋**

```bash
git add app/match/invite/ components/MatchInviteForm.tsx
git commit -m "궁합 초대 페이지 추가 (/match/invite/[id])"
```

---

## Task 3: 결과 페이지에 "궁합 보���" CTA ���가

**Files:**
- Modify: `app/r/[id]/page.tsx`

- [ ] **Step 1: 결��� 페이지 하단에 궁합 초대 CTA 추가**

`app/r/[id]/page.tsx`의 v1/v2 공통 하단 CTA 영역에 궁합 초대 링크 블록 추가.
기존 "나도 털리기" 버튼 **위**에 눈에 띄는 궁합 CTA를 배치:

```typescript
{/* 궁합 초대 CTA — v1/v2 공통 */}
<section className="bg-bg-card rounded-2xl p-6 flex flex-col items-center gap-4 border border-compat-gold/20">
  <p className="text-2xl">🤝</p>
  <h2 className="text-lg font-black text-compat-gold">궁합 확인하기</h2>
  <p className="text-sm text-claude-cream/60 text-center leading-relaxed">
    친구에게 링크를 보내면<br />
    자동으로 궁합 결과가 만들어져요
  </p>
  <MatchInviteButton resultId={id} />
</section>
```

- [ ] **Step 2: MatchInviteButton 클라이언트 컴포넌트 작성**

`components/MatchInviteButton.tsx` (새 파일):
- "궁합 링크 복사" 버튼 — 클릭 시 `mdti.dev/match/invite/{myId}` 복사
- 복사 완료 시 "복사 완료!" 피드백
- 애널리틱스 트래킹

```typescript
"use client";

import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";

interface MatchInviteButtonProps {
  resultId: string;
}

export default function MatchInviteButton({ resultId }: MatchInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/match/invite/${resultId}`
        : `https://mdti.dev/match/invite/${resultId}`;

    const shareText =
      `내 AI 사용 유형이 궁금하지 않아? 🤔\n` +
      `너도 .md 털고 나랑 궁합 확인해봐!\n\n` +
      inviteUrl;

    track("match_invite_copied", { result_id: resultId });

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 클립보드 실패 시 무시
    }
  }, [resultId]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full py-3.5 rounded-xl bg-compat-gold/20 text-compat-gold font-bold text-sm hover:bg-compat-gold/30 transition-colors border border-compat-gold/30"
    >
      {copied ? "✅ 링크 복사 완료! 친구에게 보내세요" : "🔗 궁합 링크 복사하기"}
    </button>
  );
}
```

- [ ] **Step 3: 결과 페이지에서 import 추가 및 렌더링 확인**

```typescript
// app/r/[id]/page.tsx 상단에 추가
import MatchInviteButton from "@/components/MatchInviteButton";
```

- [ ] **Step 4: 브라우저에서 결과 페이지 확인**

```bash
# http://localhost:3000/r/{기존결과ID}
# 1. "궁합 확인하기" 섹션이 공유 버튼 아래에 보이는지
# 2. "궁합 링크 복사하기" 클릭 시 클립보드에 링크가 ��사되는지
# 3. 복사된 링크로 /match/invite/{id} 접속이 되는지
```

- [ ] **Step 5: 커밋**

```bash
git add components/MatchInviteButton.tsx app/r/[id]/page.tsx
git commit -m "결과 페이지에 궁합 초대 CTA 추가"
```

---

## Task 4: 궁합 매치 페이지 개선 (v2 지원 + 공유)

**Files:**
- Modify: `app/match/[id1]/vs/[id2]/page.tsx` (대폭 개선)
- Create: `components/MatchShareButton.tsx`

- [ ] **Step 1: 궁합 매치 페이지를 v2 축 기반으로 리팩토링**

`app/match/[id1]/vs/[id2]/page.tsx`:
- v2 결과일 때: 4축(harness, control, verbose, structure) 기반 비교
- v1 결과일 때: 기존 7차원 비교 유지
- 혼합(v1 vs v2)일 때: v1 차원 비교로 폴백
- 궁합 판정 로직을 v2에 맞게 확장 (같은 축 방향 수 기반)
- 공유 기능 (MatchShareButton) 추가

```typescript
/**
 * 궁합 비교 페이지 — 서버 컴포넌트
 * v2: 4축 방향 비교 (같은 방향 수 기반 판정)
 * v1: 기존 7차원 점수 차이 기반 판정
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getResult as getResultFromStore } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import type { DimensionScores } from "@/lib/types";
import type { AxisScores, AxisKey } from "@/lib/v2-types";
import MatchShareButton from "@/components/MatchShareButton";

type Props = {
  params: Promise<{ id1: string; id2: string }>;
};

/** v2 축 한글 라벨 */
const AXIS_LABELS: Record<AxisKey, { label: string; aLabel: string; bLabel: string }> = {
  harness: { label: "도구 확장", aLabel: "탐색형", bLabel: "구축형" },
  control: { label: "AI 통제", aLabel: "통제형", bLabel: "위임형" },
  verbose: { label: "표현 방식", aLabel: "맥락형", bLabel: "핵심형" },
  structure: { label: "구조 선호", aLabel: "구조화형", bLabel: "자유형" },
};

const AXIS_KEYS: AxisKey[] = ["harness", "control", "verbose", "structure"];

/** v1 차원 라벨 */
const V1_DIM_LABELS: Record<keyof DimensionScores, string> = {
  automation: "자동화 성향",
  control: "제어 성향",
  toolDiversity: "도구 다양성",
  contextAwareness: "컨텍스트 관리",
  teamImpact: "협업 지향",
  security: "보안 의식",
  agentOrchestration: "에이전트 오케스트레이션",
};

/** v2 궁합 판정: 같은 방향인 축 수로 판정 */
function judgeMatchV2(axes1: AxisScores, axes2: AxisScores) {
  let sameCount = 0;
  const comparisons: { axis: AxisKey; same: boolean; dir1: string; dir2: string }[] = [];

  for (const axis of AXIS_KEYS) {
    const dir1 = axes1.judgments[axis].direction;
    const dir2 = axes2.judgments[axis].direction;
    const same = dir1 === dir2;
    if (same) sameCount++;
    comparisons.push({ axis, same, dir1, dir2 });
  }

  if (sameCount >= 3) {
    return {
      emoji: "🪞",
      label: "거울 같은 사이",
      description: "4개 축 중 3개 ��상 같은 방향. AI를 다루는 철학이 닮아있어요.",
      sameCount,
      comparisons,
    };
  }
  if (sameCount >= 2) {
    return {
      emoji: "💙",
      label: "환상의 파트너",
      description: "비슷한 점도, 다른 점도 적당히. 서로 보완하는 최적 조합.",
      sameCount,
      comparisons,
    };
  }
  return {
    emoji: "💥",
    label: "극과 극",
    description: "거의 모든 축에서 반대. 충돌 속에 인사이트가 나오는 사이.",
    sameCount,
    comparisons,
  };
}

/** v1 궁합 판정 (기존 로직) */
function judgeMatchV1(scores1: DimensionScores, scores2: DimensionScores) {
  const keys = Object.keys(V1_DIM_LABELS) as (keyof DimensionScores)[];
  const diffs = keys.map((k) => Math.abs(scores1[k] - scores2[k]));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff < 15) return { emoji: "🪞", label: "거울 같은 사이", description: "거의 모든 차원에서 비슷한 성향." };
  if (avgDiff < 30) return { emoji: "💙", label: "��상의 파트너", description: "적당한 차이가 서로를 보완해준다." };
  return { emoji: "💥", label: "극과 극", description: "성향 차이가 크다. 그래서 더 자극이 되는 사이." };
}

// generateMetadata — 궁합 전용 OG
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id1, id2 } = await params;
  const [r1, r2] = await Promise.all([getResultFromStore(id1), getResultFromStore(id2)]);
  if (!r1 || !r2) return { title: "MDTI 궁합" };

  const isV2_1 = !!r1.typeCode;
  const isV2_2 = !!r2.typeCode;
  const name1 = isV2_1 ? getPersonaByTypeCode(r1.typeCode!)?.name : PERSONAS[r1.persona].nameKo;
  const name2 = isV2_2 ? getPersonaByTypeCode(r2.typeCode!)?.name : PERSONAS[r2.persona].nameKo;

  const title = `${name1} × ${name2} 궁합 결과 — MDTI`;
  const description = `두 사람의 AI 활용 궁합은? .md를 털어서 확인해보세요!`;

  return {
    title,
    description,
    openGraph: {
      title, description,
      images: [{ url: `/api/og/match/${id1}/${id2}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MatchPage({ params }: Props) {
  const { id1, id2 } = await params;
  const [result1, result2] = await Promise.all([
    getResultFromStore(id1),
    getResultFromStore(id2),
  ]);
  if (!result1 || !result2) notFound();

  const isV2Both = !!result1.axisScores && !!result2.axisScores;
  const v2p1 = result1.typeCode ? getPersonaByTypeCode(result1.typeCode) : null;
  const v2p2 = result2.typeCode ? getPersonaByTypeCode(result2.typeCode) : null;

  const emoji1 = v2p1?.emoji ?? PERSONAS[result1.persona].emoji;
  const name1 = v2p1?.name ?? PERSONAS[result1.persona].nameKo;
  const emoji2 = v2p2?.emoji ?? PERSONAS[result2.persona].emoji;
  const name2 = v2p2?.name ?? PERSONAS[result2.persona].nameKo;

  // 궁합 판정
  const v2Match = isV2Both ? judgeMatchV2(result1.axisScores!, result2.axisScores!) : null;
  const v1Match = !isV2Both ? judgeMatchV1(result1.scores, result2.scores) : null;
  const match = v2Match ?? v1Match!;

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-10">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <p className="text-sm text-claude-light/50 mb-2">MDTI 궁합 결과</p>
        </div>

        {/* VS 레이아웃 */}
        <div className="bg-bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{emoji1}</span>
              <p className="text-base font-bold text-compat-gold text-center">{name1}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-claude-orange">VS</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-5xl">{emoji2}</span>
              <p className="text-base font-bold text-compat-gold text-center">{name2}</p>
            </div>
          </div>
        </div>

        {/* 궁합 판정 */}
        <div className="bg-bg-card rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">{match.emoji}</span>
          <p className="text-xl font-black text-compat-gold">{match.label}</p>
          <p className="text-sm text-claude-light/70 leading-relaxed max-w-xs">
            {match.description}
          </p>
        </div>

        {/* v2: 축별 비교 */}
        {v2Match && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-claude-cream">축별 비교</h2>
            <div className="flex flex-col gap-3">
              {v2Match.comparisons.map(({ axis, same, dir1, dir2 }) => {
                const info = AXIS_LABELS[axis];
                const j1 = result1.axisScores!.judgments[axis];
                const j2 = result2.axisScores!.judgments[axis];
                return (
                  <div key={axis} className={`rounded-xl p-4 border ${same ? "border-strength-blue/30 bg-strength-blue/5" : "border-roast-red/30 bg-roast-red/5"}`}>
                    <p className="text-xs text-claude-light/60 font-medium mb-2">{info.label}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emoji1}</span>
                        <span className={`text-sm font-bold ${same ? "text-strength-blue" : "text-roast-red"}`}>
                          {dir1 === info.aLabel.charAt(0) || ["G","R","V","S"].includes(dir1) ? info.aLabel : info.bLabel}
                        </span>
                      </div>
                      <span className="text-xs text-claude-light/40">
                        {same ? "같음 ✓" : "다름 ✗"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${same ? "text-strength-blue" : "text-roast-red"}`}>
                          {dir2 === info.aLabel.charAt(0) || ["G","R","V","S"].includes(dir2) ? info.aLabel : info.bLabel}
                        </span>
                        <span className="text-sm">{emoji2}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* v1: 차원별 바 비교 (기존 로직 유지) */}
        {!isV2Both && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-claude-cream">차원별 비교</h2>
            <div className="flex flex-col gap-3">
              {(Object.keys(V1_DIM_LABELS) as (keyof DimensionScores)[]).map((key) => (
                <div key={key} className="bg-bg-card rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs text-claude-light/60 font-medium">{V1_DIM_LABELS[key]}</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-4 text-center">{emoji1}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div className="h-full rounded-full bg-claude-orange" style={{ width: `${result1.scores[key]}%` }} />
                      </div>
                      <span className="text-xs text-claude-light/60 w-8 text-right">{result1.scores[key]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-4 text-center">{emoji2}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                        <div className="h-full rounded-full bg-strength-blue" style={{ width: `${result2.scores[key]}%` }} />
                      </div>
                      <span className="text-xs text-claude-light/60 w-8 text-right">{result2.scores[key]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 궁합 결과 공유 + 나도 해보기 */}
        <MatchShareButton
          id1={id1}
          id2={id2}
          emoji1={emoji1}
          name1={name1}
          emoji2={emoji2}
          name2={name2}
          matchLabel={match.label}
          matchEmoji={match.emoji}
        />

        <div className="text-center pb-8 flex flex-col items-center gap-3">
          <p className="text-sm text-claude-light/50">내 .md도 분석해볼까?</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-claude-orange text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
          >
            나도 털리기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: MatchShareButton 컴포��트 작성**

`components/MatchShareButton.tsx`:
- 궁합 결과 URL + 공유 멘트 복사
- LinkedIn/X 공유 버튼

```typescript
"use client";

import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";

interface MatchShareButtonProps {
  id1: string;
  id2: string;
  emoji1: string;
  name1: string;
  emoji2: string;
  name2: string;
  matchLabel: string;
  matchEmoji: string;
}

export default function MatchShareButton({
  id1, id2, emoji1, name1, emoji2, name2, matchLabel, matchEmoji,
}: MatchShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const matchUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/match/${id1}/vs/${id2}`
      : `https://mdti.dev/match/${id1}/vs/${id2}`;

  const shareText =
    `${emoji1} ${name1} × ${emoji2} ${name2}\n` +
    `궁합 결과: ${matchEmoji} ${matchLabel}\n\n` +
    `나도 궁합 확인하기 →`;

  const handleCopy = useCallback(async () => {
    track("match_shared", { channel: "copy", id1, id2 });
    try {
      await navigator.clipboard.writeText(`${shareText}\n${matchUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }, [shareText, matchUrl, id1, id2]);

  const handleLinkedIn = useCallback(() => {
    track("match_shared", { channel: "linkedin", id1, id2 });
    navigator.clipboard.writeText(shareText).catch(() => {});
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(matchUrl)}`,
      "_blank", "noopener,noreferrer"
    );
  }, [shareText, matchUrl, id1, id2]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-claude-cream text-center">��합 결과 공유하기</h2>
      <p className="text-xs text-claude-light/50 text-center">
        공유 멘트가 클립보드에 복사됩니다
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleLinkedIn}
          className="flex-1 py-3 rounded-xl bg-[#0A66C2] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 py-3 rounded-xl bg-bg-elevated text-claude-cream font-bold text-sm hover:opacity-90 transition-opacity border border-claude-light/20 flex items-center justify-center gap-2"
        >
          {copied ? "✅ 복사 완료!" : "🔗 링크 복사"}
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 브라우저에서 궁합 페이지 확인**

```bash
# http://localhost:3000/match/{id1}/vs/{id2}
# 1. v2 결과끼리: 4축 비교 렌더링
# 2. 공유 버튼 동��� 확인
# 3. "나도 털리기" → 랜딩 이동 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/match/ components/MatchShareButton.tsx
git commit -m "궁합 페이지 v2 축 비교 + 공유 기능 추가"
```

---

## Task 5: 궁합 OG 이미지

**Files:**
- Create: `app/api/og/match/[id1]/[id2]/route.tsx`

- [ ] **Step 1: 궁합 전용 OG 이미지 라우트 작성**

`app/api/og/match/[id1]/[id2]/route.tsx`:
- 1200×630 ImageResponse
- 왼쪽 이모지+이름 | VS | 오른�� 이모���+이름
- 하단: 궁합 결과 (emoji + label)
- "나도 궁합 확인하기 → mdti.dev" 워터마크

```typescript
/**
 * 궁합 OG 이미지 생성 라우트
 * /api/og/match/[id1]/[id2]
 */
import { ImageResponse } from "next/og";
import { getResult } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { getPersonaByTypeCode } from "@/lib/content/v2-personas";
import type { AxisScores, AxisKey } from "@/lib/v2-types";

type Props = {
  params: Promise<{ id1: string; id2: string }>;
};

const AXIS_KEYS: AxisKey[] = ["harness", "control", "verbose", "structure"];

function judgeMatchV2(axes1: AxisScores, axes2: AxisScores) {
  let sameCount = 0;
  for (const axis of AXIS_KEYS) {
    if (axes1.judgments[axis].direction === axes2.judgments[axis].direction) sameCount++;
  }
  if (sameCount >= 3) return { emoji: "🪞", label: "거울 같은 사이" };
  if (sameCount >= 2) return { emoji: "💙", label: "환상의 파트너" };
  return { emoji: "💥", label: "극과 극" };
}

export async function GET(_request: Request, { params }: Props) {
  const { id1, id2 } = await params;
  const [r1, r2] = await Promise.all([getResult(id1), getResult(id2)]);

  if (!r1 || !r2) {
    return new Response("Not found", { status: 404 });
  }

  const v2p1 = r1.typeCode ? getPersonaByTypeCode(r1.typeCode) : null;
  const v2p2 = r2.typeCode ? getPersonaByTypeCode(r2.typeCode) : null;
  const emoji1 = v2p1?.emoji ?? PERSONAS[r1.persona].emoji;
  const name1 = v2p1?.name ?? PERSONAS[r1.persona].nameKo;
  const emoji2 = v2p2?.emoji ?? PERSONAS[r2.persona].emoji;
  const name2 = v2p2?.name ?? PERSONAS[r2.persona].nameKo;

  const isV2Both = !!r1.axisScores && !!r2.axisScores;
  let matchEmoji = "🤝";
  let matchLabel = "궁합 결과 보기";

  if (isV2Both) {
    const m = judgeMatchV2(r1.axisScores!, r2.axisScores!);
    matchEmoji = m.emoji;
    matchLabel = m.label;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "1200px",
          height: "630px",
          background: "#0a0a0b",
          gap: "40px",
          padding: "60px",
        }}
      >
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "rgba(245,230,211,0.5)", fontSize: "20px", fontWeight: 700, fontFamily: "monospace" }}>.md</span>
          <span style={{ color: "#c0f0fb", fontSize: "20px", fontWeight: 900 }}>TI</span>
          <span style={{ color: "rgba(245,230,211,0.3)", fontSize: "16px", marginLeft: "8px" }}>궁합</span>
        </div>

        {/* VS 레이아웃 */}
        <div style={{ display: "flex", alignItems: "center", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "80px" }}>{emoji1}</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffea00" }}>{name1}</span>
          </div>
          <span style={{ fontSize: "40px", fontWeight: 900, color: "#ff6b35" }}>VS</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "80px" }}>{emoji2}</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffea00" }}>{name2}</span>
          </div>
        </div>

        {/* 궁합 결과 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "36px" }}>{matchEmoji}</span>
          <span style={{ fontSize: "32px", fontWeight: 900, color: "#fafafa" }}>{matchLabel}</span>
        </div>

        {/* 워터마크 */}
        <span style={{ fontSize: "14px", color: "rgba(245,230,211,0.25)" }}>
          나도 궁합 확인하기 → mdti.dev
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 2: 브라우저에서 OG 이미지 확인**

```bash
# http://localhost:3000/api/og/match/{id1}/{id2} 직접 접속
# 1200×630 이미지가 VS 레이아웃으로 잘 렌더링되는��� 확인
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/og/match/
git commit -m "궁합 전용 OG 이미지 라우트 추가"
```

---

## Task 6: 정리 + 통합 테스트

- [ ] **Step 1: 전체 플로우 E2E 확인**

브라우저에서 다음 시나리오를 순서대로 확인:
1. `/` → .md 입력 → 분석 → `/r/{id}` 도착 (md력 없음 확인)
2. 결과 페이지에서 "궁합 링크 복사하기" 클릭
3. 복사된 링크로 시크릿 탭에서 `/match/invite/{id}` 접속
4. 초대 페이지에서 티저 확인 → .md 입력 → 분석
5. 자동으로 `/match/{id1}/vs/{id2}` 이동
6. 궁합 결과 + 공유 버튼 확인
7. `/leaderboard` → 404 확인
8. TabNav에 리더보드 탭 없음 확인

- [ ] **Step 2: OG 이미지 확인**

```bash
# 개별 결과 OG: http://localhost:3000/api/og/{id}
# 궁합 OG: http://localhost:3000/api/og/match/{id1}/{id2}
# 둘 다 md력 관련 요소 없는지 확인
```

- [ ] **Step 3: 최종 커밋**

```bash
git add -A && git commit -m "궁합 바이럴 루프 구축 완료 + md력 정리"
```
