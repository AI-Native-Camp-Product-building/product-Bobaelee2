/**
 * 페르소나별 강점 생성기
 * 각 페르소나의 진정한 강점을 근거 기반으로 생성한다
 */
import type { PersonaKey, MdStats, StrengthItem } from "@/lib/types";

type StrengthTemplate = (stats: MdStats) => StrengthItem[];

/** 페르소나별 강점 템플릿 */
const STRENGTH_TEMPLATES: Record<PersonaKey, StrengthTemplate> = {
  "puppet-master": (stats) => [
    {
      text: `${stats.toolNames.length}개 도구를 엮는 시스템 설계 능력이 탁월합니다. ` +
        "대부분의 사람이 수동으로 처리하는 작업을 자동화로 해결하는 진정한 엔지니어 마인드입니다.",
    },
    {
      text: "hook과 pipeline 구성에 능숙해 반복 작업을 원천 차단합니다. " +
        "한 번 설정하면 Claude가 알아서 처리하는 구조를 만드는 능력, 실제로 귀한 역량입니다.",
    },
    {
      text: `${stats.totalLines}줄의 CLAUDE.md는 단순한 설정이 아니라 ` +
        "업무 운영 체계 그 자체입니다. 이 수준의 시스템화는 팀 전체의 효율을 높일 수 있습니다.",
    },
  ],

  speedrunner: (stats) => [
    {
      text: "실행 속도가 타의 추종을 불허합니다. " +
        "설정에 시간을 낭비하지 않고 바로 결과물을 만들어내는 추진력, 스타트업에서 가장 귀한 덕목입니다.",
    },
    {
      text: `${stats.totalLines}줄만으로도 Claude를 실용적으로 활용합니다. ` +
        "복잡한 설정 없이도 원하는 결과를 뽑아내는 능력은 진짜 실력의 증거입니다.",
    },
    {
      text: "군더더기 없이 핵심만 담는 간결함의 미학을 추구합니다. " +
        "많은 사람이 설정에 빠져 정작 실행을 못 하는 사이, 당신은 이미 결과물을 만들고 있습니다.",
    },
  ],

  fortress: (stats) => [
    {
      text: `보안 규칙을 ${stats.ruleCount}개 이상 명시한 당신. ` +
        "민감 정보 유출 사고는 대부분 '이 정도야 괜찮겠지'에서 시작합니다. 그 '이 정도'를 차단하는 사람이 바로 당신입니다.",
    },
    {
      text: ".env, API 키, token, credential을 체계적으로 관리합니다. " +
        "보안 사고 하나가 서비스 전체를 무너뜨릴 수 있는 시대에, 당신 같은 사람이 팀에 반드시 있어야 합니다.",
    },
    {
      text: "규칙을 글로 명시하는 습관이 탁월합니다. " +
        "구두로만 전달되던 보안 관행을 문서화하면, Claude뿐 아니라 신규 팀원도 온보딩이 쉬워집니다.",
    },
  ],

  minimalist: (stats) => [
    {
      text: "불필요한 복잡성을 거부하는 단호함이 있습니다. " +
        "많은 사람이 설정을 쌓아가다 정작 핵심을 잃어버리는 사이, 당신은 핵심만 남겼습니다.",
    },
    {
      text: "인지 부하를 최소화한 CLAUDE.md 덕분에 유지보수가 쉽습니다. " +
        "복잡한 설정은 언젠가 관리 포기로 이어지지만, 간결한 설정은 오래 살아남습니다.",
    },
    {
      text: "지금 당장 필요한 것만 넣는 실용주의 마인드를 갖고 있습니다. " +
        "YAGNI(You Aren't Gonna Need It) 원칙을 본능적으로 실천하는 사람입니다.",
    },
  ],

  collector: (stats) => [
    {
      text: `${stats.toolNames.length}개 도구를 알고 연동한다는 것 자체가 넓은 기술 스펙트럼을 의미합니다. ` +
        "다양한 도구를 알고 있으면 문제에 맞는 적절한 도구를 선택할 수 있습니다.",
    },
    {
      text: "새로운 기술을 빠르게 습득하고 시도해보는 학습력이 뛰어납니다. " +
        "기술 트렌드에 뒤처지지 않는 것, 빠르게 변하는 AI 도구 시대에 핵심 역량입니다.",
    },
    {
      text: "여러 도구의 장단점을 경험적으로 알고 있어 팀에서 도구 선택 의사결정에 큰 도움이 됩니다. " +
        "직접 써본 사람의 추천은 리뷰 글 100개보다 값집니다.",
    },
  ],

  legislator: (stats) => [
    {
      text: `${stats.ruleCount}개의 명확한 규칙은 Claude와의 협업 품질을 높입니다. ` +
        "모호한 지시보다 명확한 규칙이 더 일관된 결과를 만들어냅니다.",
    },
    {
      text: "규칙을 글로 명시하는 능력은 팀 온보딩과 지식 전수에 직결됩니다. " +
        "당신의 CLAUDE.md는 팀의 AI 활용 가이드북이 될 수 있습니다.",
    },
    {
      text: "경계를 명확히 설정하는 능력 덕분에 Claude의 오동작을 미리 차단합니다. " +
        "사고가 난 후 대응하는 것보다 사전에 방지하는 것이 10배 효율적입니다.",
    },
  ],

  craftsman: (stats) => [
    {
      text: "6개 모든 차원이 균형 잡혀 있습니다. " +
        "한 쪽으로 치우치지 않고 전체를 아우르는 시각, 팀 리드나 시니어 포지션에서 빛을 발합니다.",
    },
    {
      text: `${stats.totalLines}줄로 자동화, 보안, 협업, 구조화를 고루 담았습니다. ` +
        "완성도 있는 CLAUDE.md는 Claude와의 협업이 오래갈 수 있게 해주는 기반입니다.",
    },
    {
      text: "튀지는 않지만 꾸준하게 좋은 결과물을 만들어내는 사람입니다. " +
        "팀에서 함께 일하고 싶은 동료 1위에 항상 이름이 올라가는 유형입니다.",
    },
  ],

  "deep-diver": (stats) => [
    {
      text: "특정 영역에 대한 깊이 있는 이해가 남다릅니다. " +
        "누구보다 깊게 파고드는 전문성은 복잡한 문제를 해결할 때 진가를 발휘합니다.",
    },
    {
      text: stats.hasMemory
        ? "memory, session, context 관리를 세밀하게 설계했습니다. " +
          "긴 작업에서도 컨텍스트를 잃지 않는 능력은 대부분의 Claude 사용자가 포기하는 영역입니다."
        : "자동화 파이프라인을 극도로 정밀하게 구성했습니다. " +
          "이 수준의 설계 능력은 복잡한 워크플로우를 완전히 자동화할 수 있게 해줍니다.",
    },
    {
      text: `${stats.totalLines}줄에 담긴 깊이 있는 설정은 ` +
        "해당 분야에서 Claude를 가장 효율적으로 활용하는 전문가 수준의 CLAUDE.md입니다.",
    },
  ],
};

/**
 * 페르소나와 통계를 기반으로 3개의 강점을 생성한다
 * @param persona 페르소나 키
 * @param mdStats CLAUDE.md 통계
 * @returns 3개의 StrengthItem 배열
 */
export function generateStrengths(persona: PersonaKey, mdStats: MdStats): StrengthItem[] {
  const template = STRENGTH_TEMPLATES[persona];
  return template(mdStats);
}
