/**
 * 벤치마크 CLAUDE.md 파일들을 mdTI 엔진으로 분석하여 점수 분포를 출력한다
 * 사용법: npx tsx scripts/analyze-benchmarks.ts
 */
import { readFileSync } from "fs";
import { calculateScores } from "../lib/analyzer/scorer";
import { classifyPersona } from "../lib/analyzer/classifier";
import { extractMdStats } from "../lib/analyzer/scorer";
import type { DimensionScores } from "../lib/types";

// 벤치마크 파일 파싱
const raw = readFileSync("scripts/samples/benchmark-claudes.txt", "utf-8");
const blocks = raw.split(/^=== END ===$/m).filter(b => b.trim());

interface BenchmarkResult {
  repo: string;
  stars: number;
  lines: number;
  scores: DimensionScores;
  persona: string;
  secondary: string | null;
}

const results: BenchmarkResult[] = [];

for (const block of blocks) {
  const headerMatch = block.match(/^=== (.+?) \(stars: (\d+)\) ===/m);
  if (!headerMatch) continue;

  const repo = headerMatch[1];
  const stars = parseInt(headerMatch[2]);

  // 헤더 제거하고 본문만 추출
  const content = block.replace(/^=== .+ ===\n?/m, "").trim();
  if (!content || content.length < 10) continue;

  const lines = content.split("\n").length;
  const scores = calculateScores(content);
  const mdStats = extractMdStats(content);
  const { primary, secondary } = classifyPersona(scores, mdStats);

  results.push({ repo, stars, lines, scores, persona: primary, secondary });
}

// 정렬: 스타 내림차순
results.sort((a, b) => b.stars - a.stars);

// 1. 개별 결과 출력
console.log("\n=== 개별 분석 결과 ===\n");
console.log(
  "repo".padEnd(35) +
  "stars".padStart(8) +
  "auto".padStart(6) +
  "ctrl".padStart(6) +
  "tool".padStart(6) +
  "ctx".padStart(6) +
  "team".padStart(6) +
  "sec".padStart(6) +
  "agent".padStart(6) +
  "  persona"
);
console.log("-".repeat(110));

for (const r of results) {
  const s = r.scores;
  console.log(
    r.repo.padEnd(35) +
    String(r.stars).padStart(8) +
    String(s.automation).padStart(6) +
    String(s.control).padStart(6) +
    String(s.toolDiversity).padStart(6) +
    String(s.contextAwareness).padStart(6) +
    String(s.teamImpact).padStart(6) +
    String(s.security).padStart(6) +
    String(s.agentOrchestration).padStart(6) +
    "  " + r.persona + (r.secondary ? ` + ${r.secondary}` : "")
  );
}

// 2. 차원별 통계
console.log("\n=== 차원별 점수 분포 ===\n");

const dims = ["automation", "control", "toolDiversity", "contextAwareness", "teamImpact", "security", "agentOrchestration"] as const;

for (const dim of dims) {
  const values = results.map(r => r.scores[dim]).sort((a, b) => a - b);
  const min = values[0];
  const max = values[values.length - 1];
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const median = values[Math.floor(values.length / 2)];
  const p25 = values[Math.floor(values.length * 0.25)];
  const p75 = values[Math.floor(values.length * 0.75)];
  const p90 = values[Math.floor(values.length * 0.9)];

  console.log(`${dim.padEnd(22)} min=${String(min).padStart(3)} p25=${String(p25).padStart(3)} median=${String(median).padStart(3)} avg=${String(avg).padStart(3)} p75=${String(p75).padStart(3)} p90=${String(p90).padStart(3)} max=${String(max).padStart(3)}`);
}

// 3. 페르소나 분포
console.log("\n=== 페르소나 분포 ===\n");
const personaCounts: Record<string, number> = {};
for (const r of results) {
  personaCounts[r.persona] = (personaCounts[r.persona] || 0) + 1;
}
const sorted = Object.entries(personaCounts).sort((a, b) => b[1] - a[1]);
for (const [persona, count] of sorted) {
  const pct = Math.round((count / results.length) * 100);
  const bar = "█".repeat(Math.round(pct / 2));
  console.log(`${persona.padEnd(16)} ${String(count).padStart(3)} (${String(pct).padStart(2)}%) ${bar}`);
}

// 4. 스타 상위 10개의 상세 결과
console.log("\n=== 스타 상위 10개 상세 ===\n");
for (const r of results.slice(0, 10)) {
  const s = r.scores;
  console.log(`${r.repo} (${r.stars.toLocaleString()}⭐, ${r.lines}줄)`);
  console.log(`  → ${r.persona}${r.secondary ? ` + ${r.secondary}` : ""}`);
  console.log(`  auto=${s.automation} ctrl=${s.control} tool=${s.toolDiversity} ctx=${s.contextAwareness} team=${s.teamImpact} sec=${s.security} agent=${s.agentOrchestration}`);
  console.log();
}

// 5. 임계값 제안
console.log("\n=== 임계값 제안 (p75 기준 = 상위 25%가 도달하는 수준) ===\n");
for (const dim of dims) {
  const values = results.map(r => r.scores[dim]).sort((a, b) => a - b);
  const p75 = values[Math.floor(values.length * 0.75)];
  const p90 = values[Math.floor(values.length * 0.9)];
  console.log(`${dim.padEnd(22)} 주요 페르소나 진입=${p75} (p75)  전문가급=${p90} (p90)`);
}
