# 🗺️ Archivo Bíblico Perdido — Guía de instalación en tu servidor (1 puerto)

Esta app corre en **un solo puerto**: FastAPI sirve el frontend (React ya compilado),
la API REST y los WebSockets juntos. No necesitas Nginx para que funcione (es opcional
solo si quieres dominio + HTTPS).

## ✅ Requisitos en el servidor
- **Node.js 18+** y **Yarn**  → para compilar el frontend una vez
- **Python 3.10+** y **pip**  → para el backend
- **MongoDB** corriendo (local `mongodb://localhost:27017`, o una URL de MongoDB Atlas)

```bash
# Ubuntu/Debian (ejemplo)
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm mongodb
sudo npm i -g yarn
```

## 🚀 Instalación rápida
1. Copia el proyecto al servidor (git clone o scp). Debe quedar la carpeta con
   `frontend/` y `backend/` dentro.
2. Crea el archivo de entorno del backend:
   ```bash
   cp deploy/backend.env.example backend/.env
   nano backend/.env      # ajusta MONGO_URL, DB_NAME y el PORT que quieras
   ```
3. Compila y arranca (elige el puerto libre que gustes):
   ```bash
   chmod +x deploy/build_and_run.sh
   PORT=8080 ./deploy/build_and_run.sh
   ```
4. Abre en el navegador:
   - **TV / pantalla grande:**  `http://IP_DEL_SERVIDOR:8080/host`
   - **Jugadores (teléfono):**  escanean el QR de la TV, o entran a `.../play` con el código.

> El primer arranque siembra la base de datos automáticamente (personajes, lugares,
> eventos y preguntas). Las imágenes se cargan desde un CDN externo, no pesan en tu servidor.

## 🔎 Elegir un puerto que funcione
Comprueba que el puerto esté libre y ábrelo en el firewall:
```bash
sudo ss -ltnp | grep :8080     # si no muestra nada, está libre
sudo ufw allow 8080/tcp        # si usas ufw
```
Cambia `8080` por el que quieras en `PORT=...`.

## ♻️ Mantener la app encendida 24/7 (systemd)
```bash
# 1) coloca el proyecto en /opt/archivo-biblico (o edita las rutas del .service)
sudo cp deploy/archivo.service /etc/systemd/system/archivo.service
sudo nano /etc/systemd/system/archivo.service   # revisa WorkingDirectory y PORT
sudo systemctl daemon-reload
sudo systemctl enable --now archivo
sudo systemctl status archivo
journalctl -u archivo -f                          # ver logs
```

## 🌐 (Opcional) Dominio + HTTPS con Nginx
Solo si quieres `https://tudominio.com` en vez de `IP:puerto`.
Usa `deploy/nginx-optional.conf` (incluye las cabeceras `Upgrade` necesarias para
los WebSockets) y luego `sudo certbot --nginx -d tudominio.com`.

## ⚠️ Notas importantes
- **Un solo worker.** Las partidas viven en memoria del proceso. Corre siempre con
  `--workers 1` (ya viene así). Si algún día necesitas varios workers o reinicios sin
  perder partidas, hay que mover las salas a Redis/Mongo (te lo puedo preparar).
- **Reiniciar el backend borra las partidas activas** (no el contenido de la base).
- **Actualizar la app:** vuelve a ejecutar `build_and_run.sh` (o reinicia el servicio
  tras recompilar el frontend con `yarn build`).

## 🧩 ¿Qué hace `build_and_run.sh`?
1. Escribe `frontend/.env.production.local` con `REACT_APP_BACKEND_URL=` (vacío) → el
   frontend usa su propio origen.
2. `yarn build` (genera `frontend/build/`).
3. Instala dependencias de Python.
4. Arranca `uvicorn` sirviendo **todo** en el puerto elegido.
