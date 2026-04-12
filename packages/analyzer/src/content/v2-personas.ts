import type { V2PersonaDefinition } from '../v2-types.js';

/**
 * 16개 페르소나 — 일상 언어, AI 사용자라면 누구나 공감하는 행동 묘사
 *
 * 축 의미 (내부용, 사용자에게 미노출):
 * - 탐색(G)/구축(H): 남이 만든 거 쓰는 사람 vs 직접 만드는 사람
 * - 통제(R)/위임(D): AI에게 빡빡한 사람 vs AI 믿고 맡기는 사람
 * - 장황(V)/간결(C): 설명 많이 쓰는 사람 vs 짧게 쓰는 사람
 * - 설계(P)/실행(X): 준비 먼저 하는 사람 vs 일단 해보는 사람
 */
export const V2_PERSONAS: Record<string, V2PersonaDefinition> = {
  // === 탐색형(G) — 좋은 걸 찾아서 조합하는 사람 ===
  'GRVP': {
    typeCode: 'GRVP', name: '매뉴얼 콜렉터', emoji: '📚',
    punchline: '쓸지도 모르는 걸 일단 준비해놓는 사람',
    narrative: '좋다는 건 다 깔아봤다. 근데 직접 만든 건 없다. AI한테 하지 말라는 목록은 길고, 준비는 완벽한데 — 정작 실행은 AI가 다 한다. 본인은 "관리"하고 있다고 생각한다.',
  },
  'GRVX': {
    typeCode: 'GRVX', name: '규칙형 수집가', emoji: '🏷️',
    punchline: 'AI가 한 번 실수하면 규칙을 추가하는 사람',
    narrative: '새로운 걸 시도하는 건 좋아하는데, 뭔가 잘못되면 바로 규칙을 건다. 일단 해보고 → 실패하고 → "다음부턴 이거 하지 마" 추가. 이걸 반복하다 보니 금지 목록이 점점 길어지고 있다.',
  },
  'GDVP': {
    typeCode: 'GDVP', name: '맥락 폭격기', emoji: '💬',
    punchline: '시키기 전에 배경 설명이 더 긴 사람',
    narrative: 'AI한테 자유를 주는 편인데, 맥락은 반드시 알려준다. "이건 이래서 이런 거고, 저건 저래서 저런 거야" — 설명을 쓰다 보면 AI보다 본인이 먼저 답을 찾을 때도 있다.',
  },
  'GDVX': {
    typeCode: 'GDVX', name: '의식의 흐름러', emoji: '✉️',
    punchline: '대화하듯 쓰는데 AI가 알아서 잘한다',
    narrative: '규칙도 없고 구조도 없다. 생각나는 대로 쓰고 AI한테 맡긴다. 남들이 보면 대체 어떻게 쓰는 건지 모르겠는데 — 본인은 "그냥 말하면 되잖아"라고 한다. 근데 진짜 된다.',
  },
  'GRCP': {
    typeCode: 'GRCP', name: '세팅 스나이퍼', emoji: '🎯',
    punchline: '깔아놓고 안 쓰는 것도 확실한 사람',
    narrative: '좋다는 건 일단 깔아본다. 근데 "이건 하지 마"도 확실하다. 짧게 쓰는데 그 짧은 글 안에 허용과 금지가 명확하다. 준비는 완벽한데 — 준비한 것의 반도 안 쓴다.',
  },
  'GRCX': {
    typeCode: 'GRCX', name: '스파르탄', emoji: '⚔️',
    punchline: '말은 짧고 "하지 마"가 대부분인 사람',
    narrative: 'AI한테 할 말이 별로 없다. 근데 하지 말라는 건 확실하다. 이것저것 써봤지만 남긴 건 핵심만. 일단 해보고 안 되면 잘라낸다. 간결한 게 아니라 불필요한 걸 못 참는 거다.',
  },
  'GDCP': {
    typeCode: 'GDCP', name: '미니멀 설계자', emoji: '📐',
    punchline: '짧게 시켰는데 AI가 정확히 해온다',
    narrative: 'AI한테 많이 안 쓴다. 근데 쓰는 게 정확하다. 필요한 것만 딱 주고 나머지는 믿고 맡긴다. 효율의 끝판왕인데 — 가끔 너무 적게 줘서 AI가 헤맬 때도 있다.',
  },
  'GDCX': {
    typeCode: 'GDCX', name: '직감의 서퍼', emoji: '🏄',
    punchline: '별로 안 쓰는데 잘 되니까 뭘 더 하겠나',
    narrative: '설정? 최소한. 규칙? 거의 없음. AI한테 맡기고 결과 보고 판단한다. 잘 되면 넘어가고, 안 되면 말을 바꿔본다. 남들은 "어떻게 쓰는 거야?"라고 묻는데 — 본인도 잘 모른다.',
  },

  // === 구축형(H) — 자기만의 방식을 직접 만드는 사람 ===
  'HRVP': {
    typeCode: 'HRVP', name: '결계 아키텍트', emoji: '🏰',
    punchline: 'AI한테 시키기 전에 준비하는 시간이 더 긴 사람',
    narrative: 'AI한테 일 시키려고 규칙을 만들다 보면 하루가 간다. 모든 예외를 미리 생각하고, 모든 경우의 수를 문서화한다. 직접 만든 시스템이라 신뢰할 수 있는데 — 이걸 유지보수하는 것도 일이다.',
  },
  'HRVX': {
    typeCode: 'HRVX', name: '전장의 지휘관', emoji: '🗡️',
    punchline: 'AI 실수할 때마다 시스템이 하나씩 늘어나는 사람',
    narrative: '일단 시키고, 잘못되면 다음부터 안 그러게 직접 장치를 만든다. 경험에서 배우는 구축형. 유연해 보이지만 — 핵심 원칙은 절대 양보 안 한다. 실전에서 단련된 규칙이 쌓여간다.',
  },
  'HDVP': {
    typeCode: 'HDVP', name: '시스템 철학자', emoji: '📖',
    punchline: '직접 다 만들어놓고 AI한테 자유를 주는 사람',
    narrative: '시스템은 직접 짓는데, 그 위에서 AI가 뭘 하든 상관없다. "이해하면 규칙이 필요 없다"고 믿는다. 자유를 주려고 시스템을 만든 건데 — 그 모순을 본인은 모순이라 생각 안 한다.',
  },
  'HDVX': {
    typeCode: 'HDVX', name: '자유로운 오케스트레이터', emoji: '🌀',
    punchline: '설명은 길게 하는데 "알아서 해"로 끝나는 사람',
    narrative: '배경 설명은 넘치게 주고, 규칙은 안 건다. 직접 만든 시스템 위에서 AI가 자유롭게 돌아간다. 혼돈처럼 보이는데 — 본인은 이게 편하다. 문제가 생기면 그때 고치면 되니까.',
  },
  'HRCP': {
    typeCode: 'HRCP', name: '정밀 기계', emoji: '⚙️',
    punchline: 'AI한테 줄 설명서를 만드는 데 이틀 쓴 사람',
    narrative: '짧지만 빈틈없다. 직접 만든 시스템에 직접 쓴 규칙. 한 줄도 낭비 없이 필요한 것만 담았다. 완벽한데 — 다른 사람이 보면 너무 압축돼서 뭔 말인지 모른다.',
  },
  'HRCX': {
    typeCode: 'HRCX', name: '미니멀 해커', emoji: '💻',
    punchline: '겉보기엔 단순한데 열어보면 직접 만든 게 숨어있는 사람',
    narrative: '설명은 짧다. 규칙도 적다. 근데 뒤에서 돌아가는 자동화는 직접 만들었다. 보이는 건 미니멀인데 보이지 않는 곳에 시스템이 있다. 인수인계? 불가능하다.',
  },
  'HDCP': {
    typeCode: 'HDCP', name: '젠 마스터', emoji: '🧘',
    punchline: '아무것도 안 한 것 같은데 AI가 알아서 잘한다',
    narrative: '간결하게 쓰고, AI한테 맡기고, 결과를 본다. 근데 이게 되는 이유는 — 뒤에서 시스템을 직접 세팅해놨기 때문이다. 3일 걸렸다는 건 아무도 모른다. 안 한 게 아니라 안 한 것처럼 보이는 거다.',
  },
  'HDCX': {
    typeCode: 'HDCX', name: '카오스 엔지니어', emoji: '🌪️',
    punchline: '본인이 빠지면 아무도 못 쓰는 시스템의 주인',
    narrative: '직접 만든 건 많은데 기록은 안 한다. AI한테 맡기고 결과만 본다. 설명서도 없고 규칙도 없는데 돌아간다. 주변에서는 대체 어떻게 하는 건지 모르지만 — 본인이 빠지면 모든 게 멈춘다.',
  },
};

export function getPersonaByTypeCode(typeCode: string): V2PersonaDefinition | undefined {
  return V2_PERSONAS[typeCode];
}
