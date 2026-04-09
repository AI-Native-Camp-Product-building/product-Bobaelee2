/**
 * POST /api/analyze — CLAUDE.md 텍스트를 분석하여 페르소나 + 점수 + 처방전을 반환한다
 *
 * 요청 본문: { "text": "CLAUDE.md 내용" }
 * 응답: { persona, secondaryPersona, scores, prescriptions, roasts, strengths, mdPower, stats }
 */
import { analyze } from "@/lib/analyzer";
import { saveResult } from "@/lib/store";
import { PERSONAS } from "@/lib/content/personas";
import { nanoid } from "nanoid";
import type { DimensionScores, PersonaKey } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";

/** 입력 텍스트 최대 길이 (100KB) */
const MAX_TEXT_LENGTH = 100_000;

/** 차원 점수를 바 차트로 렌더링 */
function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

/** 마크다운 리포트 생성 */
function generateReport(
  persona: PersonaKey,
  secondary: PersonaKey | null,
  scores: DimensionScores,
  roasts: { text: string; detail: string }[],
  strengths: { text: string }[],
  prescriptions: { text: string; priority: string }[],
  mdPower: { score: number; tierEmoji: string; tierName: string },
  shareUrl: string,
): string {
  const def = PERSONAS[persona];
  const lines: string[] = [];

  lines.push(`# ${def.emoji} ${def.nameKo} (${def.nameEn})`);
  lines.push(`> "${def.tagline}"`);
  if (secondary) {
    const secDef = PERSONAS[secondary];
    lines.push(`> + ${secDef.emoji} ${secDef.nameKo} 기질`);
  }
  lines.push("");

  // 차원 점수
  lines.push("## 차원 점수");
  const dimOrder = ["automation", "control", "toolDiversity", "contextAwareness", "teamImpact", "security", "agentOrchestration"] as const;
  for (const dim of dimOrder) {
    const label = DIMENSION_LABELS[dim].label;
    const val = scores[dim];
    lines.push(`  ${label.padEnd(4)} ${scoreBar(val)} ${String(val).padStart(3)}`);
  }
  lines.push("");

  // 로스팅
  lines.push("## 🔥 로스팅");
  for (const r of roasts) {
    lines.push(`• ${r.text}`);
    lines.push(`  └ ${r.detail}`);
  }
  lines.push("");

  // 강점
  lines.push("## 💎 강점");
  for (const s of strengths) {
    lines.push(`• ${s.text}`);
  }
  lines.push("");

  // 처방전
  lines.push("## 🛠️ 처방전");
  prescriptions.forEach((rx, i) => {
    const icon = rx.priority === "high" ? "🔴" : "🟡";
    lines.push(`${i + 1}. ${icon} ${rx.text}`);
  });
  lines.push("");

  lines.push(`md력: ${mdPower.tierEmoji} ${mdPower.score}/1000 (${mdPower.tierName})`);
  lines.push(`📊 전체 결과 보기: ${shareUrl}`);

  return lines.join("\n");
}

/**
 * GET /api/analyze — API 사용법 반환 (사람과 에이전트 모두를 위한 자기 문서화)
 */
