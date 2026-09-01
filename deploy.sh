#!/bin/bash
# =============================================================================
# DEPLOY — Archivo Bíblico Perdido (comparteia.com) en cPanel/AlmaLinux/Apache
# Corre como ROOT.  Primera vez y updates usan el mismo comando.
# =============================================================================
set -e
# ============ VARIABLES ============
REPO_URL="https://github.com/Pzsuave007/comparteia.git"
CPANEL_USER="comparteia"
PORT=8080
DOMAIN="comparteia.com"
# ===================================
REPO="/home/${CPANEL_USER}/repo"
PROD="/opt/${CPANEL_USER}/backend"

[ "$EUID" -ne 0 ] && { echo "❌ Ejecuta como root"; exit 1; }
git config --global --add safe.directory '*' 2>/dev/null || true

as_user() { su -s /bin/bash -l "$CPANEL_USER" -c "PORT=$PORT $1"; }

if [ ! -d "$PROD/venv" ]; then
    echo ">>> PRIMERA INSTALACIÓN"
    if [ ! -d "$REPO/.git" ]; then rm -rf "$REPO"; git clone "$REPO_URL" "$REPO"; fi
    chown -R "$CPANEL_USER:$CPANEL_USER" "$REPO"
    chmod 711 "/home/$CPANEL_USER"
    mkdir -p "$PROD"; chown -R "$CPANEL_USER:$CPANEL_USER" "/opt/$CPANEL_USER"
    if [ ! -f "$PROD/.env" ]; then
        cp "$REPO/deploy/backend.env.production.example" "$PROD/.env"
        chown "$CPANEL_USER:$CPANEL_USER" "$PROD/.env"; chmod 600 "$PROD/.env"
    fi
    as_user "bash $REPO/deploy/install_server.sh"
    as_user "bash $REPO/deploy/setup-autostart.sh"
else
    echo ">>> UPDATE"
    chown -R "$CPANEL_USER:$CPANEL_USER" "$REPO"
    as_user "cd $REPO && git pull --ff-only"
    as_user "bash $REPO/deploy/install_server.sh"
fi

sleep 2
if curl -sf "http://localhost:$PORT/api/" >/dev/null; then
    echo "  ✅ Backend OK en :$PORT"
else
    echo "  ❌ Backend no responde. Últimas líneas del log:"; tail -n 20 "$PROD/backend.log" 2>/dev/null; exit 1
fi
echo "🎉 Abre en la TV:  https://$DOMAIN/host    ·    Jugadores: https://$DOMAIN/play"
