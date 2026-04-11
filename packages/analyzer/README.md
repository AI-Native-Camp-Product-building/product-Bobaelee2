# @mdti/analyzer

> .md 파일을 분석하여 AI 활용 페르소나 + md력 점수를 반환하는 분석 엔진

**프레임워크 의존성 없음.** 순수 TypeScript. Next.js, Vite, Node.js 어디서든 동작.

## 설치

```bash
# GitHub repo에서 직접 설치
npm install github:Vivi-lee-01/mdti#main -- --workspace=packages/analyzer

# 또는 로컬에서 (monorepo)
npm install ./packages/analyzer
```

## 사용법

```ts
import { analyze, PERSONAS } from '@mdti/analyzer'

const result = analyze(claudeMdText)

// 페르소나
console.log(PERSONAS[result.persona].emoji)    // 🤠
console.log(PERSONAS[result.persona].nameKo)   // 로데오 마스터

// md력
console.log(result.mdPower.score)              // 680
console.log(result.mdPower.tierEmoji)          // 🏔️
console.log(result.mdPower.tierName)           // Oak

// 7차원 점수
console.log(result.scores.automation)          // 75
console.log(result.scores.security)            // 60

// 콘텐츠
console.log(result.roasts[0].text)             // 로스팅
console.log(result.strengths[0].text)          // 강점
console.log(result.prescriptions[0].text)      // 처방전
```

## API

### `analyze(text: string): AnalysisResult`

핵심 함수. .md 파일 텍스트를 받아 완전한 분석 결과를 반환.

```ts
interface AnalysisResult {
  persona: PersonaKey           // 주 페르소나
  secondaryPersona: PersonaKey  // 부 페르소나
  scores: DimensionScores       // 7차원 점수 (0-100)
  qualityScores: QualityScores  // md력 품질 5차원 (0-100)
  mdPower: MdPower              // md력 점수 (0-1000) + 티어
  roasts: RoastItem[]           // 로스팅 3개
  strengths: StrengthItem[]     // 강점 3개
  prescriptions: PrescriptionItem[] // 처방전 5개
  mdStats: MdStats              // 파일 통계
}
```

### `PERSONAS`

13개 페르소나 정의. 이모지, 한글 이름, 영문 이름, 태그라인 포함.

```ts
import { PERSONAS } from '@mdti/analyzer'
PERSONAS['puppet-master'].emoji    // 🤠
PERSONAS['puppet-master'].nameKo   // 로데오 마스터
PERSONAS['puppet-master'].tagline  // 하네스를 완전히 길들인 카우보이
```

### 고급: 개별 분석 단계

```ts
import {
  calculateScores,    // 7차원 점수
  extractMdStats,     // 파일 통계
  classifyPersona,    // 페르소나 분류
  calculateQualityScores, // md력 품질
  calculateMdPower,   // md력 점수
} from '@mdti/analyzer'
```

## 13가지 페르소나

| 키 | 이모지 | 이름 |
|----|--------|------|
| puppet-master | 🤠 | 로데오 마스터 |
| huggies | 👶 | 하기스 아키텍트 |
| architect | 🎪 | 봇 농장주 |
| speedrunner | ⚡ | 손이 빠른 무법자 |
| fortress | 🏰 | 보안 편집증 환자 |
| minimalist | 📄 | CLAUDE.md 3줄러 |
| collector | 🧲 | 플러그인 수집가 |
| legislator | ⚖️ | 규칙 제왕 |
| craftsman | 🔧 | 조용한 장인 |
| deep-diver | 🕳️ | 과몰입러 |
| evangelist | 📢 | 협업 전도사 |
| daredevil | 🎲 | 위험물 취급자 |
| polymath | 🧙 | 팔방미인 |

## 라이선스

MIT
