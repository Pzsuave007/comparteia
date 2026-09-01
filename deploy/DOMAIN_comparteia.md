# 🌐 Publicar en comparteia.com

Objetivo: que `https://comparteia.com` muestre el juego. La app corre internamente
en `127.0.0.1:8080` y **Nginx** la expone con HTTPS y soporte WebSocket.

## 1) DNS (en el panel de tu dominio)
Apunta el dominio a la **IP pública de tu servidor** (averíguala con `curl ifconfig.me`):

| Tipo | Nombre | Valor                 |
|------|--------|-----------------------|
| A    | `@`    | IP_PUBLICA_DEL_SERVIDOR |
| A    | `www`  | IP_PUBLICA_DEL_SERVIDOR |

> Si tu proveedor usa Cloudflare, deja el proxy en “DNS only” (nube gris) mientras
> emites el certificado; luego puedes activarlo.
> La propagación tarda de 5 min a un par de horas.

## 2) Arranca la app (un solo puerto interno)
```bash
cp deploy/backend.env.example backend/.env    # edita MONGO_URL, DB_NAME
PORT=8080 ./deploy/build_and_run.sh           # o usa el servicio systemd (recomendado)
```

## 3) Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# NO necesitas abrir el 8080 al público: solo lo usa Nginx localmente.
```

## 4) Nginx + HTTPS
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx-optional.conf /etc/nginx/sites-available/comparteia
sudo ln -s /etc/nginx/sites-available/comparteia /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # opcional
sudo nginx -t && sudo systemctl reload nginx

# Certificado HTTPS gratis (Let's Encrypt). Requiere que el DNS del paso 1 ya apunte aquí:
sudo certbot --nginx -d comparteia.com -d www.comparteia.com
```
Certbot te configura el redirect a HTTPS y la renovación automática.

## 5) ¡Listo! Cómo se usa
- **TV / pantalla grande:** `https://comparteia.com/host`
- **Jugadores (teléfono):** escanean el QR de la TV, o entran a `https://comparteia.com/play`
  con el código de la sala.

## ✅ Comprobaciones rápidas
```bash
# app interna respondiendo:
curl -s http://127.0.0.1:8080/api/         # -> {"message":"Archivo Biblico Perdido API"}
# dominio por HTTPS:
curl -sI https://comparteia.com | head -1  # -> HTTP/2 200
```
Si algo falla:
- `sudo nginx -t` (config) · `journalctl -u archivo -f` (app) · `sudo tail -f /var/log/nginx/error.log`
- ¿Los jugadores no aparecen? Casi siempre son las cabeceras `Upgrade/Connection` del WebSocket
  (ya vienen en `nginx-optional.conf`).

## Nota
Los WebSockets viajan por `wss://comparteia.com/api/ws/...` automáticamente (mismo origen),
así que **no hay que configurar ninguna URL** en el frontend. 👍
