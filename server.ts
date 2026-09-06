import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory telemetry storage for live updates & ESP32 ingestion
let currentTelemetry = {
  timestamp: new Date().toISOString(),
  timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  polarisStatus: 'online' as 'online' | 'offline' | 'standby',
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
  communicationStatus: 'connected' as 'connected' | 'degraded' | 'disconnected',
  rssi: -78,
  snr: 9.4,
  packetLoss: 0.2,
  packetsReceived: 14280,
  uplinkIntervalSec: 10,
  uplinkProtocol: 'LoRa 868MHz' as const,
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

// Periodic simulated live telemetry tick (ocean physics)
setInterval(() => {
  if (currentTelemetry.polarisStatus !== 'online') return;
  const now = new Date();
  const wave = Math.sin(Date.now() / 8000) * 0.15;
  const jitter = (Math.random() - 0.5) * 0.04;
  
  currentTelemetry.depth = Math.max(0.5, Number((12.6 + wave + jitter).toFixed(2)));
  currentTelemetry.pressure = Number((1.0 + currentTelemetry.depth * 0.0981).toFixed(2));
  currentTelemetry.temperature = Number((28.4 - (currentTelemetry.depth - 12.0) * 0.05 + (Math.random() - 0.5) * 0.03).toFixed(2));
  currentTelemetry.salinity = Number((34.2 + (Math.random() - 0.5) * 0.04).toFixed(2));
  currentTelemetry.conductivity = Number((53.4 + (currentTelemetry.salinity - 34.2) * 0.7).toFixed(2));
  currentTelemetry.soundSpeed = Number((1449.2 + 4.6 * currentTelemetry.temperature - 0.055 * Math.pow(currentTelemetry.temperature, 2) + 1.34 * (currentTelemetry.salinity - 35) + 0.016 * currentTelemetry.depth).toFixed(1));
  currentTelemetry.density = Number((1025 - (currentTelemetry.temperature - 20) * 0.28 + (currentTelemetry.salinity - 35) * 0.78).toFixed(1));
  currentTelemetry.timestamp = now.toISOString();
  currentTelemetry.timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentTelemetry.packetsReceived += 1;
  currentTelemetry.rssi = Math.round(-77 + (Math.random() - 0.5) * 4);
}, 2000);

let alertsStore = [
  {
    id: 'alt-001',
    title: 'Low Battery Warning',
    message: 'Auxiliary backup cell voltage dropped below nominal threshold (3.45V). Main pack at 87%.',
    severity: 'warning' as const,
    category: 'battery' as const,
    timestamp: '10 mins ago',
    acknowledged: false,
    value: '3.42 V',
    threshold: '< 3.50 V',
  },
  {
    id: 'alt-002',
    title: 'Out-of-Range Salinity Reading',
    message: 'Transient freshwater discharge plume detected at 4.2m depth. Salinity dipped to 29.8 PSU.',
    severity: 'info' as const,
    category: 'sensor' as const,
    timestamp: '32 mins ago',
    acknowledged: true,
    value: '29.8 PSU',
    threshold: '32.0 - 36.5 PSU',
  },
  {
    id: 'alt-003',
    title: 'Thermocline Gradient Anomaly',
    message: 'Rapid temperature transition detected: 3.1°C drop across 1.8m vertical profile slice.',
    severity: 'info' as const,
    category: 'temperature' as const,
    timestamp: '1 hour ago',
    acknowledged: false,
    value: '-3.1 °C/m',
    threshold: '> -2.0 °C/m',
  },
  {
    id: 'alt-004',
    title: 'LoRa Uplink Fallback Engaged',
    message: 'Primary 4G LTE-M carrier unreachable. Automatically switched to 868MHz LoRa Gateway.',
    severity: 'warning' as const,
    category: 'communication' as const,
    timestamp: '3 hours ago',
    acknowledged: true,
    value: 'RSSI -88 dBm',
    threshold: '4G Timeout > 60s',
  },
];

// API Endpoints for M4 & M5 backend and ESP32 ingestion
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'POLARIS Oceanographic Telemetry System',
    version: '1.0.4',
    backendStage: 'M4/M5 Connected',
    time: new Date().toISOString(),
  });
});

app.get('/api/telemetry/live', (req, res) => {
  res.json({
    success: true,
    data: currentTelemetry,
    source: 'ESP32 -> LoRa/4G -> M4/M5 Backend Server',
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    success: true,
    data: alertsStore,
  });
});

app.post('/api/alerts/ack', (req, res) => {
  const { id } = req.body;
  alertsStore = alertsStore.map(a => a.id === id ? { ...a, acknowledged: true } : a);
  res.json({ success: true, alerts: alertsStore });
});

// Endpoint for ESP32 or external M4/M5 backend to ingest data
app.post('/api/telemetry/ingest', (req, res) => {
  const incoming = req.body;
  if (!incoming) {
    return res.status(400).json({ error: 'Missing telemetry payload' });
  }

  currentTelemetry = {
    ...currentTelemetry,
    ...incoming,
    timestamp: new Date().toISOString(),
    packetsReceived: currentTelemetry.packetsReceived + 1,
    timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  res.json({
    success: true,
    message: 'ESP32 telemetry frame ingested successfully',
    packetsTotal: currentTelemetry.packetsReceived,
    current: currentTelemetry,
  });
});

app.post('/api/polaris/status', (req, res) => {
  const { status } = req.body;
  if (['online', 'offline', 'standby'].includes(status)) {
    currentTelemetry.polarisStatus = status;
    res.json({ success: true, status: currentTelemetry.polarisStatus });
  } else {
    res.status(400).json({ error: 'Invalid status' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[POLARIS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
