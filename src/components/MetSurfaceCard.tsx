import React from 'react';
import { Wind, CloudSun, Droplets, SunMedium, Compass } from 'lucide-react';
import { TelemetryData } from '../types';

interface MetSurfaceCardProps {
  telemetry: TelemetryData;
}

export const MetSurfaceCard: React.FC<MetSurfaceCardProps> = ({ telemetry }) => {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
          <CloudSun className="w-4 h-4 text-amber-400" />
          <span>SURFACE METEOROLOGY &amp; ATMOSPHERIC BOUNDARY</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
          CALM SEA STATE 2
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Air Temp */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] mb-1">
            <span>AIR TEMP</span>
            <SunMedium className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-zinc-100">{telemetry.airTemperature.toFixed(1)}</span>
          <span className="text-xs text-zinc-400 ml-1">°C</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">RH: {telemetry.humidity}%</span>
        </div>

        {/* Barometric Pressure */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] mb-1">
            <span>BAROMETRIC</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-xl font-bold text-cyan-300">{telemetry.atmosphericPressure.toFixed(1)}</span>
          <span className="text-xs text-zinc-400 ml-1">hPa</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">MSL standard</span>
        </div>

        {/* Wind Vector */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] mb-1">
            <span>WIND VECTOR</span>
            <Wind className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <span className="text-xl font-bold text-teal-300">{telemetry.windSpeed.toFixed(1)}</span>
          <span className="text-xs text-zinc-400 ml-1">kts</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">{telemetry.windDirection}</span>
        </div>

        {/* Solar Radiation */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] mb-1">
            <span>SOLAR FLUX</span>
            <SunMedium className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-300">{telemetry.solarIrradiance}</span>
          <span className="text-xs text-zinc-400 ml-1">W/m²</span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">Peak Insolation</span>
        </div>
      </div>
    </div>
  );
};
