#!/bin/bash
# Server fresco: clona el repo y lanza deploy.sh. Correr como ROOT.
set -e
REPO_URL="https://github.com/Pzsuave007/comparteia.git"
CPANEL_USER="comparteia"
git config --global --add safe.directory '*' 2>/dev/null || true
REPO="/home/${CPANEL_USER}/repo"
[ -d "$REPO/.git" ] || git clone "$REPO_URL" "$REPO"
cd "$REPO" && git pull --ff-only || true
bash "$REPO/deploy.sh"
