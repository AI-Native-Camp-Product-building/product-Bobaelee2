/**
 * 페르소나별 로스팅 생성기
 * 발칙하고 찌르지만 웃긴 한국어 로스팅 텍스트를 동적으로 생성한다
 */
import type { PersonaKey, MdStats, RoastItem } from "@/lib/types";

type RoastTemplate = (stats: MdStats) => RoastItem[];

/** 페르소나별 로스팅 템플릿 */
const ROAST_TEMPLATES: Record<PersonaKey, RoastTemplate> = {
  "puppet-master": (stats) => [
    {
      text: "자동화가 삶의 목적이 된 사람",
      detail: `CLAUDE.md에 hook이 ${stats.keywordHits?.automation ?? "수십"} 번 이상 등장합니다. ` +
        "혹시 본인이 Claude의 주인인지, Claude 파이프라인의 노예인지 헷갈리신 적 없나요?",
      color: "red",
    },
    {
      text: `${stats.toolNames.length}개 도구를 연결한 사람`,
      detail: `${stats.toolNames.slice(0, 3).join(", ")} 등 ${stats.toolNames.length}개 도구를 연동했군요. ` +
        "이 중 마지막으로 직접 손으로 뭔가를 처리한 게 언제인지 기억하시나요?",
      color: "orange",
    },
    {
      text: "Claude가 없으면 아무것도 못 하는 구조",
      detail: `${stats.totalLines}줄짜리 CLAUDE.md로 구축한 자동화 제국. ` +
        "Claude 서버 장애 날 때 본인은 뭐 하실 건가요? 그냥 퇴근?",
      color: "blue",
    },
  ],

  speedrunner: (stats) => [
    {
      text: "문서화라는 단어를 들어본 적 있나요?",
      detail: `고작 ${stats.totalLines}줄. 이게 전부입니다. ` +
        "6개월 후 본인이 이 CLAUDE.md를 보고 이게 뭔지 이해할 수 있을까요?",
      color: "red",
    },
    {
      text: "섹션이 없다 = 생각이 없다?",
      detail: stats.sectionCount < 2
        ? "헤더 구조가 거의 없네요. CLAUDE.md도 바닥에 던져두고 나중에 주우면 된다는 주의신가요?"
        : `섹션이 ${stats.sectionCount}개뿐이에요. 빠르게 쓴 건 알겠는데, Claude도 빠르게 잊어버립니다.`,
      color: "orange",
    },
    {
      text: "규칙 없음 = 카오스",
      detail: stats.ruleCount === 0
        ? "규칙이 0개입니다. Claude에게 '알아서 해줘'는 가장 비싼 선택입니다."
        : `규칙이 ${stats.ruleCount}개뿐이에요. 이 정도면 Claude가 여러분을 설정하는 게 아니라 Claude가 여러분을 설정하는 겁니다.`,
      color: "blue",
    },
  ],

  fortress: (stats) => [
    {
      text: ".env가 꿈에 나온다",
      detail: `보안 관련 언급이 ${stats.keywordHits?.security ?? "다수"} 회나 됩니다. ` +
        "혹시 잠자리에 들기 전 API 키가 안전한지 한 번 더 확인하시나요?",
      color: "red",
    },
    {
      text: "규칙이 코드보다 많은 CLAUDE.md",
      detail: `${stats.ruleCount}개의 규칙... 이 중 몇 개가 실제로 지켜지고 있나요? ` +
        "헌법은 만들었는데 국민(Claude)이 읽었는지는 모르는 상황.",
      color: "orange",
    },
    {
      text: "팀원들도 무서워하는 보안 담당자",
      detail: `절대 금지가 ${stats.keywordHits?.control ?? "여러 번"} 번 이상 등장합니다. ` +
        "팀 회식에서도 '이 가게 보안 괜찮아요?'라고 물어보신 적 있죠?",
      color: "blue",
    },
  ],

  minimalist: (stats) => [
    {
      text: "이게 전부라고요?",
      detail: `${stats.totalLines}줄. 이걸로 Claude한테 뭘 시키실 건가요? ` +
        "'알아서 해줘'는 가장 많은 토큰을 소모하는 지시입니다.",
      color: "red",
    },
    {
      text: "도구를 안 쓰는 건지, 모르는 건지",
      detail: stats.toolNames.length === 0
        ? "도구 언급이 없습니다. Claude Code를 메모장처럼 쓰고 계신 건 아닌가요?"
        : `${stats.toolNames.length}개 도구만 있네요. 더 연결하면 더 강력해지는데 귀찮으신가요?`,
      color: "orange",
    },
    {
      text: "3줄 CLAUDE.md의 용기",
      detail: `섹션도 ${stats.sectionCount}개뿐이에요. ` +
        "간결함인지 포기인지는 모르겠지만, Claude는 지금 방향을 잃고 표류 중입니다.",
      color: "blue",
    },
  ],

  collector: (stats) => [
    {
      text: `${stats.toolNames.length}개 도구를 쌓아둔 창고 주인`,
      detail: `${stats.toolNames.join(", ")} — 이 중 오늘 실제로 쓴 게 몇 개인가요? ` +
        "수집과 활용은 다른 것입니다.",
      color: "red",
    },
    {
      text: "새 툴 나오면 무조건 써보는 병",
      detail: `도구 다양성 점수가 매우 높네요. ` +
        `연동은 했는데 ${stats.toolNames.length}개 중 실제로 자동화된 건 몇 개인가요?`,
      color: "orange",
    },
    {
      text: "플러그인이 많을수록 생산성이 높다는 착각",
      detail: "도구함이 가득 차 있으면 뭔가 열심히 하는 것 같은 느낌이 드는 게 맞긴 해요. " +
        "근데 실제로 처리된 태스크 수는요?",
      color: "blue",
    },
  ],

  legislator: (stats) => [
    {
      text: "Claude에게 헌법을 부여한 사람",
      detail: `MUST, NEVER, ALWAYS, CRITICAL, IMPORTANT가 ${stats.keywordHits?.control ?? "수십"} 번 등장합니다. ` +
        "Claude가 규칙을 어겼을 때 실제로 속상하신 적 있나요?",
      color: "red",
    },
    {
      text: `${stats.ruleCount}개 규칙의 제왕`,
      detail: `${stats.ruleCount}개의 규칙... 이 중 Claude가 실제로 지키는 건 몇 퍼센트일까요? ` +
        "법은 많을수록 지키기 어렵다는 사실, 알고 계신가요?",
      color: "orange",
    },
    {
      text: "팀원보다 Claude 단속에 더 열심",
      detail: "CLAUDE.md 통제 지수가 매우 높습니다. " +
        "Claude뿐 아니라 팀원들도 당신과 대화할 때 조심하고 있을 수 있어요.",
      color: "blue",
    },
  ],

  craftsman: (stats) => [
    {
      text: "튀는 것 없는 평균의 함정",
      detail: `${stats.totalLines}줄, ${stats.sectionCount}섹션, ${stats.toolNames.length}개 도구. ` +
        "모든 게 적당합니다. 근데 '적당함'이 위대함이 되진 않죠.",
      color: "red",
    },
    {
      text: "균형을 잡았지만 임팩트가 없는 사람",
      detail: "6개 차원이 모두 비슷한 수준입니다. 안정적이긴 한데, " +
        "Claude한테 시킨 것 중 가장 인상적인 게 뭔지 바로 떠오르시나요?",
      color: "orange",
    },
    {
      text: "조용하고 무난한 게 전부인가요?",
      detail: "뾰족한 강점이 없으면 기억에 남지 않습니다. " +
        "당신의 CLAUDE.md는 지금 Claude에게 '그냥 대충 잘 해줘'라고 말하고 있습니다.",
      color: "blue",
    },
  ],

  "deep-diver": (stats) => [
    {
      text: "한 우물만 파다 지하 5층 도달",
      detail: `${stats.totalLines}줄 중 특정 주제에 과도하게 집중되어 있습니다. ` +
        "깊이는 좋은데 너비가 없으면 Claude도 한쪽으로만 달립니다.",
      color: "red",
    },
    {
      text: "전문성과 집착의 경계선",
      detail: stats.hasMemory
        ? "memory, session, context 관리에 엄청난 공을 들였군요. 혹시 Claude 세션이 끊기면 하루가 망가지나요?"
        : "특정 자동화에 극도로 집중한 CLAUDE.md입니다. 다른 영역은 아예 생략했네요.",
      color: "orange",
    },
    {
      text: "넓은 세상을 본 적이 있나요?",
      detail: `도구 수가 ${stats.toolNames.length}개에 그칩니다. ` +
        "우물 밖에도 넓은 세상이 있습니다. 가끔은 다른 도구도 써보세요.",
      color: "blue",
    },
  ],
};

/**
 * 페르소나와 통계를 기반으로 3개의 로스팅을 생성한다
 * @param persona 페르소나 키
 * @param mdStats CLAUDE.md 통계
 * @returns 3개의 RoastItem 배열
 */
export function generateRoasts(persona: PersonaKey, mdStats: MdStats): RoastItem[] {
  const template = ROAST_TEMPLATES[persona];
  return template(mdStats);
}
