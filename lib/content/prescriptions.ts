/**
 * 조건부 처방전 시스템
 * ConditionalPrescription 기반으로 페르소나 × 품질 × 통계를 교차해
 * 항상 정확히 5개의 처방전을 선택한다
 */
import type {
  PersonaKey,
  MdStats,
  PrescriptionItem,
  QualityScores,
  DimensionScores,
  ConditionalPrescription,
} from "@/lib/types";
import { isNonDevProfile } from "@/lib/analyzer/scorer";

// ─── 우선순위 정렬 기준 ────────────────────────────────
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

// ─── 시그니처 처방전 (12개, 페르소나별 1개) ─────────────

const SIGNATURE_PRESCRIPTIONS: ConditionalPrescription[] = [
  {
    id: "sig-minimalist",
    text: "Claude에게 맡기고 싶으면, 최소한 '이것만은 하지 마'를 3개 적으세요. 자유에도 울타리가 필요합니다.",
    priority: "high",
    tag: "sig:minimalist",
    tier: "signature",
    condition: (persona) => persona === "minimalist",
  },
  {
    id: "sig-speedrunner",
    text: "지금 속도로 6개월 뒤에도 유지 가능한지 자문해보세요. 빠른 건 좋지만 방향이 먼저입니다.",
    priority: "high",
    tag: "sig:speedrunner",
    tier: "signature",
    condition: (persona) => persona === "speedrunner",
  },
  {
    id: "sig-puppet-master",
    text: "자동화 워크플로우 중 Claude 없이도 돌아가는 것이 몇 개인가요? 의존도를 점검하고 Plan B를 만드세요.",
    priority: "high",
    tag: "sig:puppet-master",
    tier: "signature",
    condition: (persona) => persona === "puppet-master",
  },
  {
    id: "sig-fortress",
    text: "보안 규칙을 실제로 Claude가 위반하면 어떻게 되는지 테스트해보세요. 훈련 없는 방어는 종이벽입니다.",
    priority: "high",
    tag: "sig:fortress",
    tier: "signature",
    condition: (persona) => persona === "fortress",
  },
  {
    id: "sig-legislator",
    text: "규칙 중 최근 6개월간 실제로 위반이 감지된 것만 남기고 나머지는 주석 처리하세요. 안 지켜지는 규칙은 노이즈입니다.",
    priority: "high",
    tag: "sig:legislator",
    tier: "signature",
    condition: (persona) => persona === "legislator",
  },
  {
    id: "sig-evangelist",
    text: "팀원 1명에게 당신의 설정 문서를 보여주고 '이해되나요?'라고 물어보세요. 읽히지 않는 문서는 독백입니다.",
    priority: "high",
    tag: "sig:evangelist",
    tier: "signature",
    condition: (persona) => persona === "evangelist",
  },
  {
    id: "sig-collector",
    text: "연결한 도구 중 최근 30일 내 실제 사용한 것을 세어보세요. 안 쓰는 도구는 노이즈입니다.",
    priority: "high",
    tag: "sig:collector",
    tier: "signature",
    condition: (persona) => persona === "collector",
  },
  {
    id: "sig-daredevil",
    text: "지금 당장 `.env 커밋 절대 금지` 한 줄을 추가하세요. 10초 투자로 10시간 사고 수습을 예방합니다.",
    priority: "high",
    tag: "sig:daredevil",
    tier: "signature",
    condition: (persona) => persona === "daredevil",
  },
  {
    id: "sig-craftsman",
    text: "뾰족한 전문 분야 하나를 골라서 깊이 설정해보세요. 균형도 좋지만 한 영역의 전문성이 Claude 활용도를 크게 올립니다.",
    priority: "high",
    tag: "sig:craftsman",
    tier: "signature",
    condition: (persona) => persona === "craftsman",
  },
  {
    id: "sig-deep-diver",
    text: "집중 영역 외에 기본 업무 맥락도 설정 문서에 추가하세요. 한 가지만 아는 사람으로 인식되면 다른 분야에서 부정확한 답변이 나옵니다.",
    priority: "high",
    tag: "sig:deep-diver",
    tier: "signature",
    condition: (persona) => persona === "deep-diver",
  },
  {
    id: "sig-architect",
    text: "생태계 구성도를 설정 문서에 추가하세요. 플러그인, Hook, MCP가 어떻게 연결되는지 한눈에 보이면 유지보수와 인수인계가 쉬워집니다.",
    priority: "high",
    tag: "sig:architect",
    tier: "signature",
    condition: (persona) => persona === "architect",
  },
  {
    id: "sig-huggies",
    text: "지금 깔려있는 플러그인과 Hook을 하나씩 설명해보세요. 설명 못 하는 건 필요 없는 거예요.",
    priority: "high",
    tag: "sig:huggies",
    tier: "signature",
    condition: (persona) => persona === "huggies",
  },
];

