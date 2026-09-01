#!/usr/bin/env bash
# =============================================================================
# INSTALADOR AUTOMÁTICO — Archivo Bíblico Perdido (comparteia.com)
# Compatible con Debian/Ubuntu (apt) y RHEL/CentOS/AlmaLinux/Rocky (dnf/yum).
# Instala dependencias, clona, compila, crea servicio 24/7 y configura
# Nginx + HTTPS. Todo en un solo comando.
#
#   curl -fsSL https://raw.githubusercontent.com/Pzsuave007/comparteia/main/deploy/install.sh | sudo bash
#   # con correo para HTTPS automático:
#   curl -fsSL .../install.sh | sudo LE_EMAIL=tucorreo@ejemplo.com bash
# =============================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Pzsuave007/comparteia.git}"
APP_USER="${APP_USER:-comparteia}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/comparteia}"
DOMAIN="${DOMAIN:-comparteia.com}"
PORT="${PORT:-8080}"
DB_NAME="${DB_NAME:-archivo_biblico}"
LE_EMAIL="${LE_EMAIL:-}"
VENV="${APP_DIR}/backend/venv"

log(){ echo -e "\n\033[1;33m>> $*\033[0m"; }
[ "$(id -u)" -eq 0 ] || { echo "Ejecuta con sudo:  curl ... | sudo bash"; exit 1; }

# ---- Detectar gestor de paquetes ----
if command -v apt-get >/dev/null 2>&1; then PM=apt
elif command -v dnf >/dev/null 2>&1; then PM=dnf
elif command -v yum >/dev/null 2>&1; then PM=yum
else echo "No encuentro apt/dnf/yum"; exit 1; fi
log "Sistema detectado: gestor '${PM}'"
. /etc/os-release || true
RHEL_MAJOR="${VERSION_ID%%.*}"

pkg(){ if [ "$PM" = apt ]; then DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"; else $PM install -y "$@"; fi; }

log "1/9 Paquetes base"
if [ "$PM" = apt ]; then
  apt-get update -y
  pkg git curl ca-certificates gnupg python3 python3-pip python3-venv nginx
else
  $PM install -y epel-release || true
  pkg git curl ca-certificates python3 python3-pip nginx
fi

log "2/9 Node.js 20"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)" -lt 18 ]; then
  if [ "$PM" = apt ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    pkg nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    pkg nodejs
  fi
fi
command -v yarn >/dev/null 2>&1 || npm install -g yarn

log "3/9 MongoDB"
if ! command -v mongod >/dev/null 2>&1; then
  if [ "$PM" = apt ]; then
    if ! apt-get install -y mongodb 2>/dev/null; then
      UB="${UBUNTU_CODENAME:-jammy}"
      curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
      echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UB}/mongodb-org/7.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-7.0.list
      apt-get update -y && pkg mongodb-org
    fi
  else
    cat > /etc/yum.repos.d/mongodb-org-7.0.repo <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/${RHEL_MAJOR}/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
    pkg mongodb-org
  fi
fi
systemctl enable --now mongod 2>/dev/null || systemctl enable --now mongodb 2>/dev/null || true

log "4/9 Clonar / actualizar repo en ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then git -C "${APP_DIR}" pull --ff-only
else mkdir -p "$(dirname "${APP_DIR}")"; git clone "${REPO_URL}" "${APP_DIR}"; fi

log "5/9 backend/.env"
[ -f "${APP_DIR}/backend/.env" ] || cat > "${APP_DIR}/backend/.env" <<EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=${DB_NAME}
CORS_ORIGINS=*
PORT=${PORT}
EOF

log "6/9 Compilar frontend (mismo origen)"
cd "${APP_DIR}/frontend"
printf 'REACT_APP_BACKEND_URL=\n' > .env.production.local
yarn install
yarn build

log "7/9 Entorno Python (venv)"
python3 -m venv "${VENV}"
"${VENV}/bin/pip" install --upgrade pip
"${VENV}/bin/pip" install -r "${APP_DIR}/backend/requirements.txt"
"${VENV}/bin/pip" install "uvicorn[standard]"
id "${APP_USER}" >/dev/null 2>&1 && chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

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
NGINX_VHOST='server {
    listen 80;
    listen [::]:80;
    server_name '"${DOMAIN}"' www.'"${DOMAIN}"';
    location / {
        proxy_pass http://127.0.0.1:'"${PORT}"';
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}'
if [ -d /etc/nginx/sites-available ]; then
  echo "$NGINX_VHOST" > /etc/nginx/sites-available/comparteia
  ln -sf /etc/nginx/sites-available/comparteia /etc/nginx/sites-enabled/comparteia
  rm -f /etc/nginx/sites-enabled/default
else
  echo "$NGINX_VHOST" > /etc/nginx/conf.d/comparteia.conf
fi
nginx -t && systemctl enable --now nginx && systemctl reload nginx

# SELinux (RHEL): permite que Nginx conecte al backend local
command -v setsebool >/dev/null 2>&1 && setsebool -P httpd_can_network_connect 1 || true
# Firewall
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=http; firewall-cmd --permanent --add-service=https; firewall-cmd --reload
elif command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true; ufw allow 443/tcp || true
fi

# certbot
if [ "$PM" = apt ]; then pkg certbot python3-certbot-nginx; else pkg certbot python3-certbot-nginx || pkg certbot python3-certbot-nginx; fi
CB_ARGS="--nginx -d ${DOMAIN} -d www.${DOMAIN} --redirect"
if [ -n "${LE_EMAIL}" ]; then CB_ARGS="${CB_ARGS} --non-interactive --agree-tos -m ${LE_EMAIL}"; fi
certbot ${CB_ARGS} || echo "!! certbot no completó (¿el DNS ya apunta aquí?). Ejecuta luego: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

echo -e "\n\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m  ✅ INSTALACIÓN COMPLETA\033[0m"
echo -e "  TV/pantalla : https://${DOMAIN}/host"
echo -e "  Jugadores   : https://${DOMAIN}/play"
echo -e "  Logs        : journalctl -u archivo -f"
echo -e "\033[1;32m========================================================\033[0m"
