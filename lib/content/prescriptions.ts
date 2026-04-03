/**
 * 페르소나별 처방전 생성기
 * 보편적 체크 + 페르소나 특화 조언을 우선순위와 함께 생성한다
 */
import type { PersonaKey, MdStats, PrescriptionItem, QualityScores } from "@/lib/types";

/**
 * 우선순위 정렬 기준
 */
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * 보편적 점검 항목 — CLAUDE.md의 기본 요소 충족 여부를 확인한다
 */
function universalChecks(stats: MdStats): PrescriptionItem[] {
  const items: PrescriptionItem[] = [];

  // 컨텍스트 관리 미흡
  if (!stats.hasMemory) {
    items.push({
      text: "컨텍스트 관리 방법을 고민해보세요. `~/.claude/CLAUDE.md`에 사용자 선호도와 " +
        "프로젝트 맥락을 저장하면 매 대화마다 같은 설명을 반복하지 않아도 됩니다.",
      priority: "high",
    });
  }

  // 프로젝트 CLAUDE.md 없음
  if (!stats.hasProjectMd) {
    items.push({
      text: "프로젝트별 CLAUDE.md를 만드세요. 글로벌 설정과 프로젝트 설정을 분리하면 " +
        "각 프로젝트에 최적화된 컨텍스트를 제공할 수 있습니다.",
      priority: "medium",
    });
  }

  // 규칙이 너무 적음
  if (stats.ruleCount < 3) {
    items.push({
      text: "명확한 규칙을 추가하세요. Claude가 반드시 따라야 할 규칙(예: 언어, 코드 스타일, 금지 사항)을 " +
        "명시하면 일관성 있는 응답을 받을 수 있습니다.",
      priority: "medium",
    });
  }

  // 규칙이 너무 많음
  if (stats.ruleCount > 20) {
    items.push({
      text: "규칙이 20개 이상이면 Claude가 일부를 무시할 수 있습니다. " +
        "핵심 규칙만 남기고 나머지는 `.claude/rules/`로 분리하세요.",
      priority: "high",
    });
  }

  // 너무 짧음
  if (stats.claudeMdLines < 10) {
    items.push({
      text: "CLAUDE.md를 좀 더 채워주세요. 현재 너무 짧아 Claude가 맥락을 이해하기 어렵습니다. " +
        "최소한 역할, 언어, 주요 도구, 금지 사항 정도는 명시하는 것을 권장합니다.",
      priority: "high",
    });
  }

  // 너무 길음
  if (stats.claudeMdLines > 150) {
    items.push({
      text: "CLAUDE.md가 150줄을 넘었습니다. Claude가 모든 지시를 따르기 어려울 수 있으니 " +
        "`@import`나 `.claude/rules/` 분리를 검토하세요.",
      priority: "medium",
    });
  }

  // 구조화 부족
  if (stats.sectionCount < 2) {
    items.push({
      text: "섹션 헤더로 CLAUDE.md를 구조화하세요. `## 규칙`, `## 도구`, `## 태도` 등의 " +
        "섹션으로 나누면 Claude가 관련 정보를 더 쉽게 찾아 적용합니다.",
      priority: "medium",
    });
  }

  return items;
}