// ─── 차원별 처방전 (페르소나 특화 + 제네릭) ──────────────

const DIMENSIONAL_PRESCRIPTIONS: ConditionalPrescription[] = [
  // actionability — 페르소나 특화 (fortress)
  {
    id: "dim-fortress-action",
    text: "보안 규칙은 완벽한데 빌드 명령어가 없어요. .env 지키면서 `npm run test`도 적어두세요.",
    priority: "high",
    tag: "dim:actionability",
    tier: "dimensional",
    condition: (persona, _stats, quality) =>
      persona === "fortress" && quality.actionability < 30,
  },
  // actionability — 제네릭
  {
    id: "dim-action-backtick",
    text: "빌드/테스트/린트 실행 명령어를 백틱으로 감싸서 추가하세요. Claude가 바로 실행할 수 있게.",
    priority: "high",
    tag: "dim:actionability",
    tier: "dimensional",
    condition: (_persona, _stats, quality) => quality.actionability < 30,
  },

  // conciseness — 길이 초과
  {
    id: "dim-concise-split",
    text: "설정 문서가 150줄을 넘으면 `.claude/rules/`로 분리하세요. 모델이 안정적으로 따르는 지시는 약 150~200개입니다.",
    priority: "high",
    tag: "dim:conciseness",
    tier: "dimensional",
    condition: (_persona, stats, quality) =>
      quality.conciseness < 30 && stats.totalLines > 150,
  },
  // conciseness — 노이즈 (자율 에이전트 맥락이면 가드레일이므로 제외)
  {
    id: "dim-concise-noise",
    text: "'clean code 작성', 'DRY 원칙' 같은 뻔한 지시를 삭제하세요. Claude는 이미 알고 있거나, 린터가 더 잘합니다.",
    priority: "medium",
    tag: "dim:conciseness-noise",
    tier: "dimensional",
    condition: (_persona, _stats, quality, scores) =>
      quality.conciseness < 40 && scores.agentOrchestration < 30,
  },
  // conciseness — 자율 에이전트 맥락에서는 가드레일 강화 권장
  {
    id: "dim-agent-guardrail",
    text: "자율 에이전트 설정이 감지됩니다. '뻔한 지시'처럼 보여도 에이전트 가드레일로 기능합니다. 삭제하지 말고, stop condition과 rollback 규칙을 더 추가하세요.",
    priority: "medium",
    tag: "dim:conciseness-noise",
    tier: "dimensional",
    condition: (_persona, _stats, quality, scores) =>
      quality.conciseness < 40 && scores.agentOrchestration >= 30,
  },

  // agentOrchestration — 높은 성숙도
  {
    id: "dim-agent-high",
    text: "에이전트 오케스트레이션 역량이 높습니다. 이터레이션 간 학습 구조(progress.txt, 패턴 축적)를 정기적으로 정리하면 효율이 더 올라갑니다.",
    priority: "low",
    tag: "dim:agentOrchestration",
    tier: "dimensional",
    condition: (_persona, _stats, _quality, scores) =>
      scores.agentOrchestration >= 60,
  },
  // agentOrchestration — 중간 (도입기)
  {
    id: "dim-agent-mid",
    text: "자율 에이전트 설정 흔적이 있습니다. stop condition, 에러 복구 프로토콜, 스코프 제한('한 번에 하나씩')을 명시하면 안정성이 크게 올라갑니다.",
    priority: "medium",
    tag: "dim:agentOrchestration",
    tier: "dimensional",
    condition: (_persona, _stats, _quality, scores) =>
      scores.agentOrchestration >= 20 && scores.agentOrchestration < 60,
  },

  // structure — 페르소나 특화 (legislator)
  {
    id: "dim-legislator-structure",
    text: "규칙은 많은데 프로젝트 고유 맥락이 없어요. 왜 이 규칙인지 배경을 한 줄씩 추가하세요.",
    priority: "high",
    tag: "dim:structure",
    tier: "dimensional",
    condition: (persona, _stats, quality) =>
      persona === "legislator" && quality.structure < 30,
  },
  // structure — 제네릭
  {
    id: "dim-structure-heading",
    text: "## Commands, ## Architecture 같은 섹션 헤딩으로 설정 문서를 구조화하세요.",
    priority: "medium",
    tag: "dim:structure",
    tier: "dimensional",
    condition: (_persona, _stats, quality) => quality.structure < 30,
  },

  // uniqueness — 제네릭
  {
    id: "dim-uniqueness-context",
    text: "코드만 봐서는 모르는 프로젝트 고유 정보를 추가하세요. '이 모듈은 레거시라 수정 금지', 'Redis는 캐싱용만' 같은 맥락.",
    priority: "medium",
    tag: "dim:uniqueness",
    tier: "dimensional",
    condition: (_persona, _stats, quality) => quality.uniqueness < 30,
  },

  // safety — 페르소나 특화 (daredevil)
  {
    id: "dim-daredevil-safety",
    text: "PreToolUse hook으로 민감 파일 수정을 차단하세요. settings.json에 hook 하나면 .env를 건드리려 할 때 자동으로 막아줍니다.",
    priority: "high",
    tag: "dim:safety",
    tier: "dimensional",
    condition: (persona, _stats, quality) =>
      persona === "daredevil" && quality.safety < 20,
  },
  // safety — 제네릭
  {
    id: "dim-safety-guardrail",
    text: "'.env 커밋 절대 금지' 같은 가드레일을 추가하세요. 이 한 줄이 대형 사고를 예방합니다.",
    priority: "high",
    tag: "dim:safety",
    tier: "dimensional",
    condition: (_persona, _stats, quality) => quality.safety < 20,
  },

  // teamImpact — 페르소나 특화 (puppet-master)
  {
    id: "dim-puppet-team",
    text: "팀원이 사용할 수 있도록 자동화 README를 추가하세요. 본인만 이해하는 시스템은 레거시의 시작입니다.",
    priority: "high",
    tag: "dim:teamImpact",
    tier: "dimensional",
    condition: (persona, _stats, _quality, scores) =>
      persona === "puppet-master" && scores.teamImpact < 30,
  },
  // teamImpact — 제네릭
  {
    id: "dim-team-collab",
    text: "협업 관련 규칙을 추가해보세요. 커뮤니케이션 스타일, 코드 리뷰 규칙 등을 설정 문서에 담으면 AI가 더 입체적으로 돕습니다.",
    priority: "medium",
    tag: "dim:teamImpact",
    tier: "dimensional",
    condition: (_persona, _stats, _quality, scores) => scores.teamImpact < 30,
  },
];

