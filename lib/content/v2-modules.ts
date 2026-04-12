import type { ModuleBlock, AxisKey } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 탐색/구축
  { axis: 'harness', direction: 'G',
    wit: '"이거 좋대" 듣고 바로 깔았는데, 어떻게 쓰는지는 아직 안 찾아봤죠?',
    exploration: '깔아만 둔 도구 중에 하나만 골라서 제대로 써보세요. 설정 한 줄 바꾸는 것부터가 시작이에요.' },
  { axis: 'harness', direction: 'H',
    wit: '"이거 내가 만들면 되지" 하고 3시간 썼는데, 이미 누가 만들어둔 게 있었어요. 그거 아셨나요?',
    exploration: '직접 만들기 전에, 남이 이미 만들어둔 게 있는지 한번 찾아보세요. 시간이 확 줄어들어요.' },
  // 통제/위임
  { axis: 'control', direction: 'R',
    wit: '"절대 하지 마"라고 써놨는데, AI가 또 했죠?',
    exploration: '"하지 마"라고 써둔 것 중에 하나만 지워보세요. 없어도 돌아가면, 처음부터 필요 없던 거였어요.' },
  { axis: 'control', direction: 'D',
    wit: '"알아서 해" 했더니 진짜로 알아서 해버렸다. 되돌리는 데 더 오래 걸렸어요.',
    exploration: '"이것만은 절대 하지 마"를 딱 하나만 적어보세요. AI가 실수했을 때 최소한의 안전장치가 생겨요.' },
  // 맥락/핵심
  { axis: 'verbose', direction: 'V',
    wit: 'AI한테 설명하다가 "내가 왜 이렇게까지 설명하고 있지?" 싶었을 겁니다.',
    exploration: '가장 길게 쓴 부분을 3줄로 줄여보세요. 나머지는 별도 파일로 빼도 돼요. AI가 더 빠르게 이해합니다.' },
  { axis: 'verbose', direction: 'C',
    wit: '"이 정도면 알아듣겠지" — AI는 완전 다른 걸 만들어왔죠.',
    exploration: 'AI가 같은 실수를 반복하면, "왜 이걸 해야 하는지" 이유를 한 줄만 적어보세요. 그 한 줄이 반복을 끊어줘요.' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S',
    wit: '.md를 정리하다가 "정리하는 규칙"까지 만들고 있었어요. 맞죠?',
    exploration: '비슷한 내용끼리 합칠 수 있는 거 없는지 한번 봐보세요. 너무 잘게 나누면 AI도 헷갈려해요.' },
  { axis: 'structure', direction: 'F',
    wit: '지난달에 쓴 .md를 열었는데, 본인이 적은 건지 AI가 적은 건지 모르겠더라고요.',
    exploration: '제목 3개만 만들어보세요 — "이렇게 해줘", "이건 하지 마", "이런 식으로 말해줘". 그것만으로 AI가 훨씬 잘 알아들어요.' },
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
