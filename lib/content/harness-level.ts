/**
 * 하네스 레벨 판정
 * H/G 축 + confidence로 4단계 레벨 결정
 */
import type { AxisJudgment } from '../v2-types';

export interface HarnessLevel {
  emoji: string;
  title: string;
  description: string;
}

export function getHarnessLevel(harnessJudgment: AxisJudgment): HarnessLevel {
  const { direction, confidence } = harnessJudgment;

  if (direction === 'H' && confidence >= 0.7) {
    return {
      emoji: '🤠',
      title: '로데오급',
      description: '하네스를 직접 깎고, 남한테도 나눠주는 수준. Hook도 짜고, 스킬도 만들고, 에이전트도 돌린다. 목장이 점점 커지고 있다.',
    };
  }
  if (direction === 'H') {
    return {
      emoji: '🐴',
      title: '목장 견습생',
      description: '직접 만들긴 만드는데, 아직 목장은 작다. 하네스를 깎는 법을 배우는 중이고, 가끔 기존 부품도 가져다 쓴다.',
    };
  }
  if (direction === 'G' && confidence >= 0.7) {
    return {
      emoji: '🧲',
      title: '하네스 수집가',
      description: '좋은 하네스 고르는 눈은 확실하다. 직접 만들진 않지만, 뭐가 좋은지 정확히 안다. 남이 만든 걸 조합하는 것도 능력이다.',
    };
  }
  return {
    emoji: '👶',
    title: '하기스',
    description: '하네스가 뭔지는 알겠는데, 아직 기저귀 단계. 괜찮다 — 다들 여기서 시작했다.',
  };
}
