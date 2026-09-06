export interface TelemetryData {
  timestamp: string;
  timeLabel: string;
  polarisStatus: 'online' | 'offline' | 'standby';
  // CTD parameters
  temperature: number;
  probeTemperature: number;
  surfaceTemperature: number;
  depth: number;
  maxRatedDepth: number;
  pressure: number;
  salinity: number;
  conductivity: number;
  density: number;
  soundSpeed: number;
  // Meteorological & Surface
  airTemperature: number;
  atmosphericPressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  solarIrradiance: number;
  // Power & Battery
  batteryPercent: number;
  batteryVoltage: number;
  batteryCurrent: number;
  batteryTemp: number;
  batteryHealth: number;
  powerConsumptionWatts: number;
  estimatedRuntimeHours: number;
  solarChargingCurrent: number;
  // Communication
  communicationStatus: 'connected' | 'degraded' | 'disconnected';
  rssi: number;
  snr: number;
  packetLoss: number;
  packetsReceived: number;
  uplinkIntervalSec: number;
  uplinkProtocol: string;
  lastUplinkTime: string;
  // GNSS / Navigation
  latitude: number;
  longitude: number;
  speedOverGround: number;
  heading: number;
  satellites: number;
  hdop: number;
  altitudeMeters: number;
  locationName: string;
}

export interface OceanAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'battery' | 'sensor' | 'temperature' | 'communication' | 'depth';
  timestamp: string;
  acknowledged: boolean;
  value: string;
  threshold: string;
}

export interface DepthProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  density: number;
  soundSpeed: number;
}