export async function GET() {
  return Response.json({
    name: "mdTI Analyze API",
    description: "CLAUDE.md 텍스트를 분석하여 AI 활용 성향 페르소나를 분류합니다",
    endpoint: "POST /api/analyze",
    request: {
      method: "POST",
      content_types: {
        "application/json": {
          headers: { "Content-Type": "application/json" },
          body: { text: "(string, 필수) CLAUDE.md 파일 내용" },
        },
        "text/plain": {
          headers: { "Content-Type": "text/plain" },
          body: "CLAUDE.md 파일 내용을 그대로 전송",
        },
      },
    },
    response: {
      persona: "{ primary: string, secondary: string | null } — 12가지 페르소나 중 주/부 분류",
      scores: "7개 차원 점수 (0-100): automation, control, toolDiversity, contextAwareness, teamImpact, security, agentOrchestration",
      prescriptions: "처방전 5개 — 에이전트가 해석하여 CLAUDE.md 개선 제안에 활용",
      roasts: "로스팅 3개 — 재미 요소",
      strengths: "강점 3개",
      mdPower: "md력 점수 (0-1000) + 티어",
      shareUrl: "결과 웹 페이지 URL — 레이더 차트, 궁합 등 풀 비주얼",
      markdownReport: "터미널에서 바로 출력 가능한 포맷된 리포트 (페르소나, 바 차트, 로스팅, 처방전 포함)",
    },
    example: {
      curl_json: `curl -X POST https://mdti.vercel.app/api/analyze -H "Content-Type: application/json" -d '{"text": "# My Rules\\n- 항상 한국어로 답변"}'`,
      curl_collect_mac: `(for f in ~/.claude/CLAUDE.md ~/.claude/settings.json; do [ -f "$f" ] && echo "=== $(basename "$f") ===" && cat "$f" && echo ""; done; [ -f ~/.claude/mcp_settings.json ] && echo "=== mcp_settings.json ===" && python3 -c "import json,sys; d=json.load(open(sys.argv[1])); [s['env'].update({k:'***' for k in s['env']}) for s in d.get('mcpServers',{}).values() if 'env' in s]; print(json.dumps(d,indent=2,ensure_ascii=False))" ~/.claude/mcp_settings.json && echo ""; echo "=== commands ===" && find ~/.claude/commands -name '*.md' 2>/dev/null | xargs -I{} basename {} .md; echo ""; find ~ -maxdepth 3 \\( -name 'CLAUDE.md' -o -name 'AGENTS.md' \\) -not -path '*/.claude/*' -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | while read f; do echo "=== $f ===" && cat "$f" && echo ""; done) | sed -E -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/***EMAIL***/g' -e 's/(xoxb-|xoxp-|sk-|ghp_|gho_|Bearer )[A-Za-z0-9_-]+/\\1***/g' -e 's/AKfycb[A-Za-z0-9_-]+/***DEPLOY_ID***/g' -e 's/ntn_[A-Za-z0-9_-]+/***NOTION***/g' | curl -s -X POST https://mdti.vercel.app/api/analyze -H "Content-Type: text/plain" --data-binary @- | jq -r .markdownReport`,
      note: "curl_collect_mac은 전체 Claude 설정(CLAUDE.md, settings.json, MCP, commands, 프로젝트별 MD)을 수집하고 API 키/이메일을 자동 마스킹하여 분석합니다",
      agent_prompt: "내 Claude 설정 파일들(~/.claude/CLAUDE.md, settings.json, mcp_settings.json, 프로젝트별 CLAUDE.md, AGENTS.md)을 모두 읽어서 하나로 합친 뒤 https://mdti.vercel.app/api/analyze 에 text/plain으로 POST 요청을 보내줘. API 키, 토큰, 이메일은 마스킹해서 보내고. 응답의 markdownReport를 그대로 출력해주고, 처방전 중 바로 적용할 수 있는 게 있으면 뭘 어떻게 수정하면 좋을지 알려줘.",
    },
    personas: [
      "puppet-master", "speedrunner", "fortress", "minimalist",
      "collector", "legislator", "craftsman", "deep-diver",
      "evangelist", "architect", "huggies", "daredevil",
    ],
  });
}

export async function POST(request: Request) {
  let text: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("text/plain")) {
    // text/plain — 파일 내용을 그대로 보낸 경우
    text = await request.text();
  } else {
    // application/json (기본) — {"text": "..."} 형식
    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "요청 본문이 유효한 JSON이 아닙니다. text/plain으로 보내면 JSON 없이 텍스트만 전송할 수 있습니다." },
        { status: 400 },
      );
    }
    text = body.text;
  }

  if (!text || typeof text !== "string") {
    return Response.json(
      { error: "text 필드가 필요합니다 (string)" },
      { status: 400 },
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `텍스트가 너무 깁니다 (최대 ${MAX_TEXT_LENGTH}자)` },
      { status: 400 },
    );
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return Response.json(
      { error: "빈 텍스트는 분석할 수 없습니다" },
      { status: 400 },
    );
  }

  const result = analyze(trimmed);

  // 결과 저장 → shareUrl 생성
  const id = nanoid(10);
  await saveResult(id, result);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mdti.vercel.app";
  const shareUrl = `${baseUrl}/r/${id}`;

  // 마크다운 리포트 생성
  const markdownReport = generateReport(
    result.persona,
    result.secondaryPersona,
    result.scores,
    result.roasts,
    result.strengths,
    result.prescriptions,
    result.mdPower,
    shareUrl,
  );

  return Response.json({
    persona: {
      primary: result.persona,
      secondary: result.secondaryPersona,
    },
    scores: result.scores,
    qualityScores: result.qualityScores,
    prescriptions: result.prescriptions,
    roasts: result.roasts,
    strengths: result.strengths,
    mdPower: result.mdPower,
    stats: {
      totalLines: result.mdStats.totalLines,
      toolNames: result.mdStats.toolNames,
      hasRoleDefinition: result.mdStats.hasRoleDefinition,
      isExpandedInput: result.mdStats.isExpandedInput,
    },
    shareUrl,
    markdownReport,
  });
}
