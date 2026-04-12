/**
 * 하네스 레벨 판정
 * H/G 축 + MdStats(직접 만든 스킬/에이전트 수, 줄 수)로 5단계 결정
 *
 * 핵심 기준:
 * - 로데오급: 스킬/에이전트를 직접 만든 사람 (userSkillCount + userAgentCount >= 2)
 * - 목장 견습생: 직접 만들기 시작한 사람 (userSkill/Agent >= 1, 또는 H축 + 높은 신뢰도)
 * - 하네스 수집가: 플러그인/MCP를 잘 조합하는 사람 (G축 + 높은 신뢰도)
 * - 하기스: 남이 만든 거 퍼다 쓰는 단계
 * - 갓부화: .md가 거의 없는 단계
 */
import type { AxisJudgment } from '../v2-types';
import type { MdStats } from '../types';

export interface HarnessLevel {
  emoji: string;
  title: string;
  description: string;
}

export function getHarnessLevel(harnessJudgment: AxisJudgment, stats?: Partial<MdStats>): HarnessLevel {
  const { direction, confidence } = harnessJudgment;
  const userSkills = (stats?.userSkillCount ?? 0) + (stats?.userAgentCount ?? 0);
  const totalLines = stats?.totalLines ?? 0;

  // 로데오급: 스킬/에이전트를 직접 2개 이상 만든 사람
  if (userSkills >= 2) {
    return {
      emoji: '🤠',
      title: '로데오급',
      description: '스킬도 만들고, 에이전트도 돌리고, 남한테 나눠주기까지 한다. 하네스를 직접 깎는 카우보이. 목장이 점점 커지고 있다.',
    };
  }

  // 목장 견습생: 직접 만든 게 1개 이상이거나, H축 + 높은 신뢰도
  if (userSkills >= 1 || (direction === 'H' && confidence >= 0.7)) {
    return {
      emoji: '🐴',
      title: '목장 견습생',
      description: '직접 만들긴 만드는데, 아직 목장은 작다. 하네스를 깎는 법을 배우는 중이고, 가끔 기존 부품도 가져다 쓴다.',
    };
  }

  // H축이지만 낮은 신뢰도 → 수집가와 견습생 사이 → 견습생 쪽
  if (direction === 'H') {
    return {
      emoji: '🐴',
      title: '목장 견습생',
      description: '구축 성향은 보이는데 아직 본격적으로 시작하진 않았다. 하네스를 깎을 나무는 골라둔 상태.',
    };
  }

  // G축 + 높은 신뢰도 → 하네스 수집가
  if (confidence >= 0.7) {
    return {
      emoji: '🧲',
      title: '하네스 수집가',
      description: '좋은 하네스 고르는 눈은 확실하다. 직접 만들진 않지만, 뭐가 좋은지 정확히 안다. 남이 만든 걸 조합하는 것도 능력이다.',
    };
  }

  // G축 + .md 10줄 이하 → 갓부화
  if (totalLines <= 10) {
    return {
      emoji: '🥚',
      title: '갓부화',
      description: 'Claude Code 깔긴 했다. .md 파일이 있다는 것도 안다. 근데 거기까지다. 아직 세상이 눈부시다.',
    };
  }

  // 나머지 → 하기스
  return {
    emoji: '👶',
    title: '하기스',
    description: '하네스가 뭔지는 알겠는데, 아직 기저귀 단계. 남이 만든 거 퍼다 쓰는 중이다. 괜찮다 — 다들 여기서 시작했다.',
  };
}
