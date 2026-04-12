import type { ModuleBlock, AxisKey } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 탐색/구축
  { axis: 'harness', direction: 'G',
    wit: '"이거 좋대" 듣고 바로 깔았는데, 어떻게 쓰는지는 아직 안 찾아본 거 몇 개쯤 되지 않나요?',
    exploration: '자주 쓰는 MCP 하나를 골라서 Hook으로 커스터마이징해보세요. 그 순간 하기스에서 견습생으로 올라갑니다. 🐴' },
  { axis: 'harness', direction: 'H',
    wit: '"이거 내가 만들면 되지" 하고 3시간 쓴 건데, 이미 누가 만들어둔 게 있었던 적 없나요?',
    exploration: '플러그인 마켓에서 남이 만든 거 하나 깔아보세요. 내가 뭘 더 만들어야 할지 선명해집니다.' },
  // 통제/위임
  { axis: 'control', direction: 'R',
    wit: '"절대 하지 마"라고 써놨는데, AI가 그거 정확히 그대로 한 적 없나요?',
    exploration: '.md에서 NEVER 하나만 지워보세요. 그 규칙 없이도 돌아가면 — 처음부터 필요 없던 규칙이었어요.' },
  { axis: 'control', direction: 'D',
    wit: '"알아서 해" 했더니 진짜로 알아서 해버려서 되돌리느라 더 오래 걸린 적 없나요?',
    exploration: '.md에 deny 규칙 딱 하나만 추가해보세요. git push --force 같은 거. Hook으로 막으면 하네스 레벨업 보너스. 🐴' },
  // 맥락/핵심
  { axis: 'verbose', direction: 'V',
    wit: 'AI한테 설명하다가 "이거 내가 왜 이렇게까지 설명하고 있지?" 한 적 없나요?',
    exploration: '.md에서 가장 긴 섹션을 3줄로 요약하고 나머지는 @references.md로 빼보세요. AI 응답 속도가 체감될 겁니다.' },
  { axis: 'verbose', direction: 'C',
    wit: '"이 정도면 알아듣겠지" 했는데 AI가 완전 다른 걸 만들어온 적 없나요?',
    exploration: 'AI가 같은 실수를 반복하면, .md에 "왜 이 규칙이 필요한지" 한 줄만 추가해보세요. 그 한 줄이 반복 실수를 끊어줍니다.' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S',
    wit: '.md를 정리하다가 "정리하는 규칙"까지 적기 시작한 적 없나요?',
    exploration: '합칠 수 있는 섹션 3개를 찾아서 하나로 묶어보세요. AI는 구조가 깊어질수록 컨텍스트를 놓칩니다.' },
  { axis: 'structure', direction: 'F',
    wit: '지난달에 쓴 .md를 열었는데 본인이 적은 게 맞나 싶었던 적 없나요?',
    exploration: '.md에 ## 헤딩 3개만 넣어보세요 — "규칙", "스타일", "금지사항". 이것만으로 AI 이해도가 달라집니다.' },
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