// ─── 공통 처방전 (보편적 조언) ──────────────────────────

const COMMON_PRESCRIPTIONS: ConditionalPrescription[] = [
  {
    id: "common-context",
    text: "설정 파일에 사용자 선호도와 프로젝트 맥락을 저장하면 매 대화마다 같은 설명을 반복하지 않아도 됩니다.",
    priority: "high",
    tag: "common:context",
    tier: "common",
    condition: (_persona, stats) => !stats.hasMemory && !stats.hasProjectMd,
  },
  {
    id: "common-role",
    text: "역할 정의를 추가하세요. '나는 백엔드 개발자다', '나는 PM이다' 한 문장이 Claude의 답변 방향을 완전히 바꿉니다.",
    priority: "high",
    tag: "common:role",
    tier: "common",
    // 줄 수가 아닌 역할 키워드 존재 여부로 판단 (글로벌 md는 짧고 프로젝트 md에 역할을 넣는 전략도 유효)
    condition: (_persona, stats) => !stats.hasRoleDefinition,
  },
  {
    id: "common-tools",
    text: "주로 사용하는 도구 3~5개를 나열해두세요. 매번 'React 프로젝트야'라고 말하는 건 시간 낭비입니다.",
    priority: "medium",
    tag: "common:tools",
    tier: "common",
    condition: (_persona, stats) => stats.toolNames.length < 2,
  },
  {
    id: "common-rules",
    text: "금지 사항 3개만 추가해보세요. '무슨 말 해도 영어로 답변하지 마', '파일 삭제 전 반드시 확인 물어봐' 정도면 큰 실수를 예방합니다.",
    priority: "medium",
    tag: "common:rules",
    tier: "common",
    condition: (_persona, stats) => stats.ruleCount < 2,
  },
];

