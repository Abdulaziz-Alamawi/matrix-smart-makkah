# Deployment Guide — Matrix Smart Makkah

Author: Abdulaziz AlAmawi

## Option A — Docker (full stack)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| ML API | http://localhost:8000/docs |

## Option B — Vercel (web frontend)

1. Import repo on Vercel
2. Set Root Directory to `apps/web`
3. Deploy (no env vars required for demo)

## Option C — ML service

```bash
cd services/ml && docker build -t matrix-makkah-ml . && docker run -p 8000:8000 matrix-makkah-ml
```

(c) 2026 Abdulaziz AlAmawi
