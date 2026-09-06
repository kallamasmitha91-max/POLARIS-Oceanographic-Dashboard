import React, { useState } from 'react';
import { Navigation, MapPin, Compass, Satellite, Anchor, ShieldCheck, Box } from 'lucide-react';
import { TelemetryData } from '../types';
import { BuoyAttitude3D } from './BuoyAttitude3D';

interface GnssCompassCardProps {
  telemetry: TelemetryData;
}

export const GnssCompassCard: React.FC<GnssCompassCardProps> = ({ telemetry }) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Format coordinate decimal to degrees/minutes
  const formatCoord = (deg: number, isLat: boolean) => {
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const m = ((abs - d) * 60).toFixed(3);
    return `${d}° ${m}' ${dir}`;
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span>GNSS TELEMETRY &amp; DRIFT COMPASS</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle 3D Gyro vs 2D Dial */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                viewMode === '3d' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Box className="w-2.5 h-2.5" />
              3D GYRO
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                viewMode === '2d' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2D DIAL
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Satellite className="w-3 h-3" />
            <span>3D-FIX // {telemetry.satellites} SVs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Compass Rose or 3D Attitude Gyro */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          {viewMode === '3d' ? (
            <BuoyAttitude3D heading={telemetry.heading} pitch={2.8} roll={-1.5} />
          ) : (
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer dial ticks */}
              <div className="absolute inset-0 rounded-full border border-zinc-800 flex items-center justify-center">
                <div className="absolute top-1 text-[10px] font-mono font-bold text-cyan-400">N</div>
                <div className="absolute right-1 text-[10px] font-mono text-zinc-400">E</div>
                <div className="absolute bottom-1 text-[10px] font-mono text-zinc-400">S</div>
                <div className="absolute left-1 text-[10px] font-mono text-zinc-400">W</div>
              </div>

              {/* Concentric distance rings (anchor watch zone) */}
              <div className="absolute w-32 h-32 rounded-full border border-zinc-800/60 border-dashed" />
              <div className="absolute w-20 h-20 rounded-full border border-zinc-800/40" />

              {/* Drift circle watch boundary */}
              <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 bg-cyan-500/5 animate-pulse" />

              {/* Heading Needle */}
              <div
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${telemetry.heading}deg)` }}
              >
                {/* North pointer needle */}
                <div className="w-0.5 h-16 bg-gradient-to-t from-transparent via-cyan-400 to-cyan-300 absolute top-6 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[10px] border-b-cyan-400 absolute top-4" />

                {/* South needle */}
                <div className="w-0.5 h-12 bg-gradient-to-b from-transparent to-zinc-600 absolute bottom-8 rounded-full" />
              </div>

              {/* Central hub */}
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-cyan-400 z-10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-cyan-300" />
              </div>
            </div>
          )}

          <div className="mt-2 text-center">
            <span className="text-sm font-mono font-bold text-zinc-100">{telemetry.heading.toFixed(1)}°</span>
            <span className="text-xs text-zinc-400 font-mono ml-1">HEADING (SE)</span>
            {viewMode === '3d' && (
              <span className="text-[10px] text-cyan-400/80 font-mono block">PITCH +2.8° // ROLL -1.5°</span>
            )}
          </div>
        </div>

        {/* Right coordinates and spatial telemetry */}
        <div className="md:col-span-7 space-y-3">
          {/* Geolocation Tag */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                MOORING STATION DATUM:
              </span>
              <span className="text-cyan-300 font-mono font-semibold text-[11px]">
                {telemetry.locationName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block">LATITUDE</span>
                <span className="text-sm font-mono font-bold text-zinc-100 tracking-tight">
                  {formatCoord(telemetry.latitude, true)}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  ({telemetry.latitude.toFixed(5)}°)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block">LONGITUDE</span>
                <span className="text-sm font-mono font-bold text-zinc-100 tracking-tight">
                  {formatCoord(telemetry.longitude, false)}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  ({telemetry.longitude.toFixed(5)}°)
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Matrix */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">SPEED (SOG)</span>
              <span className="text-base font-mono font-bold text-cyan-400">
                {telemetry.speedOverGround.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono ml-1">knots</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">HDOP PRECISION</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {telemetry.hdop.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono ml-1">(&lt; 1.0)</span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 font-mono block">ANCHOR WATCH</span>
              <span className="text-base font-mono font-bold text-zinc-200">
                18.4
              </span>
              <span className="text-[10px] text-zinc-400 font-mono ml-1">m / 200m</span>
            </div>
          </div>

          {/* Geofence notice */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Geofence Integrity: SECURE. No anchor drag detected over 72hr period.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
