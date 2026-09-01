#!/usr/bin/env bash
# =============================================================================
# INSTALADOR AUTOMÁTICO — Archivo Bíblico Perdido (comparteia.com)
# Instala dependencias, clona, compila, crea servicio 24/7 y configura
# Nginx + HTTPS. Todo en un solo comando.
#
# Uso (en el servidor):
#   curl -fsSL https://raw.githubusercontent.com/Pzsuave007/comparteia/main/deploy/install.sh | sudo bash
# Con correo para HTTPS automático:
#   curl -fsSL https://raw.githubusercontent.com/Pzsuave007/comparteia/main/deploy/install.sh | sudo LE_EMAIL=tucorreo@ejemplo.com bash
# =============================================================================
set -euo pipefail

# ---- Configuración (puedes sobrescribir con variables de entorno) ----
REPO_URL="${REPO_URL:-https://github.com/Pzsuave007/comparteia.git}"
APP_USER="${APP_USER:-comparteia}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/comparteia}"
DOMAIN="${DOMAIN:-comparteia.com}"
PORT="${PORT:-8080}"
DB_NAME="${DB_NAME:-archivo_biblico}"
LE_EMAIL="${LE_EMAIL:-}"          # opcional: correo para certbot no interactivo
VENV="${APP_DIR}/backend/venv"

log(){ echo -e "\n\033[1;33m>> $*\033[0m"; }

[ "$(id -u)" -eq 0 ] || { echo "Ejecuta con sudo:  curl ... | sudo bash"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

log "1/9 Paquetes base"
apt-get update -y
apt-get install -y git curl ca-certificates gnupg python3 python3-pip python3-venv nginx

log "2/9 Node.js 20"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v yarn >/dev/null 2>&1 || npm install -g yarn

log "3/9 MongoDB"
if ! command -v mongod >/dev/null 2>&1; then
  if apt-get install -y mongodb 2>/dev/null; then
    systemctl enable --now mongodb || true
  else
    . /etc/os-release
    UB="${UBUNTU_CODENAME:-jammy}"
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UB}/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -y
    apt-get install -y mongodb-org
    systemctl enable --now mongod
  fi
fi

log "4/9 Clonar / actualizar repo en ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull --ff-only
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

log "5/9 backend/.env"
if [ ! -f "${APP_DIR}/backend/.env" ]; then
  cat > "${APP_DIR}/backend/.env" <<EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=${DB_NAME}
CORS_ORIGINS=*
PORT=${PORT}
EOF
fi

log "6/9 Compilar frontend (mismo origen)"
cd "${APP_DIR}/frontend"
printf 'REACT_APP_BACKEND_URL=\n' > .env.production.local
yarn install
yarn build

log "7/9 Entorno de Python (venv)"
python3 -m venv "${VENV}"
"${VENV}/bin/pip" install --upgrade pip
"${VENV}/bin/pip" install -r "${APP_DIR}/backend/requirements.txt"
"${VENV}/bin/pip" install "uvicorn[standard]"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log "8/9 Servicio systemd (24/7)"
cat > /etc/systemd/system/archivo.service <<EOF
[Unit]
Description=Archivo Biblico Perdido (${DOMAIN})
After=network.target mongod.service mongodb.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
Environment=FRONTEND_BUILD_DIR=${APP_DIR}/frontend/build
Environment=PORT=${PORT}
ExecStart=${VENV}/bin/uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now archivo

log "9/9 Nginx + HTTPS para ${DOMAIN}"
cat > /etc/nginx/sites-available/comparteia <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/comparteia /etc/nginx/sites-enabled/comparteia
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
command -v ufw >/dev/null 2>&1 && { ufw allow 80/tcp || true; ufw allow 443/tcp || true; }

apt-get install -y certbot python3-certbot-nginx
if [ -n "${LE_EMAIL}" ]; then
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos -m "${LE_EMAIL}" --redirect \
    || echo "!! certbot no completó (¿el DNS ya apunta a este servidor?). Ejecútalo luego: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --redirect \
    || echo "!! certbot no completó (¿el DNS ya apunta a este servidor?). Ejecútalo luego: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

echo -e "\n\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m  ✅ INSTALACIÓN COMPLETA\033[0m"
echo -e "  TV/pantalla : https://${DOMAIN}/host"
echo -e "  Jugadores   : https://${DOMAIN}/play"
echo -e "  Logs        : journalctl -u archivo -f"
echo -e "\033[1;32m========================================================\033[0m"
