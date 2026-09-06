import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CtdSensorCards } from './components/CtdSensorCards';
import { OceanDepthProfile } from './components/OceanDepthProfile';
import { OceanTwin3D } from './components/OceanTwin3D';
import { LiveTelemetryChart, TelemetryHistoryPoint } from './components/LiveTelemetryChart';
import { GnssCompassCard } from './components/GnssCompassCard';
import { SystemPowerComm } from './components/SystemPowerComm';
import { MetSurfaceCard } from './components/MetSurfaceCard';
import { Esp32IngestionModal } from './components/Esp32IngestionModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { generateDepthProfile } from './data/mockProfile';
import { TelemetryData, OceanAlert } from './types';
import { AlertTriangle, RefreshCw, Cpu, Activity, Box, LayoutGrid, Maximize2 } from 'lucide-react';

const INITIAL_TELEMETRY: TelemetryData = {
  timestamp: new Date().toISOString(),
  timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  polarisStatus: 'online',
  temperature: 28.4,
  probeTemperature: 28.4,
  surfaceTemperature: 29.1,
  depth: 12.6,
  maxRatedDepth: 150.0,
  pressure: 1.26,
  salinity: 34.2,
  conductivity: 53.4,
  density: 1022.4,
  soundSpeed: 1541.2,
  airTemperature: 31.2,
  atmosphericPressure: 1013.25,
  humidity: 78,
  windSpeed: 12.4,
  windDirection: 'ESE (115°)',
  solarIrradiance: 845,
  batteryPercent: 87,
  batteryVoltage: 12.6,
  batteryCurrent: -240,
  batteryTemp: 27.2,
  batteryHealth: 98,
  powerConsumptionWatts: 3.02,
  estimatedRuntimeHours: 142.5,
  solarChargingCurrent: 380,
  communicationStatus: 'connected',
  rssi: -78,
  snr: 9.4,
  packetLoss: 0.2,
  packetsReceived: 14280,
  uplinkIntervalSec: 10,
  uplinkProtocol: 'LoRa 868MHz',
  lastUplinkTime: 'Just now',
  latitude: 13.0827,
  longitude: 80.2707,
  speedOverGround: 0.4,
  heading: 142.0,
  satellites: 14,
  hdop: 0.78,
  altitudeMeters: 0.2,
  locationName: 'Bay of Bengal — Sector Bravo-4',
};

