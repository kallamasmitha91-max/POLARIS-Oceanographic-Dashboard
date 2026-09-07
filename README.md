# POLARIS Oceanographic Dashboard — No AI

A browser-only React/Vite implementation of the POLARIS Oceanographic Dashboard.

## What changed
- Removed the Google Gemini SDK and AI Studio Gemini capability.
- Removed the Express backend and API-key requirement.
- Telemetry is simulated locally in the browser with JavaScript.
- Alert acknowledgement, status changes, charts, 3D views and ESP32 demo ingestion remain client-side.
- No Gemini API, API key, or server is required.

## Run locally
Prerequisite: Node.js

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build
```bash
npm run build
```
