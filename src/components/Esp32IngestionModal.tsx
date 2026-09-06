import React, { useState } from 'react';
import { X, Cpu, Send, Copy, Check, Terminal, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { TelemetryData } from '../types';

interface Esp32IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (payload: Partial<TelemetryData>) => Promise<boolean>;
  currentTelemetry: TelemetryData;
}

export const Esp32IngestionModal: React.FC<Esp32IngestionModalProps> = ({
  isOpen,
  onClose,
  onIngest,
  currentTelemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'docs'>('simulator');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Editable simulation parameters
  const [simTemp, setSimTemp] = useState<number>(currentTelemetry.temperature);
  const [simDepth, setSimDepth] = useState<number>(currentTelemetry.depth);
  const [simSalinity, setSimSalinity] = useState<number>(currentTelemetry.salinity);
  const [simBattery, setSimBattery] = useState<number>(currentTelemetry.batteryPercent);
  const [simRssi, setSimRssi] = useState<number>(currentTelemetry.rssi);

  if (!isOpen) return null;

  const handleSendFrame = async () => {
    setIsSending(true);
    setSendSuccess(null);

    const payload: Partial<TelemetryData> = {
      temperature: Number(simTemp),
      depth: Number(simDepth),
      pressure: Number((1.0 + simDepth * 0.0981).toFixed(2)),
      salinity: Number(simSalinity),
      conductivity: Number((53.4 + (simSalinity - 34.2) * 0.7).toFixed(2)),
      batteryPercent: Number(simBattery),
      rssi: Number(simRssi),
      lastUplinkTime: 'Just now (ESP32 Ingest)',
    };

    const ok = await onIngest(payload);
    setIsSending(false);
    if (ok) {
      setSendSuccess('Frame ingested successfully into POLARIS core!');
      setTimeout(() => setSendSuccess(null), 3500);
    }
  };

  const sampleArduinoCode = `/*
 * POLARIS CTD Probe - ESP32 Telemetry Transmitter
 * Target: ESP32-WROOM-32 / LoRa SX1276 or WiFi
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_OR_HOTSPOT";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "https://YOUR_APP_URL/api/telemetry/ingest";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected. Ready to stream CTD frames.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Read PT100, Piezoresistive & Induction sensors
    StaticJsonDocument<256> doc;
    doc["temperature"] = 28.45;    // PT100 RTD
    doc["depth"] = 12.60;          // Pressure sensor derived
    doc["salinity"] = 34.22;       // 4-electrode conductivity
    doc["batteryPercent"] = 87;    // ADC divider
    doc["rssi"] = WiFi.RSSI();

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.printf("POLARIS Ingest HTTP: %d\\n", httpResponseCode);
    http.end();
  }
  delay(10000); // 10s telemetry cadence
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-zinc-100 flex items-center gap-2 text-sm sm:text-base">
                ESP32 Telemetry Testbench &amp; REST Ingestor
              </h3>
              <p className="text-xs text-zinc-400">
                Direct endpoint: <code className="text-cyan-300 font-mono">POST /api/telemetry/ingest</code>
              </p>
            </div>
          </div>

          <button
            id="close-esp32-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-zinc-800 px-5 bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-3 text-xs font-mono font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            FRAME INJECTOR
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 text-xs font-mono font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            ARDUINO / ESP-IDF CODE
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-3 text-xs font-mono font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            API SCHEMA
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Inject arbitrary CTD &amp; power frames into the server to verify real-time alert thresholds, UI charts, and profile response.
              </p>

              {/* Slider Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                {/* Temperature */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Water Temp (°C):</span>
                    <span className="text-teal-400 font-bold">{simTemp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="0.1"
                    value={simTemp}
                    onChange={e => setSimTemp(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>5°C (Deep cold)</span>
                    <span>35°C (Tropical SST)</span>
                  </div>
                </div>

                {/* Depth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Probe Depth (m):</span>
                    <span className="text-indigo-400 font-bold">{simDepth} m</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="0.5"
                    value={simDepth}
                    onChange={e => setSimDepth(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>0m (Surface)</span>
                    <span>150m (Rated limit)</span>
                  </div>
                </div>

                {/* Salinity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Salinity (PSU):</span>
                    <span className="text-cyan-400 font-bold">{simSalinity} PSU</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="40"
                    step="0.1"
                    value={simSalinity}
                    onChange={e => setSimSalinity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>25 PSU (Plume)</span>
                    <span>40 PSU (Hypersaline)</span>
                  </div>
                </div>

                {/* Battery */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Battery SOC (%):</span>
                    <span className="text-emerald-400 font-bold">{simBattery}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={simBattery}
                    onChange={e => setSimBattery(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>5% (Depleted)</span>
                    <span>100% (Float)</span>
                  </div>
                </div>
              </div>

              {/* Quick Scenario Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Quick Scenario Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSimDepth(55.0);
                      setSimTemp(16.2);
                      setSimSalinity(34.8);
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
                  >
                    Deep Thermocline Plunge (55m)
                  </button>
                  <button
                    onClick={() => {
                      setSimSalinity(28.4);
                      setSimDepth(3.2);
                      setSimTemp(29.8);
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
                  >
                    River Plume Anomaly (28.4 PSU)
                  </button>
                  <button
                    onClick={() => {
                      setSimBattery(18);
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
                  >
                    Low Battery Alarm (18%)
                  </button>
                </div>
              </div>

              {/* Success banner */}
              {sendSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{sendSuccess}</span>
                </div>
              )}

              {/* Ingest Action Button */}
              <button
                id="transmit-simulated-frame-btn"
                onClick={handleSendFrame}
                disabled={isSending}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>TRANSMITTING FRAME VIA POST...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>EMIT ESP32 TELEMETRY FRAME NOW</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Arduino / PlatformIO C++:</span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-mono transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-x-auto text-cyan-300 leading-relaxed">
                <pre>{sampleArduinoCode}</pre>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                    POST
                  </span>
                  <span>/api/telemetry/ingest</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Accepts partial or complete JSON frames from marine IoT nodes (ESP32, Raspberry Pi Pico, Cellular modem). All fields are optional.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-zinc-400 uppercase text-[10px]">Example JSON Payload:</span>
                <pre className="text-zinc-300 text-[11px] overflow-x-auto bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
{`{
  "temperature": 28.45,
  "depth": 12.60,
  "pressure": 1.26,
  "salinity": 34.22,
  "conductivity": 53.4,
  "batteryPercent": 87,
  "batteryVoltage": 12.6,
  "rssi": -78,
  "speedOverGround": 0.4
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
