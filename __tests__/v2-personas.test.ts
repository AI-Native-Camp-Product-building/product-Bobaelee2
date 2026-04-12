import { describe, test, expect } from 'vitest';
import { V2_PERSONAS, getPersonaByTypeCode } from '@/lib/content/v2-personas';

describe('v2 personas', () => {
  test('32개 페르소나 정의 존재', () => {
    expect(Object.keys(V2_PERSONAS)).toHaveLength(32);
  });

  test('모든 페르소나에 name, tagline, narrative, emoji 존재', () => {
    for (const [code, persona] of Object.entries(V2_PERSONAS)) {
      expect(persona.name).toBeTruthy();
      expect(persona.tagline).toBeTruthy();
      expect(persona.narrative).toBeTruthy();
      expect(persona.emoji).toBeTruthy();
      expect(code).toHaveLength(5);
    }
  });

  test('typeCode와 키가 일치', () => {
    for (const [code, persona] of Object.entries(V2_PERSONAS)) {
      expect(persona.typeCode).toBe(code);
    }
  });

  test('getPersonaByTypeCode로 조회 가능', () => {
    const persona = getPersonaByTypeCode('HDCXF');
    expect(persona).toBeDefined();
    expect(persona?.name).toBe('카오스 엔지니어');
  });

  test('존재하지 않는 타입 코드는 undefined', () => {
    expect(getPersonaByTypeCode('ZZZZZ')).toBeUndefined();
  });
});
