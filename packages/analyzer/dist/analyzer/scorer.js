import { DIMENSION_PATTERNS, countPatternMatches, countUniqueSignals, extractToolNames, isExpandedInput, extractEnabledPlugins, extractMcpServerNames, extractCommandNames, countHooks, extractExpandedSignals, extractSkillCount, extractAgentCount, } from "./patterns.js";
/**
 * 각 차원의 정규화 기준값 — 패턴 수의 70%를 만점 기준으로 자동 계산
 * 고유 신호 카운팅이므로 만점 = 패턴 종류 수, 70%는 일부 패턴이 해당 없는 경우 허용
 * contextAwareness만 50%: 고급 기능 패턴(.claude/rules, @import, subagent 등)이 많아
 * 일반 사용자가 7개를 모두 쓸 가능성이 낮음
 */
// A경로 (짧은 CLAUDE.md만) — 벤치마크 기반 저임계값
const THRESHOLD_RATIO = {
    toolDiversity: 0.3, // 20개 중 6개 → 만점 (벤치마크: 최대 3개 히트)
    agentOrchestration: 0.3, // ~16개 중 5개 → 만점 (벤치마크: 75%가 0점)
    contextAwareness: 0.4, // ~14개 중 6개 → 만점
    teamImpact: 0.5, // ~16개 중 8개 → 만점 (분포가 건강)
    security: 0.5, // ~11개 중 6개 → 만점 (벤치마크: 중위값 0)
    control: 0.7, // 유지 (패턴 재설계로 점수 자연 하락)
};
const DEFAULT_RATIO = 0.6; // automation: ~15개 중 9개 → 만점
// B경로 (수집 스크립트 — settings.json + MCP + hooks + 프로젝트 CLAUDE.md 전부 포함)
// 텍스트가 길어서 패턴 히트가 자연적으로 높음 → 더 높은 임계값 필요
const EXPANDED_THRESHOLD_RATIO = {
    toolDiversity: 0.6,
    agentOrchestration: 0.7,
    contextAwareness: 0.7,
    teamImpact: 0.7,
    security: 0.7,
    control: 0.85,
};
const EXPANDED_DEFAULT_RATIO = 0.8;
/** 단일 차원에 적용 가능한 보정 보너스 상한 (B경로에서 포화 방지) */
const MAX_BONUS_PER_DIMENSION = 25;
function computeThresholds(expanded) {
    const ratios = expanded ? EXPANDED_THRESHOLD_RATIO : THRESHOLD_RATIO;
    const defaultRatio = expanded ? EXPANDED_DEFAULT_RATIO : DEFAULT_RATIO;
    const result = {};
    for (const dim of Object.keys(DIMENSION_PATTERNS)) {
        const ratio = ratios[dim] ?? defaultRatio;
        result[dim] = Math.ceil(DIMENSION_PATTERNS[dim].length * ratio);
    }
    return result;
}
// A경로용 기본 threshold (하위 호환)
const THRESHOLDS = computeThresholds(false);
/**
 * 원시 매칭 횟수를 0~100 점수로 정규화한다
 * @param count 원시 매칭 횟수
 * @param threshold 100점 기준 임계값
 */
function normalize(count, threshold) {
    const score = Math.round((count / threshold) * 100);
    return Math.min(100, Math.max(0, score));
}
/**
 * CLAUDE.md 텍스트에서 6개 차원 점수를 계산한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns DimensionScores (각 차원 0~100)
 */
