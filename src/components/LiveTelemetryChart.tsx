import React, { useState } from 'react';
import { LineChart, Activity, Clock, ZoomIn } from 'lucide-react';

export interface TelemetryHistoryPoint {
  time: string;
  temperature: number;
  salinity: number;
  depth: number;
  pressure: number;
}

interface LiveTelemetryChartProps {
  history: TelemetryHistoryPoint[];
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({ history }) => {
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'salinity' | 'depth'>('temperature');

  const metricConfigs = {
    temperature: {
      label: 'Water Temperature',
      unit: '°C',
      stroke: '#14b8a6', // teal-500
      fill: 'rgba(20, 184, 166, 0.1)',
      min: 27.5,
      max: 29.5,
      precision: 2,
    },
    salinity: {
      label: 'Salinity',
      unit: 'PSU',
      stroke: '#06b6d4', // cyan-500
      fill: 'rgba(6, 182, 212, 0.1)',
      min: 33.5,
      max: 35.0,
      precision: 2,
    },
    depth: {
      label: 'Probe Depth',
      unit: 'm',
      stroke: '#818cf8', // indigo-400
      fill: 'rgba(129, 140, 248, 0.1)',
      min: 11.5,
      max: 14.0,
      precision: 2,
    },
  };

  const cfg = metricConfigs[activeMetric];

  // SVG dimensions
  const width = 680;
  const height = 200;
  const padding = { top: 20, right: 25, bottom: 30, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute dynamic scale if points exist
  const values = history.map(h => h[activeMetric]);
  const minVal = values.length ? Math.min(cfg.min, Math.min(...values) - 0.1) : cfg.min;
  const maxVal = values.length ? Math.max(cfg.max, Math.max(...values) + 0.1) : cfg.max;

  const getX = (idx: number) => {
    if (history.length <= 1) return padding.left;
    return padding.left + (idx / (history.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    const ratio = (val - minVal) / range;
    return padding.top + (1 - ratio) * chartH;
  };

  // Build path
  const linePath = history
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt[activeMetric])}`)
    .join(' ');

  const areaPath = history.length
    ? `${linePath} L ${getX(history.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`
    : '';

  const latestVal = history.length ? history[history.length - 1][activeMetric] : 0;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
          <LineChart className="w-4 h-4 text-cyan-400" />
          <span>TIME-SERIES TELEMETRY STREAM (ROLLING BUFFER)</span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 font-mono text-xs">
          {(['temperature', 'salinity', 'depth'] as const).map(metric => {
            const isActive = activeMetric === metric;
            return (
              <button
                key={metric}
                id={`chart-tab-${metric}-btn`}
                onClick={() => setActiveMetric(metric)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-cyan-300 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {metric.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric summary bar */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-400">{cfg.label}:</span>
          <span className="text-xl font-bold text-zinc-100">
            {latestVal.toFixed(cfg.precision)} {cfg.unit}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>BUFFER: {history.length} SAMPLES (~{history.length * 2}s)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="bg-zinc-950 rounded-lg p-2 border border-zinc-800/80 overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const val = minVal + pct * (maxVal - minVal);
            const y = padding.top + (1 - pct) * chartH;
            return (
              <g key={`grid-h-${pct}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-zinc-400 font-mono"
                >
                  {val.toFixed(cfg.precision)}
                </text>
              </g>
            );
          })}

          {/* Area under line */}
          {areaPath && (
            <path d={areaPath} fill={cfg.fill} />
          )}

          {/* Stroke line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={cfg.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots on points */}
          {history.map((pt, idx) => {
            const isLast = idx === history.length - 1;
            return (
              <circle
                key={`dot-${idx}`}
                cx={getX(idx)}
                cy={getY(pt[activeMetric])}
                r={isLast ? 4 : 2}
                fill={isLast ? cfg.stroke : '#18181b'}
                stroke={cfg.stroke}
                strokeWidth={isLast ? 2 : 1}
              />
            );
          })}

          {/* Time axis labels */}
          {history.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 8}
                className="text-[9px] fill-zinc-400 font-mono"
              >
                {history[0].time}
              </text>
              <text
                x={width - padding.right}
                y={height - 8}
                textAnchor="end"
                className="text-[9px] fill-zinc-400 font-mono"
              >
                {history[history.length - 1].time}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
