/**
 * 페르소나별 강점 생성기
 * 팩폭 톤 — 인정하되 날카롭게. "근데 이건 진짜 잘하네"
 */
import type { PersonaKey, MdStats, StrengthItem } from "@/lib/types";

type StrengthTemplate = (stats: MdStats) => StrengthItem[];

const STRENGTH_TEMPLATES: Record<PersonaKey, StrengthTemplate> = {
  "puppet-master": (stats) => [
    {
      text: stats.mcpServerCount > 0
        ? `MCP ${stats.mcpServerCount}개 + 도구 ${stats.toolNames.length}개를 돌아가게 만든 건 진짜 실력이에요. 대부분은 연동 시도하다 포기합니다.`
        : `${stats.toolNames.length}개 도구를 실제로 엮어서 돌아가게 만든 사람. 연동만 해놓고 안 쓰는 사람이 태반인데, 당신은 진짜 굴리고 있어요.`,
    },
    {
      text: stats.hookCount > 1
        ? `Hook ${stats.hookCount}개로 반복 작업을 시스템으로 없앤 건 엔지니어의 본능이에요. 한 번 설정하면 끝이라는 걸 아는 사람.`
        : "반복 작업을 손으로 안 하겠다는 집념. 그 집념이 결국 시스템을 만들어요. 대부분은 '다음에 자동화해야지'만 하다 끝나거든요.",
    },
    {
      text: stats.commandCount > 0
        ? `커스텀 명령어 ${stats.commandCount}개까지 만든 건 '도구를 쓰는 사람'이 아니라 '도구를 만드는 사람'이라는 뜻이에요.`
        : `${stats.claudeMdLines}줄의 설정은 단순한 메모가 아니라 업무 운영 체계예요. 이 수준의 시스템화를 팀에 전파하면 조직 전체가 빨라집니다.`,
    },
  ],

  speedrunner: (stats) => [
    {
      text: "실행력 하나는 끝판왕이에요. 설정에 3시간 쓰고 정작 코드 한 줄 안 짜는 사람보다 백 배 낫습니다.",
    },
    {
      text: `${stats.claudeMdLines}줄만으로도 결과물을 내고 있다는 건, 도구 없이도 본인 실력이 있다는 증거예요.`,
    },
    {
      text: "오버엔지니어링 안 하는 감각. 이건 진짜 귀한 거예요. 설정 100줄 짜놓고 정작 일 안 하는 사람이 얼마나 많은지 몰라요.",
    },
  ],

  fortress: (stats) => [
    {
      text: stats.blocksDangerousOps
        ? `rm -rf, force push를 deny로 원천 차단. 이건 '신중한 사람'이 아니라 '사고를 미리 막는 사람'이에요. 팀에 반드시 있어야 하는 유형.`
        : `보안 규칙 ${stats.ruleCount}개를 글로 명시한 건 대단해요. '알아서 조심하겠지'라고 방치하는 팀이 대부분인 세상에서.`,
    },
    {
      text: stats.hookPromptCount > 0
        ? "PreToolUse Hook으로 실수를 시스템적으로 차단. 규칙을 적는 수준을 넘어 강제하는 수준까지 간 거예요."
        : "민감 정보 관리를 문서화한 건 팀 전체의 보안 수준을 올려요. 당신의 설정 문서가 곧 팀의 보안 교과서.",
    },
    {
      text: "보안 사고는 '이 정도면 괜찮겠지'에서 시작해요. 그 '이 정도'를 차단하는 사람이 팀에 한 명은 있어야 하는데, 그게 당신이에요.",
    },
  ],

  minimalist: (stats) => [
    {
      text: "불필요한 복잡성을 거부하는 건 나름의 철학이에요. 설정 100줄 짜놓고 관리 포기하는 것보다 솔직히 나을 수 있어요.",
    },
    {
      text: "유지보수 비용 0. 간결한 설정은 깨지지 않아요. 복잡한 설정은 언젠가 반드시 깨집니다.",
    },
    {
      text: `${stats.claudeMdLines}줄이지만 필요한 건 들어있다면, YAGNI 원칙을 본능적으로 실천하는 사람이에요.`,
    },
  ],

  collector: (stats) => {
    const totalEcosystem = stats.pluginCount + stats.mcpServerCount + stats.toolNames.length;
    return [
      {
        text: totalEcosystem > 0
          ? `${totalEcosystem}개 에코시스템을 아는 것 자체가 넓은 기술 시야예요. 문제가 생겼을 때 '그거 이 도구로 되는데'라고 말할 수 있는 사람.`
          : `${stats.toolNames.length}개 도구를 알고 있다는 건 기술 트렌드에 뒤처지지 않는다는 뜻이에요.`,
      },
      {
        text: "새로운 도구를 두려워하지 않는 학습력. AI 도구가 한 달에 하나씩 나오는 시대에 이건 핵심 역량이에요.",
      },
      {
        text: "직접 써본 사람의 추천은 리뷰 글 100개보다 가치 있어요. 팀에서 '이거 써봤는데' 할 수 있는 사람이 당신이에요.",
      },
    ];
  },

  legislator: (stats) => [
    {
      text: `${stats.ruleCount}개 규칙이 지켜지든 안 지켜지든, 명시한 것 자체가 가치예요. 모호한 지시보다 명확한 규칙이 10배 나은 결과를 만들어요.`,
    },
    {
      text: "당신의 설정 문서는 팀 AI 활용 가이드북이 될 수 있어요. 규칙을 글로 명시하는 능력은 온보딩과 지식 전수에 직결돼요.",
    },
    {
      text: "사전에 경계를 설정하는 건 사후에 수습하는 것보다 10배 효율적이에요. 그걸 실천하는 사람이 적다는 게 당신의 가치.",
    },
  ],

  craftsman: (stats) => [
    {
      text: "6개 차원이 다 균형 잡혀 있다는 건 편향 없이 전체를 보는 시각이 있다는 뜻이에요. 팀 리드 포지션에서 빛나는 유형.",
    },
    {
      text: `${stats.claudeMdLines}줄로 자동화, 보안, 협업, 구조화를 고루 담았어요. 하나에 올인하지 않고 전체를 관리하는 능력.`,
    },
    {
      text: "함께 일하면 가장 편한 사람. 극단이 없어서 팀의 균형추 역할을 해요. 그게 과소평가되고 있을 뿐이에요.",
    },
  ],

  "deep-diver": (stats) => [
    {
      text: "누구보다 깊게 파고드는 전문성. 복잡한 문제를 던지면 진가를 발휘해요. 이건 넓은 사람이 절대 못 해요.",
    },
    {
      text: stats.hasMemory
        ? "memory, session, context 관리를 이 수준으로 설계한 사람은 상위 5%예요. 대부분은 포기하는 영역이거든요."
        : "자동화 파이프라인을 이 정밀도로 설계한 건 진짜 장인이에요. 대충 돌아가게 만드는 사람은 많지만, 제대로 만드는 사람은 드물어요.",
    },
    {
      text: `${stats.claudeMdLines}줄의 깊이는 해당 분야에서 Claude를 가장 효율적으로 쓰는 사람이라는 뜻이에요.`,
    },
  ],

  evangelist: (stats) => [
    {
      text: "협업 규칙을 문서화하는 능력은 팀의 암묵지를 형식지로 바꾸는 거예요. 이건 시니어의 핵심 역량이에요.",
    },
    {
      text: `${stats.sectionCount}개 섹션에 팀 워크플로우를 체계적으로 정리했어요. 이 설정 문서를 신입에게 주면 온보딩 시간이 절반으로 줄어요.`,
    },
    {
      text: "혼자 잘하는 것보다 같이 잘하게 만드는 게 더 어려워요. 그 어려운 걸 하고 있는 사람.",
    },
  ],

  huggies: (stats) => {
    const eco = stats.pluginCount + stats.mcpServerCount + stats.commandCount;
    return [
      {
        text: `에코시스템 ${eco}개를 시도한 것 자체가 대단해요. 대부분은 기본 설정에서 멈추거든요. 시도하는 사람이 성장하는 사람이에요.`,
      },
      {
        text: "지금은 '왜 이렇게 설정했는지' 모를 수 있지만, 이 경험이 쌓이면 로데오 마스터가 되는 거예요. 모든 카우보이는 낙마에서 시작해요.",
      },
      {
        text: stats.hookCount >= 2
          ? `Hook ${stats.hookCount}개를 직접 만들어본 경험. 이건 대부분의 사용자가 건드리지도 않는 영역이에요. 이미 상위 20% 안에 있어요.`
          : "플러그인과 명령어를 직접 설정해본 경험은 단순한 사용자를 넘어 '커스터마이저'로 가는 첫걸음이에요.",
      },
    ];
  },

  architect: (stats) => {
    const eco = stats.pluginCount + stats.mcpServerCount + stats.commandCount;
    return [
      {
        text: `${eco}개 구성요소를 유기적으로 연결한 아키텍처 설계 능력. 이건 상위 1%만 가능해요.`,
      },
      {
        text: stats.commandCount > 0
          ? `/${stats.commandNames.slice(0, 2).join(", /")} 등 커스텀 명령어까지 만든 건 '도구를 쓰는 사람'을 넘어 '플랫폼을 만드는 사람'이에요.`
          : "플러그인과 Hook을 조합해 자기만의 워크플로우를 구축. Claude Code의 가능성을 완전히 새로운 수준으로 끌어올린 사람.",
      },
      {
        text: `Hook ${stats.hookCount}개로 실수 방지 + 후처리를 동시에 자동화. 대부분은 기본 설정으로 쓰는 Claude Code를 완전히 다른 도구로 만들어버렸어요.`,
      },
    ];
  },

  daredevil: (stats) => [
    {
      text: "실행 속도가 압도적이에요. 아이디어에서 구현까지의 리드타임이 가장 짧은 유형. MVP 만들 때 최강.",
    },
    {
      text: `자동화 설정은 탄탄해요. ${stats.claudeMdLines}줄의 설정에서 자동화에 집중한 부분은 실제로 높은 효율을 만들고 있어요.`,
    },
    {
      text: "빠른 프로토타이핑과 실험에 최적화된 설정. 초기 스타트업에서 이 스타일은 진짜 가치 있어요.",
    },
  ],
};

export function generateStrengths(persona: PersonaKey, mdStats: MdStats): StrengthItem[] {
  const template = STRENGTH_TEMPLATES[persona];
  return template(mdStats);
}
