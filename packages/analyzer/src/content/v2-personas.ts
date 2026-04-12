import type { V2PersonaDefinition } from '../v2-types.js';

export const V2_PERSONAS: Record<string, V2PersonaDefinition> = {
  // === 하기스(G) 계열 — 16개 ===
  'GRVPS': { typeCode: 'GRVPS', name: '매뉴얼 콜렉터', tagline: '세상의 모든 가이드를 정리해둔 사람', narrative: '남이 만든 좋은 것을 찾아내고, 빠짐없이 세팅하고, 완벽하게 문서화한다. 직접 만들지 않았을 뿐 — 당신의 정리 능력 자체가 이미 하나의 시스템이다.', emoji: '📚' },
  'GRVPF': { typeCode: 'GRVPF', name: '탐색의 설계자', tagline: '아이디어는 넘치고 정리는 머릿속에', narrative: '새로운 가능성을 찾아다니며 꼼꼼하게 규칙까지 세우지만, 문서는 자유분방하다. 머릿속에는 완벽한 지도가 있는데 밖으로 꺼내면 약간 카오스. 근데 본인은 그게 편하다.', emoji: '🗺️' },
  'GRVXS': { typeCode: 'GRVXS', name: '체계적 실험가', tagline: '해보면서 정리하는 사람', narrative: '이것저것 시도하면서도 기록은 체계적이다. 실험은 넓게, 정리는 깔끔하게. 당신의 CLAUDE.md는 실험 노트처럼 깔끔하게 쌓여간다.', emoji: '🧪' },
  'GRVXF': { typeCode: 'GRVXF', name: '자유로운 탐험가', tagline: '가보지 않은 길이 재밌는 사람', narrative: '규칙도 많고 설명도 길지만 형식에는 얽매이지 않는다. 실행하며 배우고, 배운 건 자기만의 방식으로 적어둔다. 정돈되진 않았지만 살아있는 문서.', emoji: '🌊' },
  'GDVPS': { typeCode: 'GDVPS', name: '위임형 큐레이터', tagline: 'AI를 믿고, 좋은 것만 골라놓은 사람', narrative: '좋은 도구를 찾아서 세팅하되, AI에게는 자유를 준다. 맥락은 충분히 주지만 통제는 최소한. 당신의 CLAUDE.md는 가이드북이지 규칙집이 아니다.', emoji: '🎯' },
  'GDVPF': { typeCode: 'GDVPF', name: '흐름의 사상가', tagline: '생각을 풀어놓으면 그게 설계가 되는 사람', narrative: '장황하게 써놓지만 규칙은 아니다. 맥락과 의도를 풍부하게 전달하고, AI가 알아서 하길 기대한다. 형식보다 의미, 통제보다 소통.', emoji: '💭' },
  'GDVXS': { typeCode: 'GDVXS', name: '실용적 브리퍼', tagline: '충분히 알려주고 AI가 하게 두는 사람', narrative: '풍부한 맥락을 구조적으로 정리해두고, 실행은 AI에게 맡긴다. 사전 설계보다는 돌리면서 다듬는 타입. 문서는 깔끔한데 규칙은 느슨하다.', emoji: '📋' },
  'GDVXF': { typeCode: 'GDVXF', name: '의식의 흐름러', tagline: '쓰다 보니 장문, 근데 그게 다 맥락', narrative: '생각나는 대로 길게 쓰고, 구조는 신경 안 쓰고, 규칙도 별로 없다. 그런데 이상하게 AI가 잘 알아듣는다. 당신의 문서는 편지 같다.', emoji: '✉️' },
  'GRCPS': { typeCode: 'GRCPS', name: '미니멀 통제자', tagline: '적게 쓰되 규칙은 확실한 사람', narrative: '문서는 짧지만 NEVER와 MUST가 정확하다. 꼭 필요한 것만 쓰고, 그 안에서 선은 확실히 긋는다. 간결함 속에 단호함.', emoji: '🔒' },
  'GRCPF': { typeCode: 'GRCPF', name: '직감적 파수꾼', tagline: '짧지만 빈틈없는, 본능적 방어선', narrative: '형식은 없지만 핵심 규칙은 놓치지 않는다. 구조 없이 몇 줄 적어놨는데 그게 다 가드레일이다. 최소한의 문서, 최대한의 통제.', emoji: '🛡️' },
  'GRCXS': { typeCode: 'GRCXS', name: '효율의 수호자', tagline: '짧고 체계적이고, 선은 명확한 사람', narrative: '간결하게 쓰되 구조적이고, 규칙은 지키면서 실행 중심이다. 적은 줄 수 안에 놀라운 밀도. 실용주의와 통제의 교차점.', emoji: '⚡' },
  'GRCXF': { typeCode: 'GRCXF', name: '스파르탄', tagline: '말은 적고 규칙은 칼같은 사람', narrative: '3줄 안에 NEVER가 2개. 형식? 불필요. 설계? 실행이 설계다. 최소한의 말로 최대한의 경계를 세우는, 스파르타식 AI 사용.', emoji: '⚔️' },
  'GDCPS': { typeCode: 'GDCPS', name: '미니멀 설계자', tagline: '적게 쓰고, AI를 믿고, 구조는 잡아두는 사람', narrative: '간결하지만 체계적이고, 통제보다 위임을 선택한다. 핵심만 담은 깔끔한 설계도를 AI에게 건네고, 알아서 하길 기대한다.', emoji: '📐' },
  'GDCPF': { typeCode: 'GDCPF', name: '직관적 위임자', tagline: '느낌으로 맡기는데 그게 맞는 사람', narrative: '짧고, 자유롭고, 규칙도 없다. 근데 필요한 맥락은 다 있다. 형식을 벗어나면서도 AI가 필요한 건 챙겨주는, 직관의 설계.', emoji: '🎩' },
  'GDCXS': { typeCode: 'GDCXS', name: '가벼운 실용주의자', tagline: '깔끔하게 정리하고 AI에게 맡기는 사람', narrative: '간결하고 구조적이지만 사전 설계보다 실행 중심. 위임형이라 규칙은 느슨. 적은 노력으로 최대 효과를 뽑는 타입.', emoji: '🎈' },
  'GDCXF': { typeCode: 'GDCXF', name: '직감의 서퍼', tagline: '가볍게 타지만 넘어지지 않는 사람', narrative: 'MCP 몇 개면 충분하고, 규칙은 최소한으로, 문서는 3줄이면 된다. AI를 믿고 파도를 타듯이 쓴다. 가벼워 보이지만 — 자기만의 감이 있다.', emoji: '🏄' },

  // === 하네스(H) 계열 — 16개 ===
  'HRVPS': { typeCode: 'HRVPS', name: '결계 아키텍트', tagline: '빈틈없는 시스템의 설계자', narrative: '모든 규칙을 직접 설계하고, 모든 예외를 문서화하고, AI가 넘지 못할 선을 정확히 긋는다. 당신의 CLAUDE.md를 보면 하나의 완성된 운영 매뉴얼이다. 빡빡하지만 — 그래서 신뢰할 수 있다.', emoji: '🏰' },
  'HRVPF': { typeCode: 'HRVPF', name: '프리스타일 아키텍트', tagline: '체계는 머릿속에, 문서는 자유롭게', narrative: '시스템 설계 능력은 확실한데, 문서 형식에는 구애받지 않는다. 규칙은 촘촘하고 맥락은 풍부한데, 읽는 사람은 좀 헤맬 수 있다. 본인은 다 알거든.', emoji: '🎨' },
  'HRVXS': { typeCode: 'HRVXS', name: '체계적 감독관', tagline: '돌리면서 규칙을 다지는 사람', narrative: '실행하면서 검증하고, 검증 결과를 체계적으로 정리한다. 통제와 실행이 동시에 돌아가는, 감독과 선수를 겸하는 타입.', emoji: '📊' },
  'HRVXF': { typeCode: 'HRVXF', name: '전장의 지휘관', tagline: '규칙은 강하고 형식은 자유로운, 실전형 리더', narrative: '전쟁터에서 문서 형식을 따질 여유는 없다. 규칙은 확실하고, 실행은 빠르고, 형식은 상관없다. 결과로 말하는 통제형 실전가.', emoji: '⚔️' },
  'HDVPS': { typeCode: 'HDVPS', name: '시스템 철학자', tagline: '구조도 맥락도 풍부한, AI와의 대화를 설계하는 사람', narrative: '직접 만든 시스템 위에 풍부한 맥락을 올리고, AI에게는 자유를 준다. 통제보다 신뢰, 규칙보다 이해. 당신의 CLAUDE.md는 철학서에 가깝다.', emoji: '📖' },
  'HDVPF': { typeCode: 'HDVPF', name: '비전 메이커', tagline: '큰 그림을 그리고 AI에게 실현을 맡기는 사람', narrative: '장대한 맥락을 자유롭게 풀어놓고, 세부 실행은 AI의 판단에 맡긴다. 형식에 구애받지 않는 비전. 시스템은 직접 지었지만 운전대는 AI에게 넘긴다.', emoji: '🔮' },
  'HDVXS': { typeCode: 'HDVXS', name: '데이터 장인', tagline: '실행하며 쌓고, 쌓은 걸 체계적으로 정리하는 사람', narrative: '풍부한 맥락을 주되 결과를 보면서 다듬는다. 위임하지만 방치하지 않는다. 검증과 축적의 루프가 체계적으로 돌아가는 시스템.', emoji: '🔬' },
  'HDVXF': { typeCode: 'HDVXF', name: '자유로운 오케스트레이터', tagline: '풍부하게 맡기고, 자유롭게 돌리는 사람', narrative: '맥락은 넘치게 주고, 통제는 내려놓고, 형식도 자유롭다. 시스템은 직접 지었지만 그 안에서는 모든 것이 유동적. 혼돈 속의 질서.', emoji: '🌀' },
  'HRCPS': { typeCode: 'HRCPS', name: '정밀 기계', tagline: '짧고, 정확하고, 빈틈없는 시스템', narrative: '직접 만든 시스템, 짧지만 촘촘한 규칙, 깔끔한 구조. 한 줄도 낭비 없이 필요한 것만 담았다. 당신의 CLAUDE.md는 정밀 기계의 도면이다.', emoji: '⚙️' },
  'HRCPF': { typeCode: 'HRCPF', name: '은둔 고수', tagline: '적게 보여주지만 그 안에 시스템이 다 있는 사람', narrative: '문서는 짧고 형식도 자유롭지만, 규칙은 정확하고 시스템은 돌아간다. 겉으로는 단순해 보이는데, 열어보면 정교한 하네스가 숨어있다.', emoji: '🥷' },
  'HRCXS': { typeCode: 'HRCXS', name: '실전 엔지니어', tagline: '짧고, 통제하고, 체계적으로 실행하는 사람', narrative: '간결한 규칙과 체계적 실행의 조합. 사전 설계보다 돌리면서 다지는 타입이지만, 규칙만큼은 확실하다. 실전에서 단련된 시스템.', emoji: '🔧' },
  'HRCXF': { typeCode: 'HRCXF', name: '미니멀 하커', tagline: '최소한의 코드로 최대한의 통제를 만드는 사람', narrative: '짧고 자유롭지만 핵심 hooks는 직접 만들었다. 형식은 없어도 시스템은 돌아가고, 규칙은 적어도 정확하다. 해커의 미학.', emoji: '💻' },
  'HDCPS': { typeCode: 'HDCPS', name: '젠 마스터', tagline: '적게, 맡기되, 구조는 있는 사람', narrative: '간결한 문서, 체계적 구조, 그리고 위임. 필요한 것만 담아두고 AI에게 넘긴다. 미니멀리즘과 신뢰의 조화. 당신의 시스템은 비어있어서 강하다.', emoji: '🧘' },
  'HDCPF': { typeCode: 'HDCPF', name: '무위자연', tagline: '아무것도 안 한 것 같은데 시스템이 돌아가는 사람', narrative: '짧고, 자유롭고, 규칙도 없고, AI에게 맡긴다. 근데 시스템은 직접 지었다. 물처럼 형태가 없지만 흐름은 정확하다.', emoji: '💧' },
  'HDCXS': { typeCode: 'HDCXS', name: '린 빌더', tagline: '군더더기 없이 돌리는 사람', narrative: '간결, 체계적, 실행 중심, 위임형. 직접 만든 시스템을 최소한의 문서로 운영한다. 낭비 없는 린(lean) 방식. 시스템이 말해주니까 문서가 길 필요 없다.', emoji: '🏗️' },
  'HDCXF': { typeCode: 'HDCXF', name: '카오스 엔지니어', tagline: '시키면 끝나 있는 시스템의 주인', narrative: '당신의 시스템은 정교하게 돌아가는데, 그걸 설명하는 문서는 어디에도 없다. 구조는 머릿속에, 실행은 AI에게, 결과는 알아서 나온다. 주변에서는 대체 어떻게 하는 건지 모르지만 — 잘 된다.', emoji: '🌪️' },
};

export function getPersonaByTypeCode(typeCode: string): V2PersonaDefinition | undefined {
  return V2_PERSONAS[typeCode];
}
