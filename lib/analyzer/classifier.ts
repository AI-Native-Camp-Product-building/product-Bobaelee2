/**
 * 6개 차원 점수와 통계를 바탕으로 13가지 페르소나를 후보 적합도 기반으로 분류한다
 */
import type { DimensionScores, MdStats, PersonaKey, PersonaResult } from "@/lib/types";

/** 가장 높은 점수의 차원을 페르소나로 매핑 (fallback용) */
const DIMENSION_TO_PERSONA: Record<keyof DimensionScores, PersonaKey> = {
  automation: "puppet-master",
  control: "legislator",
  toolDiversity: "collector",
  contextAwareness: "deep-diver",
  collaboration: "evangelist",
  security: "fortress",
};

/** DimensionScores의 평균값을 계산한다 */
function average(scores: DimensionScores): number {
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** DimensionScores의 표준편차를 계산한다 */
function stdDev(scores: DimensionScores): number {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** DimensionScores의 최대값을 반환한다 */
function maxScore(scores: DimensionScores): number {
  return Math.max(...Object.values(scores));
}

/** 가장 높은 점수의 차원 키를 반환한다 */
function dominantDimension(scores: DimensionScores): keyof DimensionScores {
  let maxKey: keyof DimensionScores = "automation";
  let maxVal = -1;
  for (const [key, val] of Object.entries(scores) as [keyof DimensionScores, number][]) {
    if (val > maxVal) {
      maxVal = val;
      maxKey = key;
    }
  }
  return maxKey;
}

/**
 * 분석 점수와 통계를 기반으로 페르소나를 분류한다
 *
 * 후보 적합도 기반 분류:
 * 1. 특수 케이스 (minimalist) 선처리
 * 2. 모든 후보 페르소나에 적합도 점수를 매김
 * 3. 적합도 순 정렬 → 주/부 페르소나 추출
 */
export function classifyPersona(scores: DimensionScores, mdStats: MdStats): PersonaResult {
  const avg = average(scores);
  const sd = stdDev(scores);
  const max = maxScore(scores);

  // Step 1: 특수 케이스 — 내용이 없는 경우
  if (mdStats.totalLines <= 10 && avg < 20) {
    return { primary: "minimalist", secondary: null };
  }
  if (max < 25) {
    return { primary: "minimalist", secondary: null };
  }

  // Step 2: 모든 후보 페르소나에 적합도 점수를 매김
  const candidates: { persona: PersonaKey; fit: number }[] = [];

  // 에코시스템 기반 (확장 수집 시)
  if (mdStats.isExpandedInput) {
    const eco = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.commandCount;
    if (eco >= 25 && mdStats.hookCount >= 5) {
      candidates.push({ persona: "architect", fit: 95 });
    } else if (eco >= 10 && mdStats.hookCount >= 2) {
      candidates.push({ persona: "huggies", fit: 80 });
    }
  }

  // 차원 기반 후보 — fit은 0~100 정규화 (조건 초과분 기반)
  if (scores.automation >= 70 && scores.toolDiversity >= 70) {
    const fit = (scores.automation - 70) / 30 * 50 + (scores.toolDiversity - 70) / 30 * 50;
    candidates.push({ persona: "puppet-master", fit });
  }
  if (scores.automation >= 50 && scores.security < 20) {
    const gap = scores.automation - scores.security;
    const fit = Math.max(0, (gap - 30) / 70 * 100);
    candidates.push({ persona: "daredevil", fit });
  }
  // macgyver 제거 — 조건(automation>=65, toolDiversity<30)이 비현실적
  if (scores.security >= 70) {
    const fit = (scores.security - 70) / 30 * 100;
    candidates.push({ persona: "fortress", fit });
  }
  if (scores.control >= 75) {
    const fit = (scores.control - 75) / 25 * 100;
    candidates.push({ persona: "legislator", fit });
  }
  if (scores.collaboration >= 55) {
    const fit = (scores.collaboration - 55) / 45 * 100;
    candidates.push({ persona: "evangelist", fit });
  }
  if (scores.toolDiversity >= 70 && scores.automation < 40) {
    const fit = (scores.toolDiversity - 70) / 30 * 50 + (40 - scores.automation) / 40 * 50;
    candidates.push({ persona: "collector", fit });
  }
  if (mdStats.totalLines <= 30 && scores.control < 25 && scores.contextAwareness < 30) {
    candidates.push({ persona: "speedrunner", fit: 50 });
  }
  if (sd < 20 && avg >= 30) {
    const fit = Math.max(0, (avg - 30) / 70 * 100);
    candidates.push({ persona: "craftsman", fit });
  }
  if (max >= 80 && sd >= 30) {
    const fit = (max - 80) / 20 * 50 + Math.min(50, (sd - 30) / 30 * 50);
    candidates.push({ persona: "deep-diver", fit });
  }

  // Step 3: 적합도 순 정렬 → 주/부 추출
  candidates.sort((a, b) => b.fit - a.fit);

  if (candidates.length === 0) {
    // fallback: 가장 높은 차원
    const dominant = dominantDimension(scores);
    return { primary: DIMENSION_TO_PERSONA[dominant], secondary: null };
  }

  const primary = candidates[0].persona;

  // 부 페르소나: 주 페르소나 적합도의 60% 이상일 때만 표시
  let secondary: PersonaKey | null = null;
  if (candidates.length >= 2 && candidates[1].fit >= candidates[0].fit * 0.6) {
    secondary = candidates[1].persona;
  }

  // 주/부가 같은 경우 방지
  if (secondary === primary) {
    secondary = candidates.length >= 3 ? candidates[2].persona : null;
  }

  return { primary, secondary };
}
