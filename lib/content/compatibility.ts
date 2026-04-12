/**
 * 페르소나 궁합 정보 생성기
 * 각 페르소나의 최고 궁합, 최악 궁합을 제공한다
 */
import type { PersonaKey, CompatInfo } from "@/lib/types";

/** 페르소나별 궁합 맵 */
const COMPATIBILITY_MAP: Record<PersonaKey, { perfect: PersonaKey; chaos: PersonaKey }> = {
  "puppet-master": { perfect: "speedrunner", chaos: "fortress" },
  speedrunner: { perfect: "puppet-master", chaos: "legislator" },
  fortress: { perfect: "legislator", chaos: "daredevil" },
  minimalist: { perfect: "craftsman", chaos: "legislator" },
  collector: { perfect: "deep-diver", chaos: "minimalist" },
  legislator: { perfect: "fortress", chaos: "speedrunner" },
  craftsman: { perfect: "minimalist", chaos: "collector" },
  "deep-diver": { perfect: "collector", chaos: "craftsman" },
  evangelist: { perfect: "architect", chaos: "minimalist" },
  architect: { perfect: "evangelist", chaos: "minimalist" },
  huggies: { perfect: "architect", chaos: "daredevil" },
  daredevil: { perfect: "daredevil", chaos: "fortress" },
};

/** 페르소나 이름 (한글, 짧게) */
const PERSONA_NAME_KO: Record<PersonaKey, string> = {
  "puppet-master": "봇 농장주",
  speedrunner: "손이 빠른 무법자",
  fortress: "보안 편집증 환자",
  minimalist: "설정 문서 3줄러",
  collector: "플러그인 수집가",
  legislator: "규칙 제왕",
  craftsman: "조용한 장인",
  "deep-diver": "과몰입러",
  evangelist: "협업 전도사",
  architect: "하네스 아키텍트",
  daredevil: "위험물 취급자",
  huggies: "하기스 아키텍트",
};

/** 최고 궁합 설명 템플릿 */
const PERFECT_DESCRIPTIONS: Record<PersonaKey, string> = {
  "puppet-master":
    "봇 농장주 + 손이 빠른 무법자 = 최강의 실행 콤보. 무법자가 아이디어를 내면 농장주가 자동화로 구현하는 무한 생산성 루프.",
  speedrunner:
    "손이 빠른 무법자 + 봇 농장주 = 실행과 자동화의 환상 조합. 무법자가 던진 아이디어를 농장주가 파이프라인으로 만들어준다.",
  fortress:
    "보안 편집증 + 규칙 제왕 = 철벽 방어 파트너십. 요새가 감지하고 입법자가 규칙화하는 난공불락 콤비.",
  minimalist:
    "3줄러 + 조용한 장인 = 군더더기 없는 완벽한 조합. 장인이 채워주는 균형이 3줄러의 간결함을 완성시켜준다.",
  collector:
    "수집가 + 과몰입러 = 넓이와 깊이의 환상 콤비. 수집가가 발굴하고 과몰입러가 심층 분석하는 지식의 상호 보완.",
  legislator:
    "규칙 제왕 + 보안 편집증 = 규정과 보안의 꿈의 콤비. 입법자가 만든 규칙을 요새가 철저히 수호하는 최강의 거버넌스.",
  craftsman:
    "조용한 장인 + 3줄러 = 균형과 간결함의 만남. 장인의 꼼꼼함이 3줄러의 실용주의를 완성도 있게 보완해준다.",
  "deep-diver":
    "과몰입러 + 수집가 = 지식의 심층 탐구 파트너. 과몰입러가 파고들면 수집가가 넓은 맥락을 제공하는 최강 리서치 팀.",
  evangelist:
    "협업 전도사 + 하네스 아키텍트 = 팀 생산성 극대화 콤비. 전도사가 협업 규칙을 만들면 아키텍트가 도구로 구현하는 완벽한 분업.",
  architect:
    "로데오 마스터 + 협업 전도사 = 기술과 문화의 시너지. 카우보이의 생태계를 전도사가 팀 전체에 전파하는 최강의 확산 루프.",
  huggies:
    "하기스 아키텍트 + 로데오 마스터 = 사제 관계의 꿈. 기저귀 단계의 하기스가 카우보이의 목장을 견학하면 성장 속도 10배. 가장 이상적인 멘토링 궁합.",
  daredevil:
    "위험물 취급자 + 위험물 취급자 = 스피드의 끝판왕. 보안도 도구도 최소한으로 줄이고 오직 결과물에만 집중하는 조합. 단, 사고 나면 둘 다 도망갈 곳이 없다.",
};

