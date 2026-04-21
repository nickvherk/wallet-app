"use client";

import { ChartPoint } from "@/lib/mockData";
import { useMemo } from "react";

interface PnLChartProps {
  points: ChartPoint[];
}

const W = 800;
const H = 160;
const PAD = { top: 20, right: 16, bottom: 28, left: 60 };

function formatAxisLabel(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function PnLChart({ points }: PnLChartProps) {
  const { path, areaPath, yTicks, xLabels, isFlat } = useMemo(() => {
    if (points.length < 2) return { path: "", areaPath: "", yTicks: [], xLabels: [], isFlat: true };

    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const isFlat = rawMin === rawMax;

    const padding = isFlat ? 100 : (rawMax - rawMin) * 0.15;
    const minV = rawMin - padding;
    const maxV = rawMax + padding;

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const toX = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
    const toY = (v: number) => PAD.top + plotH - ((v - minV) / (maxV - minV)) * plotH;

    const coords = points.map((p, i) => ({ x: toX(i), y: toY(p.value) }));

    // Smooth cubic bezier path
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const baselineY = toY(0);
    const clampedBaseline = Math.min(Math.max(baselineY, PAD.top), PAD.top + plotH);

    const areaPath =
      d +
      ` L ${last.x} ${clampedBaseline} L ${first.x} ${clampedBaseline} Z`;

    // Y axis ticks (4 evenly spaced)
    const tickCount = 4;
    const yTicks: { y: number; label: string }[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const v = minV + ((maxV - minV) * i) / tickCount;
      yTicks.push({ y: toY(v), label: formatAxisLabel(v) });
    }

    // X axis labels: first, middle, last
    const xLabels = [
      { x: toX(0), label: points[0].date.slice(5) },
      { x: toX(Math.floor((points.length - 1) / 2)), label: points[Math.floor((points.length - 1) / 2)].date.slice(5) },
      { x: toX(points.length - 1), label: points[points.length - 1].date.slice(5) },
    ];

    return { path: d, areaPath, yTicks, xLabels, isFlat };
  }, [points]);

  const finalValue = points[points.length - 1]?.value ?? 0;
  const isPositive = finalValue >= 0;

  if (isFlat || points.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
        Not enough data for this timeframe
      </div>
    );
  }

  return (
    <div className="w-full" style={{ aspectRatio: `${W}/${H + 8}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="pnl-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? "#14F195" : "#EF4444"} stopOpacity="0.18" />
            <stop offset="100%" stopColor={isPositive ? "#14F195" : "#EF4444"} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={PAD.left}
            y1={tick.y}
            x2={W - PAD.right}
            y2={tick.y}
            stroke="#1e1e2e"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#pnl-area)" />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={isPositive ? "#14F195" : "#EF4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={PAD.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#4b5563"
            fontFamily="monospace"
          >
            {tick.label}
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={H - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#4b5563"
            fontFamily="monospace"
          >
            {lbl.label}
          </text>
        ))}

        {/* End dot */}
        {(() => {
          const last = points[points.length - 1];
          const plotW = W - PAD.left - PAD.right;
          const plotH = H - PAD.top - PAD.bottom;
          const values = points.map((p) => p.value);
          const rawMin = Math.min(...values);
          const rawMax = Math.max(...values);
          const padding = (rawMax - rawMin) * 0.15 || 100;
          const minV = rawMin - padding;
          const maxV = rawMax + padding;
          const x = PAD.left + plotW;
          const y = PAD.top + plotH - ((last.value - minV) / (maxV - minV)) * plotH;
          return (
            <circle
              cx={x}
              cy={y}
              r="4"
              fill={isPositive ? "#14F195" : "#EF4444"}
              filter={`drop-shadow(0 0 4px ${isPositive ? "#14F195" : "#EF4444"})`}
            />
          );
        })()}
      </svg>
    </div>
  );
}