export function calculateScores(md) {
    if (!md || md.trim().length === 0) {
        return {
            automation: 0,
            control: 0,
            toolDiversity: 0,
            contextAwareness: 0,
            teamImpact: 0,
            security: 0,
            agentOrchestration: 0,
        };
    }
    const expandedInput = isExpandedInput(md);
    const thresholds = expandedInput ? computeThresholds(true) : THRESHOLDS;
    const dimensions = Object.keys(thresholds);
    const result = {};
    for (const dim of dimensions) {
        const patterns = DIMENSION_PATTERNS[dim];
        const count = countUniqueSignals(md, patterns);
        result[dim] = normalize(count, thresholds[dim]);
    }
    // 확장 수집 데이터가 있으면 구조화된 신호로 점수 보정
    if (expandedInput) {
        const sig = extractExpandedSignals(md);
        // 보정 시 차원별 보너스 누적을 추적하여 상한 적용
        const bonusUsed = {};
        const addBonus = (dim, amount) => {
            const used = bonusUsed[dim] ?? 0;
            const remaining = MAX_BONUS_PER_DIMENSION - used;
            if (remaining <= 0)
                return;
            const actual = Math.min(amount, remaining);
            result[dim] = Math.min(100, result[dim] + actual);
            bonusUsed[dim] = used + actual;
        };
        // 보안: deny 규칙, 위험 명령어 차단, PreToolUse hook → security에만 귀속
        if (sig.blocksDangerousOps)
            addBonus("security", 12);
        if (sig.hasDenyRules)
            addBonus("security", Math.min(sig.denyCount * 3, 12));
        if (sig.hasPreToolUseHook)
            addBonus("security", 6);
        // 자동화: PostToolUse hook, Session hook, hook 유형 다양성
        if (sig.hasPostToolUseHook)
            addBonus("automation", 8);
        if (sig.hasSessionHooks)
            addBonus("automation", 5);
        if (sig.hookTypeCommandCount >= 2)
            addBonus("automation", 6);
        // 컨텍스트 관리: prompt hook, statusLine, 마켓플레이스, 플러그인 선별, 프로젝트별 CLAUDE.md
        if (sig.hookTypePromptCount >= 1)
            addBonus("contextAwareness", 5);
        if (sig.hasStatusLine)
            addBonus("contextAwareness", 5);
        if (sig.hasMultipleMarketplaces)
            addBonus("contextAwareness", 3);
        if (sig.pluginEnabledRatio > 0 && sig.pluginEnabledRatio < 0.5) {
            addBonus("contextAwareness", 6);
        }
        if (sig.projectMdCount >= 2)
            addBonus("contextAwareness", 6);
        // 제어: defaultMode가 auto가 아님 = 수동 승인 선호 (deny는 제거됨)
        if (!sig.defaultModeIsAuto)
            addBonus("control", 8);
        // 도구 다양성: MCP 서버 수
        const mcpServers = extractMcpServerNames(md);
        if (mcpServers.length >= 3)
            addBonus("toolDiversity", 10);
        else if (mcpServers.length >= 1)
            addBonus("toolDiversity", 5);
        // 에이전트 오케스트레이션 보너스 재설계 (2026-04-10 수정)
        // - defaultMode auto는 "진짜 자율운영"의 약한 시그널일 뿐임: +15 → +5 축소
        // - PreToolUse + PostToolUse 조합 = "신중한 자율운영자": +10 신설
        // - 스킬/에이전트 파일 수 = 하네스 깊이의 실체적 시그널: 기존 dead code 대체
        if (sig.defaultModeIsAuto)
            addBonus("agentOrchestration", 5);
        if (sig.hasPreToolUseHook && sig.hasPostToolUseHook) {
            addBonus("agentOrchestration", 10);
        }
        if (sig.hookTypePromptCount >= 2)
            addBonus("agentOrchestration", 8);
        const skillCount = extractSkillCount(md);
        const agentCount = extractAgentCount(md);
        // 스킬 + 에이전트 = 하네스 풀스택 시그널. 합쳐서 최대 +15
        const harnessDepth = skillCount + agentCount;
        if (harnessDepth >= 10)
            addBonus("agentOrchestration", 15);
        else if (harnessDepth >= 5)
            addBonus("agentOrchestration", 10);
        else if (harnessDepth >= 2)
            addBonus("agentOrchestration", 5);
        // 팀 임팩트: 프로젝트별 CLAUDE.md = 팀 환경
        if (sig.projectMdCount >= 3)
            addBonus("teamImpact", 8);
    }
    return result;
}
/**
 * CLAUDE.md 텍스트에서 통계 정보를 추출한다
 * @param md 분석할 CLAUDE.md 전체 텍스트
 * @returns MdStats 객체
 */
