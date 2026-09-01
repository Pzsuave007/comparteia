#!/bin/bash
# Corre como usuario cPanel (lo invoca deploy.sh vía su -l). NO usar sudo aquí.
set -e
CPANEL_USER="$(whoami)"
PORT="${PORT:-8080}"
REPO="/home/${CPANEL_USER}/repo"
PROD="/opt/${CPANEL_USER}/backend"
PUBLIC_HTML="/home/${CPANEL_USER}/public_html"

echo ">> venv + dependencias slim (Python 3.9)"
[ -d "$PROD/venv" ] || python3 -m venv "$PROD/venv"
"$PROD/venv/bin/pip" install --upgrade pip
"$PROD/venv/bin/pip" install -r "$REPO/deploy/requirements.prod.txt"

echo ">> copiar backend a $PROD"
cp "$REPO"/backend/*.py "$PROD"/
[ -f "$PROD/.env" ] || cp "$REPO/deploy/backend.env.production.example" "$PROD/.env"

echo ">> compilar frontend (mismo origen)"
cd "$REPO/frontend"
printf 'REACT_APP_BACKEND_URL=\n' > .env.production.local
yarn install --ignore-engines
yarn build

echo ">> publicar frontend en public_html"
mkdir -p "$PUBLIC_HTML"
rm -rf "$PUBLIC_HTML"/static "$PUBLIC_HTML"/index.html "$PUBLIC_HTML"/asset-manifest.json "$PUBLIC_HTML"/*.png "$PUBLIC_HTML"/*.txt "$PUBLIC_HTML"/*.ico 2>/dev/null || true
cp -r "$REPO"/frontend/build/* "$PUBLIC_HTML"/
cp "$REPO"/deploy/htaccess "$PUBLIC_HTML"/.htaccess
find "$PUBLIC_HTML" -type f -exec chmod 644 {} \;
find "$PUBLIC_HTML" -type d -exec chmod 755 {} \;

echo ">> arrancar backend (nohup) en 127.0.0.1:${PORT}"
pkill -f "uvicorn server:app.*${PORT}" 2>/dev/null || true
sleep 1
cd "$PROD"
set -a; . "$PROD/.env"; set +a
nohup "$PROD/venv/bin/uvicorn" server:app --host 127.0.0.1 --port "${PORT}" --workers 1 > "$PROD/backend.log" 2>&1 &
sleep 3
echo ">> backend.log (últimas líneas):"; tail -n 8 "$PROD/backend.log" || true
