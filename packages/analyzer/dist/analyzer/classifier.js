/** 차원별 전용 페르소나 매핑 — deep-diver 억제 및 부 페르소나 선택에 사용 */
const DIMENSION_SPECIFIC_PERSONAS = {
    security: ["fortress"],
    control: ["legislator"],
    automation: ["puppet-master", "daredevil"],
    toolDiversity: ["collector", "puppet-master"],
    teamImpact: ["evangelist"],
    contextAwareness: [],
    agentOrchestration: ["architect", "puppet-master"],
};
/** 가장 높은 점수의 차원을 페르소나로 매핑 (fallback용) */
const DIMENSION_TO_PERSONA = {
    automation: "puppet-master",
    control: "legislator",
    toolDiversity: "collector",
    contextAwareness: "deep-diver",
    teamImpact: "evangelist",
    security: "fortress",
    agentOrchestration: "architect",
};
/** 페르소나 → 핵심 차원 매핑 (부 페르소나 선택 시 차원 충돌 회피) */
const PERSONA_PRIMARY_DIMENSION = {
    "puppet-master": "automation",
    fortress: "security",
    legislator: "control",
    evangelist: "teamImpact",
    collector: "toolDiversity",
    "deep-diver": "contextAwareness",
    daredevil: "automation",
};
/** DimensionScores의 평균값을 계산한다 */
function average(scores) {
    const values = Object.values(scores);
    return values.reduce((a, b) => a + b, 0) / values.length;
}
/** DimensionScores의 표준편차를 계산한다 */
function stdDev(scores) {
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}
/** DimensionScores의 최대값을 반환한다 */
function maxScore(scores) {
    return Math.max(...Object.values(scores));
}
/** 가장 높은 점수의 차원 키를 반환한다 */
function dominantDimension(scores) {
    let maxKey = "automation";
    let maxVal = -1;
    for (const [key, val] of Object.entries(scores)) {
        if (val > maxVal) {
            maxVal = val;
            maxKey = key;
        }
    }
    return maxKey;
}
/**
 * 모든 후보 페르소나의 적합도를 계산하고 메타 노트를 수집한다
 * classifyPersona와 classifyPersonaDebug의 공통 진입점
 */