export function extractMdStats(md) {
    if (!md || md.trim().length === 0) {
        return {
            totalLines: 0,
            sectionCount: 0,
            toolNames: [],
            hasMemory: false,
            hasHooks: false,
            hasProjectMd: false,
            hasRoleDefinition: false,
            ruleCount: 0,
            claudeMdLines: 0,
            keywordHits: {},
            keywordUniqueHits: {},
            pluginCount: 0,
            mcpServerCount: 0,
            commandCount: 0,
            hookCount: 0,
            skillCount: 0,
            agentCount: 0,
            pluginNames: [],
            mcpServerNames: [],
            commandNames: [],
            isExpandedInput: false,
            denyCount: 0,
            blocksDangerousOps: false,
            hookPromptCount: 0,
            hookCommandCount: 0,
            pluginEnabledRatio: 0,
            projectMdCount: 0,
        };
    }
    const lines = md.split("\n");
    const totalLines = lines.length;
    // ## 또는 # 으로 시작하는 섹션 헤더 수
    const sectionCount = lines.filter((line) => /^#{1,3}\s+/.test(line)).length;
    // 도구명 추출
    const toolNames = extractToolNames(md);
    // memory 또는 메모리 언급 여부
    const hasMemory = /memory|메모리/gi.test(md);
    // hook 언급 여부
    const hasHooks = /hooks?/gi.test(md);
    // project.*claude 또는 CLAUDE.md 언급 여부
    const hasProjectMd = /project.*claude|CLAUDE\.md/gi.test(md);
    // 규칙 수: "- " 또는 숫자로 시작하는 목록 항목 중 금지/필수/반드시/MUST/NEVER 포함
    const ruleLines = lines.filter((line) => /^[\s\-*\d]+/.test(line) &&
        /금지|반드시|필수|항상|절대|MUST|NEVER|ALWAYS|IMPORTANT|CRITICAL/i.test(line));
    const ruleCount = ruleLines.length;
    // 각 차원별 히트 수 기록
    // keywordHits: 반복 카운트 — 통계 UI 표시용 ("총 23회 출현")
    // keywordUniqueHits: 고유 신호 수 — 점수 산출 기준과 일치 ("7종류 감지")
    // 두 카운팅을 분리하는 이유: 점수는 다양성(고유 신호)으로 매기되,
    // B2B 분석에서는 반복 빈도(강조도)도 의미 있는 데이터이므로 둘 다 저장
    const keywordHits = {};
    const keywordUniqueHits = {};
    for (const dim of Object.keys(DIMENSION_PATTERNS)) {
        keywordHits[dim] = countPatternMatches(md, DIMENSION_PATTERNS[dim]);
        keywordUniqueHits[dim] = countUniqueSignals(md, DIMENSION_PATTERNS[dim]);
    }
    // 역할 정의 존재 여부 — 전체 텍스트에서 검색 (글로벌 md가 짧아도 프로젝트 md에 있을 수 있음)
    const hasRoleDefinition = /나는\s*누구|I\s*am\s*a|역할|role:|직함|직무|주요\s*업무|개발자|엔지니어|디자이너|PM\b|마케터|HR\b|운영자|대상:/i.test(md);
    // CLAUDE.md 섹션 줄 수 (확장 입력 시 섹션만, 아니면 전체)
    const expanded = isExpandedInput(md);
    let claudeMdLines = totalLines;
    if (expanded) {
        const claudeSection = md.match(/===\s+(?:.*\/)?CLAUDE\.md\s*===\n([\s\S]*?)(?:\n===|$)/);
        claudeMdLines = claudeSection ? claudeSection[1].split("\n").length : totalLines;
    }
    // 확장 수집 신호 파싱
    const pluginNames = expanded ? extractEnabledPlugins(md) : [];
    const mcpServerNames = expanded ? extractMcpServerNames(md) : [];
    const commandNames = expanded ? extractCommandNames(md) : [];
    const hookCount = expanded ? countHooks(md) : (hasHooks ? 1 : 0);
    const skillCount = expanded ? extractSkillCount(md) : 0;
    const agentCount = expanded ? extractAgentCount(md) : 0;
    // 심층 분석 신호
    const signals = expanded ? extractExpandedSignals(md) : null;
    return {
        totalLines,
        sectionCount,
        toolNames,
        hasMemory,
        hasHooks: hasHooks || hookCount > 0,
        hasProjectMd,
        hasRoleDefinition,
        ruleCount,
        claudeMdLines,
        keywordHits,
        keywordUniqueHits,
        pluginCount: pluginNames.length,
        mcpServerCount: mcpServerNames.length,
        commandCount: commandNames.length,
        hookCount,
        skillCount,
        agentCount,
        pluginNames,
        mcpServerNames,
        commandNames,
        isExpandedInput: expanded,
        denyCount: signals?.denyCount ?? 0,
        blocksDangerousOps: signals?.blocksDangerousOps ?? false,
        hookPromptCount: signals?.hookTypePromptCount ?? 0,
        hookCommandCount: signals?.hookTypeCommandCount ?? 0,
        pluginEnabledRatio: signals?.pluginEnabledRatio ?? 0,
        projectMdCount: signals?.projectMdCount ?? 0,
    };
}
/**
 * 비개발자 프로파일인지 판정한다
 * 역할 정의가 있으면서 개발자 특화 차원이 전부 낮은 경우
 */
export function isNonDevProfile(stats, scores) {
    return (stats.hasRoleDefinition &&
        scores.automation < 20 &&
        scores.security < 20 &&
        scores.agentOrchestration < 10);
}
//# sourceMappingURL=scorer.js.map