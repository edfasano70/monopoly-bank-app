#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

strict=0
for arg in "$@"; do
  if [ "$arg" = "--strict" ]; then
    strict=1
  fi
done

errors=0
skipped=()

say() { printf '%s\n' "$*"; }
ok() { say "✓ $*"; }
bad() { say "✗ $*"; errors=$((errors + 1)); }

required=(
  index.php
  api/conexion.php
  api/game.php
  api/join.php
  api/transfer.php
  api/status.php
  api/approve.php
  api/reject.php
  api/regenerate.php
  api/captcha.php
  api/delete_player.php
  api/config.example.php
  sql/schema.sql
  deploy.sh
  manifest.json
  sw.js
  offline.html
  icon.png
  icon-192.png
  icon-512.png
  icon-180.png
  icon-maskable-192.png
  icon-maskable-512.png
  assets/tailwind.js
  assets/js/qrcode.js
  assets/js/reasons.js
  assets/js/common.js
  assets/js/bank.js
  assets/js/player.js
)

for f in "${required[@]}"; do
  if [ ! -f "$f" ]; then
    bad "falta $f"
  fi
done

if [ -f .gitignore ] && ! grep -qx 'api/config.php' .gitignore; then
  bad "api/config.php no está en .gitignore"
fi

if [ -f deploy.sh ] && [ ! -x deploy.sh ]; then
  bad "deploy.sh no es ejecutable"
fi

for table in games players transactions; do
  if ! grep -q "CREATE TABLE IF NOT EXISTS $table" sql/schema.sql; then
    bad "sql/schema.sql no define la tabla $table"
  fi
done

if command -v node >/dev/null 2>&1; then
  for f in assets/js/*.js sw.js; do
    if node --check "$f"; then
      ok "JS $f"
    else
      bad "JS $f"
    fi
  done
else
  say "! node no disponible: JS sin chequear"
  skipped+=("node")
fi

php_cmd=""
if [ -n "${PHP_BIN:-}" ] && command -v "${PHP_BIN}" >/dev/null 2>&1; then
  php_cmd="${PHP_BIN}"
elif command -v php >/dev/null 2>&1; then
  php_cmd="php"
fi

if [ -n "$php_cmd" ]; then
  while IFS= read -r -d '' f; do
    if out="$("$php_cmd" -l "$f" 2>&1)"; then
      ok "PHP $f"
    else
      say "$out"
      bad "PHP $f"
    fi
  done < <(find . -path './.git' -prune -o -name '*.php' -print0)
else
  say "! php no disponible: lint PHP omitido (validar en el servidor con php -l)"
  skipped+=("php")
fi

for f in deploy.sh scripts/*.sh; do
  if bash -n "$f"; then
    ok "shell $f"
  else
    bad "shell $f"
  fi
done

if command -v python3 >/dev/null 2>&1; then
  if python3 -c 'import json; json.load(open("manifest.json"))'; then
    ok "manifest.json"
  else
    bad "manifest.json"
  fi
  if python3 -m py_compile scripts/smoke.py; then
    ok "python scripts/smoke.py"
    rm -rf scripts/__pycache__
  else
    bad "python scripts/smoke.py"
  fi
else
  say "! python3 no disponible: smoke test sin chequear"
  skipped+=("python3")
fi

if [ "$errors" -gt 0 ]; then
  say ""
  bad "chequeo terminado con $errors error(es)"
  exit 1
fi

if [ "${#skipped[@]}" -gt 0 ] && [ "$strict" -eq 1 ]; then
  say ""
  bad "faltan herramientas: ${skipped[*]}"
  exit 1
fi

if [ "${#skipped[@]}" -gt 0 ]; then
  say ""
  say "✓ Chequeo completado (omitidos: ${skipped[*]})"
else
  say ""
  say "✓ Chequeo completado"
fi