function buildCandidates(scores, mdStats) {
    const avg = average(scores);
    const sd = stdDev(scores);
    const max = maxScore(scores);
    const notes = [];
    // 메타 노트: 입력 경로
    if (mdStats.isExpandedInput) {
        notes.push("전체 수집 분석 — settings.json, 플러그인, hook, 스킬, 에이전트 정보가 포함되어 더 정확한 분류가 가능합니다.");
    }
    else {
        notes.push("CLAUDE.md 본문만으로 분석했습니다. 더 정확한 분류를 원한다면 수집 스크립트를 실행해보세요.");
    }
    // Step 1: 특수 케이스 — 내용이 없는 경우
    if (mdStats.totalLines <= 10 && avg < 20) {
        return {
            candidates: [],
            shortCircuit: {
                result: { primary: "minimalist", secondary: null },
                reason: `totalLines ${mdStats.totalLines} ≤ 10 AND 평균 ${avg.toFixed(0)} < 20 — 분석할 내용이 너무 적음`,
            },
            notes,
        };
    }
    if (max < 25) {
        return {
            candidates: [],
            shortCircuit: {
                result: { primary: "minimalist", secondary: null },
                reason: `최고 점수 ${max.toFixed(0)} < 25 — 어느 차원도 의미 있는 시그널 없음`,
            },
            notes,
        };
    }
    // Step 2: 후보 등록
    const candidates = [];
    // 하네스 숙련도 기반 (전체 수집) — "만든다 vs 쓴다" 정확 구분
    // userSkillCount = 전체 스킬 - 플러그인이 설치한 스킬 (수집 스크립트에서 계산)
    if (mdStats.isExpandedInput) {
        const userSkills = mdStats.userSkillCount ?? 0;
        const userAgents = mdStats.userAgentCount ?? 0;
        const selfAuthored = userSkills + userAgents;
        const pluginCount = mdStats.pluginCount;
        const adopted = pluginCount + mdStats.mcpServerCount;
        const selfConfigured = mdStats.commandCount + mdStats.hookCount;
        notes.push(`하네스 분석: 스킬 ${mdStats.skillCount ?? 0}개(플러그인 ${mdStats.pluginSkillCount ?? 0}개, 직접 ${userSkills}개), 에이전트 ${mdStats.agentCount ?? 0}개(플러그인 ${mdStats.pluginAgentCount ?? 0}개, 직접 ${userAgents}개), 설정 ${selfConfigured}개, 활용 ${adopted}개`);
        // 로데오 마스터: 직접 만든 스킬/에이전트가 있는 사람
        if (selfAuthored >= 2) {
            const fit = 90 + Math.min(selfAuthored * 3 + selfConfigured, 15);
            candidates.push({
                persona: "architect",
                fit,
                reason: `하네스 제작자 — 직접 만든 스킬 ${userSkills}개 + 에이전트 ${userAgents}개 = ${selfAuthored}개 ≥ 2`,
            });
        }
        // 하기스 아키텍트: 플러그인/MCP 생태계를 활용하는 사람
        if (adopted >= 3 || adopted + selfConfigured >= 6) {
            const fit = 75 + Math.min(adopted + selfConfigured, 15);
            candidates.push({
                persona: "huggies",
                fit,
                reason: `하네스 활용자 — 플러그인 ${pluginCount}개, MCP ${mdStats.mcpServerCount}개, 명령어 ${mdStats.commandCount}개, 훅 ${mdStats.hookCount}개`,
            });
        }
    }
    // 텍스트 기반 보조 진입: 수집 스크립트 미사용이어도 에이전트 오케스트레이션 시그널이 강하면 후보
    if (!mdStats.isExpandedInput && scores.agentOrchestration >= 70 && scores.toolDiversity >= 40) {
        const fit = scores.agentOrchestration - 10;
        candidates.push({
            persona: "architect",
            fit,
            reason: `텍스트 기반: agentOrchestration ${scores.agentOrchestration} ≥ 70 AND toolDiversity ${scores.toolDiversity} ≥ 40 — 수집 스크립트 없이도 하네스 제작 시그널 감지`,
        });
    }
    // 차원 기반 후보들 — 벤치마크 기반 임계값
    if (scores.automation >= 55 && scores.toolDiversity >= 40) {
        const fit = (scores.automation - 55) / 45 * 50 + (scores.toolDiversity - 40) / 60 * 50;
        candidates.push({
            persona: "puppet-master",
            fit,
            reason: `automation ${scores.automation} ≥ 55 AND toolDiversity ${scores.toolDiversity} ≥ 40`,
        });
    }
    if (scores.automation >= 45 && scores.security < 20) {
        const gap = scores.automation - scores.security;
        const fit = Math.max(0, (gap - 25) / 75 * 100);
        candidates.push({
            persona: "daredevil",
            fit,
            reason: `automation ${scores.automation} ≥ 45 AND security ${scores.security} < 20 (gap ${gap})`,
        });
    }
    if (scores.security >= 55) {
        const fit = (scores.security - 55) / 45 * 100;
        candidates.push({
            persona: "fortress",
            fit,
            reason: `security ${scores.security} ≥ 55`,
        });
    }
    if (scores.control >= 55) {
        const fit = (scores.control - 55) / 45 * 100;
        candidates.push({
            persona: "legislator",
            fit,
            reason: `control ${scores.control} ≥ 55`,
        });
    }
    if (scores.teamImpact >= 55) {
        const fit = (scores.teamImpact - 55) / 45 * 100;
        candidates.push({
            persona: "evangelist",
            fit,
            reason: `teamImpact ${scores.teamImpact} ≥ 55`,
        });
    }
    if (scores.toolDiversity >= 45 && scores.automation < 30) {
        const fit = (scores.toolDiversity - 45) / 55 * 50 + (30 - scores.automation) / 30 * 50;
        candidates.push({
            persona: "collector",
            fit,
            reason: `toolDiversity ${scores.toolDiversity} ≥ 45 AND automation ${scores.automation} < 30`,
        });
    }
    if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30 && max < 70) {
        candidates.push({
            persona: "speedrunner",
            fit: 50,
            reason: `totalLines ${mdStats.totalLines} ≤ 30 AND control ${scores.control} < 25 AND contextAwareness ${scores.contextAwareness} < 30 AND max ${max.toFixed(0)} < 70`,
        });
    }
    if (sd < 20 && avg >= 25) {
        let fit = Math.max(0, (avg - 25) / 75 * 100);
        // 유의미한 경쟁자(fit ≥ 15)가 있을 때만 페널티 적용
        const hasStrongCompetitor = candidates.some((c) => c.fit >= 15);
        if (hasStrongCompetitor)
            fit *= 0.5;
        candidates.push({
            persona: "craftsman",
            fit,
            reason: `표준편차 ${sd.toFixed(1)} < 20 AND 평균 ${avg.toFixed(0)} ≥ 25 — 균형형${hasStrongCompetitor ? " (강한 경쟁자 있어 fit 50% 감점)" : ""}`,
        });
    }
    // deep-diver: 1위 차원이 2위 차원의 2배 이상 = 극단적 과몰입
    const sortedValues = Object.values(scores).sort((a, b) => b - a);
    const first = sortedValues[0];
    const second = sortedValues[1];
    const dominanceRatio = second > 0 ? first / second : Infinity;
    if (first >= 70 && dominanceRatio >= 2.0) {
        const dominant = dominantDimension(scores);
        const specificPersonas = DIMENSION_SPECIFIC_PERSONAS[dominant] ?? [];
        const hasDimensionSpecificPersona = specificPersonas.length > 0;
        // second=0(Infinity)이면 빈약한 파일이지 극단 몰입이 아님 → fit 상한 60
        const cappedRatio = second > 0 ? dominanceRatio : 4.0;
        let fit = Math.min(100, (cappedRatio - 2.0) / 3.0 * 50 + (first - 70) / 30 * 50);
        if (second === 0)
            fit = Math.min(60, fit);
        if (hasDimensionSpecificPersona) {
            fit *= 0.3;
        }
        candidates.push({
            persona: "deep-diver",
            fit,
            reason: `1위 차원 ${first.toFixed(0)} ≥ 70 AND 1위/2위 비율 ${dominanceRatio === Infinity ? "∞" : dominanceRatio.toFixed(1)} ≥ 2.0${hasDimensionSpecificPersona ? ` (${dominant}에 전용 페르소나 있어 fit 30%로 억제)` : ""}`,
        });
    }
    return { candidates, shortCircuit: null, notes };
}
/**
 * 후보 리스트에서 주/부 페르소나를 추출한다
 * 후보가 없으면 dominantDimension 기반 fallback
 */
