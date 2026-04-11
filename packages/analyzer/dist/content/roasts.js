/** 페르소나별 로스팅 템플릿 */
const ROAST_TEMPLATES = {
    "puppet-master": (stats) => [
        {
            text: "Claude 장애 공지 뜨면 심장 먼저 멈추는 사람",
            detail: stats.hookCount > 0
                ? `Hook ${stats.hookCount}개, MCP ${stats.mcpServerCount}개로 구축한 자동화 제국. 장애 복구 시간 동안 할 수 있는 일: 없음. 수동 대응 플랜: 없음.`
                : `자동화 키워드 ${stats.keywordHits?.automation ?? "수십"}개. 지금은 효율로 보이지만 Plan B 1줄이 없으면 그 효율이 리스크로 바뀌는 순간이 옵니다 — 장애 한 번이면 증명되는 종류의.`,
            color: "red",
        },
        {
            text: "당신이 만든 자동화의 유일한 독자는 3개월 후의 당신입니다",
            detail: stats.commandCount > 0
                ? `/${stats.commandNames.slice(0, 3).join(", /")} 등 ${stats.commandCount}개 명령어. 지금은 머리에 다 있겠지만, 3개월 후 본인한테 인수인계하려는 순간 '아 이거 왜 이렇게 했더라'가 옵니다. 과거의 본인도 타인이에요.`
                : `${stats.toolNames.slice(0, 3).join(", ")} 등 ${stats.toolNames.length}개 도구를 엮어놓은 이 시스템, 인수인계 대상이 미래의 본인이라고 생각해보세요. 그 순간 구조가 다르게 보입니다.`,
            color: "orange",
        },
        {
            text: "자동화 파이프라인 짜는 시간 > 절약하는 시간",
            detail: `${stats.claudeMdLines}줄짜리 설정 유지보수하는 데 쓰는 시간, 솔직히 세어본 적 없죠? 수동으로 하면 5분이면 끝날 일을 자동화하겠다고 3시간 쓴 적, 이번 주에만 몇 번이에요.`,
            color: "blue",
        },
    ],
    speedrunner: (stats) => [
        {
            text: "6개월 후의 자기 자신에게 테러하는 중",
            detail: `${stats.claudeMdLines}줄. 미래의 내가 이걸 보고 뭘 알 수 있을까요? '과거의 나는 대체 뭘 한 거지?' 이 말을 하게 될 겁니다.`,
            color: "red",
        },
        {
            text: "'대충 해도 되는 거 아니야?'가 인생 모토",
            detail: stats.sectionCount < 2
                ? "섹션 구분도 없어요. Claude한테 '알아서 해줘'는 가장 비싼 프롬프트입니다. 토큰비로 환산해보세요."
                : `섹션 ${stats.sectionCount}개뿐. 빠르게 쓴 건 알겠는데, Claude도 빠르게 잊어버려요.`,
            color: "orange",
        },
        {
            text: "설정 안 하는 게 설정이라고 우기는 타입",
            detail: `규칙 ${stats.ruleCount}개. 이 정도면 Claude가 매번 새 사람 만나는 기분일 거예요. 5분만 투자해서 역할 하나만 적어도 답변 퀄리티가 달라집니다.`,
            color: "blue",
        },
    ],
    fortress: (stats) => [
        {
            text: "API 키 유출되는 악몽 꿔본 적 있죠?",
            detail: stats.blocksDangerousOps
                ? `deny ${stats.denyCount}개에 rm -rf까지 차단. 대단한데, 이 규칙 만드는 데 쓴 시간으로 실제 코딩 얼마나 했어요?`
                : `보안 키워드 ${stats.keywordHits?.security ?? "다수"}회. 방어 본능은 훈련으로 만들기 어려운 감각이에요. 다만 이 에너지의 10%만 '해도 되는 것' 명시에 쓰면, 팀원이 당신한테 뭘 물어봐도 되는지 알게 됩니다.`,
            color: "red",
        },
        {
            text: stats.hookPromptCount > 0
                ? "Claude를 못 믿어서 Claude한테 검사 시키는 모순"
                : "보안 규칙이 기능 코드보다 많은 사람",
            detail: stats.hookPromptCount > 0
                ? `AI 판단 Hook ${stats.hookPromptCount}개. Claude가 코드를 쓰기 전에 Claude가 먼저 검사하는 구조... 이게 신뢰인가요, 불신인가요?`
                : `${stats.ruleCount}개 규칙 중 절반이 '하지 마라'입니다. Claude한테 할 수 있는 걸 알려주는 게 더 효율적이에요.`,
            color: "orange",
        },
        {
            text: "팀원이 .env 어딨냐고 물어보면 눈이 반짝이는 사람",
            detail: "보안 교육할 때 눈이 가장 빛나는 사람 — 팀에 꼭 있어야 하는 포지션이에요. 다만 너무 빛나면 후배가 '물어봐도 되나' 한 번 망설입니다. '좋은 질문이야' 한 마디가 당신의 보안 문화를 팀 전체로 퍼뜨려요.",
            color: "blue",
        },
    ],
    minimalist: (stats) => [
        {
            text: "'Claude야 알아서 해' — 가장 비싼 프롬프트",
            detail: stats.isExpandedInput
                ? `플러그인 ${stats.pluginCount}개 깔아놓고 CLAUDE.md는 ${stats.claudeMdLines}줄. 자동차는 샀는데 운전면허가 없는 격이에요.`
                : `${stats.claudeMdLines}줄. Claude가 매 세션 당신 취향 재추론하느라 독심술 쓰고 있어요 — 그 토큰비 합치면 밥값은 나옵니다. 한 줄 추가가 그대로 내 시간으로 돌아오는 거래.`,
            color: "red",
        },
        {
            text: "귀찮아서 안 쓴 건지, 뭘 써야 하는지 모르는 건지",
            detail: stats.toolNames.length === 0
                ? "도구 언급 0개. Claude Code를 ChatGPT처럼 쓰고 있어요. 터미널에서 실행하는 이유가 있거든요."
                : `도구 ${stats.toolNames.length}개만 적어놨네요. '나머지는 알아서 해줘'가 통하는 세상이 아닙니다.`,
            color: "orange",
        },
        {
            text: "CLAUDE.md 빈칸이 당신의 가능성을 잡아먹고 있어요",
            detail: `섹션 ${stats.sectionCount}개. 역할, 도구, 금지사항만 적어도 Claude의 답변 퀄리티가 2배는 올라요. 5분 투자, 매일 30분 절약.`,
            color: "blue",
        },
    ],
    collector: (stats) => {
        const totalEcosystem = stats.pluginCount + stats.mcpServerCount + stats.toolNames.length;
        return [
            {
                text: "도구함이 창고 수준인데 실제로 쓰는 건 3개",
                detail: stats.pluginCount > 0
                    ? `플러그인 ${stats.pluginCount}개, MCP ${stats.mcpServerCount}개, 도구 ${stats.toolNames.length}개. 이 중 이번 주에 실제로 쓴 거 손가락으로 꼽아보세요.`
                    : `${stats.toolNames.join(", ")} — 전부 CLAUDE.md에 적어놨는데, 마지막으로 직접 연동한 게 언제예요?`,
                color: "red",
            },
            {
                text: "새 도구 나오면 README부터 읽는 사람",
                detail: stats.pluginCount > 0
                    ? `${stats.pluginNames.slice(0, 3).join(", ")} 등... 깔아놓고 한 번 써보고 끝난 플러그인이 절반 이상이죠?`
                    : "도구 다양성 점수만 높고 자동화 점수는 바닥이에요. 수집이 취미지, 활용이 취미는 아니네요.",
                color: "orange",
            },
            {
                text: "구독료 합산해보면 눈물 나올 사람",
                detail: `${totalEcosystem > 0 ? totalEcosystem + "개" : stats.toolNames.length + "개"} 도구를 관리하는 데 쓰는 인지 비용, 계산해본 적 있어요? 도구 3개 빼면 생산성이 오히려 올라갈 수도 있습니다.`,
                color: "blue",
            },
        ];
    },
    legislator: (stats) => [
        {
            text: "CLAUDE.md가 사내 취업규칙보다 긴 사람",
            detail: `MUST ${stats.keywordHits?.control ?? "수십"}회 등장. 규칙을 만드는 게 일인지 취미인지 경계가 사라졌어요. Claude는 로봇이지 공무원이 아닙니다.`,
            color: "red",
        },
        {
            text: "규칙 100개 만들어놓고 Claude가 3개만 지키는 사람",
            detail: `${stats.ruleCount}개 규칙. 솔직히 이 중 Claude가 실제로 따르는 비율이 몇 %인지 확인해본 적 있어요? 규칙은 적을수록 지켜져요.`,
            color: "orange",
        },
        {
            text: "예외 규칙의 예외 규칙을 만들고 있는 자신을 발견한 적 있죠?",
            detail: "규칙이 많으면 충돌이 생기고, 충돌을 해결하려고 또 규칙을 만들고. 지금 법률 지옥도 한가운데 서 계신 거 아세요?",
            color: "blue",
        },
    ],
    craftsman: (stats) => [
        {
            text: "모든 게 적당한데, 그게 문제",
            detail: `${stats.claudeMdLines}줄, ${stats.sectionCount}섹션, ${stats.toolNames.length}개 도구. 모범생 답안지 같은 CLAUDE.md예요. 근데 모범생은 기억에 안 남아요.`,
            color: "red",
        },
        {
            text: "'무난하다'는 칭찬이 아닙니다",
            detail: "6개 차원이 다 비슷해요. 리스크를 안 지는 건 좋은데, 임팩트도 안 내고 있어요. 가장 인상적인 자동화가 뭐였는지 3초 안에 떠올릴 수 있어요?",
            color: "orange",
        },
        {
            text: "함께 일하면 편한데, 찾지는 않는 사람",
            detail: "안정적이고 균형 잡혀 있어서 불만은 없어요. 근데 '이 사람한테 꼭 물어봐야지'라고 떠올리진 않아요. 뾰족한 게 하나 필요해요.",
            color: "blue",
        },
    ],
    "deep-diver": (stats) => [
        {
            text: "한 우물을 파다가 지구 반대편에 도착한 사람",
            detail: `${stats.claudeMdLines}줄 중 특정 주제가 절반 이상이에요. 깊이는 인정하는데, 옆 우물에 뭐가 있는지는 관심 없으시죠?`,
            color: "red",
        },
        {
            text: "전문가와 집착의 차이를 아시나요?",
            detail: stats.hasMemory
                ? "memory, session, context 관리에 올인했군요. Claude 세션 끊기면 하루가 망가지는 수준이면 전문성이 아니라 의존성이에요."
                : "특정 자동화 하나에 소설 분량을 쏟았어요. 그 시간에 다른 영역 하나만 더 건드렸으면 10배 효율이었을 텐데.",
            color: "orange",
        },
        {
            text: "다른 사람이 당신의 CLAUDE.md를 읽으면 논문인 줄 알아요",
            detail: `도구 ${stats.toolNames.length}개뿐이면서 줄 수는 ${stats.claudeMdLines}줄. 한 영역에 500줄 쏟은 시간에 옆 영역 50줄만 건드렸어도 지금보다 3배 넓은 Claude가 됐을 거예요. 다음 주제 하나만 골라보세요.`,
            color: "blue",
        },
    ],
    evangelist: (stats) => [
        {
            text: "혼자 코딩할 때도 PR 올리는 사람",
            detail: `협업 키워드가 CLAUDE.md를 뒤덮고 있어요. 1인 프로젝트에서도 코드 리뷰를 Claude에게 시키고 있죠? 인정하세요.`,
            color: "red",
        },
        {
            text: "팀 프로세스 만드느라 정작 본인은 코딩 안 하는 사람",
            detail: `${stats.ruleCount}개 규칙 중 절반이 '팀원은 이렇게 하라'는 내용. Claude한테 시킨 건지 팀원한테 시킨 건지 구분이 안 돼요.`,
            color: "orange",
        },
        {
            text: "회의록 정리하는 자동화는 만들었는데, 회의를 줄이는 건 생각 안 해봤죠?",
            detail: `${stats.sectionCount}개 섹션에 협업 관련 내용이 가득. 프로세스를 만드는 건 좋은데, 그 프로세스가 진짜 생산성을 높이고 있는지 측정해본 적 있어요?`,
            color: "blue",
        },
    ],
    huggies: (stats) => {
        const eco = stats.pluginCount + stats.mcpServerCount + stats.commandCount;
        return [
            {
                text: "하네스 위에 올라타긴 했는데 고삐를 못 잡고 있어요",
                detail: `플러그인 ${stats.pluginCount}개, Hook ${stats.hookCount}개, 명령어 ${stats.commandCount}개. 숫자만 보면 그럴듯한데, 이 중 왜 이렇게 설정했는지 설명할 수 있는 게 몇 개예요?`,
                color: "red",
            },
            {
                text: "로데오 마스터 따라 하다가 낙마하는 타입",
                detail: `에코시스템 ${eco}개를 구축했는데, 솔직히 남이 쓰는 거 보고 따라 깐 거 절반 이상이죠? '일단 깔아보자'에서 '이게 뭐였지?'까지 3일이면 충분해요.`,
                color: "orange",
            },
            {
                text: "기저귀 단계라는 거 본인이 먼저 인정할 때 성장 속도가 2배 돼요",
                detail: "설정은 복잡한데 활용은 기본 수준 — 마치 레이싱 장비 풀세트로 동네 마트까지 운전하는 느낌이에요. 지금은 과하지만 6개월 뒤엔 딱 맞는 옷이 될 수도 있어요. 단, '이거 왜 깔았지?' 싶은 건 한 달에 한 개씩 빼보세요.",
                color: "blue",
            },
        ];
    },
    architect: (stats) => {
        const eco = stats.pluginCount + stats.mcpServerCount + stats.commandCount;
        return [
            {
                text: "Claude Code 위에 운영체제를 하나 더 올린 사람",
                detail: `플러그인 ${stats.pluginCount}개, MCP ${stats.mcpServerCount}개, 명령어 ${stats.commandCount}개, Hook ${stats.hookCount}개. 이걸 설명하려면 아키텍처 다이어그램이 필요해요. 그 다이어그램도 Claude한테 그리게 시키겠죠?`,
                color: "red",
            },
            {
                text: "Claude Code 업데이트 날 = 당신의 장애 대응 훈련 날",
                detail: `${eco}개 구성요소가 서로 엮여 있어서, breaking change 하나에 반나절 디버깅. 이미 여러 번 겪었죠?`,
                color: "orange",
            },
            {
                text: "이 설정을 인수인계 받을 사람이 불쌍합니다",
                detail: `이 복잡도를 이해하려면 최소 일주일이 필요해요. 본인도 3개월 전에 왜 이렇게 설정했는지 기억 못 하는 부분이 있잖아요.`,
                color: "blue",
            },
        ];
    },
    daredevil: (stats) => [
        {
            text: "사고 터지기 전까지는 팀에서 가장 빠른 사람",
            detail: stats.isExpandedInput
                ? `deny 규칙 ${stats.denyCount}개. ${stats.denyCount === 0 ? "Claude가 rm -rf 쳐도 막을 수 없는 구조예요. 이게 효율인가요, 도박인가요?" : "있긴 한데 보안 전체 점수가 바닥이에요."}`
                : `자동화 키워드 ${stats.keywordHits?.automation ?? "다수"}개 vs 보안 키워드 ${stats.keywordHits?.security ?? 0}개. 보험 없이 스카이다이빙하는 거예요.`,
            color: "red",
        },
        {
            text: stats.hookCount > 0 && !stats.blocksDangerousOps
                ? `Hook ${stats.hookCount}개 중 보안용 0개`
                : "'어차피 private repo잖아' — 유명한 마지막 말",
            detail: stats.hookCount > 0
                ? "Hook을 자동화에만 쓰고 보호에는 안 써요. 가스레인지는 쓸 줄 알면서 소화기는 없는 주방이에요."
                : "API 키를 환경변수에 넣긴 했는데, 보호 규칙이 0개예요. public repo로 전환하는 순간 끝나요.",
            color: "orange",
        },
        {
            text: "속도와 보안은 트레이드오프가 아닌데, 트레이드오프로 만들어버린 사람",
            detail: `deny 한 줄 추가하는 데 10초예요. 키 유출 사고 수습하는 데는 10시간이에요. 지금 10초 쓰세요.`,
            color: "blue",
        },
    ],
};
/**
 * 페르소나와 통계를 기반으로 3개의 로스팅을 생성한다
 */
export function generateRoasts(persona, mdStats) {
    const template = ROAST_TEMPLATES[persona];
    return template(mdStats);
}
//# sourceMappingURL=roasts.js.map