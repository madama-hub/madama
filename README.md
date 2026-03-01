# MADAMA

A real-time geospatial intelligence web app built with **React + TypeScript + Vite + Cesium**.

It combines live-style data layers (satellites, flights, military flights, traffic, CCTV, earthquakes) on an interactive 3D globe with HUD overlays and AI-assisted summary insights.

---

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **3D Globe / Mapping:** Cesium + Resium
- **Video Streams:** hls.js
- **Orbit / Space Math:** satellite.js
- **Icons:** lucide-react
- **Styling:** custom CSS (HUD + glass UI)

---

## Requirements

- Node.js 18+ (Node 20+ recommended)
- npm 9+
- Cesium Ion token

---

## Quick Start (Install + Run)

### 1) Clone

```bash
git clone https://github.com/madama-hub/madama.git
cd madama
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Copy example env:

```bash
cp .env.example .env
```

Set values in `.env`:

```env
VITE_CESIUM_ION_TOKEN=your_ion_token_here
VITE_GOOGLE_3D_TILES_ASSET_ID=2275207
DEEPSEEK_API_KEY=your_deepseek_server_key_here
```

> Notes:
> - `DEEPSEEK_API_KEY` is used by the local Vite proxy endpoint (`/api/deepseek-summary`).
> - `.env` is ignored by git.

### 4) Start development server

```bash
npm run dev
```

Open the local URL shown in terminal (usually `http://localhost:5173` or next free port).

---

## Available Scripts

- `npm run dev` → run local dev server
- `npm run build` → type-check + production build
- `npm run preview` → preview production build locally
- `npm run lint` → run eslint

---

## How to Use the App

1. **Rotate/zoom globe** to explore the map.
2. Open **Data Layers** in the left sidebar and enable layers:
   - Satellites
   - Flights
   - Military
   - Traffic
   - CCTV
   - Seismic (earthquakes)
3. Use **Scenes** to jump between predefined cities/landmarks.
4. Use **AI Insights** panel to view:
   - heuristic layer-based insights
   - DeepSeek-generated short summary report (if key is configured)
5. Use right sidebar toggles for visual/HUD preferences.

---

## AI Insights / DeepSeek

The app sends context to a local dev proxy route:

- `POST /api/deepseek-summary` (in `vite.config.ts`)

This keeps your API key out of browser request headers and generates concise report-style text from current active layers.

---

## Deployment / Hosting

This is a Vite static frontend (with a dev-time proxy), so easiest hosting options:

1. **Vercel** (recommended)
2. **Netlify**
3. **Cloudflare Pages**

If you need DeepSeek in production, move the proxy route to a serverless function (e.g. Vercel Function / Netlify Function / Cloudflare Worker) and keep `DEEPSEEK_API_KEY` on the server side.

---

## Troubleshooting

- **Black globe / tiles not loading**
  - Check `VITE_CESIUM_ION_TOKEN` in `.env`
  - Verify token permissions in Cesium Ion

- **AI summary not appearing**
  - Check `DEEPSEEK_API_KEY` in `.env`
  - Restart dev server after env changes

- **Port already in use**
  - Vite auto-selects the next available port (5174, 5175, ...)

---

## License

Private / internal (update this section if you want an open-source license).
