import React, { useState } from 'react';
import { X, Bell, AlertTriangle, AlertCircle, Info, Check, ShieldCheck } from 'lucide-react';
import { OceanAlert } from '../types';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: OceanAlert[];
  onAcknowledge: (id: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
}) => {
  const [filter, setFilter] = useState<'all' | 'unacked'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => (filter === 'unacked' ? !a.acknowledged : true));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-zinc-100 text-sm sm:text-base">
                Oceanographic Telemetry Alarms
              </h3>
              <p className="text-xs text-zinc-400">
                Active sensor threshold violations &amp; hardware warnings
              </p>
            </div>
          </div>

          <button
            id="close-alerts-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-950/60 text-xs font-mono">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL ALARMS ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unacked')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'unacked'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              UNACKNOWLEDGED ({alerts.filter(a => !a.acknowledged).length})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-mono text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <p>No active alarms in this view. All thresholds nominal.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isWarning = alert.severity === 'warning';
              const isCritical = alert.severity === 'critical';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    alert.acknowledged
                      ? 'bg-zinc-950/50 border-zinc-800/80 opacity-60'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-800/50 shadow-xs'
                      : isCritical
                      ? 'bg-rose-950/30 border-rose-800/60 shadow-xs'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isCritical ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <h4 className="text-xs font-mono font-bold text-zinc-100">
                        {alert.title}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400">
                      {alert.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 pl-6 border-t border-zinc-800/60 text-[11px] font-mono">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span>Value: <span className="text-zinc-200 font-semibold">{alert.value}</span></span>
                      <span>Limit: <span className="text-zinc-400">{alert.threshold}</span></span>
                    </div>

                    {!alert.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>ACK</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3" />
                        ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