function pickPrimaryAndSecondary(candidates, scores) {
    if (candidates.length === 0) {
        const dominant = dominantDimension(scores);
        if (scores[dominant] < 40) {
            return { primary: "minimalist", secondary: null };
        }
        return { primary: DIMENSION_TO_PERSONA[dominant], secondary: null };
    }
    const sorted = [...candidates].sort((a, b) => b.fit - a.fit);
    const primary = sorted[0].persona;
    let secondary = null;
    for (let i = 1; i < sorted.length; i++) {
        const candidate = sorted[i];
        if (candidate.fit < 25)
            break;
        if (candidate.fit < sorted[0].fit * 0.6)
            break;
        if (candidate.persona === primary)
            continue;
        const primaryDim = PERSONA_PRIMARY_DIMENSION[primary];
        const candidateDim = PERSONA_PRIMARY_DIMENSION[candidate.persona];
        if (primaryDim && candidateDim && primaryDim === candidateDim)
            continue;
        if (candidate.persona === "deep-diver") {
            const dominant = dominantDimension(scores);
            const specificPersonas = DIMENSION_SPECIFIC_PERSONAS[dominant] ?? [];
            if (specificPersonas.includes(primary))
                continue;
        }
        secondary = candidate.persona;
        break;
    }
    return { primary, secondary };
}
/**
 * 분석 점수와 통계를 기반으로 페르소나를 분류한다
 *
 * 후보 적합도 기반 분류:
 * 1. 특수 케이스 (minimalist) 선처리
 * 2. 모든 후보 페르소나에 적합도 점수를 매김
 * 3. 적합도 순 정렬 → 주/부 페르소나 추출
 */
export function classifyPersona(scores, mdStats) {
    const built = buildCandidates(scores, mdStats);
    if (built.shortCircuit)
        return built.shortCircuit.result;
    return pickPrimaryAndSecondary(built.candidates, scores);
}
/**
 * 분류 과정의 디버그 정보를 반환한다 — 투명성 UI에서 "이 분류가 어떻게 나왔나요?" 표시용
 *
 * 동일 입력에 대해 classifyPersona와 같은 primary/secondary를 보장한다 (buildCandidates 공유).
 */
export function classifyPersonaDebug(scores, mdStats) {
    const built = buildCandidates(scores, mdStats);
    if (built.shortCircuit) {
        return {
            primary: built.shortCircuit.result.primary,
            secondary: built.shortCircuit.result.secondary,
            candidates: [],
            notes: built.notes,
            shortCircuitReason: built.shortCircuit.reason,
            fallbackUsed: false,
        };
    }
    const sortedCandidates = [...built.candidates].sort((a, b) => b.fit - a.fit);
    const result = pickPrimaryAndSecondary(built.candidates, scores);
    const fallbackUsed = sortedCandidates.length === 0;
    return {
        primary: result.primary,
        secondary: result.secondary,
        candidates: sortedCandidates,
        notes: built.notes,
        shortCircuitReason: null,
        fallbackUsed,
    };
}
//# sourceMappingURL=classifier.js.map