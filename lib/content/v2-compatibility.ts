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
    `${myE} ${my}은(는) 남이 만든 걸 찾아 쓰고, ${targetE} ${target}은(는) 직접 만든다. 탐색자가 발견한 보석을 구축자가 시스템에 녹여내는 황금 콤비.`,
  control: (my, myE, target, targetE) =>
    `${myE} ${my}은(는) AI를 꽉 잡고, ${targetE} ${target}은(는) 풀어준다. 빡빡한 규칙과 자유로운 위임이 만나면 의외로 완벽한 균형이 된다.`,
  verbose: (my, myE, target, targetE) =>
    `${myE} ${my}은(는) 맥락을 설명하고, ${targetE} ${target}은(는) 핵심만 말한다. '왜'를 아는 사람과 '뭘'을 아는 사람이 만나면 가장 효율적인 팀이 탄생한다.`,
  structure: (my, myE, target, targetE) =>
    `${myE} ${my}은(는) 깔끔하게 정리하고, ${targetE} ${target}은(는) 자유롭게 쓴다. 구조와 창의가 만나면 정돈된 카오스가 된다.`,
};

/** 이중 축 차이 내러티브 (맥락+구조 반전 — 보완 관계) */
function getComplementNarrative(
  myName: string, myEmoji: string,
  targetName: string, targetEmoji: string,
): string {
  return `${myEmoji} ${myName}과(와) ${targetEmoji} ${targetName}은(는) 서로 부족한 걸 채워주는 관계다. 한쪽이 "이건 왜 이래?"라고 설명할 때 다른 쪽은 "그래서 뭐 하면 돼?"라고 묻고, 한쪽이 폴더를 정리할 때 다른 쪽은 메모장에 자유롭게 쏟아낸다. 싸우면서 성장하는 타입.`;
}

/** 전축 반대 내러티브 (최악 궁합) */
function getNemesisNarrative(
  myName: string, myEmoji: string,
  targetName: string, targetEmoji: string,
): string {
  return `${myEmoji} ${myName}이(가) 하는 모든 것의 정반대를 ${targetEmoji} ${targetName}이(가) 한다. 한쪽이 체계를 세우면 다른 쪽이 부수고, 한쪽이 설명하면 다른 쪽은 이미 실행 중이다. 같은 팀이 되면 매일이 전쟁이다.`;
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
