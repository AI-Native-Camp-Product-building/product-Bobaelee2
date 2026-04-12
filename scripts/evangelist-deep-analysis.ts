import { readFileSync } from "fs";
import { calculateScores, extractMdStats } from "../lib/analyzer/scorer";

const raw = readFileSync("scripts/samples/benchmark-claudes.txt", "utf-8");
const blocks = raw.split(/^=== END ===$/m).filter(b => b.trim());

// teamImpact 패턴 정의 (patterns.ts와 동일)
const teamImpactPatterns = [
  /팀|team/gi,
  /코드\s*리뷰|code\s*review/gi,
  /\bPR\b|pull\s*request/gi,
  /컨벤션|convention/gi,
  /린트|lint|eslint|prettier/gi,
  /브랜치|branch/gi,
  /merge|머지/gi,
  /동료|peer/gi,
  /온보딩|onboard|신규\s*입사/gi,
  /공유|share|전파/gi,
  /문서화|documentation/gi,
  /멘토|mentor/gi,
  /리뷰어|reviewer|CODEOWNERS/gi,
  /스탠드업|standup|회고|retro/gi,
  /회의|meeting|미팅/gi,
  /보고|report|리포트/gi,
];

const patternNames = [
  "팀|team",
  "코드리뷰|code review",
  "PR|pull request",
  "컨벤션|convention",
  "린트|lint|eslint|prettier",
  "브랜치|branch",
  "merge|머지",
  "동료|peer",
  "온보딩|onboard",
  "공유|share|전파",
  "문서화|documentation",
  "멘토|mentor",
  "리뷰어|reviewer|CODEOWNERS",
  "스탠드업|standup|회고|retro",
  "회의|meeting|미팅",
  "보고|report|리포트",
];

const patternFreq = new Array(teamImpactPatterns.length).fill(0);
let evangelistViaCandidate = 0;
let evangelistViaFallback = 0;

const knownEvangelist = new Set([
  "rustdesk/rustdesk", "denoland/deno", "oven-sh/bun",
  "prisma/prisma", "pnpm/pnpm", "nrwl/nx", "biomejs/biome",
  "wasp-lang/wasp", "toss/es-toolkit", "tinyhttp/tinyhttp",
  "firoorg/firo", "instructure/instructure-ui", "mizchi/lsmcp",
  "enuno/unifi-mcp-server", "eser/aya.is", "allora-network/allora-sdk-py",
  "constROD/template-expo", "doublegate/SPECTRE", "AirOne-dev/dbgate-ai"
]);

let totalValidBlocks = 0;

for (const block of blocks) {
  const headerMatch = block.match(/^=== (.+?) \(stars: (\d+)\) ===/m);
  if (!headerMatch) continue;
  const repo = headerMatch[1];
  const content = block.replace(/^=== .+ ===\n?/m, "").trim();
  if (!content || content.length < 10) continue;
  totalValidBlocks++;

  const scores = calculateScores(content);

  // 각 패턴 히트 집계
  let hitCount = 0;
  const hitPatterns: string[] = [];
  for (let i = 0; i < teamImpactPatterns.length; i++) {
    const cloned = new RegExp(teamImpactPatterns[i].source, teamImpactPatterns[i].flags);
    if (cloned.test(content)) {
      patternFreq[i]++;
      hitCount++;
      hitPatterns.push(patternNames[i]);
    }
  }

  if (!knownEvangelist.has(repo)) continue;

  // dominant dimension
  let maxKey = "automation";
  let maxVal = -1;
  for (const [k, v] of Object.entries(scores)) {
    if (v > maxVal) { maxVal = v; maxKey = k; }
  }

  const isCandidate = scores.teamImpact >= 55;

  if (isCandidate) {
    evangelistViaCandidate++;
    console.log(`[CANDIDATE] ${repo.padEnd(42)} team=${String(scores.teamImpact).padStart(3)} hitPats=${hitCount} → ${hitPatterns.join(", ")}`);
  } else {
    evangelistViaFallback++;
    console.log(`[FALLBACK]  ${repo.padEnd(42)} team=${String(scores.teamImpact).padStart(3)} dominant=${maxKey}(${maxVal}) hitPats=${hitCount} → ${hitPatterns.join(", ")}`);
  }
}

console.log(`\n=== Evangelist 분류 경로 ===`);
console.log(`Candidate system (teamImpact>=55): ${evangelistViaCandidate}개 (${Math.round(evangelistViaCandidate/knownEvangelist.size*100)}%)`);
console.log(`Fallback (dominant=teamImpact):    ${evangelistViaFallback}개 (${Math.round(evangelistViaFallback/knownEvangelist.size*100)}%)`);
console.log(`Total evangelist:                  ${knownEvangelist.size}개`);

console.log(`\n=== teamImpact 패턴별 히트율 (전체 ${totalValidBlocks}개 repo) ===`);
for (let i = 0; i < patternNames.length; i++) {
  const rate = Math.round(patternFreq[i] / totalValidBlocks * 100);
  const bar = "█".repeat(Math.round(rate / 5));
  console.log(`${patternNames[i].padEnd(35)} ${String(patternFreq[i]).padStart(2)}/${totalValidBlocks} (${String(rate).padStart(3)}%) ${bar}`);
}

// fallback 케이스의 다른 후보 부재 이유 분석
console.log(`\n=== Fallback 케이스 상세 (왜 후보가 없었나) ===`);
for (const block of blocks) {
  const headerMatch = block.match(/^=== (.+?) \(stars: (\d+)\) ===/m);
  if (!headerMatch) continue;
  const repo = headerMatch[1];
  const content = block.replace(/^=== .+ ===\n?/m, "").trim();
  if (!content || content.length < 10) continue;
  if (!knownEvangelist.has(repo)) continue;

  const scores = calculateScores(content);
  if (scores.teamImpact >= 55) continue; // candidate케이스는 스킵

  const hasPuppetMaster = scores.automation >= 55 && scores.toolDiversity >= 40;
  const hasDaredevil = scores.automation >= 45 && scores.security < 20;
  const hasFortress = scores.security >= 55;
  const hasLegislator = scores.control >= 55;
  const hasCraftsman = (() => {
    const vals = Object.values(scores);
    const avg2 = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((acc, v) => acc + (v - avg2) ** 2, 0) / vals.length;
    const sd = Math.sqrt(variance);
    return sd < 20 && avg2 >= 25;
  })();

  console.log(`  ${repo}`);
  console.log(`    scores: auto=${scores.automation} ctrl=${scores.control} tool=${scores.toolDiversity} ctx=${scores.contextAwareness} team=${scores.teamImpact} sec=${scores.security} agent=${scores.agentOrchestration}`);
  console.log(`    no candidates: puppet-master=${hasPuppetMaster} daredevil=${hasDaredevil} fortress=${hasFortress} legislator=${hasLegislator} craftsman=${hasCraftsman}`);
}