/** 페르소나 특화 처방전 */
const PERSONA_PRESCRIPTIONS: Record<PersonaKey, PrescriptionItem[]> = {
  "puppet-master": [
    {
      text: "자동화 파이프라인 다운타임 대응 계획을 CLAUDE.md에 추가하세요. " +
        "Claude 서버 장애나 API 오류 시 대안 워크플로우를 명시해두면 비상시 당황하지 않습니다.",
      priority: "high",
    },
    {
      text: "각 hook과 자동화 스크립트에 대한 간략한 설명을 CLAUDE.md에 포함하세요. " +
        "6개월 후의 나를 위한 가장 좋은 문서화입니다.",
      priority: "medium",
    },
    {
      text: "자동화 의존도를 분기별로 점검하세요. 어떤 작업이 자동화되고 있는지, " +
        "불필요하게 자동화된 것은 없는지 주기적으로 리뷰해 복잡성을 줄이세요.",
      priority: "low",
    },
  ],

  speedrunner: [
    {
      text: "지금 당장 CLAUDE.md에 사용하는 언어를 명시하세요. '한국어로 답변해줘' 한 줄만 추가해도 " +
        "영어 답변을 한국어로 바꾸는 추가 요청을 없앨 수 있습니다.",
      priority: "high",
    },
    {
      text: "자주 사용하는 도구와 스택을 CLAUDE.md에 적어두세요. " +
        "매번 'React 프로젝트야', 'TypeScript 써야 해'라고 말하는 건 시간 낭비입니다.",
      priority: "high",
    },
    {
      text: "금지 사항 3개만 추가해보세요. '무슨 말 해도 영어로 답변하지 마', " +
        "'파일 삭제 전 반드시 확인 물어봐' 정도면 큰 실수를 예방할 수 있습니다.",
      priority: "medium",
    },
  ],

  fortress: [
    {
      text: "보안 규칙과 업무 규칙을 분리해 섹션을 구성하세요. " +
        "현재 보안에 과도하게 집중되어 있어 Claude가 다른 맥락을 놓칠 수 있습니다.",
      priority: "medium",
    },
    {
      text: "각 보안 규칙에 '왜 이 규칙이 필요한지' 배경을 한 줄씩 추가하세요. " +
        "Claude가 예외 상황을 판단할 때 의도를 파악하는 데 도움이 됩니다.",
      priority: "medium",
    },
    {
      text: "협업 관련 규칙도 추가해보세요. 보안만큼이나 팀원과의 커뮤니케이션 스타일, " +
        "코드 리뷰 규칙 등을 CLAUDE.md에 담으면 Claude가 더 입체적으로 돕습니다.",
      priority: "low",
    },
  ],

  minimalist: [
    {
      text: "역할 정의를 추가하세요. '나는 HR Lead다', '나는 풀스택 개발자다' 한 문장이 " +
        "Claude의 답변 방향을 완전히 바꿉니다. 지금 당장 추가하세요.",
      priority: "high",
    },
    {
      text: "주로 사용하는 도구 3~5개를 나열해두세요. Slack, Notion, GitHub 등 " +
        "자주 언급하는 도구를 미리 명시하면 매번 설명하는 수고를 덜 수 있습니다.",
      priority: "high",
    },
    {
      text: "응답 스타일 선호도를 명시하세요. 간결하게 vs. 상세하게, " +
        "코드 먼저 vs. 설명 먼저 — 이 차이만으로도 Claude 활용도가 크게 달라집니다.",
      priority: "medium",
    },
  ],

  collector: [
    {
      text: "도구별 사용 목적을 CLAUDE.md에 명시하세요. " +
        "Slack은 소통, Notion은 문서화, GitHub은 코드 관리 — 이 맥락을 Claude가 알면 " +
        "더 적절한 도구 활용을 제안받을 수 있습니다.",
      priority: "medium",
    },
    {
      text: "도구 중 자동화할 수 있는 것을 파악해 hook으로 연결해보세요. " +
        "수집만 하는 것보다 연결하는 것이 실질적인 효율을 만들어냅니다.",
      priority: "high",
    },
    {
      text: "자주 사용하지 않는 도구는 CLAUDE.md에서 빼세요. " +
        "너무 많은 도구 목록은 Claude를 혼란스럽게 하고 정작 중요한 도구를 놓치게 합니다.",
      priority: "low",
    },
  ],

  legislator: [
    {
      text: "규칙의 우선순위를 명시하세요. 모든 규칙이 동등하면 Claude가 충돌 상황에서 " +
        "어떤 규칙을 따라야 할지 판단하기 어렵습니다. '이 규칙은 다른 모든 것보다 우선한다'는 식으로 명확히 하세요.",
      priority: "high",
    },
    {
      text: "규칙보다 맥락을 더 제공해보세요. '왜 이 규칙인가'를 Claude가 이해하면 " +
        "명시되지 않은 상황에서도 의도에 맞는 판단을 할 수 있습니다.",
      priority: "medium",
    },
    {
      text: "분기별로 규칙을 리뷰하고 더 이상 필요 없는 규칙을 정리하세요. " +
        "규칙이 너무 많으면 모순이 생기고 Claude의 일관성이 떨어집니다.",
      priority: "medium",
    },
  ],

  craftsman: [
    {
      text: "특기 분야를 하나 골라 깊이 있게 설정해보세요. 균형도 좋지만 " +
        "한 영역의 전문성이 두드러지면 Claude로부터 더 수준 높은 도움을 받을 수 있습니다.",
      priority: "medium",
    },
    {
      text: "현재 진행 중인 프로젝트를 CLAUDE.md에 기록해두세요. " +
        "컨텍스트가 풍부할수록 Claude가 더 관련성 높은 제안을 합니다.",
      priority: "medium",
    },
    {
      text: "응답 형식에 대한 선호를 더 구체적으로 명시해보세요. " +
        "마크다운 표 vs. 불릿 리스트, 코드 예시 포함 여부 등 취향을 알수록 Claude가 더 잘 맞춰줍니다.",
      priority: "low",
    },
  ],

  "deep-diver": [
    {
      text: "현재 집중하는 영역 외에 기본 업무 맥락도 CLAUDE.md에 추가하세요. " +
        "Claude가 한 가지만 잘 아는 사람으로 인식하면 다른 분야에서 부정확한 답변을 할 수 있습니다.",
      priority: "high",
    },
    {
      text: "사용하는 도구 범위를 조금 넓혀보세요. 깊이도 중요하지만 " +
        "연관 도구를 추가하면 시너지가 생겨 더 강력한 워크플로우를 구성할 수 있습니다.",
      priority: "medium",
    },
    {
      text: "협업 관련 규칙을 추가해보세요. 혼자만 쓰는 CLAUDE.md는 개인 최적화에 머물지만, " +
        "팀과 공유 가능한 설정을 만들면 영향력이 팀 전체로 확장됩니다.",
      priority: "low",
    },
  ],

  evangelist: [
    {
      text: "개인 작업 효율을 높이는 자동화도 추가해보세요. " +
        "협업 규칙은 훌륭하지만, 본인의 반복 작업을 줄이는 hook이나 커스텀 명령어가 없으면 " +
        "남 챙기느라 정작 본인은 비효율적으로 일하고 있을 수 있습니다.",
      priority: "high",
    },
    {
      text: "보안 규칙도 팀 관점에서 추가해보세요. " +
        "PR 규칙은 있는데 API 키 관리 규칙이 없으면, 팀원의 실수를 미리 잡을 기회를 놓칩니다.",
      priority: "medium",
    },
    {
      text: "협업 규칙의 '왜'를 적어두세요. 규칙만 나열하면 Claude가 예외 상황을 판단하기 어렵습니다. " +
        "'이 규칙은 지난 스프린트 머지 충돌 때문에 만들었다' 같은 맥락이 중요합니다.",
      priority: "medium",
    },
  ],

  huggies: [
    {
      text: "지금 깔려있는 플러그인과 Hook을 하나씩 설명해보세요. 설명 못 하는 건 필요 없는 거예요. " +
        "정리하면 오히려 시스템이 안정적으로 돌아갑니다.",
      priority: "high",
    },
    {
      text: "로데오 마스터가 되려면 '왜 이 설정인가'를 적어두세요. " +
        "각 Hook과 명령어에 주석 한 줄만 추가해도 3개월 후 본인이 감사합니다.",
      priority: "medium",
    },
    {
      text: "한 번에 다 만들려고 하지 마세요. 가장 자주 하는 작업 하나를 완벽하게 자동화한 뒤, " +
        "그 다음으로 넘어가세요. 기저귀를 떼려면 한 발씩.",
      priority: "medium",
    },
  ],

  architect: [
    {
      text: "생태계 구성도(아키텍처 다이어그램)를 CLAUDE.md에 추가하세요. " +
        "플러그인, Hook, MCP가 어떻게 연결되는지 한눈에 보이면 유지보수와 인수인계가 쉬워집니다.",
      priority: "high",
    },
    {
      text: "각 플러그인/Hook의 역할을 한 줄씩 설명해두세요. " +
        "6개월 후의 나를 위한 문서화입니다. 지금 기억나는 게 나중에는 안 떠오릅니다.",
      priority: "medium",
    },
    {
      text: "분기별로 사용하지 않는 플러그인이나 Hook을 정리하세요. " +
        "생태계가 복잡할수록 불필요한 구성요소가 성능과 안정성을 떨어뜨립니다.",
      priority: "low",
    },
  ],

  macgyver: [
    {
      text: "MCP 서버 1~2개만 연동해보세요. Slack이나 Notion을 MCP로 연결하면 " +
        "curl로 짜던 스크립트가 한 줄로 줄어듭니다. 도구를 쓰는 것도 실력입니다.",
      priority: "high",
    },
    {
      text: "자동화 스크립트에 주석을 추가하세요. " +
        "본인만 이해하는 셸 스크립트는 6개월 후 본인에게도 암호문이 됩니다.",
      priority: "medium",
    },
    {
      text: "플러그인을 하나만 써보세요. superpowers나 hookify 같은 플러그인은 " +
        "직접 스크립트 짜는 것보다 안정적이고 커뮤니티가 유지보수해줍니다.",
      priority: "medium",
    },
  ],

  daredevil: [
    {
      text: "지금 당장 .env 보호 규칙을 CLAUDE.md에 추가하세요. " +
        "'절대 .env 파일을 커밋하지 마라' 한 줄이면 됩니다. 이것만으로도 대형 사고를 예방합니다.",
      priority: "high",
    },
    {
      text: "PreToolUse hook으로 민감 파일 수정을 차단하세요. " +
        "settings.json에 hook 하나 추가하면 Claude가 .env를 건드리려 할 때 자동으로 막아줍니다.",
      priority: "high",
    },
    {
      text: "API 키는 반드시 환경변수로 분리하고, CLAUDE.md에 이 규칙을 명시하세요. " +
        "코드에 키를 하드코딩하는 습관은 public repo 전환 시 재앙이 됩니다.",
      priority: "medium",
    },
  ],
};

