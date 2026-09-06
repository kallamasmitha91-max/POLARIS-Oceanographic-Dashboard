import React from 'react';
import { BatteryCharging, Wifi, Zap, Sun, ShieldCheck, Radio, ArrowUpRight, Cpu } from 'lucide-react';
import { TelemetryData } from '../types';

interface SystemPowerCommProps {
  telemetry: TelemetryData;
}

export const SystemPowerComm: React.FC<SystemPowerCommProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Marine Power Subsystem */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>MARINE POWER &amp; SOLAR ARRAY</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
            NET CHARGING (+140mA)
          </span>
        </div>

        {/* Battery Capacity Gauge */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-zinc-100">{telemetry.batteryPercent}</span>
              <span className="text-sm font-mono text-zinc-400">% SOC</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              LiFePO4 12V 100Ah Marine Pack
            </span>
          </div>

          <div className="text-right font-mono">
            <span className="text-lg font-bold text-zinc-200">{telemetry.batteryVoltage.toFixed(2)} V</span>
            <span className="block text-[10px] text-zinc-400">Health: {telemetry.batteryHealth}% SOH</span>
          </div>
        </div>

        {/* Battery SOC Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.batteryPercent > 50
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : telemetry.batteryPercent > 20
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${telemetry.batteryPercent}%` }}
            />
          </div>
        </div>

        {/* Solar & Power Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              SOLAR HARVEST
            </span>
            <span className="text-sm font-semibold text-amber-300">+{telemetry.solarChargingCurrent} mA</span>
            <span className="text-[10px] text-zinc-400 block">{telemetry.solarIrradiance} W/m²</span>
          </div>

          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              SYSTEM LOAD
            </span>
            <span className="text-sm font-semibold text-zinc-200">{telemetry.powerConsumptionWatts.toFixed(2)} W</span>
            <span className="text-[10px] text-zinc-400 block">{telemetry.batteryCurrent} mA</span>
          </div>

          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">RESERVE RUNTIME</span>
            <span className="text-sm font-semibold text-emerald-400">{telemetry.estimatedRuntimeHours.toFixed(1)} h</span>
            <span className="text-[10px] text-zinc-400 block">(~5.9 days dark)</span>
          </div>
        </div>
      </div>

      {/* 2. RF Telemetry & Uplink */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span>LONG-RANGE RF UPLINK &amp; TELEMETRY</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
            {telemetry.uplinkProtocol}
          </span>
        </div>

        {/* Link Quality Readout */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-zinc-100">{telemetry.rssi}</span>
              <span className="text-sm font-mono text-zinc-400">dBm (RSSI)</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Signal-to-Noise Ratio: <span className="text-cyan-300 font-semibold">+{telemetry.snr} dB</span>
            </span>
          </div>

          <div className="text-right font-mono">
            <span className="text-sm font-bold text-emerald-400">{(100 - telemetry.packetLoss).toFixed(1)}% LINK Q</span>
            <span className="block text-[10px] text-zinc-400">Loss: {telemetry.packetLoss}%</span>
          </div>
        </div>

        {/* Signal Bars */}
        <div className="flex items-center gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map(bar => {
            const isActive = telemetry.rssi > -110 + bar * 8;
            return (
              <div
                key={bar}
                className={`h-2 flex-1 rounded-sm transition-all ${
                  isActive ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {/* Communications Matrix */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">FRAMES INGESTED</span>
            <span className="text-sm font-semibold text-zinc-200">{telemetry.packetsReceived.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400 block">0 CRC drop</span>
          </div>

          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">CADENCE</span>
            <span className="text-sm font-semibold text-cyan-300">{telemetry.uplinkIntervalSec}s</span>
            <span className="text-[10px] text-zinc-400 block">Adaptive Burst</span>
          </div>

          <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">FALLBACK NET</span>
            <span className="text-sm font-semibold text-zinc-300">4G LTE-M</span>
            <span className="text-[10px] text-emerald-400 block">Standby</span>
          </div>
        </div>
      </div>
    </div>
  );
};
