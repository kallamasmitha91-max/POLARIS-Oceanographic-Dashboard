import React from 'react';
import { Compass, Radio, Cpu, Bell, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TelemetryData, OceanAlert } from '../types';

interface HeaderProps {
  telemetry: TelemetryData;
  alerts: OceanAlert[];
  onOpenEsp32Modal: () => void;
  onOpenAlertsModal: () => void;
  onChangeStatus: (status: 'online' | 'offline' | 'standby') => void;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  alerts,
  onOpenEsp32Modal,
  onOpenAlertsModal,
  onChangeStatus,
  lastUpdated,
}) => {
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Compass className="w-5 h-5 animate-[spin_30s_linear_infinite]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-wider text-zinc-100 font-mono flex items-center gap-2">
                POLARIS <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">CTD-v4</span>
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                <span className="text-zinc-600">/</span>
                <span>BAY OF BENGAL</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-300">SEC-04B</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 tracking-tight">
              Oceanographic Telemetry &amp; Micro-Physical Profiling Array
            </p>
          </div>
        </div>

        {/* Right action metrics & controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* Status selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
            <button
              id="status-online-btn"
              onClick={() => onChangeStatus('online')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                telemetry.polarisStatus === 'online'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.polarisStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              ONLINE
            </button>
            <button
              id="status-standby-btn"
              onClick={() => onChangeStatus('standby')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                telemetry.polarisStatus === 'standby'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.polarisStatus === 'standby' ? 'bg-amber-400' : 'bg-zinc-600'}`} />
              STBY
            </button>
            <button
              id="status-offline-btn"
              onClick={() => onChangeStatus('offline')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                telemetry.polarisStatus === 'offline'
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.polarisStatus === 'offline' ? 'bg-rose-400' : 'bg-zinc-600'}`} />
              OFFLINE
            </button>
          </div>

          {/* ESP32 Ingest Trigger */}
          <button
            id="open-esp32-modal-btn"
            onClick={onOpenEsp32Modal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 transition-all font-mono"
            title="ESP32 Telemetry Testbench & Frame Ingestor"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>ESP32 INGEST</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          {/* Alerts Drawer Trigger */}
          <button
            id="open-alerts-modal-btn"
            onClick={onOpenAlertsModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono transition-all ${
              unacknowledgedCount > 0
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>ALERTS</span>
            {unacknowledgedCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                {unacknowledgedCount}
              </span>
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Live Clock / Last Sync */}
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-zinc-800 text-zinc-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAST FRAME:</span>
            <span className="text-zinc-200">{lastUpdated || telemetry.timeLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