/**
 * 품질 기반 처방전 — md력 점수의 약한 차원에 대한 개선 조언
 */
function qualityChecks(quality: QualityScores, stats: MdStats): PrescriptionItem[] {
  const items: PrescriptionItem[] = [];

  if (quality.actionability < 30) {
    items.push({
      text: "빌드/테스트/린트 실행 명령어를 백틱으로 감싸서 추가하세요. " +
        "`npm run test`, `bun build` 같은 구체적 명령어가 있어야 Claude가 바로 실행할 수 있습니다.",
      priority: "high",
    });
  }

  if (quality.conciseness < 30 && stats.claudeMdLines > 150) {
    items.push({
      text: "CLAUDE.md가 " + stats.claudeMdLines + "줄입니다. 모델이 안정적으로 따르는 지시는 ~150개가 한계입니다. " +
        "핵심만 남기고 나머지는 @import나 .claude/rules/로 분리하세요.",
      priority: "high",
    });
  }

  if (quality.conciseness < 40 && stats.claudeMdLines <= 150) {
    items.push({
      text: "'clean code 작성' 같은 뻔한 지시나 린터가 처리할 스타일 규칙이 있다면 삭제하세요. " +
        "Claude는 이미 알고 있거나, 린터가 더 잘합니다.",
      priority: "medium",
    });
  }

  if (quality.structure < 30) {
    items.push({
      text: "## Commands, ## Architecture, ## Rules 같은 섹션 헤딩으로 구조화하세요. " +
        "Claude가 관련 정보를 빠르게 찾아 적용합니다.",
      priority: "medium",
    });
  }

  if (quality.uniqueness < 30) {
    items.push({
      text: "코드만 봐서는 모르는 프로젝트 고유 정보를 추가하세요. " +
        "예: '이 모듈은 레거시라 수정 금지', 'Redis는 캐싱용만', 'PR은 반드시 1명 이상 리뷰'",
      priority: "medium",
    });
  }

  if (quality.safety < 20) {
    items.push({
      text: "가드레일을 추가하세요. '.env 커밋 절대 금지', '변경 후 반드시 typecheck 실행' 같은 " +
        "규칙이 Claude의 위험한 실수를 방지합니다.",
      priority: "high",
    });
  }

  return items;
}

/**
 * 페르소나와 통계를 기반으로 처방전을 생성한다
 * 보편적 체크 + 품질 체크 + 페르소나 특화 조언을 우선순위 순으로 정렬해 반환한다
 * @param persona 페르소나 키
 * @param mdStats CLAUDE.md 통계
 * @param qualityScores 품질 점수 (optional — 하위호환)
 * @returns 우선순위 순 PrescriptionItem 배열
 */
export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores?: QualityScores,
): PrescriptionItem[] {
  const universal = universalChecks(mdStats);
  const quality = qualityScores ? qualityChecks(qualityScores, mdStats) : [];
  const specific = PERSONA_PRESCRIPTIONS[persona];

  const all = [...universal, ...quality, ...specific];

  // 우선순위 순으로 정렬: high → medium → low
  all.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return all;
}