// ─── 전체 처방전 배열 ───────────────────────────────────

const ALL_PRESCRIPTIONS: ConditionalPrescription[] = [
  ...SIGNATURE_PRESCRIPTIONS,
  ...DIMENSIONAL_PRESCRIPTIONS,
  ...COMMON_PRESCRIPTIONS,
];

// ─── 선택 알고리즘 ─────────────────────────────────────

/**
 * 조건을 만족하는 처방전 중 5개를 티어 기반으로 선택한다
 * [1] 시그니처 1개 → [2-4] 차원별 최대 3개 (tag 중복 제거) → [5] 공통 1개
 * 부족하면 남은 차원별/공통에서 백필
 */
function selectPrescriptions(
  persona: PersonaKey,
  stats: MdStats,
  quality: QualityScores,
  scores: DimensionScores,
): PrescriptionItem[] {
  // 조건 필터링
  const eligible = ALL_PRESCRIPTIONS.filter((p) =>
    p.condition(persona, stats, quality, scores),
  );

  // 티어별 분류 + 우선순위 정렬
  const signatures = eligible.filter((p) => p.tier === "signature");
  const dimensionals = eligible
    .filter((p) => p.tier === "dimensional")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const commons = eligible
    .filter((p) => p.tier === "common")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const selected: ConditionalPrescription[] = [];
  const usedTags = new Set<string>();

  // [1] 시그니처 (페르소나별 1개)
  const sig = signatures[0];
  if (sig) {
    selected.push(sig);
    usedTags.add(sig.tag);
  }

  // [2-4] 차원별 (tag 중복 제거, 최대 3개)
  for (const p of dimensionals) {
    if (selected.length >= 4) break;
    if (usedTags.has(p.tag)) continue;
    selected.push(p);
    usedTags.add(p.tag);
  }

  // [5] 공통 1개
  const common = commons.find((p) => !usedTags.has(p.tag));
  if (common) {
    selected.push(common);
    usedTags.add(common.tag);
  }

  // 백필 — 5개 미만이면 남은 차원별/공통에서 채움 (tag 중복 허용)
  for (const p of [...dimensionals, ...commons]) {
    if (selected.length >= 5) break;
    if (selected.some((s) => s.id === p.id)) continue;
    selected.push(p);
  }

  return selected.slice(0, 5).map((p) => ({ text: p.text, priority: p.priority }));
}

// ─── 공개 API ──────────────────────────────────────────

/**
 * 페르소나 × 품질 × 통계를 교차 분석해 5개의 처방전을 생성한다
 * @param persona 주 페르소나
 * @param mdStats CLAUDE.md 통계
 * @param qualityScores 품질 점수 (5개 차원)
 * @param dimensionScores 분석 차원 점수 (6개 차원)
 * @returns 정확히 5개(또는 조건 부족 시 5개 이하)의 PrescriptionItem
 */
/** 개발자 용어 → 비개발자 용어 치환 테이블 */
const DEV_TO_GENERAL: [RegExp, string][] = [
  [/커밋/g, "변경 사항 저장"],
  [/디버깅/g, "문제 해결"],
  [/린트/g, "자동 검수"],
  [/코드\s*리뷰/g, "동료 검토"],
  [/\bPR\b/g, "변경 요청"],
  [/빌드/g, "실행 준비"],
  [/CI\/CD/g, "자동 배포"],
  [/Hook/gi, "자동 실행 규칙"],
  [/\.env/g, "비밀 설정 파일"],
  [/MCP/g, "외부 연결"],
];

export function generatePrescriptions(
  persona: PersonaKey,
  mdStats: MdStats,
  qualityScores: QualityScores,
  dimensionScores: DimensionScores,
): PrescriptionItem[] {
  const selected = selectPrescriptions(persona, mdStats, qualityScores, dimensionScores);

  // 비개발자 프로파일이면 개발자 용어를 일반 용어로 치환
  if (isNonDevProfile(mdStats, dimensionScores)) {
    for (const item of selected) {
      item.text = DEV_TO_GENERAL.reduce(
        (t, [from, to]) => t.replace(from, to),
        item.text,
      );
    }
  }

  return selected;
}
