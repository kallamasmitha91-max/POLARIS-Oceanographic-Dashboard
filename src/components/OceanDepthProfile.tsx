import React, { useState } from 'react';
import { Layers, Eye, Sliders, ChevronRight, Activity, Info } from 'lucide-react';
import { DepthProfilePoint } from '../types';

interface OceanDepthProfileProps {
  profileData: DepthProfilePoint[];
  currentProbeDepth: number;
  onDepthSelect?: (depth: number) => void;
}

export const OceanDepthProfile: React.FC<OceanDepthProfileProps> = ({
  profileData,
  currentProbeDepth,
  onDepthSelect,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'salinity' | 'density' | 'soundSpeed'>('temperature');
  const [hoveredPoint, setHoveredPoint] = useState<DepthProfilePoint | null>(null);

  // Ranges for metrics
  const metricConfigs = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      min: 8,
      max: 32,
      color: '#14b8a6', // teal-500
      stroke: 'stroke-teal-400',
      fill: 'fill-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      text: 'text-teal-300',
    },
    salinity: {
      label: 'Salinity',
      unit: 'PSU',
      min: 30,
      max: 37,
      color: '#06b6d4', // cyan-500
      stroke: 'stroke-cyan-400',
      fill: 'fill-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-300',
    },
    density: {
      label: 'Density',
      unit: 'kg/m³',
      min: 1020,
      max: 1028,
      color: '#818cf8', // indigo-400
      stroke: 'stroke-indigo-400',
      fill: 'fill-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-300',
    },
    soundSpeed: {
      label: 'Sound Velocity',
      unit: 'm/s',
      min: 1480,
      max: 1560,
      color: '#10b981', // emerald-500
      stroke: 'stroke-emerald-400',
      fill: 'fill-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
    },
  };

  const currentCfg = metricConfigs[selectedMetric];

  // SVG coordinate transformation
  const width = 580;
  const height = 360;
  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxDepth = 150;

  // Y-scale is Depth (0m at top to 150m at bottom)
  const getY = (depth: number) => padding.top + (depth / maxDepth) * graphHeight;
  // X-scale is the Metric value
  const getX = (val: number) => {
    const clamped = Math.max(currentCfg.min, Math.min(currentCfg.max, val));
    const ratio = (clamped - currentCfg.min) / (currentCfg.max - currentCfg.min);
    return padding.left + ratio * graphWidth;
  };

  // Generate SVG path line
  const pathD = profileData
    .map((pt, idx) => {
      const x = getX(pt[selectedMetric]);
      const y = getY(pt.depth);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Current probe position
  const currentProbeY = getY(currentProbeDepth);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 tracking-wider mb-0.5">
            <Layers className="w-4 h-4" />
            <span>OCEANOGRAPHIC VERTICAL PROFILE (CTD CAST)</span>
          </div>
          <p className="text-xs text-zinc-400">
            Water column stratification (0 - 150m depth) &amp; thermocline boundary monitoring
          </p>
        </div>

        {/* Metric selection pills */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {(['temperature', 'salinity', 'density', 'soundSpeed'] as const).map(key => {
            const cfg = metricConfigs[key];
            const isActive = selectedMetric === key;
            return (
              <button
                key={key}
                id={`profile-metric-${key}-btn`}
                onClick={() => setSelectedMetric(key)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  isActive
                    ? `${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold shadow-xs`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main visual display grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left SVG Chart */}
        <div className="lg:col-span-8 flex flex-col justify-center relative overflow-hidden bg-zinc-950/80 rounded-lg border border-zinc-800/80 p-2">
          {/* Depth stratification backdrop bands */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {/* Mixed layer (0-25m) */}
            <div
              className="w-full bg-cyan-500/20 border-b border-cyan-500/30"
              style={{ height: `${(25 / maxDepth) * 100}%` }}
            />
            {/* Thermocline (25-80m) */}
            <div
              className="w-full bg-indigo-500/20 border-b border-indigo-500/30"
              style={{ height: `${(55 / maxDepth) * 100}%` }}
            />
            {/* Deep Bathyal layer (80-150m) */}
            <div
              className="w-full bg-blue-900/30"
              style={{ height: `${(70 / maxDepth) * 100}%` }}
            />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
          >
            {/* Horizontal Grid lines (Depth) */}
            {[0, 25, 50, 75, 100, 125, 150].map(d => {
              const y = getY(d);
              return (
                <g key={`grid-d-${d}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray={d === 0 || d === 150 ? 'none' : '3 3'}
                    strokeWidth={d === 0 ? 1.5 : 1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-zinc-400 font-mono"
                  >
                    {d}m
                  </text>
                </g>
              );
            })}

            {/* Vertical Grid lines (Metric values) */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const val = currentCfg.min + pct * (currentCfg.max - currentCfg.min);
              const x = padding.left + pct * graphWidth;
              return (
                <g key={`grid-val-${pct}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#1f242d"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-zinc-400 font-mono"
                  >
                    {val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} {currentCfg.unit}
                  </text>
                </g>
              );
            })}

            {/* Thermocline Zone Marker Label */}
            <rect
              x={width - padding.right - 105}
              y={getY(25) + 8}
              width="100"
              height="20"
              rx="4"
              fill="#18181b"
              stroke="#3f3f46"
              strokeWidth="0.8"
            />
            <text
              x={width - padding.right - 55}
              y={getY(25) + 21}
              textAnchor="middle"
              className="text-[9px] font-mono fill-zinc-400 tracking-wider"
            >
              THERMOCLINE ZONE
            </text>

            {/* Profile Curve Line */}
            <path
              d={pathD}
              fill="none"
              stroke={currentCfg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points along profile */}
            {profileData.map((pt, i) => {
              const x = getX(pt[selectedMetric]);
              const y = getY(pt.depth);
              const isHovered = hoveredPoint?.depth === pt.depth;

              return (
                <g
                  key={`pt-${i}`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onDepthSelect && onDepthSelect(pt.depth)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 3.5}
                    fill="#09090b"
                    stroke={currentCfg.color}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* Current Probe Live Depth Indicator Line */}
            <g>
              <line
                x1={padding.left - 5}
                y1={currentProbeY}
                x2={width - padding.right + 5}
                y2={currentProbeY}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                className="animate-pulse"
              />
              {/* Probe marker tag on the right */}
              <g transform={`translate(${width - padding.right + 8}, ${currentProbeY})`}>
                <polygon points="0,0 8,-5 8,5" fill="#06b6d4" />
                <rect x="8" y="-9" width="76" height="18" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
                <text x="46" y="3" textAnchor="middle" fill="#67e8f9" className="text-[9px] font-mono font-bold">
                  PROBE {currentProbeDepth}m
                </text>
              </g>
            </g>

            {/* Hover Tooltip inside SVG */}
            {hoveredPoint && (
              <g transform={`translate(${getX(hoveredPoint[selectedMetric]) + 10}, ${getY(hoveredPoint.depth) - 15})`}>
                <rect
                  x="0"
                  y="-12"
                  width="115"
                  height="44"
                  rx="5"
                  fill="#18181b"
                  stroke="#3f3f46"
                  strokeWidth="1"
                  className="filter drop-shadow-md"
                />
                <text x="8" y="4" className="text-[10px] font-mono fill-zinc-400">
                  Depth: <tspan className="fill-zinc-100 font-bold">{hoveredPoint.depth}m</tspan>
                </text>
                <text x="8" y="20" className="text-[10px] font-mono fill-zinc-400">
                  {currentCfg.label}: <tspan className="fill-cyan-400 font-bold">{hoveredPoint[selectedMetric]} {currentCfg.unit}</tspan>
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right oceanographic layer inspection sidebar */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          {/* Stratification breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              Hydrodynamic Layers
            </h4>

            {/* Layer 1 */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-cyan-800/60 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-cyan-300 font-mono">1. Epipelagic Surface</span>
                <span className="text-zinc-400 font-mono text-[11px]">0 – 25m</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Wind-mixed isothermal layer. High solar irradiance ({845} W/m²), active gas exchange, uniform salinity.
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span>Active Probe:</span>
                <span className="text-cyan-400 font-semibold">{currentProbeDepth}m (In Mixed Zone)</span>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-indigo-800/60 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-indigo-300 font-mono">2. Permanent Thermocline</span>
                <span className="text-zinc-400 font-mono text-[11px]">25 – 80m</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Steep vertical temperature gradient. Density barrier prevents deep nutrient upwelling. Sharp acoustic refractive duct.
              </p>
            </div>

            {/* Layer 3 */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-blue-800/60 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-blue-300 font-mono">3. Deep Bathyal Layer</span>
                <span className="text-zinc-400 font-mono text-[11px]">&gt; 80m</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Homogeneous cold water (approx 9.3°C). Hydrostatic pressure exceeds 15.0 bar at deployment limit.
              </p>
            </div>
          </div>

          {/* Micro Telemetry Readout */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs font-mono space-y-1.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Thermocline Gradient:</span>
              <span className="text-amber-400 font-semibold">-0.22 °C/m</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Acoustic SOFAR Axis:</span>
              <span className="text-emerald-400 font-semibold">1,120 m (Regional)</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Halocline Stability:</span>
              <span className="text-teal-400 font-semibold">Stable (+0.015 PSU/m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
