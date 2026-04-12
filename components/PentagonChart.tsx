'use client';

import type { AxisScores, AxisKey } from '@/lib/v2-types';
import { AXIS_LABELS, AXIS_ORDER } from '@/lib/v2-types';

interface Props {
  axisScores: AxisScores;
  color?: string;
}

/**
 * 5축 펜타곤 레이더 — 숫자 없이 모양만
 * 각 축의 confidence를 반지름으로, 방향에 따라 라벨 표시
 */
export default function PentagonChart({ axisScores, color = '#6366f1' }: Props) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;

  // 5각형 꼭짓점 좌표 (상단 시작, 시계방향)
  const points = AXIS_ORDER.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });

  // 데이터 포인트 (confidence 기반)
  const dataPoints = AXIS_ORDER.map((axis, i) => {
    const confidence = axisScores.judgments[axis].confidence;
    const r = radius * (0.3 + confidence * 0.7); // 최소 30%, 최대 100%
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });

  const gridPolygon = points.map(p => `${p.x},${p.y}`).join(' ');
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 격자 */}
        <polygon points={gridPolygon} fill="none" stroke="#e5e7eb" strokeWidth="1" />

        {/* 데이터 영역 */}
        <polygon points={dataPolygon} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />

        {/* 데이터 포인트 점 */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />
        ))}

        {/* 축 라벨 */}
        {AXIS_ORDER.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const labelR = radius + 28;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          const judgment = axisScores.judgments[axis];
          const labels = AXIS_LABELS[axis];
          const label = judgment.direction === labels.a ? labels.aLabel : labels.bLabel;

          return (
            <text key={axis} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              className="text-xs fill-gray-600 font-medium">
              {label}
            </text>
          );
        })}
      </svg>
      <p className="text-sm text-gray-400">너의 CLAUDE.md 실루엣</p>
    </div>
  );
}
