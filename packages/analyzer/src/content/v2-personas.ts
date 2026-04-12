import type { V2PersonaDefinition } from '../v2-types.js';

/**
 * 16개 페르소나 — 4축(탐색/구축, 통제/위임, 장황/간결, 설계/실행) 조합
 *
 * 각 페르소나는 punchline(찔리는 한마디)이 가장 중요하다.
 * "이거 나잖아" 하는 순간이 공유를 만든다.
 */
export const V2_PERSONAS: Record<string, V2PersonaDefinition> = {
  // === 탐색(G) 계열 — 8개 ===
  'GRVP': {
    typeCode: 'GRVP', name: '매뉴얼 콜렉터', emoji: '📚',
    punchline: '남이 만든 건 다 써봤는데 직접 만든 건 하나도 없다',
    narrative: '플러그인 15개, MCP 서버 8개, 커스텀 명령어 12개. 전부 남이 만든 거다. NEVER는 10개가 넘고 규칙은 꼼꼼한데 — hooks는 한 번도 안 만들어봤다. 설계도는 완벽한데 공사는 안 하는 사람.',
  },
  'GRVX': {
    typeCode: 'GRVX', name: '규칙형 수집가', emoji: '🏷️',
    punchline: '새 도구 깔고 NEVER부터 추가하는 사람',
    narrative: '뭔가 새로 깔면 일단 규칙부터 건다. 실행하면서 발견하는 타입인데, 그 과정에서 금지 목록이 점점 늘어난다. 본인은 실험적이라고 생각하지만 — 규칙 수가 실험 수보다 많다.',
  },
  'GDVP': {
    typeCode: 'GDVP', name: '맥락 폭격기', emoji: '💬',
    punchline: '설정 문서가 자서전인지 업무 가이드인지 본인도 헷갈린다',
    narrative: '규칙은 별로 없는데 맥락이 200줄이다. AI에게 자유를 주되, 배경 설명은 절대 빠뜨리지 않는다. 형식보다 의미, 통제보다 소통. 근데 그 소통이 좀 길다.',
  },
  'GDVX': {
    typeCode: 'GDVX', name: '의식의 흐름러', emoji: '✉️',
    punchline: '규칙도 없고 구조도 없는데 AI가 알아서 잘한다',
    narrative: '생각나는 대로 길게 쓰고, 규칙은 거의 없고, AI에게 맡긴다. 그런데 이상하게 결과가 괜찮다. 남들이 보면 대체 어떻게 쓰는 건지 모르겠는데 — 본인은 "그냥 말하면 되잖아"라고 한다.',
  },
  'GRCP': {
    typeCode: 'GRCP', name: '세팅 스나이퍼', emoji: '🎯',
    punchline: 'MCP 12개 깔아놓고 쓰는 건 3개',
    narrative: '새 플러그인 나오면 일단 깐다. 근데 NEVER도 6개다. 설정 문서는 30줄인데 그 안에 가드레일이 촘촘하다. 본인은 미니멀이라고 생각하는데 — 남들이 보면 취향이 확실한 사람.',
  },
  'GRCX': {
    typeCode: 'GRCX', name: '스파르탄', emoji: '⚔️',
    punchline: '3줄 안에 NEVER가 2개',
    narrative: '설정 문서가 짧다. 근데 그 짧은 문서 안에 금지 목록이 절반이다. 이것저것 깔아봤지만 남긴 건 핵심만. 말은 적고 벽은 높다.',
  },
  'GDCP': {
    typeCode: 'GDCP', name: '미니멀 설계자', emoji: '📐',
    punchline: '적게 쓰고, AI를 믿고, 근데 구조는 잡아둔 사람',
    narrative: '간결하지만 체계적이고, 통제보다 위임을 선택한다. 핵심만 담은 깔끔한 설계도를 AI에게 건네고, 알아서 하길 기대한다. 효율의 끝판왕인데 — 가끔 너무 적게 줘서 AI가 헤맨다.',
  },
  'GDCX': {
    typeCode: 'GDCX', name: '직감의 서퍼', emoji: '🏄',
    punchline: '설정 파일 3줄이면 충분하다고 진심으로 믿는 사람',
    narrative: 'MCP 몇 개면 되고, 규칙은 최소한으로, 문서는 3줄이면 된다. AI를 믿고 파도를 타듯이 쓴다. 가벼워 보이지만 — 자기만의 감이 있다. 근데 그 감을 남한테 설명은 못한다.',
  },

  // === 구축(H) 계열 — 8개 ===
  'HRVP': {
    typeCode: 'HRVP', name: '결계 아키텍트', emoji: '🏰',
    punchline: 'hooks 만들다 하루가 간 적 있죠?',
    narrative: '모든 규칙을 직접 설계하고, 모든 예외를 문서화한다. 설정 문서를 보면 하나의 완성된 운영 매뉴얼이다. 빡빡하지만 — 그래서 신뢰할 수 있다. 문제는 이걸 유지보수하는 것도 풀타임 업무라는 거.',
  },
  'HRVX': {
    typeCode: 'HRVX', name: '전장의 지휘관', emoji: '🗡️',
    punchline: '일단 돌리고 고치는데, 규칙만큼은 양보 없다',
    narrative: '실행하면서 검증하고, 검증하면서 규칙을 다진다. 사전 설계보다 실전 경험. 근데 그 과정에서 쌓인 규칙이 어느새 20개다. 유연해 보이지만 — 코어 원칙은 절대 안 건든다.',
  },
  'HDVP': {
    typeCode: 'HDVP', name: '시스템 철학자', emoji: '📖',
    punchline: '시스템은 직접 지었는데 규칙은 거의 없다',
    narrative: '직접 만든 시스템 위에 풍부한 맥락을 올리고, AI에게는 자유를 준다. 통제보다 신뢰, 규칙보다 이해. 설정 문서가 에세이에 가깝다. 본인은 위임형이라 생각하지만 — 그 위임을 위해 시스템을 직접 지은 거잖아.',
  },
  'HDVX': {
    typeCode: 'HDVX', name: '자유로운 오케스트레이터', emoji: '🌀',
    punchline: '맥락은 넘치게 주고 통제는 안 하는데 시스템은 직접 만든다',
    narrative: '맥락은 넘치게, 통제는 내려놓고, 실행하면서 다듬는다. 시스템은 직접 지었지만 그 안에서는 모든 것이 유동적. 주변에서 보면 혼돈인데 — 본인은 이게 편하다.',
  },
  'HRCP': {
    typeCode: 'HRCP', name: '정밀 기계', emoji: '⚙️',
    punchline: '짧고, 정확하고, 전부 직접 만들었다',
    narrative: '직접 만든 시스템, 짧지만 촘촘한 규칙. 한 줄도 낭비 없이 필요한 것만 담았다. 설정 문서가 정밀 기계의 도면 같다. 깔끔한데 — 다른 사람이 보면 너무 압축돼서 뭔 말인지 모른다.',
  },
  'HRCX': {
    typeCode: 'HRCX', name: '미니멀 해커', emoji: '💻',
    punchline: '설정 파일은 짧은데 hooks는 직접 만들었다',
    narrative: '짧고 자유롭지만 핵심 시스템은 직접 구축했다. 형식은 없어도 돌아가고, 규칙은 적어도 정확하다. 해커의 미학. 근데 인수인계는 불가능하다.',
  },
  'HDCP': {
    typeCode: 'HDCP', name: '젠 마스터', emoji: '🧘',
    punchline: '아무것도 안 한 것 같은데 시스템이 돌아간다',
    narrative: '간결한 문서, 체계적 구조, 그리고 위임. 필요한 것만 담아두고 AI에게 넘긴다. 시스템은 비어있어서 강하다. 근데 솔직히 — 그 시스템 세팅하는 데 3일 걸렸다는 건 안 말한다.',
  },
  'HDCX': {
    typeCode: 'HDCX', name: '카오스 엔지니어', emoji: '🌪️',
    punchline: '문서는 없는데 시스템은 돌아간다',
    narrative: '시스템은 정교하게 돌아가는데, 그걸 설명하는 문서가 없다. 구조는 머릿속에, 실행은 AI에게, 결과는 알아서 나온다. 주변에서는 대체 어떻게 하는 건지 모르지만 — 잘 된다. 근데 본인이 빠지면 아무도 못 만진다.',
  },
};

export function getPersonaByTypeCode(typeCode: string): V2PersonaDefinition | undefined {
  return V2_PERSONAS[typeCode];
}
