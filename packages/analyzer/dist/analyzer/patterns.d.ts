/**
 * 7개 차원별 패턴 정의 및 도구명 추출 유틸리티
 * 각 RegExp는 CLAUDE.md 텍스트에서 해당 차원의 신호를 감지한다
 */
/** 차원별 정규식 패턴 목록 */
export declare const DIMENSION_PATTERNS: Record<string, RegExp[]>;
/**
 * 텍스트에서 패턴 목록의 총 매칭 횟수를 센다 (통계 표시용)
 * @param text 분석할 텍스트
 * @param patterns 정규식 패턴 배열
 * @returns 총 매칭 횟수
 */
export declare function countPatternMatches(text: string, patterns: RegExp[]): number;
/**
 * 텍스트에서 매칭되는 고유 패턴 수를 센다 (점수 산출용)
 * 각 패턴은 매칭 여부(0 또는 1)만 카운트 — 반복 횟수 무시
 * @param text 분석할 텍스트
 * @param patterns 정규식 패턴 배열
 * @returns 매칭된 고유 패턴 수
 */
export declare function countUniqueSignals(text: string, patterns: RegExp[]): number;
/** 도구명 → 감지 패턴 매핑 */
export declare const TOOL_NAMES: Record<string, RegExp>;
/**
 * 텍스트에서 언급된 도구 이름 목록을 추출한다
 * @param text 분석할 텍스트
 * @returns 감지된 도구명 배열 (중복 없음)
 */
export declare function extractToolNames(text: string): string[];
/**
 * 전체 수집 입력인지 감지한다 (=== settings.json === 등 구분자 존재 여부)
 */
export declare function isExpandedInput(text: string): boolean;
/**
 * settings.json의 enabledPlugins에서 활성화된(true) 플러그인 이름을 추출한다
 */
export declare function extractEnabledPlugins(text: string): string[];
/**
 * mcp_settings.json 또는 settings.json에서 MCP 서버 이름을 추출한다
 */
export declare function extractMcpServerNames(text: string): string[];
/**
 * commands 섹션에서 커스텀 명령어 파일명을 추출한다
 */
export declare function extractCommandNames(text: string): string[];
/**
 * settings.json의 hooks 섹션에서 hook 이벤트 수를 계산한다
 */
export declare function countHooks(text: string): number;
/** 확장 입력에서 차원별 보너스 점수를 계산한다 */
export interface ExpandedSignals {
    hasDenyRules: boolean;
    denyCount: number;
    blocksDangerousOps: boolean;
    hasPreToolUseHook: boolean;
    defaultModeIsAuto: boolean;
    hasPostToolUseHook: boolean;
    hasSessionHooks: boolean;
    hookTypePromptCount: number;
    hookTypeCommandCount: number;
    hasStatusLine: boolean;
    hasMultipleMarketplaces: boolean;
    pluginEnabledRatio: number;
    projectMdCount: number;
}
/**
 * 확장 수집 데이터의 skills 섹션에서 스킬 수를 추출한다
 * 섹션이 없거나 비어있으면 0을 반환한다
 */
export declare function extractSkillCount(text: string): number;
/**
 * 확장 수집 데이터의 agents 섹션에서 에이전트 수를 추출한다
 * ~/.claude/agents 하위의 .md 파일 수에 대응
 */
export declare function extractAgentCount(text: string): number;
/**
 * 플러그인이 설치한 스킬 수를 추출한다 (=== plugin-skills === 섹션)
 * 이 수치를 전체 skillCount에서 빼면 직접 만든 스킬 수를 알 수 있다
 */
export declare function extractPluginSkillCount(text: string): number;
/**
 * 플러그인이 설치한 에이전트 수를 추출한다 (=== plugin-agents === 섹션)
 */
export declare function extractPluginAgentCount(text: string): number;
/**
 * 확장 수집 데이터에서 구조화된 신호를 추출한다
 */
export declare function extractExpandedSignals(text: string): ExpandedSignals;
//# sourceMappingURL=patterns.d.ts.map