const INITIAL_ALERTS: OceanAlert[] = [
  {
    id: 'alt-001',
    title: 'Low Battery Warning',
    message: 'Auxiliary backup cell voltage dropped below nominal threshold (3.45V). Main pack at 87%.',
    severity: 'warning',
    category: 'battery',
    timestamp: '10 mins ago',
    acknowledged: false,
    value: '3.42 V',
    threshold: '< 3.50 V',
  },
  {
    id: 'alt-002',
    title: 'Out-of-Range Salinity Reading',
    message: 'Transient freshwater discharge plume detected at 4.2m depth. Salinity dipped to 29.8 PSU.',
    severity: 'info',
    category: 'sensor',
    timestamp: '32 mins ago',
    acknowledged: true,
    value: '29.8 PSU',
    threshold: '32.0 - 36.5 PSU',
  },
  {
    id: 'alt-003',
    title: 'Thermocline Gradient Anomaly',
    message: 'Rapid temperature transition detected: 3.1°C drop across 1.8m vertical profile slice.',
    severity: 'info',
    category: 'temperature',
    timestamp: '1 hour ago',
    acknowledged: false,
    value: '-3.1 °C/m',
    threshold: '> -2.0 °C/m',
  },
  {
    id: 'alt-004',
    title: 'LoRa Uplink Fallback Engaged',
    message: 'Primary 4G LTE-M carrier unreachable. Automatically switched to 868MHz LoRa Gateway.',
    severity: 'warning',
    category: 'communication',
    timestamp: '3 hours ago',
    acknowledged: true,
    value: 'RSSI -88 dBm',
    threshold: '4G Timeout > 60s',
  },
];

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [alerts, setAlerts] = useState<OceanAlert[]>(INITIAL_ALERTS);
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [isEsp32ModalOpen, setIsEsp32ModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'3d-split' | '3d-fullscreen' | '2d-metrics'>('3d-split');

  // Fetch live telemetry from Express backend
  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/live');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d: TelemetryData = json.data;
          setTelemetry(d);
          setIsConnected(true);
          setLastFetchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          setHistory(prev => {
            const newPt: TelemetryHistoryPoint = {
              time: d.timeLabel || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              temperature: d.temperature,
              salinity: d.salinity,
              depth: d.depth,
              pressure: d.pressure,
            };
            const updated = [...prev, newPt];
            return updated.slice(-25); // retain last 25 ticks
          });
        }
      }
    } catch {
      // Local fallback simulation if server takes a moment
      setIsConnected(false);
    }
  }, []);

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setAlerts(json.data);
        }
      }
    } catch {
      // Keep existing alerts
    }
  }, []);

  // Polling loop
  useEffect(() => {
    fetchLiveTelemetry();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchLiveTelemetry, fetchAlerts]);

  // Handle status change
  const handleChangeStatus = async (status: 'online' | 'offline' | 'standby') => {
    try {
      const res = await fetch('/api/polaris/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTelemetry(prev => ({ ...prev, polarisStatus: status }));
      }
    } catch {
      setTelemetry(prev => ({ ...prev, polarisStatus: status }));
    }
  };

  // Handle ESP32 manual frame ingestion
  const handleIngestFrame = async (payload: Partial<TelemetryData>): Promise<boolean> => {
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchLiveTelemetry();
        return true;
      }
      return false;
    } catch {
      // Local apply
      setTelemetry(prev => ({ ...prev, ...payload }));
      return true;
    }
  };

  // Handle Alert ACK
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await fetch('/api/alerts/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ignore
    }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  // Handle probe depth adjust from profile view
  const handleDepthAdjust = (depth: number) => {
    handleIngestFrame({ depth });
  };

  const depthProfilePoints = generateDepthProfile(telemetry.temperature, telemetry.salinity);
  const unackedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header */}
      <Header
        telemetry={telemetry}
        alerts={alerts}
        onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        onChangeStatus={handleChangeStatus}
        lastUpdated={lastFetchTime}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-5">
        {/* Active Alert Banner if any unacknowledged critical/warning */}
        {unackedAlerts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-mono font-bold uppercase tracking-wider text-amber-300">
                  {unackedAlerts[0].title}:
                </span>{' '}
                <span className="text-zinc-300">{unackedAlerts[0].message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <button
                onClick={() => handleAcknowledgeAlert(unackedAlerts[0].id)}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors"
              >
                ACKNOWLEDGE
              </button>
              <button
                onClick={() => setIsAlertsModalOpen(true)}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                VIEW ALL ({unackedAlerts.length})
              </button>
            </div>
          </div>
        )}

        {/* View Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
            <span className="text-zinc-500">VIEW MODE:</span>
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setDashboardMode('3d-split')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
                  dashboardMode === '3d-split'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D DIGITAL TWIN</span>
              </button>
              <button
                onClick={() => setDashboardMode('3d-fullscreen')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
                  dashboardMode === '3d-fullscreen'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>FULLSCREEN 3D</span>
              </button>
              <button
                onClick={() => setDashboardMode('2d-metrics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
                  dashboardMode === '2d-metrics'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>2D METRICS</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="hidden sm:inline">CTD WINCH TELEMETRY:</span>
            <span className="text-cyan-300 font-semibold">{telemetry.depth.toFixed(1)}m</span>
            <span className="text-zinc-600">/</span>
            <span>{telemetry.temperature.toFixed(2)}°C</span>
            <span className="text-zinc-600">/</span>
            <span>{telemetry.salinity.toFixed(1)} PSU</span>
          </div>
        </div>

        {/* 1. Primary CTD Sensor Metrics */}
        <section aria-label="CTD Sensor Metrics">
          <CtdSensorCards telemetry={telemetry} />
        </section>

        {/* 2. 3D Digital Twin Visualization */}
        {dashboardMode !== '2d-metrics' && (
          <section aria-label="3D Ocean Digital Twin">
            <OceanTwin3D
              telemetry={telemetry}
              onDepthChange={handleDepthAdjust}
              isExpanded={dashboardMode === '3d-fullscreen'}
              onToggleExpand={() =>
                setDashboardMode(prev => (prev === '3d-fullscreen' ? '3d-split' : '3d-fullscreen'))
              }
            />
          </section>
        )}

        {/* 3. Vertical Ocean Depth Profile (Cast visualization) */}
        {dashboardMode !== '3d-fullscreen' && (
          <section aria-label="Vertical Ocean Depth Profile">
            <OceanDepthProfile
              profileData={depthProfilePoints}
              currentProbeDepth={telemetry.depth}
              onDepthSelect={handleDepthAdjust}
            />
          </section>
        )}

        {/* 3. Time Series Rolling Chart & Meteorological Conditions */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-label="Telemetry Stream and Meteorology">
          <div className="lg:col-span-8">
            <LiveTelemetryChart history={history} />
          </div>
          <div className="lg:col-span-4">
            <MetSurfaceCard telemetry={telemetry} />
          </div>
        </section>

        {/* 4. Spatial GNSS Position & Power/Uplink Subsystems */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-label="GNSS and Marine Subsystems">
          <div className="lg:col-span-5">
            <GnssCompassCard telemetry={telemetry} />
          </div>
          <div className="lg:col-span-7">
            <SystemPowerComm telemetry={telemetry} />
          </div>
        </section>
      </main>

      {/* ESP32 Ingestion Modal */}
      <Esp32IngestionModal
        isOpen={isEsp32ModalOpen}
        onClose={() => setIsEsp32ModalOpen(false)}
        onIngest={handleIngestFrame}
        currentTelemetry={telemetry}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-4 px-4 lg:px-8 mt-8 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>POLARIS M4/M5 TELEMETRY ENGINE</span>
            <span className="text-zinc-700">|</span>
            <span>STATION 04-BRAVO</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>UPTIME: 99.98%</span>
            <span>EOS-80 SEAWATER FORMULA</span>
            <span className="text-cyan-400 font-semibold">ESP32 STREAM READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
