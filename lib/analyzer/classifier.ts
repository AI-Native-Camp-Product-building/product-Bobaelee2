/**
 * 6개 차원 점수와 통계를 바탕으로 8가지 페르소나 중 하나를 분류한다
 */
import type { DimensionScores, MdStats, PersonaKey } from "@/lib/types";

/** 가장 높은 점수의 차원을 페르소나로 매핑 */
const DIMENSION_TO_PERSONA: Record<keyof DimensionScores, PersonaKey> = {
  automation: "puppet-master",
  control: "legislator",
  toolDiversity: "collector",
  maturity: "deep-diver",
  collaboration: "evangelist",
  security: "fortress",
};

/**
 * DimensionScores의 평균값을 계산한다
 */
function average(scores: DimensionScores): number {
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * DimensionScores의 표준편차를 계산한다
 */
function stdDev(scores: DimensionScores): number {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * DimensionScores의 최대값을 반환한다
 */
function maxScore(scores: DimensionScores): number {
  return Math.max(...Object.values(scores));
}

/**
 * 가장 높은 점수의 차원 키를 반환한다
 */
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
 * 우선순위 순서로 규칙을 적용한다:
 * 1. totalLines ≤ 10 & avg < 20 → minimalist
 * 2. max < 25 → minimalist
 * 3. max ≥ 80 & stdDev ≥ 30 → 상위 차원 기반 특수 분류
 * 4. automation ≥ 70 & toolDiversity ≥ 70 → puppet-master
 * 5. security ≥ 75 → fortress
 * 6. control ≥ 75 → legislator
 * 7. toolDiversity ≥ 70 & automation < 40 → collector
 * 8. totalLines ≤ 30 & control < 25 & maturity < 30 → speedrunner
 * 9. stdDev < 20 → craftsman
 * 10. 기본: 가장 높은 차원의 페르소나
 */
export function classifyPersona(scores: DimensionScores, mdStats: MdStats): PersonaKey {
  const avg = average(scores);
  const sd = stdDev(scores);
  const max = maxScore(scores);
  const dominant = dominantDimension(scores);

  // 규칙 1: 매우 짧고 내용이 거의 없는 경우
  if (mdStats.totalLines <= 10 && avg < 20) {
    return "minimalist";
  }

  // 규칙 2: 모든 차원이 낮은 경우
  if (max < 25) {
    return "minimalist";
  }

  // 규칙 3: 확장 수집 에코시스템 분류
  if (mdStats.isExpandedInput) {
    const totalEcosystem = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.commandCount;

    // 3a: S~A급 → 로데오 마스터 (하네스를 완전히 길들인 카우보이)
    // 기준: Cherry Studio(43K★), everything-claude-code(134K★)
    if (totalEcosystem >= 25 && mdStats.hookCount >= 5) {
      return "architect";
    }

    // 3b: 중간급 → 하기스 아키텍트 (기저귀 단계)
    // 에코시스템은 있는데 아직 엉성한 사람
    if (totalEcosystem >= 10 && mdStats.hookCount >= 2 && totalEcosystem < 25) {
      return "huggies";
    }
  }

  // 규칙 4: 극단적으로 높은 점수 + 불균형 분포
  if (max >= 80 && sd >= 30) {
    // 자동화+도구 다양성 모두 높으면 봇 농장주
    if (scores.automation >= 75 && scores.toolDiversity >= 75) {
      return "puppet-master";
    }
    // 보안이 지배적이면 요새
    if (dominant === "security") {
      return "fortress";
    }
    // 통제가 지배적이면 입법자
    if (dominant === "control") {
      return "legislator";
    }
    // 나머지는 과몰입러
    return "deep-diver";
  }

  // 규칙 4: 자동화 높고 보안 매우 낮음 → 위험물 취급자
  if (scores.automation >= 50 && scores.security < 20) {
    return "daredevil";
  }

  // 규칙 5: 자동화 + 도구 다양성 모두 높음 → 봇 농장주
  if (scores.automation >= 70 && scores.toolDiversity >= 70) {
    return "puppet-master";
  }

  // 규칙 6: 자동화 높고 도구 적음 → 맥가이버
  if (scores.automation >= 65 && scores.toolDiversity < 30) {
    return "macgyver";
  }

  // 규칙 7: 보안 의식이 매우 강함
  if (scores.security >= 70) {
    return "fortress";
  }

  // 규칙 8: 통제 성향이 매우 강함
  if (scores.control >= 75) {
    return "legislator";
  }

  // 규칙 9: 협업 성향이 매우 강함 → 협업 전도사
  if (scores.collaboration >= 55) {
    return "evangelist";
  }

  // 규칙 10: 도구는 많이 쓰지만 자동화는 안 함 → 수집가
  if (scores.toolDiversity >= 70 && scores.automation < 40) {
    return "collector";
  }

  // 규칙 11: 짧고 통제/성숙도 낮음 → 스피드러너
  if (mdStats.totalLines <= 30 && scores.control < 25 && scores.maturity < 30) {
    return "speedrunner";
  }

  // 규칙 12 (확장 수집): 추가 분류
  if (mdStats.isExpandedInput) {
    const totalEcosystem = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.commandCount;
    if (totalEcosystem >= 10 && scores.automation < 40) {
      return "collector";
    }
    if (mdStats.hookCount >= 3 && scores.toolDiversity >= 50) {
      return "puppet-master";
    }
  }

  // 규칙 13: 표준편차가 낮으면 균형 잡힌 장인
  if (sd < 20) {
    return "craftsman";
  }

  // 규칙 14: 가장 높은 차원으로 기본 분류
  return DIMENSION_TO_PERSONA[dominant];
}