/** 최악 궁합 설명 템플릿 */
const CHAOS_DESCRIPTIONS: Record<PersonaKey, string> = {
  "puppet-master":
    "봇 농장주 vs 보안 편집증 = 자동화와 감시의 충돌. 농장주가 webhook 깔면 요새가 '이거 안전해요?'라며 제동 거는 무한 루프.",
  speedrunner:
    "무법자 vs 규칙 제왕 = 카오스 vs 질서의 정면충돌. 무법자가 push하면 입법자가 'CRITICAL 규칙 위반!'이라며 막아서는 아수라장.",
  fortress:
    "보안 편집증 vs 위험물 취급자 = 상극 중의 상극. 요새가 .env 보호 규칙 10개를 만들면 데어데블이 '그게 왜 필요해요?'라며 전부 삭제하려는 최악의 궁합.",
  minimalist:
    "3줄러 vs 규칙 제왕 = 자유와 통제의 충돌. 3줄러가 대충 하려 하면 입법자가 MUST/NEVER/ALWAYS로 도배하며 충돌.",
  collector:
    "수집가 vs 3줄러 = 많음 vs 없음의 충돌. 수집가는 도구를 계속 추가하고 3줄러는 '그거 필요 없잖아요'라며 삭제 요청.",
  legislator:
    "규칙 제왕 vs 무법자 = 헌법 vs 무정부주의의 충돌. 입법자의 모든 규칙을 무법자가 '이게 왜 필요해요?'라며 무시하는 지옥.",
  craftsman:
    "조용한 장인 vs 수집가 = 절제 vs 과잉의 충돌. 장인이 정리하면 수집가가 다시 추가하는 시지프스의 바위 굴리기.",
  "deep-diver":
    "과몰입러 vs 조용한 장인 = 극단 vs 균형의 충돌. 과몰입러가 한 곳에 500줄을 쓰면 장인은 '이게 다 필요해요?'라며 당황.",
  evangelist:
    "협업 전도사 vs 3줄러 = 팀 프로세스 vs 무관심의 충돌. 전도사가 PR 리뷰 규칙을 만들면 3줄러가 'Claude야 알아서 해'라며 무시하는 평행선.",
  architect:
    "로데오 마스터 vs 3줄러 = 초복잡 vs 초간결의 극과 극. 카우보이가 플러그인 10개 설치를 권하면 3줄러는 'Claude Code 기본으로도 충분한데요'라며 대화 거부.",
  huggies:
    "하기스 아키텍트 vs 위험물 취급자 = 기저귀 vs 무보호의 충돌. 하기스가 '이 Hook 왜 안 돼요?'라고 물으면 데어데블이 'Hook이 뭐예요?'라고 답하는 평행우주.",
  daredevil:
    "위험물 취급자 vs 보안 편집증 = 속도 vs 안전의 정면충돌. 데어데블이 'ship fast'를 외치면 요새가 보안 감사 보고서를 내미는 영원한 평행선.",
};

/**
 * 페르소나에 대한 궁합 정보 2개를 반환한다 (perfect, chaos)
 * @param persona 페르소나 키
 * @returns CompatInfo 배열 (perfect, chaos 순)
 */
export function getCompatibility(persona: PersonaKey): CompatInfo[] {
  const { perfect, chaos } = COMPATIBILITY_MAP[persona];

  return [
    {
      type: "perfect",
      targetPersona: perfect,
      description: PERFECT_DESCRIPTIONS[persona],
    },
    {
      type: "chaos",
      targetPersona: chaos,
      description: CHAOS_DESCRIPTIONS[persona],
    },
  ];
}
