# AGENTS.md

## Project

Banca web para Monopoly: PHP 8 nativo + PDO/MySQL (InnoDB), JS vanilla y Tailwind local. Sin framework, sin build step. La spec original es `plan_de_implementaci_n2.md`; ante conflicto, mandan el código y este archivo.

## Layout

- `index.php` decide la vista por query param: sin params → inicio; `?join=CODE` → alta; `?code=CODE` → banca; `?token=HEX` → jugador. Inyecta `window.MONOPOLY`.
- `assets/js/common.js` (helpers + inicio/alta), `bank.js`, `player.js`; polling cada 3 s.
- `assets/js/qrcode.js` (qrcode-generator, MIT) genera el QR del enlace de invitación **en el cliente**; no usar APIs de QR externas.
- `assets/js/reasons.js` agrupa los motivos en tres flujos: **Banca→Jugador**, **Jugador→Banca** y **Jugador→Jugador**. La Banca puede registrar los tres; el panel del jugador solo muestra los dos últimos.
- `api/`: `game.php`, `join.php`, `transfer.php`, `status.php`, `approve.php`, `reject.php`, `regenerate.php`, `seeder.php` (CLI) y `conexion.php` (`getPDO`, `jsonResponse`, `readJsonBody`, `normalizeCode`, `isValidCode`).
- Recuperación de acceso: el token se guarda en `localStorage` por código de partida; `?join=` ofrece “Continuar” en el mismo dispositivo. Si se perdió, la Banca regenera el enlace del jugador (`POST /api/regenerate.php`, invalida el anterior) y lo muestra como QR en un popup.
- `sql/schema.sql`: `games`, `players`, `transactions`, `pending_transfers`. `NULL` en `from_player_id`/`to_player_id` = Banca; `UNIQUE(game_id, name)`; `CHECK(amount > 0)`.
- `deploy.sh` espejo de `../saludable/deploy.sh`.

## Contrato de transferencias

- `POST /api/transfer.php` siempre lleva `game_code`.
- Emisor: `from_token` (`HEX` o `BANK`). La Banca cobra con `from_token=BANK` + `from_player_id`.
- Destinatario: `to_player_id` (jugador) o `to_token=BANK`. `status.php` **nunca** devuelve tokens; `regenerate.php` es la excepción controlada por la Banca.
- Importe entero `1..1e9`; misma partida; atómico con `FOR UPDATE` + `UPDATE ... AND balance >= ?`; 409 si no alcanza.
- **Jugador→Jugador iniciado por un jugador queda pendiente**: `transfer.php` responde 202 con `pending`; la Banca aprueba con `approve.php` o rechaza con `reject.php` desde la tarjeta de pendientes. Lo que inicia la Banca se ejecuta al instante.

## Comandos

- `./scripts/check.sh` (o `make check`): valida archivos requeridos, `.gitignore`, JS con `node --check`, shell con `bash -n`, Python con `py_compile` y PHP con `php -l` **solo si hay PHP local**. `--strict` falla si falta una herramienta.
- `python3 scripts/smoke.py [--base-url URL] [--insecure]`: checks HTTP no mutantes (`/` 200, `config.php`/`.md`/`.sql` 403, status 400/404).
- `python3 scripts/smoke.py --full`: crea una partida `SMOKE_<epoch>` y prueba join/transferencias/saldos. **Deja datos**; limpiar a mano.
- `./deploy.sh`: requiere `DEPLOY_HOST`, `DEPLOY_USER` y `SSHPASS`; `DEPLOY_DEST` es opcional. **No ejecutar sin pedido explícito**.

## Deployment — mirror `../saludable`

Leer `../saludable/GUIA_MULTI_APP.md` antes de tocar el servidor.

- Servidor: Ubuntu 24.04 · Apache 2.4 · PHP 8.3 · MySQL 8 · certbot · `ufw` (22/80/443).
- Host de la app → docroot `/var/www/monopoly` → vhost `/etc/apache2/sites-available/monopoly.conf`. El hostname no se versiona; se define en el servidor y en `DEPLOY_HOST`.
- DB `monopoly`, usuario `monopoly_user`@`localhost`. Aplicar `sql/schema.sql` manualmente.
- `api/config.example.php` se versiona; `api/config.php` solo existe en el servidor (`chmod 640`, `www-data`) y está excluido de git y rsync.
- Vhost: negar `config.php`, `.sql/.md/.txt` y dotfiles; logs `monopoly-error.log`/`monopoly-access.log`; HTTPS con `certbot --apache -d <host> --redirect`.
- Tailwind se sirve local desde `assets/tailwind.js` (copiado de saludable); no usar CDN externo.

## Gotchas

- **No hay PHP CLI local** y **no usar Docker** (pedido explícito). `check.sh` omite el lint PHP; validar en el servidor con `php -l` o instalando `php-cli`.
- Nunca leer, copiar ni versionar secretos de `../saludable/api/config.php`; generar la config de `monopoly` en el servidor.
- UI en español neutro (sin voseo). Escapar nombres/descripciones con `esc()` o `textContent` (XSS).
- No hay auth: la banca se protege solo con el código de partida; el token del jugador es una credencial bearer (no compartirlo).
- Reglas del workspace en `../AGENTS.md`: PHP 8 + MySQL, sin build, paths absolutos `/api/...`.
