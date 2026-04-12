import { describe, test, expect } from 'vitest';
import { scoreAxes } from '@/lib/analyzer/axis-scorer';
import type { MdStats } from '@/lib/types';

const mockStats = (overrides: Partial<MdStats> = {}): MdStats => ({
  totalLines: 50,
  claudeMdLines: 50,
  sectionCount: 3,
  toolNames: [],
  hasMemory: false,
  hasHooks: false,
  hasProjectMd: false,
  ruleCount: 0,
  keywordHits: {},
  keywordUniqueHits: {},
  pluginCount: 0,
  mcpServerCount: 0,
  commandCount: 0,
  hookCount: 0,
  skillCount: 0,
  agentCount: 0,
  skillNames: [],
  pluginSkillCount: 0,
  userSkillCount: 0,
  pluginAgentCount: 0,
  userAgentCount: 0,
  pluginNames: [],
  mcpServerNames: [],
  commandNames: [],
  hasRoleDefinition: false,
  isExpandedInput: false,
  denyCount: 0,
  blocksDangerousOps: false,
  hookPromptCount: 0,
  hookCommandCount: 0,
  pluginEnabledRatio: 0,
  projectMdCount: 0,
  ...overrides,
});

describe('scoreAxes', () => {
  test('NEVER 많은 텍스트는 control축 R(통제)', () => {
    const text = 'NEVER do this\nNEVER do that\nMUST follow rules\nALWAYS check';
    const result = scoreAxes(text, mockStats());
    expect(result.judgments.control.direction).toBe('R');
  });

  test('짧은 CLAUDE.md는 verbose축 C(간결)', () => {
    const text = '# Rules\n- be nice\n- be fast';
    const result = scoreAxes(text, mockStats({ claudeMdLines: 3 }));
    expect(result.judgments.verbose.direction).toBe('C');
  });

  test('typeCode는 4글자', () => {
    const text = 'some text';
    const result = scoreAxes(text, mockStats());
    expect(result.typeCode).toHaveLength(4);
  });

  test('typeCode는 유효한 글자로만 구성', () => {
    const text = 'some text with hooks and NEVER rules';
    const result = scoreAxes(text, mockStats());
    const validChars = ['G', 'H', 'R', 'D', 'V', 'C', 'P', 'X'];
    for (const char of result.typeCode) {
      expect(validChars).toContain(char);
    }
  });

  test('confidence는 0.5~1.0 범위', () => {
    const text = 'NEVER commit .env\nNEVER push secrets';
    const result = scoreAxes(text, mockStats());
    for (const axis of Object.values(result.judgments)) {
      expect(axis.confidence).toBeGreaterThanOrEqual(0.5);
      expect(axis.confidence).toBeLessThanOrEqual(1.0);
    }
  });

  test('시그널 없는 축은 confidence 0.5 (동점)', () => {
    const text = '';
    const result = scoreAxes(text, mockStats({ claudeMdLines: 0 }));
    // 시그널이 전혀 없는 축은 0.5
    // verbose는 줄 수 기반이라 항상 시그널이 있음
    expect(result.judgments.harness.confidence).toBe(0.5);
  });
});
