/**
 * 4축 이분법 판정 — 패턴 시그널 + 줄 수 + 설정을 합산하여 축별 A/B 결정
 */
import type { MdStats } from '../types';
import type { AxisKey, AxisJudgment, AxisScores, TypeCode } from '../v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '../v2-types';
import {
  countAxisSignals,
  judgeVerboseAxis,
  judgeControlFromSettings,
} from './patterns';

/**
 * 텍스트와 통계를 받아 4축 이분법 판정 수행
 */
export function scoreAxes(text: string, stats: MdStats): AxisScores {
  // 1. 패턴 기반 시그널 카운트 (harness, control, plan 축)
  const patternSignals = countAxisSignals(text, stats);

  // 2. 줄 수 기반 (verbose 축)
  const verboseSignals = judgeVerboseAxis(stats);

  // 3. settings 기반 (control 축 보강)
  const settingsSignals = judgeControlFromSettings(text);

  // 4. 각 축별 판정 조합
  const judgments = {} as Record<AxisKey, AxisJudgment>;

  for (const axis of AXIS_ORDER) {
    let aCount = patternSignals[axis]?.a ?? 0;
    let bCount = patternSignals[axis]?.b ?? 0;

    // 축별 특수 시그널 합산
    if (axis === 'verbose') {
      aCount += verboseSignals.a;
      bCount += verboseSignals.b;
    }
    if (axis === 'control') {
      aCount += settingsSignals.a;
      bCount += settingsSignals.b;
    }

    const total = aCount + bCount;
    const direction = aCount >= bCount
      ? AXIS_LABELS[axis].a
      : AXIS_LABELS[axis].b;
    const confidence = total > 0
      ? Math.max(aCount, bCount) / total
      : 0.5;

    judgments[axis] = { axis, aCount, bCount, direction, confidence };
  }

  // 5. 타입 코드 생성 (4글자)
  const typeCode: TypeCode = AXIS_ORDER.map(axis => judgments[axis].direction).join('');

  return { judgments, typeCode };
}
