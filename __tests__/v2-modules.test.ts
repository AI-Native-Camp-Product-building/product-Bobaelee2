import { describe, test, expect } from 'vitest';
import { MODULE_BLOCKS, getWitItems, getExplorationItems } from '@/lib/content/v2-modules';
import type { AxisKey } from '@/lib/v2-types';

describe('v2 modules', () => {
  test('8개 모듈 블록 존재 (4축 × 2방향)', () => {
    expect(MODULE_BLOCKS).toHaveLength(8);
  });

  test('모든 블록에 wit, exploration 존재', () => {
    for (const block of MODULE_BLOCKS) {
      expect(block.wit).toBeTruthy();
      expect(block.exploration).toBeTruthy();
      expect(block.axis).toBeTruthy();
      expect(block.direction).toBeTruthy();
    }
  });

  test('getWitItems는 2-3개 반환', () => {
    const judgments: Record<AxisKey, { direction: string; confidence: number }> = {
      harness: { direction: 'G', confidence: 0.9 },
      control: { direction: 'R', confidence: 0.8 },
      verbose: { direction: 'V', confidence: 0.7 },
      plan: { direction: 'P', confidence: 0.6 },
    };
    const items = getWitItems('GRVP', judgments);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.length).toBeLessThanOrEqual(3);
    // 확신도 높은 순: harness, control, verbose
    expect(items[0]).toContain('MCP');  // harness G wit
  });

  test('getExplorationItems는 반대 방향의 탐험 반환', () => {
    const judgments: Record<AxisKey, { direction: string; confidence: number }> = {
      harness: { direction: 'G', confidence: 0.9 },
      control: { direction: 'R', confidence: 0.8 },
      verbose: { direction: 'V', confidence: 0.7 },
      plan: { direction: 'P', confidence: 0.6 },
    };
    const items = getExplorationItems('GRVP', judgments);
    expect(items.length).toBeGreaterThanOrEqual(2);
    // harness G → 반대(H)의 exploration
    expect(items[0]).toContain('새로운 도구');  // harness H exploration
  });
});
