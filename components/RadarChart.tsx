"use client";

/**
 * 7축 레이더 차트 -- SVG 직접 구현 (라이브러리 없음)
 */
import type { DimensionScores } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";

interface RadarChartProps {
  scores: DimensionScores;
  size?: number;
}

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[];
const NUM_AXES = DIMENSIONS.length;
const GRID_LEVELS = [20, 40, 60, 80, 100];

function angleFor(index: number): number {
  return (Math.PI * 2 * index) / NUM_AXES - Math.PI / 2;
}

function pointAt(index: number, value: number, radius: number): [number, number] {
  const angle = angleFor(index);
  const r = (value / 100) * radius;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function polygonPoints(values: number[], radius: number, cx: number, cy: number): string {
  return values
    .map((v, i) => {
      const [x, y] = pointAt(i, v, radius);
      return `${cx + x},${cy + y}`;
    })
    .join(" ");
}

export default function RadarChart({ scores, size = 300 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.47;
  const values = DIMENSIONS.map((d) => scores[d]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: `${size}px` }}
      role="img" aria-label="7차원 레이더 차트">
      {GRID_LEVELS.map((level) => (
        <polygon key={`grid-${level}`}
          points={polygonPoints(Array(NUM_AXES).fill(level), radius, cx, cy)}
          fill="none" stroke="rgba(245,230,211,0.1)" strokeWidth="1" />
      ))}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = pointAt(i, 100, radius);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + x} y2={cy + y}
          stroke="rgba(245,230,211,0.08)" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints(values, radius, cx, cy)}
        fill="rgba(217,119,87,0.25)" stroke="#D97757" strokeWidth="2" />
      {values.map((v, i) => {
        const [x, y] = pointAt(i, v, radius);
        return <circle key={`point-${i}`} cx={cx + x} cy={cy + y} r="3" fill="#D97757" />;
      })}
      {DIMENSIONS.map((dim, i) => {
        const [lx, ly] = pointAt(i, 100, labelRadius);
        const x = cx + lx;
        const y = cy + ly;
        const angle = angleFor(i);
        const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle"
          : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <g key={`label-${dim}`}>
            <text x={x} y={y - 6} textAnchor={textAnchor}
              fill="rgba(245,230,211,0.7)" fontSize="12" fontWeight="600">
              {DIMENSION_LABELS[dim].label}
            </text>
            <text x={x} y={y + 10} textAnchor={textAnchor}
              fill="#D97757" fontSize="11" fontWeight="700">
              {scores[dim]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
