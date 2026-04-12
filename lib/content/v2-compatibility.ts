/**
 * v2 페르소나 궁합 로직
 * 4축 기반으로 최적 궁합 / 보완 관계 / 최악 궁합을 계산한다.
 *
 * 규칙:
 * - 최적 궁합(soulmate): 3축 동일, 1축만 다름 (구조>맥락>통제>탐색 우선)
 * - 보완 관계(complement): 2축 동일, 2축 다름 (맥락+구조 축 반전)
 * - 최악 궁합(nemesis): 4축 모두 반대
 */
import { V2_PERSONAS } from './v2-personas';
import type { AxisKey } from '../v2-types';

/** 궁합 항목 타입 */
export interface V2CompatItem {
  type: 'soulmate' | 'complement' | 'nemesis';
  targetTypeCode: string;
  targetName: string;
  targetEmoji: string;
  description: string;
}

/** 축 인덱스 매핑 (타입코드 내 위치) */
const AXIS_INDEX: Record<AxisKey, number> = {
  harness: 0,
  control: 1,
  verbose: 2,
  structure: 3,
};

/** 축별 반전 매핑 */
const FLIP: Record<string, string> = {
  G: 'H', H: 'G',
  R: 'D', D: 'R',
  V: 'C', C: 'V',
  S: 'F', F: 'S',
};

/** 타입코드에서 특정 축들을 반전한 새 타입코드를 반환 */
function flipAxes(typeCode: string, axes: AxisKey[]): string {
  const chars = typeCode.split('');
  for (const axis of axes) {
    const idx = AXIS_INDEX[axis];
    chars[idx] = FLIP[chars[idx]];
  }
  return chars.join('');
}

/** 최적 궁합 축 반전 우선순위: 구조 > 맥락 > 통제 > 탐색 */
const SOULMATE_PRIORITY: AxisKey[] = ['structure', 'verbose', 'control', 'harness'];

/** 단일 축 차이 내러티브 */
const SINGLE_AXIS_NARRATIVES: Record<AxisKey, (myName: string, myEmoji: string, targetName: string, targetEmoji: string) => string> = {
  harness: (my, myE, target, targetE) =>
    `${myE} ${my}가 MCP 서버를 직접 짜고 있을 때, ${targetE} ${target}는 마켓플레이스에서 별점 순으로 정렬 중이다. 로데오와 하기스의 만남 — 하나가 만들면 다른 하나가 제일 먼저 써본다.`,
  control: (my, myE, target, targetE) =>
    `${myE} ${my}의 CLAUDE.md에는 NEVER가 12개. ${targetE} ${target}의 CLAUDE.md에는 "알아서 해"가 전부다. 한쪽이 "이거 왜 허용했어?"라고 하면 다른 쪽은 "이거 왜 막았어?"라고 한다.`,
  verbose: (my, myE, target, targetE) =>
    `${myE} ${my}의 프롬프트는 A4 세 장. ${targetE} ${target}의 프롬프트는 한 줄. 같은 결과가 나온다. 한쪽은 화가 나고, 다른 쪽은 뿌듯하다.`,
  structure: (my, myE, target, targetE) =>
    `${myE} ${my}의 .md에는 헤딩이 15개, 리스트가 42개. ${targetE} ${target}의 .md는 줄바꿈 없는 의식의 흐름. 한쪽이 정리해주면 다른 쪽이 다시 흐트러뜨린다. 시지프스의 .md 버전.`,
};

/** 이중 축 차이 내러티브 (맥락+구조 반전 — 보완 관계) */
function getComplementNarrative(
  myName: string, myEmoji: string,
  targetName: string, targetEmoji: string,
): string {
  return `${myEmoji} ${myName}가 3시간 걸려 설계한 구조를, ${targetEmoji} ${targetName}가 5분 만에 "이거 너무 복잡한데?"라고 한다. 반대로 ${targetName}가 자유롭게 쏟아낸 아이디어를, ${myName}가 깔끔하게 정리해준다. 서로 짜증나면서도 없으면 안 되는 관계.`;
}

/** 전축 반대 내러티브 (최악 궁합) */
function getNemesisNarrative(
  myName: string, myEmoji: string,
  targetName: string, targetEmoji: string,
): string {
  return `${myEmoji} ${myName}가 완벽한 시스템을 세우면 ${targetEmoji} ${targetName}가 "그거 왜 필요해?"라고 묻는다. ${targetName}가 결과물을 내면 ${myName}가 "이게 어떻게 작동하는 건데?"라고 묻는다. 평행우주에서 온 두 사람. 같은 팀이 되면 매일이 전쟁이다.`;
}

/**
 * v2 타입코드에 대한 궁합 3종을 반환한다.
 * @param typeCode 4글자 타입코드 (예: 'GRVS')
 * @returns 최적 궁합, 보완 관계, 최악 궁합 순 배열
 */
export function getV2Compatibility(typeCode: string): V2CompatItem[] {
  const myPersona = V2_PERSONAS[typeCode];
  if (!myPersona) return [];

  const myName = myPersona.name;
  const myEmoji = myPersona.emoji;

  // 1. 최적 궁합: 우선순위에 따라 1축만 반전
  const soulmateAxis = SOULMATE_PRIORITY[0]; // structure 우선
  const soulmateCode = flipAxes(typeCode, [soulmateAxis]);
  const soulmateDef = V2_PERSONAS[soulmateCode];

  // 2. 보완 관계: 맥락+구조 축 반전
  const complementCode = flipAxes(typeCode, ['verbose', 'structure']);
  const complementDef = V2_PERSONAS[complementCode];

  // 3. 최악 궁합: 전축 반전
  const nemesisCode = flipAxes(typeCode, ['harness', 'control', 'verbose', 'structure']);
  const nemesisDef = V2_PERSONAS[nemesisCode];

  const items: V2CompatItem[] = [];

  if (soulmateDef) {
    items.push({
      type: 'soulmate',
      targetTypeCode: soulmateCode,
      targetName: soulmateDef.name,
      targetEmoji: soulmateDef.emoji,
      description: SINGLE_AXIS_NARRATIVES[soulmateAxis](myName, myEmoji, soulmateDef.name, soulmateDef.emoji),
    });
  }

  if (complementDef) {
    items.push({
      type: 'complement',
      targetTypeCode: complementCode,
      targetName: complementDef.name,
      targetEmoji: complementDef.emoji,
      description: getComplementNarrative(myName, myEmoji, complementDef.name, complementDef.emoji),
    });
  }

  if (nemesisDef) {
    items.push({
      type: 'nemesis',
      targetTypeCode: nemesisCode,
      targetName: nemesisDef.name,
      targetEmoji: nemesisDef.emoji,
      description: getNemesisNarrative(myName, myEmoji, nemesisDef.name, nemesisDef.emoji),
    });
  }

  return items;
}
