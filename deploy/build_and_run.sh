#!/usr/bin/env bash
# =============================================================================
# ARCHIVO BÍBLICO PERDIDO — Instalación en 1 solo puerto (self-hosting)
# Sirve frontend + API + WebSocket desde FastAPI en un único puerto.
# Uso:   PORT=8080 ./deploy/build_and_run.sh
# =============================================================================
set -e

# Raíz del proyecto (carpeta que contiene frontend/ y backend/)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ">> 1/4  Frontend: build de producción (mismo origen)"
cd "$ROOT/frontend"
# Vacío = el frontend usa su propio origen (window.location.origin)
printf 'REACT_APP_BACKEND_URL=\n' > .env.production.local
yarn install --frozen-lockfile || yarn install
yarn build

echo ">> 2/4  Backend: dependencias de Python"
cd "$ROOT/backend"
pip install -r requirements.txt

echo ">> 3/4  Variables de entorno"
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "!! No existe backend/.env — copia deploy/backend.env.example a backend/.env y edítalo."
  exit 1
fi

echo ">> 4/4  Arrancando servidor en el puerto ${PORT:-8080}"
export FRONTEND_BUILD_DIR="$ROOT/frontend/build"
PORT="${PORT:-8080}"
# IMPORTANTE: 1 solo worker (las salas viven en memoria).
exec uvicorn server:app --host 0.0.0.0 --port "$PORT" --workers 1
