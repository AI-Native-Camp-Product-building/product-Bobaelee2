import { describe, test, expect } from 'vitest';
import { analyzeV2 } from '@/lib/analyzer/index';

describe('v2 full pipeline', () => {
  test('NEVER 많은 장문 구조화 텍스트 → 통제+장황+구조화 판정', () => {
    const text = `# Rules
## Security
- NEVER commit .env
- NEVER expose API keys
- MUST check before push

## Tools
- Slack integration
- Notion integration

## Workflow
- ALWAYS review before merge
- NEVER skip tests`;

    const result = analyzeV2(text);
    expect(result.typeCode).toHaveLength(4);
    expect(result.persona).toBeDefined();
    expect(result.persona.name).toBeTruthy();
    expect(result.witItems.length).toBeGreaterThanOrEqual(2);
    expect(result.explorationItems.length).toBeGreaterThanOrEqual(2);
    // 통제(R) 기대
    expect(result.axisScores.judgments.control.direction).toBe('R');
  });

  test('짧은 자유형 텍스트 → 간결', () => {
    const text = 'just use common sense\nbe helpful';
    const result = analyzeV2(text);
    expect(result.axisScores.judgments.verbose.direction).toBe('C');
  });

  test('모든 결과 필드가 존재', () => {
    const text = '# My Rules\n- NEVER break things\n- Use Slack for comms';
    const result = analyzeV2(text);

    expect(result.typeCode).toBeTruthy();
    expect(result.axisScores).toBeDefined();
    expect(result.axisScores.judgments).toBeDefined();
    expect(result.persona).toBeDefined();
    expect(result.persona.typeCode).toBe(result.typeCode);
    expect(result.witItems).toBeDefined();
    expect(result.explorationItems).toBeDefined();
    expect(result.mdStats).toBeDefined();
  });

  test('hooks + agent 패턴이 많으면 하네스(H) 판정', () => {
    const text = `# Hooks
hooks configuration
PreToolUse hooks
PostToolUse hooks

# Agent
autonomous agent loop
iteration management
parallel agent execution
agent orchestration patterns`;

    const result = analyzeV2(text);
    expect(result.axisScores.judgments.harness.direction).toBe('H');
  });

  test('외부 도구가 많으면 하기스(G) 판정', () => {
    const text = `Use Slack for communication
Notion for documentation
Google Sheets for data
GitHub for code
Supabase for database
Vercel for deployment
Linear for project management
Figma for design
Docker for containers`;

    const result = analyzeV2(text);
    expect(result.axisScores.judgments.harness.direction).toBe('G');
  });
});
