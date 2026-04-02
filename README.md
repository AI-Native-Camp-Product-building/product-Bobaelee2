# .mdTI

> 당신의 CLAUDE.md가 당신에게 하고 싶었던 말

CLAUDE.md를 분석해서 개발 성향을 페르소나로 분류하고, 발칙하게 로스팅하는 소셜 바이럴 서비스.

**Live**: https://mdti.vercel.app

---

## 어떤 서비스인가요?

CLAUDE.md를 붙여넣으면 **8가지 페르소나** 중 하나로 분류해줍니다:

| 페르소나 | 설명 |
|---------|------|
| 봇 농장주 — The Puppet Master | AI를 부리는 줄 알았는데, AI가 시킨 대로 사는 사람 |
| 손이 빠른 무법자 — The Speedrunner | 설정은 사치, 실행이 정의 |
| 보안 편집증 환자 — The Fortress | .env 파일이 꿈에 나오는 사람 |
| CLAUDE.md 3줄러 — The Minimalist | Claude야 알아서 해 |
| 플러그인 수집가 — The Collector | 일단 깔고 본다 |
| 규칙 제왕 — The Legislator | Claude에게도 헌법이 필요하다 |
| 조용한 장인 — The Craftsman | 도구는 수단일 뿐 |
| 과몰입러 — The Deep Diver | 한 우물만 파는데 그 우물이 지하 5층 |

## 주요 기능

- **발칙한 로스팅** — MD에서 발견한 특징을 찔리게 로스팅
- **진짜 강점 인정** — 로스팅만 하면 서운하니까
- **궁합** — 찰떡 / 환장 / 거울 궁합
- **MD 업그레이드 처방전** — 실질적인 CLAUDE.md 개선 가이드
- **글로벌 통계** — "상위 X%", "평균의 N배" 같은 희소성 메시지
- **LinkedIn 공유** — OG 카드 최적화 + 공유 문구 자동 생성

## 프라이버시

**분석은 100% 브라우저에서. 원본은 어디에도 전송되지 않습니다.**

- 분석 엔진은 클라이언트 사이드 JavaScript (규칙 기반 패턴 매칭)
- 서버에 저장되는 것: 분석 결과 (페르소나, 점수, 문구)만
- 서버에 저장되지 않는 것: 원본 CLAUDE.md 텍스트

## 기술 스택

- **프레임워크**: Next.js 15+ (App Router)
- **스타일링**: Tailwind CSS 4
- **DB**: Supabase (PostgreSQL, 서울 리전)
- **OG 이미지**: @vercel/og (Satori)
- **배포**: Vercel
- **테스트**: Vitest (98개 테스트)

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 (Supabase 없이도 메모리 모드로 동작)
npm run dev

# 테스트
npm run test:run
```
