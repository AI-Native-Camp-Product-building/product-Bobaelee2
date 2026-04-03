/**
 * 확장 분석 결과 섹션
 * 전체 수집 데이터에서 감지된 심층 신호를 시각적으로 보여준다
 * isExpandedInput이 false이면 렌더링하지 않음
 */
import type { MdStats } from "@/lib/types";

interface ExpandedAnalysisProps {
  mdStats: MdStats;
}

export default function ExpandedAnalysis({ mdStats }: ExpandedAnalysisProps) {
  if (!mdStats.isExpandedInput) return null;

  const totalEcosystem = mdStats.pluginCount + mdStats.mcpServerCount + mdStats.commandCount + mdStats.hookCount;

  // 감지된 구성요소가 하나도 없으면 섹션 자체를 숨김
  if (totalEcosystem === 0 && mdStats.denyCount === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-claude-cream">
        🔬 전체 설정 심층 분석
      </h2>

      <div className="bg-bg-card rounded-xl p-5 flex flex-col gap-4 border border-claude-light/10">
        {/* 에코시스템 요약 바 */}
        <div className="flex items-center gap-2 text-xs text-claude-light/50">
          <span className="text-claude-orange font-bold text-lg">{totalEcosystem}</span>
          <span>개 구성요소 감지됨</span>
        </div>

        {/* 감지 항목 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 플러그인 */}
          <DetectedItem
            icon="🧩"
            label="플러그인"
            count={mdStats.pluginCount}
            items={mdStats.pluginNames}
            maxShow={4}
          />

          {/* MCP 서버 */}
          <DetectedItem
            icon="🔌"
            label="MCP 서버"
            count={mdStats.mcpServerCount}
            items={mdStats.mcpServerNames}
            maxShow={4}
          />

          {/* 커스텀 명령어 */}
          <DetectedItem
            icon="⚡"
            label="커스텀 명령어"
            count={mdStats.commandCount}
            items={mdStats.commandNames.map((n) => `/${n}`)}
            maxShow={4}
          />

          {/* Hook */}
          <DetectedItem
            icon="🪝"
            label="Hook"
            count={mdStats.hookCount}
            detail={hookDetail(mdStats)}
          />
        </div>

        {/* 보안 태세 */}
        <SecurityPosture mdStats={mdStats} />
      </div>
    </section>
  );
}

/** 감지 항목 카드 */
function DetectedItem({
  icon,
  label,
  count,
  items,
  detail,
  maxShow = 3,
}: {
  icon: string;
  label: string;
  count: number;
  items?: string[];
  detail?: string;
  maxShow?: number;
}) {
  if (count === 0) {
    return (
      <div className="bg-bg-elevated/50 rounded-lg p-3 opacity-50">
        <div className="flex items-center gap-1.5 mb-1">
          <span>{icon}</span>
          <span className="text-xs font-medium text-claude-light/60">{label}</span>
        </div>
        <p className="text-xs text-claude-light/40">없음</p>
      </div>
    );
  }

  const shown = items?.slice(0, maxShow) ?? [];
  const remaining = (items?.length ?? 0) - maxShow;

  return (
    <div className="bg-bg-elevated/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span>{icon}</span>
        <span className="text-xs font-medium text-claude-cream">{label}</span>
        <span className="text-xs font-bold text-claude-orange ml-auto">{count}</span>
      </div>
      {items && items.length > 0 ? (
        <p className="text-xs text-claude-light/60 leading-relaxed">
          {shown.join(", ")}
          {remaining > 0 && <span className="text-claude-light/40"> +{remaining}</span>}
        </p>
      ) : detail ? (
        <p className="text-xs text-claude-light/60 leading-relaxed">{detail}</p>
      ) : null}
    </div>
  );
}

/** Hook 상세 텍스트 생성 */
function hookDetail(stats: MdStats): string {
  const parts: string[] = [];
  if (stats.hookPromptCount > 0) parts.push(`AI 판단 ${stats.hookPromptCount}`);
  if (stats.hookCommandCount > 0) parts.push(`셸 실행 ${stats.hookCommandCount}`);
  return parts.length > 0 ? parts.join(" · ") : `${stats.hookCount}개`;
}

/** 보안 태세 인디케이터 */
function SecurityPosture({ mdStats }: { mdStats: MdStats }) {
  const signals: { text: string; good: boolean }[] = [];

  if (mdStats.blocksDangerousOps) {
    signals.push({ text: `위험 명령어 차단 (deny ${mdStats.denyCount}개)`, good: true });
  } else if (mdStats.denyCount > 0) {
    signals.push({ text: `deny 규칙 ${mdStats.denyCount}개`, good: true });
  } else {
    signals.push({ text: "deny 규칙 없음", good: false });
  }

  if (mdStats.hookPromptCount > 0) {
    signals.push({ text: "PreToolUse AI 검사 활성", good: true });
  }

  if (mdStats.pluginEnabledRatio > 0) {
    const pct = Math.round(mdStats.pluginEnabledRatio * 100);
    signals.push({
      text: `플러그인 선별 사용 (${pct}% 활성)`,
      good: mdStats.pluginEnabledRatio < 0.7,
    });
  }

  if (mdStats.projectMdCount >= 2) {
    signals.push({ text: `프로젝트별 CLAUDE.md ${mdStats.projectMdCount}개`, good: true });
  }

  if (signals.length === 0) return null;

  return (
    <div className="border-t border-claude-light/10 pt-3 flex flex-col gap-1.5">
      <p className="text-xs font-medium text-claude-light/50">보안 · 성숙도 신호</p>
      {signals.map((sig, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className={sig.good ? "text-rx-green" : "text-roast-red"}>
            {sig.good ? "✓" : "✗"}
          </span>
          <span className={sig.good ? "text-claude-light/70" : "text-roast-red/70"}>
            {sig.text}
          </span>
        </div>
      ))}
    </div>
  );
}
