import React from 'react';
import { Waves, Thermometer, ArrowDownCircle, Gauge, Activity, TrendingUp, Radio } from 'lucide-react';
import { TelemetryData } from '../types';

interface CtdSensorCardsProps {
  telemetry: TelemetryData;
}

export const CtdSensorCards: React.FC<CtdSensorCardsProps> = ({ telemetry }) => {
  const depthPercent = Math.min(100, Math.max(0, (telemetry.depth / telemetry.maxRatedDepth) * 100));
  const tempDelta = Number((telemetry.temperature - telemetry.surfaceTemperature).toFixed(2));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Salinity & Conductivity */}
      <div className="bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
        
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono tracking-wider">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>CTD // SALINITY</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-mono text-[10px] border border-cyan-800/40">
            OPTIMAL
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-mono font-bold tracking-tight text-zinc-100">
            {telemetry.salinity.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">PSU</span>
        </div>

        <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between font-mono">
          <span>Conductivity:</span>
          <span className="text-cyan-300 font-semibold">{telemetry.conductivity.toFixed(2)} mS/cm</span>
        </div>

        {/* Range bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>Fresh (0)</span>
            <span className="text-zinc-400">Normal Ocean (35)</span>
            <span>Brine (45)</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (telemetry.salinity / 45) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Water Temperature */}
      <div className="bg-zinc-900/70 border border-zinc-800 hover:border-teal-500/40 rounded-xl p-4 transition-all relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />

        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono tracking-wider">
            <Thermometer className="w-3.5 h-3.5 text-teal-400" />
            <span>CTD // TEMPERATURE</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-teal-950/60 text-teal-300 font-mono text-[10px] border border-teal-800/40">
            PROBE PT100
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-mono font-bold tracking-tight text-zinc-100">
            {telemetry.temperature.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">°C</span>
          <span className="text-xs text-zinc-400 font-mono ml-auto">
            ({((telemetry.temperature * 9/5) + 32).toFixed(1)} °F)
          </span>
        </div>

        <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between font-mono">
          <span>Surface Delta:</span>
          <span className={`${tempDelta < 0 ? 'text-teal-300' : 'text-amber-300'} font-semibold`}>
            {tempDelta > 0 ? `+${tempDelta}` : tempDelta} °C (SST {telemetry.surfaceTemperature}°C)
          </span>
        </div>

        {/* Thermocline bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>Freezing (0°C)</span>
            <span className="text-teal-400">Probe: {telemetry.temperature}°C</span>
            <span>Surface (35°C)</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-teal-400 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (telemetry.temperature / 35) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Depth & Hydrostatic Pressure */}
      <div className="bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono tracking-wider">
            <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>CTD // DEPTH &amp; PRESSURE</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-mono text-[10px] border border-indigo-800/40">
            PIEZORESISTIVE
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-mono font-bold tracking-tight text-zinc-100">
            {telemetry.depth.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">m</span>
          <span className="text-xs text-zinc-400 font-mono ml-auto">
            ({(telemetry.depth * 3.28084).toFixed(1)} ft)
          </span>
        </div>

        <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between font-mono">
          <span>Hydrostatic Pres:</span>
          <span className="text-indigo-300 font-semibold">{telemetry.pressure.toFixed(2)} bar ({(telemetry.pressure * 10).toFixed(1)} dbar)</span>
        </div>

        {/* Tether Deployment progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>Surface (0m)</span>
            <span className="text-indigo-300">{(depthPercent).toFixed(1)}% Max</span>
            <span>Rated (150m)</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
              style={{ width: `${depthPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Acoustic Sound Speed & Density */}
      <div className="bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono tracking-wider">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACOUSTICS &amp; DENSITY</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono text-[10px] border border-emerald-800/40">
            DERIVED EOS-80
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-mono font-bold tracking-tight text-zinc-100">
            {telemetry.soundSpeed.toFixed(1)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">m/s</span>
          <span className="text-xs text-zinc-400 font-mono ml-auto">
            (Mach 4.54)
          </span>
        </div>

        <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between font-mono">
          <span>In-Situ Density:</span>
          <span className="text-emerald-300 font-semibold">{telemetry.density.toFixed(1)} kg/m³</span>
        </div>

        {/* Sonar status */}
        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-zinc-800/80 text-zinc-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            Sonar Velocity Layer:
          </span>
          <span className="text-emerald-400 font-medium">Positive Gradient</span>
        </div>
      </div>
    </div>
  );
};
