# mdTI 바이럴 강화 설계

> 날짜: 2026-04-07
> 목적: 결과 납득감 + 공유 동기 강화 → 바이럴 루프 개선

## 배경

### 핵심 문제
"결과가 나왔는데, 왜 이건지 모르겠고, 나만 보니까 감이 안 와서, 공유할 마음이 안 든다"

### 문제 분석
1. **분류 근거 부재** — 7차원 점수가 존재하지만(Supabase에 저장됨) 결과 화면에서 보여주지 않음
2. **비교 대상 부재** — 다른 사용자와의 상대적 위치를 모름
3. **공유 동기 약화** — 1, 2로 인해 "이걸 공유해야겠다"는 충동이 생기지 않음

### 결정 사항
- 분석 엔진(7차원, 94개 패턴, 페르소나 분류 로직) 변경 없음
- 수집 스크립트 변경 없음
- UI 추가만으로 납득감과 공유 동기를 해결
- 차원 재설계(CIVC 프레임워크 기반)는 이후 별도 프로젝트로

## 기능 1: 전투력 측정기 (레이더 차트)

### 개요
7차원 점수를 레이더 차트로 시각화. 차트 모양 자체가 "왜 이 페르소나인지" 분류 근거를 대체한다.

### 배치 위치
```
1. ResultHero (페르소나)
2. 부 페르소나 태그
3. ★ 전투력 측정기 (신규)
4. MdPowerSection (md력)
5. RoastSection (로스팅)
... (이하 기존 순서 유지)
```

### 구성
- **타이틀**: "🎪 봇 농장주의 전투력 분석" (페르소나 이모지 + 이름 연동)
- **7축 레이더 차트**: SVG 직접 구현 (라이브러리 없음)
- **축 라벨**: 짧은 한글 2~3글자
  - automation → 자동화
  - control → 통제
  - toolDiversity → 도구
  - contextAwareness → 맥락
  - teamImpact → 팀
  - security → 보안
  - agentOrchestration → 에이전트
- **각 축에 점수(0~100) 표시**
- **하단**: "94개 패턴 중 N개 감지"

### 디자인
- 기존 팔레트 유지: `bg-bg-card`, `claude-orange`, `claude-cream`
- 레이더 영역: `claude-orange` 반투명 fill
- 격자선: `claude-light/10` 으로 20/40/60/80/100 동심 다각형
- 컴포넌트: `components/RadarChart.tsx` (클라이언트 컴포넌트)

### 기술 구현
- 7각형 좌표 계산: `cos(2πi/7)`, `sin(2πi/7)` 기반
- SVG `<polygon>` 으로 배경 격자 + 데이터 영역
- `<text>` 로 라벨 + 점수 배치
- 반응형: 모바일 기준 폭 300px, 데스크톱 400px

### 데이터 흐름
- `scores` 필드 (DimensionScores)는 이미 Supabase에 저장됨
- 결과 페이지에서 `result.scores`를 `RadarChart`에 전달하면 끝
- 추가 API 불필요

## 기능 2: 상위 N% 배지

### 개요
전체 사용자 분포 대비 내 위치를 보여줌. 공유 멘트의 훅이 됨.

### 표시 항목
1. **전체 md력 순위**: "상위 12%" — md력 점수 기준 percentile
2. **최강 차원**: "보안 상위 5%" — 7개 차원 중 가장 높은 percentile인 것 하나

### 배치 위치
- 레이더 차트 바로 아래, 차트 컴포넌트 안에 포함

### 기술 구현

#### Supabase percentile 계산
```sql
-- md력 percentile
SELECT COUNT(*) FROM results WHERE md_power_score < :myScore
/ (SELECT COUNT(*) FROM results) * 100

-- 차원별 percentile
SELECT COUNT(*) FROM results WHERE (scores->>'security')::int < :mySecurityScore
/ (SELECT COUNT(*) FROM results) * 100
```

#### API
- `lib/store.ts`의 `getGlobalStats()`를 확장하여 percentile 데이터 포함
- 또는 별도 `getPercentile(resultId)` 함수 추가
- 결과 페이지에서 서버 사이드로 조회 (클라이언트 호출 아님)

#### 캐싱
- percentile은 실시간 정확도 불필요 — 1시간 캐시 또는 일간 배치 계산으로 충분
- `globalStats`에 분포 히스토그램을 포함시키고 클라이언트에서 percentile 계산하는 방식도 가능

### 디자인
- 배지 형태: `"🏆 md력 상위 12% · 보안 상위 5%"` 한 줄
- 색상: `claude-orange` 강조

## 기능 3: 캡처 카드에 레이더 차트 포함

### 개요
SNS 공유 이미지에 레이더 차트가 포함되어야 바이럴 의미가 있음.

### 적용 대상
1. **CaptureCard 컴포넌트** — 캡처 버튼 클릭 시 생성되는 이미지
2. **OG 이미지** (`/api/og/[id]/route.tsx`) — SNS 미리보기 카드

### CaptureCard
- 기존 `CaptureCard.tsx`에 `RadarChart` 컴포넌트 삽입
- 캡처 영역에 포함되도록 레이아웃 조정
- 상위 N% 배지도 캡처 영역 안에 포함

### OG 이미지
- 현재 OG 이미지는 `ImageResponse`(Satori) 기반
- Satori에서 SVG 직접 렌더링이 제한적 → 대안:
  - (A) Satori의 `<div>` + CSS로 간소화된 막대그래프 형태로 대체
  - (B) 레이더 차트를 inline SVG string으로 삽입 시도
  - (C) OG에는 레이더 없이 상위 N% 텍스트만 포함
- **추천: (C)** — OG 이미지에는 "🎪 봇 농장주 · md력 상위 12%" 텍스트만. 레이더는 캡처 카드에만.

## 결과 페이지 최종 구조

```
1. ResultHero (페르소나 이모지 + 이름 + 태그라인)
2. 부 페르소나 태그
3. ★ 전투력 측정기 (레이더 차트 + 상위 N% 배지) — 신규
4. MdPowerSection (md력 점수 + 티어)
5. RegisterLeaderboard
6. RoastSection (로스팅 3개)
7. StrengthSection (강점 3개)
8. CompatSection (궁합 3개)
9. ExpandedAnalysis (확장 분석, B경로만)
10. PrescriptionSection (처방전 5개)
11. StatsSection (통계)
12. ShareButton (캡처 + SNS 공유)
13. 하단 CTA
```

## 파일 변경 목록

| 파일 | 변경 내용 |
|-----|--------|
| `components/RadarChart.tsx` | 신규 — 7축 레이더 차트 SVG 컴포넌트 |
| `components/BattlePower.tsx` | 신규 — 전투력 측정기 래퍼 (레이더 + 배지) |
| `app/r/[id]/page.tsx` | BattlePower 삽입 |
| `lib/store.ts` | percentile 계산 함수 추가 |
| `lib/types.ts` | DIMENSION_LABELS 상수 추가 |
| `components/CaptureCard.tsx` | 레이더 차트 + 배지 포함 |
| `app/api/og/[id]/route.tsx` | 상위 N% 텍스트 추가 |

## 안 하는 것

- 분석 엔진 변경 (7차원, 패턴, 분류 로직)
- 수집 스크립트 변경
- 차원 리브랜딩 (내부 키 유지, UI 라벨만 짧게)
- 별도 분류 근거 카드 (레이더가 대체)
- DB 스키마 변경 (scores는 이미 저장됨)
