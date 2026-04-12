/**
 * 4축 이분법 판정 — 패턴 시그널 + 줄 수 + 설정을 합산하여 축별 A/B 결정
 */
import type { MdStats } from '../types.js';
import type { AxisKey, AxisJudgment, AxisScores, TypeCode } from '@/lib/v2-types';
import { AXIS_ORDER, AXIS_LABELS } from '@/lib/v2-types';
import {
  countAxisSignals,
  judgeVerboseAxis,
  judgeControlFromSettings,
  judgeStructureAxis,
} from './patterns.js';

/**
 * 텍스트와 통계를 받아 4축 이분법 판정 수행
 */
export function scoreAxes(text: string, stats: MdStats): AxisScores {
  // 1. 패턴 기반 시그널 카운트 (harness, control, verbose, structure 축)
  const patternSignals = countAxisSignals(text, stats);

  // 2. verbose 축 (키워드 + 줄 수 기반)
  const verboseSignals = judgeVerboseAxis(stats, text);

  // 3. control 축 보강 (settings.json + CLAUDE.md 분석)
  const settingsSignals = judgeControlFromSettings(text, stats);

  // 4. structure 축 (마크다운 구조 분석)
  const structureSignals = judgeStructureAxis(text);

  // 5. 각 축별 판정 조합
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
    if (axis === 'structure') {
      aCount += structureSignals.a;
      bCount += structureSignals.b;
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

  // 6. 타입 코드 생성 (4글자)
  const typeCode: TypeCode = AXIS_ORDER.map(axis => judgments[axis].direction).join('');

  return { judgments, typeCode };
}
