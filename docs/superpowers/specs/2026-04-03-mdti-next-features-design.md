# .mdTI 차기 피쳐 디자인 스펙

## Context

.mdTI는 CLAUDE.md/AGENTS.md를 분석해 13가지 페르소나로 분류하고, .md력 점수(0~1000) + 6단계 티어 + 리더보드를 제공하는 소셜 바이럴 서비스. 현재 "한 번 털고 끝"이라는 리텐션 문제와 바이럴 루프 부재가 가장 큰 과제. 독립 프로덕트로 성장시키기 위해 리텐션(B) + 바이럴(A) 하이브리드 전략으로 3개 피쳐를 추가한다.

## 피쳐 1: 성장 히스토리 (.md력 변화 그래프)

### 목적
"한 번 털고 끝"을 ".md 개선 → 재분석 → 점수 변화 확인"이라는 재방문 루프로 전환.

### 동작
1. 사용자가 분석할 때마다 점수를 시계열로 누적 저장
2. 리더보드 프로필 또는 결과 페이지에서 "내 성장 그래프" 표시
3. 그래프: X축 = 날짜, Y축 = .md력 점수, 티어 구간 배경색
4. 각 포인트에 마우스 오버 시 "그때의 페르소나 + 점수" 툴팁

### 데이터 모델
```sql
create table score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  result_id text not null,
  md_power integer not null,
  tier text not null,
  persona text not null,
  recorded_at timestamptz default now()
);

create index idx_history_user on score_history (user_id, recorded_at desc);
```

- 기존 `leaderboard_scores`는 최신 점수만 유지 (현행 유지)
- `score_history`는 매 분석마다 append-only로 누적

### UI
- 결과 페이지의 .md력 섹션 하단에 "성장 히스토리 보기" 링크
- `/profile` 페이지에 그래프 섹션 추가
- CSS만으로 간단한 바 차트 (라이브러리 미사용, 가벼운 구현)

### 핵심 흐름
```
분석 → 결과 저장 → 리더보드 등록/갱신 시 score_history에도 INSERT
                                        ↓
                              프로필 페이지에서 히스토리 조회 → 그래프 렌더링
```

## 피쳐 2: 처방전 → 체크리스트 (게이미피케이션)

### 목적
"처방전을 읽고 끝"이 아니라 "이걸 하면 점수가 올라간다"는 구체적 동기 부여. 완료하고 재분석하면 실제 점수가 올라가는 경험.

### 동작
1. 기존 처방전(PrescriptionItem)에 **예상 점수 영향**을 추가
   - 예: "Memory 설정 추가하세요 → 성숙도 +15~25 예상"
2. 결과 페이지에서 처방전을 체크리스트 UI로 표시
3. 체크 완료 후 "다시 분석하기" CTA → 실제 점수 변화 확인
4. 체크리스트 상태는 localStorage에 저장 (DB 불필요)

### 처방전 점수 영향 매핑
```typescript
interface PrescriptionItem {
  text: string;
  priority: "high" | "medium" | "low";
  estimatedImpact?: {
    dimension: keyof DimensionScores;
    min: number;  // 최소 예상 증가
    max: number;  // 최대 예상 증가
  };
}
```

### UI 변경
- PrescriptionSection에 체크박스 추가
- 체크 시 취소선 + "예상 +15~25점" 배지 표시
- 하단에 "처방전 반영 후 다시 분석하기 →" CTA 버튼
- 완료 개수 프로그레스 표시: "3/7 완료"

## 피쳐 3: 팀 분석 (리더보드 기반)

### 목적
개인 분석을 넘어 팀 단위 성향 리포트 제공. "우리 팀은 어떤 성향인가?"라는 궁금증 유발 + 팀원 간 공유로 바이럴.

### 동작
1. 리더보드에 등록된 사용자가 "팀 만들기" → 팀 이름 + 초대 코드 생성
2. 팀원이 초대 코드로 팀 합류 (이미 리더보드에 등록된 사용자만)
3. 팀 페이지에서 팀 종합 리포트:
   - 팀 평균 .md력 + 티어 분포 차트
   - 팀 내 6개 차원 레이더 차트 (평균)
   - 페르소나 분포: "봇 농장주 3명, 3줄러 2명, ..."
   - 팀의 강점/약점 자동 도출: "자동화는 강하지만 보안이 약합니다"

### 데이터 모델
```sql
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,  -- 6자리 코드
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);
```

### UI
- 리더보드 페이지에 "팀 만들기" / "팀 합류" 버튼
- `/team/[id]` — 팀 리포트 페이지
- 팀 리포트는 공유 가능한 URL (비로그인도 조회 가능)

### 팀 리포트 구조
```
┌─────────────────────────────────────┐
│ 🏢 팀 "퓨쳐스콜레 AI팀"             │
│ 5명 참여 · 평균 .md력 423           │
│                                     │
│ 📊 차원별 평균 (레이더 차트)          │
│ 자동화 72 / 보안 45 / 협업 38 / ... │
│                                     │
│ 👥 페르소나 분포                     │
│ 🎪 봇 농장주 ██████ 3명             │
│ 📄 3줄러    ████   2명             │
│                                     │
│ 💡 팀 인사이트                      │
│ "자동화는 상위 20%지만              │
│  보안 의식이 하위 40%입니다"         │
└─────────────────────────────────────┘
```

## 구현 우선순위

| 순서 | 피쳐 | 예상 규모 | 의존성 |
|---|---|---|---|
| 1 | 성장 히스토리 | 중 | Supabase 마이그레이션 + 프로필 페이지 수정 |
| 2 | 처방전 체크리스트 | 소 | 프론트엔드만 (localStorage) |
| 3 | 팀 분석 | 대 | 성장 히스토리 완료 후 (히스토리 인프라 활용) |

## 기술 제약

- 차트 라이브러리: CSS 기반 우선 (번들 사이즈 최소화), 필요 시 lightweight 라이브러리(uplot 등) 검토
- 팀 분석의 레이더 차트: SVG 직접 그리기 또는 CSS
- AI 분석은 이번 스코프에서 제외 (패턴 매칭 고도화로 커버)
- 프라이버시: 팀 분석 시 개인의 원본 .md는 공유하지 않음 (점수/페르소나만 집계)
