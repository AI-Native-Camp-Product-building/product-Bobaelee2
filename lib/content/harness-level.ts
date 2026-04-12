/**
 * 하네스 레벨 판정
 *
 * 핵심 철학: "로데오급"은 OMC 같은 프레임워크를 직접 만들어 배포하는 수준.
 * 플러그인/스킬을 설치해서 쓰는 건 아무리 많아도 하기스~수집가 범위.
 *
 * 현실: userSkillCount는 플러그인에서 온 스킬을 완벽히 분리 못 함.
 * 따라서 레벨 기준을 매우 높게 잡아서 진짜 만드는 사람만 상위에 오도록 함.
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
  const hookCount = stats?.hookCount ?? 0;
  const commandCount = stats?.commandCount ?? 0;

  // 로데오급: 하네스 프레임워크를 만들어서 배포하는 수준
  // userSkill 10개 이상 + hook 5개 이상 + command 8개 이상 + 1000줄 이상
  // = OMC급 생태계를 직접 구축한 사람만 해당
  if (userSkills >= 10 && hookCount >= 5 && commandCount >= 8 && totalLines >= 1000) {
    return {
      emoji: '🤠',
      title: '로데오급',
      description: '하네스를 깎아서 생태계로 만든 사람. 플러그인 배포하고, 프레임워크 만들고, 남들이 그 위에서 작업한다. 전설의 카우보이.',
    };
  }

  // 목장 견습생: Hook, 커맨드를 직접 짜서 자동화하는 사람
  // userSkill 5개 이상 + hook 3개 이상
  if (userSkills >= 5 && hookCount >= 3) {
    return {
      emoji: '🐴',
      title: '목장 견습생',
      description: '하네스를 직접 깎기 시작했다. Hook도 짜고, 스킬도 만들고. 아직 목장은 작지만 방향은 확실하다.',
    };
  }

  // 하네스 수집가: 플러그인/MCP를 잘 조합하는 사람
  // plugin 3개 이상 또는 mcp 2개 이상, 또는 H축
  if ((stats?.pluginCount ?? 0) >= 3 || (stats?.mcpServerCount ?? 0) >= 2 || direction === 'H') {
    return {
      emoji: '🧲',
      title: '하네스 수집가',
      description: '좋은 하네스 고르는 눈은 확실하다. 직접 만들진 않지만, 뭐가 좋은지 정확히 안다. 남이 만든 걸 조합하는 것도 능력이다.',
    };
  }

  // 갓부화: .md가 거의 없음
  if (totalLines <= 10) {
    return {
      emoji: '🥚',
      title: '갓부화',
      description: 'Claude Code 깔긴 했다. .md 파일이 있다는 것도 안다. 근데 거기까지다. 아직 세상이 눈부시다.',
    };
  }

  // 하기스: 나머지 전부 — 남이 만든 거 퍼다 쓰는 단계
  return {
    emoji: '👶',
    title: '하기스',
    description: '하네스가 뭔지는 알겠는데, 아직 기저귀 단계. 남이 만든 거 퍼다 쓰는 중이다. 괜찮다 — 다들 여기서 시작했다.',
  };
}
