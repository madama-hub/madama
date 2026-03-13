# MADAMA

MADAMA is an **AI-powered geospatial anomaly monitoring project** built for an AI/ML engineering portfolio.

The current product focus is **Earth operations only**:
- flights
- earthquakes
- DDoS / abuse signals
- traffic
- CCTV as operator context only

The globe UI is the investigation surface. The backend is the intelligence engine.

---

## Project Direction

This repository is being reshaped from a broad “mission control” demo into a more hiring-focused system:

> **A geospatial anomaly detection platform with a 3D globe frontend and a Python backend for ingestion, feature engineering, scoring, and evaluation.**

Moon and Mars modes remain in the app as exploration / portfolio flair, but the ML story is centered on Earth.

---

## Architecture

### Frontend
- **React 19 + TypeScript + Vite**
- **Cesium + Resium** for the 3D globe
- **hls.js** for CCTV/video playback
- Custom HUD / glass UI

### Backend
- **Python 3**
- **FastAPI** for APIs
- **SQLAlchemy** for persistence layer setup
- **PostgreSQL** connection configuration
- Snapshot-based services for:
  - data ingestion
  - region feature engineering
  - anomaly scoring
  - alert generation
  - evaluation metrics

---

## Current Backend Endpoints

The frontend is wired to these backend routes:

- `GET /api/v1/health`
- `GET /api/v1/events/flights`
- `GET /api/v1/events/earthquakes`
- `GET /api/v1/events/traffic`
- `GET /api/v1/events/ddos`
- `GET /api/v1/features/regions`
- `GET /api/v1/alerts`
- `GET /api/v1/alerts/summary`
- `GET /api/v1/model/metrics`
- `POST /api/v1/predict/anomaly`

---

## Requirements

### Frontend
- Node.js 18+ (Node 20+ recommended)
- npm 9+
- Cesium Ion token

### Backend
- Python 3.11+ recommended
- pip
- PostgreSQL (optional for future persistence; current snapshot flow can still run without a live DB if bootstrap fails)

---

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Set values in `.env`:

```env
VITE_CESIUM_ION_TOKEN=your_ion_token_here
VITE_GOOGLE_3D_TILES_ASSET_ID=2275207
VITE_MOON_3D_TILES_ASSET_ID=2684829
VITE_MARS_3D_TILES_ASSET_ID=3644333

MADAMA_DATABASE_URL=postgresql+psycopg://madama:madama@localhost:5432/madama
MADAMA_ENVIRONMENT=development
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Notes:
- `OPENAI_API_KEY` is reserved for future explanation / summarization work.
- `ABUSEIPDB_API_KEY` improves the DDoS signal feed, but the backend has a simulated fallback.
- `.env` is ignored by git.

---

## Local Setup

## 1) Install frontend dependencies

```bash
cd /Applications/madama
npm install
```

## 2) Install backend dependencies

Recommended with a virtual environment:

```bash
cd /Applications/madama
python3 -m venv backend/.venv
source backend/.venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r backend/requirements.txt
```

## 3) Start the backend

With the virtual environment activated:

```bash
cd /Applications/madama
source backend/.venv/bin/activate
npm run backend:dev
```

The backend runs on:

```text
http://127.0.0.1:8000
```

Docs:

```text
http://127.0.0.1:8000/docs
```

## 4) Start the frontend

In another terminal:

```bash
cd /Applications/madama
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Vite proxies `/api/*` to the FastAPI backend.

---

## Available Scripts

### Frontend
- `npm run dev` → run Vite dev server
- `npm run build` → type-check + production build
- `npm run preview` → preview production build
- `npm run lint` → run eslint

### Backend
- `npm run backend:dev` → start FastAPI on port `8000`
- `npm run backend:snapshot` → materialize a fresh anomaly snapshot
- `npm run backend:evaluate` → print current model metrics JSON
- `npm run backend:collect` → collect snapshots every 5 minutes from the terminal

---

## What the Frontend Shows Right Now

