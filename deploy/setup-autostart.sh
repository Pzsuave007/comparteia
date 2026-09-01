#!/bin/bash
# Corre como usuario cPanel. Reinicia el backend al reiniciar el servidor.
set -e
CPANEL_USER="$(whoami)"
PORT="${PORT:-8080}"
PROD="/opt/${CPANEL_USER}/backend"
CMD="@reboot cd $PROD && set -a && . $PROD/.env && set +a && $PROD/venv/bin/uvicorn server:app --host 127.0.0.1 --port ${PORT} --workers 1 > $PROD/backend.log 2>&1 &"
( crontab -l 2>/dev/null | grep -v "uvicorn server:app" ; echo "$CMD" ) | crontab -
echo ">> crontab @reboot configurado."
