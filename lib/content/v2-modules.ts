import type { ModuleBlock, AxisKey } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';

export const MODULE_BLOCKS: ModuleBlock[] = [
  // 하기스/하네스
  { axis: 'harness', direction: 'G', wit: '이번 주에 깐 MCP가 지난 주에 깐 것보다 많은 적 없나요?', exploration: '자주 쓰는 것 하나만 깊이 파보면 새로운 세계가 열릴 수도' },
  { axis: 'harness', direction: 'H', wit: '설정 다듬다가 하루가 간 적 없나요?', exploration: '가끔은 새로운 도구를 아무 계획 없이 깔아보는 것도 발견이야' },
  // 통제/위임
  { axis: 'control', direction: 'R', wit: 'NEVER 12개 써놓고도 불안해서 한 번 더 확인하러 돌아온 적 없나요?', exploration: '한 번쯤 규칙 없이 AI를 풀어보면 의외의 결과가 나올지도' },
  { axis: 'control', direction: 'D', wit: 'bypass 모드 켜놓고 커피 마시러 갔다가, 뭔가 잘못된 적 없나요?', exploration: '중요한 작업에 가드레일 하나만 걸어보면 밤잠이 편할 수도' },
  // 장황/간결
  { axis: 'verbose', direction: 'V', wit: 'CLAUDE.md 수정하다가 이게 문서인지 자서전인지 헷갈린 적 없나요?', exploration: '한번 핵심 3줄만 남기고 다 지워보면, AI가 의외로 잘할 수도' },
  { axis: 'verbose', direction: 'C', wit: '3줄 쓰고 "이 정도면 충분하지" 했는데, 클로드가 전혀 다른 걸 해온 적 없나요?', exploration: '자주 반복하는 지시가 있다면, 그건 CLAUDE.md에 적어둘 타이밍' },
  // 설계/실행
  { axis: 'plan', direction: 'P', wit: '@import 구조 잡다가 정작 코드는 한 줄도 안 쓴 채로 하루가 간 적 없나요?', exploration: '가끔은 구조 없이 일단 돌려보는 게 더 빠른 발견일 수도' },
  { axis: 'plan', direction: 'X', wit: '일단 돌려보고 고치자 했는데, 고칠 게 산더미가 된 적 없나요?', exploration: '다음 프로젝트는 AGENTS.md부터 써보면 의외로 속도가 날 수도' },
  // 구조화/자유형
  { axis: 'structure', direction: 'S', wit: '헤딩 레벨 정하다가 30분 쓴 적 없나요?', exploration: '다음엔 생각나는 대로 먼저 쓰고 나중에 정리하면 더 빠를 수도' },
  { axis: 'structure', direction: 'F', wit: '나중에 정리해야지 하고 3개월째 산문체인 적 없나요?', exploration: '헤딩 3개만 넣어보면 클로드가 놀랍도록 다르게 행동할 수도' },
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
