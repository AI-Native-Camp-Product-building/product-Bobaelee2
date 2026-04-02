/**
 * 8가지 페르소나 정의
 * 각 페르소나는 CLAUDE.md 분석 결과로 분류된 개발자 유형을 나타낸다
 */
import type { PersonaKey, PersonaDefinition } from "@/lib/types";

/** 8가지 페르소나 전체 정의 */
export const PERSONAS: Record<PersonaKey, PersonaDefinition> = {
  "puppet-master": {
    key: "puppet-master",
    nameKo: "봇 농장주",
    nameEn: "The Puppet Master",
    emoji: "🎪",
    tagline: "AI를 부리는 줄 알았는데, 사실 AI가 시킨 대로 살고 있는 사람",
    description:
      "hook, bot, pipeline, 자동화 스크립트로 가득 찬 CLAUDE.md를 가진 당신. " +
      "Claude에게 모든 걸 맡겨두고 퇴근한 척하지만, 사실 Slack 알림이 울릴 때마다 " +
      "식은땀을 흘리고 있는 진정한 자동화 중독자.",
  },
  speedrunner: {
    key: "speedrunner",
    nameKo: "손이 빠른 무법자",
    nameEn: "The Speedrunner",
    emoji: "⚡",
    tagline: "설정은 사치, 실행이 정의",
    description:
      "CLAUDE.md? 그거 꼭 써야 해요? 라고 생각하는 당신. " +
      "문서화보다 실행, 설정보다 결과. 빠르게 치고 나가는 건 좋은데 " +
      "나중에 본인도 뭘 만들었는지 기억 못할 가능성 120%.",
  },
  fortress: {
    key: "fortress",
    nameKo: "보안 편집증 환자",
    nameEn: "The Fortress",
    emoji: "🏰",
    tagline: ".env 파일이 꿈에 나오는 사람",
    description:
      "API 키 하나에 절대 금지 세 개를 붙이는 당신. " +
      "보안 규칙이 기능 코드보다 많은 CLAUDE.md를 자랑스럽게 여기며, " +
      "팀원들이 .env를 어디 뒀는지 물어볼 때마다 눈을 반짝이는 진정한 보안 수호자.",
  },
  minimalist: {
    key: "minimalist",
    nameKo: "CLAUDE.md 3줄러",
    nameEn: "The Minimalist",
    emoji: "📄",
    tagline: "Claude야 알아서 해",
    description:
      "CLAUDE.md에 '한국어로 답해줘' 딱 한 줄만 있는 당신. " +
      "간결함의 미학인지, 귀찮음의 승리인지는 본인만 알고 있음. " +
      "하지만 Claude가 엉뚱한 답변을 할 때마다 '내가 더 적어놨어야 했나' 생각하지 않나요?",
  },
  collector: {
    key: "collector",
    nameKo: "플러그인 수집가",
    nameEn: "The Collector",
    emoji: "🧲",
    tagline: "일단 깔고 본다",
    description:
      "Slack, Notion, GitHub, Supabase, Vercel, Linear, Figma... 전부 다 쓰는 당신. " +
      "도구가 많다고 실력이 느는 건 아닌데, 새 툴 나오면 무조건 써봐야 직성이 풀리는 " +
      "진정한 수집가. 도구함이 창고 수준.",
  },
  legislator: {
    key: "legislator",
    nameKo: "규칙 제왕",
    nameEn: "The Legislator",
    emoji: "⚖️",
    tagline: "Claude에게도 헌법이 필요하다",
    description:
      "MUST, NEVER, ALWAYS, CRITICAL, IMPORTANT가 CLAUDE.md 전체를 뒤덮은 당신. " +
      "Claude에게 규칙을 부여하는 게 취미이며, 혹시 Claude가 규칙을 어기면 " +
      "진짜로 속상해하는 진정한 입법자. 팀원들도 살짝 무서워함.",
  },
  craftsman: {
    key: "craftsman",
    nameKo: "조용한 장인",
    nameEn: "The Craftsman",
    emoji: "🔧",
    tagline: "도구는 수단일 뿐",
    description:
      "화려하지 않지만 균형 잡힌 CLAUDE.md를 가진 당신. " +
      "자동화도 적당히, 보안도 적당히, 협업도 적당히. " +
      "튀는 건 없지만 함께 일하면 가장 편한 사람. " +
      "묵묵히 좋은 결과물을 내는 진정한 장인.",
  },
  "deep-diver": {
    key: "deep-diver",
    nameKo: "과몰입러",
    nameEn: "The Deep Diver",
    emoji: "🕳️",
    tagline: "한 우물만 파는데 그 우물이 지하 5층",
    description:
      "CLAUDE.md에 특정 주제 하나만 엄청나게 깊게 파고든 당신. " +
      "context, session, memory 관리가 무려 전체의 절반을 차지하거나, " +
      "특정 자동화 파이프라인에 대한 설명이 소설 분량인 당신. " +
      "깊이는 최고인데 너비가 아쉬운 진정한 전문가 기질.",
  },
};