### Earth mode
- flights from backend snapshot endpoint
- earthquakes from backend snapshot endpoint
- traffic from backend snapshot endpoint
- DDoS events from backend snapshot endpoint
- alert rings / alert labels from backend alert endpoint
- AI insights panel driven by backend alert summary + model metrics
- CCTV as visual context only

### Moon / Mars mode
- exploration content remains available
- AI anomaly scoring is intentionally Earth-only for now


## Collecting Training Data

You do **not** need to open the frontend to collect data.

The correct way to collect data is to run the backend collector directly from the terminal:

```bash
cd /Applications/madama
source backend/.venv/bin/activate
npm run backend:collect
```

What happens every 5 minutes:
1. the backend builds a fresh snapshot
2. raw events are fetched from APIs, or fallback simulated data is used
3. region-level features are engineered
4. alerts and evaluation metrics are generated
5. the newest snapshot is written to `backend/data/latest_snapshot.json`
6. a timestamped backup snapshot is written into `backend/data/history/`
7. the backend attempts to persist raw events, region features, and alerts into PostgreSQL

If PostgreSQL is unavailable, the collector still works and the JSON backup history still gets created.

### One-run test

If you want to test the collector once before running it forever:

```bash
cd /Applications/madama
source backend/.venv/bin/activate
python3 -m backend.scripts.collect_snapshots --interval 300 --iterations 1
```

### PostgreSQL in simple terms

PostgreSQL is the **database server**.
SQL is the **language** used to talk to that database.

So:
- **SQL** = the language
- **PostgreSQL** = the actual database system storing the data

If `psql` is not installed on your machine yet, PostgreSQL is probably not installed locally yet.
That is okay for now — you can still collect timestamped JSON backups until you install PostgreSQL.

### How much data is enough for a first Isolation Forest?

Good practical targets:
- **minimum**: 2–3 days of collection at 5-minute intervals
- **better**: 7 days or more

Why that can already work:
- 1 day at 5-minute intervals = **288 snapshots**
- each snapshot creates multiple region feature rows
- after a few days you can already have **thousands of rows**

For a first useful Isolation Forest baseline, aim for:
- **5,000–10,000 region rows minimum**
- **20,000+ rows is better**

---

## ML / Portfolio Story

This project is intended to demonstrate:
- multi-source data ingestion
- geospatial feature engineering
- anomaly scoring logic
- alert generation
- model evaluation metrics
- full-stack AI product thinking
- a strong interactive visualization layer

Current scoring is a baseline heuristic anomaly ranker. It is structured so you can later replace or extend it with:
- Isolation Forest
- XGBoost
- learned ranking models
- forecasting models
- LLM explanations grounded in model evidence

---

## Validation Status

Validated so far:
- frontend production build passes
- backend Python files compile successfully with `python3 -m compileall`

If backend runtime fails locally, the most likely cause is missing Python packages. Install them with:

```bash
cd /Applications/madama
source backend/.venv/bin/activate
python3 -m pip install -r backend/requirements.txt
```

---

## Troubleshooting

### Globe tiles not loading
- verify `VITE_CESIUM_ION_TOKEN`
- verify your Cesium Ion token permissions

### Frontend loads but AI insights / alerts fail
- make sure the backend is running on `127.0.0.1:8000`
- make sure Vite is running on `localhost:5173`
- verify backend dependencies are installed

### `No module named uvicorn` or `No module named pydantic`
- activate your backend virtual environment
- install backend requirements:

```bash
python3 -m pip install -r backend/requirements.txt
```

### Port already in use
- Vite may switch to a new port automatically
- FastAPI default here is `8000`; stop the old process or choose another port manually

---

## Next Recommended Steps

To make this even stronger as an AI/ML engineering portfolio piece:
1. keep the collector running and accumulate several days of historical feature data
2. train a first `IsolationForest` model from collected region snapshots
3. replace the heuristic scorer with the trained model for live inference
4. add experiment tracking and model versioning
5. add forecast endpoints
6. add grounded OpenAI-generated analyst summaries / RAG explanations
7. add Docker and CI

---

## License

Private / internal for now.
