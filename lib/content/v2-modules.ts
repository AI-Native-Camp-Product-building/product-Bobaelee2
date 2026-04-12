import type { ModuleBlock, AxisKey } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 탐색/구축
  { axis: 'harness', direction: 'G', wit: '이번 주에 깐 MCP가 지난 주에 깐 것보다 많은 적 없나요?', exploration: '자주 쓰는 것 하나만 깊이 파보면 새로운 세계가 열릴 수도' },
  { axis: 'harness', direction: 'H', wit: '설정 다듬다가 하루가 간 적 없나요?', exploration: '가끔은 새로운 도구를 아무 계획 없이 깔아보는 것도 발견이야' },
  // 통제/위임
  { axis: 'control', direction: 'R', wit: 'NEVER 12개 써놓고도 불안해서 한 번 더 확인하러 돌아온 적 없나요?', exploration: '한 번쯤 규칙 없이 AI를 풀어보면 의외의 결과가 나올지도' },
  { axis: 'control', direction: 'D', wit: 'bypass 모드 켜놓고 커피 마시러 갔다가, 뭔가 잘못된 적 없나요?', exploration: '중요한 작업에 가드레일 하나만 걸어보면 밤잠이 편할 수도' },
  // 맥락/핵심
  { axis: 'verbose', direction: 'V', wit: '배경 설명 쓰다가 이게 프롬프트인지 에세이인지 헷갈린 적 없나요?', exploration: '한 번 핵심만 툭 던져보면, AI가 의외로 잘 알아챌 수도' },
  { axis: 'verbose', direction: 'C', wit: '짧게 쓰고 "이 정도면 충분하지" 했는데, AI가 엉뚱한 걸 해온 적 없나요?', exploration: '자주 반복하는 지시가 있다면, 그건 시스템 프롬프트에 넣을 타이밍' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S', wit: '문서 정리하다가 목차가 점점 길어지는 걸 본 적 없나요?', exploration: '가끔은 구조 없이 자유롭게 쓰면, 새로운 관점이 나올 수도' },
  { axis: 'structure', direction: 'F', wit: '그냥 자유롭게 써서 넘겼는데, 나중에 뭐 했는지 기억 안 난 적 없나요?', exploration: '다음 번에는 기본 틀이라도 만들어두면 나중 일이 편할 수도' },
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
