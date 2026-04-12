import type { ModuleBlock, AxisKey } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 탐색/구축
  { axis: 'harness', direction: 'G', wit: '이번 주에 깐 MCP가 지난 주에 깐 것보다 많은 적 없나요?', exploration: '자주 쓰는 MCP가 있다면, 그거 커스터마이징하는 Hook 하나 만들어보세요. 의외로 간단하고, 그게 하네스의 시작이에요.' },
  { axis: 'harness', direction: 'H', wit: '설정 다듬다가 하루가 간 적 없나요?', exploration: '이번 주에 플러그인 마켓플레이스에서 아무거나 하나 깔아보세요. 남이 만든 걸 쓰면 내가 뭘 더 만들어야 할지 보여요.' },
  // 통제/위임
  { axis: 'control', direction: 'R', wit: 'NEVER 12개 써놓고도 불안해서 한 번 더 확인하러 돌아온 적 없나요?', exploration: 'CLAUDE.md에서 NEVER 하나만 지워보세요. 진짜로 그 규칙이 없으면 어떤 일이 벌어지는지 — 의외로 아무 일도 안 벌어질 수도 있어요.' },
  { axis: 'control', direction: 'D', wit: 'bypass 모드 켜놓고 커피 마시러 갔다가, 뭔가 잘못된 적 없나요?', exploration: 'CLAUDE.md에 deny 규칙 하나만 추가해보세요. git push --force 같은 거. 실수 한 번이면 충분하잖아요.' },
  // 맥락/핵심
  { axis: 'verbose', direction: 'V', wit: '배경 설명 쓰다가 이게 프롬프트인지 에세이인지 헷갈린 적 없나요?', exploration: 'CLAUDE.md에서 가장 긴 섹션을 3줄로 요약해보세요. 남은 건 @references.md로 빼면 본문이 깔끔해져요.' },
  { axis: 'verbose', direction: 'C', wit: '짧게 쓰고 "이 정도면 충분하지" 했는데, AI가 엉뚱한 걸 해온 적 없나요?', exploration: 'AI가 자꾸 같은 실수를 반복하면, 그 이유를 CLAUDE.md에 한 줄 적어보세요. "왜 이 규칙이 필요한지"만 추가해도 정확도가 확 올라가요.' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S', wit: '문서 정리하다가 목차가 점점 길어지는 걸 본 적 없나요?', exploration: '섹션 3개 이상 합칠 수 있는 거 없는지 한번 봐보세요. 구조가 너무 잘게 쪼개지면 AI도 컨텍스트를 놓쳐요.' },
  { axis: 'structure', direction: 'F', wit: '그냥 자유롭게 써서 넘겼는데, 나중에 뭐 했는지 기억 안 난 적 없나요?', exploration: 'CLAUDE.md에 ## 헤딩 3개만 넣어보세요. "규칙", "스타일", "금지사항" — 이것만으로도 AI가 읽기 훨씬 편해져요.' },
];

/**
 * 타입 코드에 맞는 위트 블록 반환 (가장 확신도 높은 2-3개)
 */
export function getWitItems(
  typeCode: string,
  judgments: Record<AxisKey, { direction: string; confidence: number }>
): string[] {
  const sorted = AXIS_ORDER
    .map(axis => ({ axis, ...judgments[axis] }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return sorted.map(({ axis, direction }) => {
    const block = MODULE_BLOCKS.find(b => b.axis === axis && b.direction === direction);
    return block?.wit ?? '';
  }).filter(Boolean);
}

/**
 * 탐험 제안 반환 (가장 확신도 높은 3개 축의 반대 방향)
 */
export function getExplorationItems(
  typeCode: string,
  judgments: Record<AxisKey, { direction: string; confidence: number }>
): string[] {
  const sorted = AXIS_ORDER
    .map(axis => ({ axis, ...judgments[axis] }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return sorted.map(({ axis, direction }) => {
    const labels = AXIS_LABELS[axis];
    const oppositeDirection = direction === labels.a ? labels.b : labels.a;
    const block = MODULE_BLOCKS.find(b => b.axis === axis && b.direction === oppositeDirection);
    return block?.exploration ?? '';
  }).filter(Boolean);
}
