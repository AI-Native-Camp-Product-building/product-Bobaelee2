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

  // OMC 기준값: userSkill~7, hook~5, cmd~8, plugin~10, mcp~6
  // OMC를 설치한 것만으로는 하기스. 그 위는 OMC 이상을 직접 만든 사람만.

  // 로데오급: OMC 같은 프레임워크를 직접 만들어서 배포하는 수준
  // OMC 기준값의 2배 이상 — 현실적으로 프레임워크 빌더만 도달
  if (userSkills >= 15 && hookCount >= 10 && commandCount >= 15 && totalLines >= 2000) {
    return {
      emoji: '🤠',
      title: '로데오급',
      description: '하네스를 깎아서 생태계로 만든 사람. 프레임워크를 배포하고, 남들이 그 위에서 작업한다. 전설의 카우보이.',
    };
  }

  // 목장 견습생: OMC 위에서 자기만의 스킬/Hook을 추가로 만드는 사람
  // OMC 기준값보다 확실히 높아야 함
  if (userSkills >= 12 && hookCount >= 8) {
    return {
      emoji: '🐴',
      title: '목장 견습생',
      description: '남이 만든 하네스 위에서 자기만의 도구를 만들기 시작했다. 아직 목장은 작지만 방향은 확실하다.',
    };
  }

  // 하네스 수집가: OMC를 넘어서 자기만의 MCP + 플러그인 생태계를 확장한 사람
  // plugin 15개 이상 AND mcp 8개 이상 — OMC 기본(plugin:10, mcp:6)보다 확실히 많아야 함
  if ((stats?.pluginCount ?? 0) >= 15 && (stats?.mcpServerCount ?? 0) >= 8) {
    return {
      emoji: '🧲',
      title: '하네스 수집가',
      description: '좋은 하네스 고르는 눈은 확실하다. OMC 기본 세팅에 MCP도 추가하고, 플러그인도 더 깔고. 직접 만들진 않지만 조합은 프로급.',
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

  // 하기스: 대부분의 사람 — OMC 설치하고 쓰는 수준 포함
  return {
    emoji: '👶',
    title: '하기스',
    description: '하네스가 뭔지는 알겠는데, 아직 기저귀 단계. 남이 만든 거 퍼다 쓰는 중이다. 괜찮다 — 다들 여기서 시작했다.',
  };
}
