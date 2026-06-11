# Matrix Smart Makkah — ML Microservice

FastAPI + scikit-learn service that provides predictive analytics for the
Smart City Operating System. Authored by **Abdulaziz AlAmawi**.

## Models

| Model | Algorithm | Target |
|-------|-----------|--------|
| Forecasters (waste / traffic / aqi / energy) | `GradientBoostingRegressor` over lag + seasonal features | metric at `t + horizon` |
| Incident Risk Scorer | `RandomForestClassifier` | composite risk `0..100` |
| Predictive Maintenance | `IsolationForest` (anomaly detection) | device failure within 7 days |

Models train on synthetic-but-realistic telemetry at startup (see `app/models.py`).

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs>

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/models` | Model registry + accuracy |
| POST | `/forecast` | Time-series forecast `{ metric, horizon, history? }` |
| POST | `/risk` | Composite risk score from features |
| POST | `/maintenance` | Predictive-maintenance scoring for devices |

### Example

```bash
curl -X POST http://localhost:8000/forecast \
  -H 'content-type: application/json' \
  -d '{"metric":"traffic","horizon":24}'
```

## Docker

```bash
docker build -t matrix-makkah-ml .
docker run -p 8000:8000 matrix-makkah-ml
```
