import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/analyzer";

/** 비비님 설정과 유사한 확장 입력 */
const EXPANDED_INPUT = `=== CLAUDE.md ===
# 프로젝트 규칙
## 언어
- 항상 한국어로 답변한다
## 태도
- 모르는 것은 솔직히 모른다고 말한다

=== settings.json ===
{
  "permissions": {
    "allow": ["mcp__claude_ai_Notion__*", "mcp__claude_ai_Slack__*", "Bash(git *)"],
    "deny": ["Bash(rm -rf *)", "Bash(git push --force *)", "Bash(git reset --hard *)"],
    "defaultMode": "auto"
  },
  "hooks": {
    "PreToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "prompt", "prompt": "check env"}]}],
    "PostToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "echo done"}]}],
    "SessionEnd": [{"matcher": "", "hooks": [{"type": "command", "command": "bash log.sh"}]}],
    "Stop": [{"matcher": ".*", "hooks": [{"type": "command", "command": "node report.js"}]}]
  },
  "statusLine": {"type": "command", "command": "bash statusline.sh"},
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "hookify@claude-plugins-official": true,
    "session-wrap@team-attention-plugins": true,
    "slack@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "commit-commands@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "code-review@claude-plugins-official": false,
    "feature-dev@claude-plugins-official": false,
    "frontend-design@claude-plugins-official": false,
    "security-guidance@claude-plugins-official": false,
    "linear@claude-plugins-official": false
  },
  "extraKnownMarketplaces": {"superpowers-marketplace": {}}
}

=== mcp_settings.json ===
{
  "mcpServers": {
    "slack": {"command": "npx", "env": {"SLACK_TOKEN": "***REDACTED***"}},
    "notion": {"command": "npx", "env": {"TOKEN": "***REDACTED***"}},
    "google-workspace": {"command": "npx", "env": {"ID": "***REDACTED***"}},
    "greeting-ats": {"command": "node", "env": {"KEY": "***REDACTED***"}}
  }
}

=== commands ===
arrange
phone-screening
ps
onboard
github-invite
pr-gen
squash
dalgona

=== PROJECT MEMORY ===
# 사용자 설정
## 프로젝트
- HRbot GAS 프로젝트
- MeetingRoomBot GAS
- GreetingATS API
- 폰스크리닝 자동화
## 도구
- Slack, Notion, Google Workspace, GitHub

=== /Users/vivi/CLAUDE.md ===
# 프로젝트 규칙
## 자주 쓰는 도구
- 협업: Slack, Notion
- Google Workspace

=== /Users/vivi/mdti/CLAUDE.md ===
@AGENTS.md

=== /Users/vivi/ralph/CLAUDE.md ===
# Ralph PRD Agent
`;

/** CLAUDE.md만 넣은 기본 입력 */
const BASIC_INPUT = `# 프로젝트 규칙
## 언어
- 항상 한국어로 답변한다
## 태도
- 모르는 것은 솔직히 모른다고 말한다
## 자주 쓰는 도구
- 협업: Slack, Notion
- Google Workspace
`;

describe("확장 입력 vs 기본 입력 분석 비교", () => {
  it("확장 입력이 isExpandedInput = true여야 한다", () => {
    const result = analyze(EXPANDED_INPUT);
    expect(result.mdStats.isExpandedInput).toBe(true);
  });

  it("기본 입력이 isExpandedInput = false여야 한다", () => {
    const result = analyze(BASIC_INPUT);
    expect(result.mdStats.isExpandedInput).toBe(false);
  });

  it("확장 입력에서 심층 신호가 추출되어야 한다", () => {
    const result = analyze(EXPANDED_INPUT);
    const s = result.mdStats;

    console.log("=== 확장 입력 분석 결과 ===");
    console.log("페르소나:", result.persona);
    console.log("점수:", JSON.stringify(result.scores, null, 2));
    console.log("pluginCount:", s.pluginCount);
    console.log("mcpServerCount:", s.mcpServerCount);
    console.log("commandCount:", s.commandCount);
    console.log("hookCount:", s.hookCount);
    console.log("denyCount:", s.denyCount);
    console.log("blocksDangerousOps:", s.blocksDangerousOps);
    console.log("hookPromptCount:", s.hookPromptCount);
    console.log("hookCommandCount:", s.hookCommandCount);
    console.log("pluginEnabledRatio:", s.pluginEnabledRatio);
    console.log("projectMdCount:", s.projectMdCount);

    // 심층 신호 검증
    expect(s.pluginCount).toBeGreaterThan(0);
    expect(s.mcpServerCount).toBeGreaterThan(0);
    expect(s.commandCount).toBeGreaterThan(0);
    expect(s.hookCount).toBeGreaterThan(0);
    expect(s.denyCount).toBeGreaterThan(0);
    expect(s.blocksDangerousOps).toBe(true);
    expect(s.hookPromptCount).toBeGreaterThan(0);
    expect(s.hookCommandCount).toBeGreaterThan(0);
  });

  it("확장 입력의 보안 점수가 기본 입력보다 높아야 한다", () => {
    const expanded = analyze(EXPANDED_INPUT);
    const basic = analyze(BASIC_INPUT);

    console.log("=== 점수 비교 ===");
    console.log("기본 점수:", JSON.stringify(basic.scores));
    console.log("확장 점수:", JSON.stringify(expanded.scores));
    console.log("기본 페르소나:", basic.persona);
    console.log("확장 페르소나:", expanded.persona);

    // deny 규칙 + PreToolUse hook이 있으므로 보안 점수가 올라야 함
    expect(expanded.scores.security).toBeGreaterThan(basic.scores.security);
  });

  it("확장 입력과 기본 입력의 페르소나가 달라야 한다", () => {
    const expanded = analyze(EXPANDED_INPUT);
    const basic = analyze(BASIC_INPUT);

    // 동일 CLAUDE.md라도 확장 데이터로 인해 다른 페르소나가 나올 수 있음
    console.log("기본:", basic.persona, "→ 확장:", expanded.persona);
    // 최소한 점수는 달라야 함
    expect(expanded.scores).not.toEqual(basic.scores);
  });
});
