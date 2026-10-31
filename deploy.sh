#!/bin/bash
set -euo pipefail

HOST="${DEPLOY_HOST:?Define DEPLOY_HOST con el host o la IP del servidor}"
USER="${DEPLOY_USER:?Define DEPLOY_USER con el usuario SSH}"
DEST="${DEPLOY_DEST:-/var/www/monopoly}"

if [ -z "${SSHPASS:-}" ]; then
  echo "Define SSHPASS con la contraseña SSH antes de ejecutar: export SSHPASS='...'" >&2
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no"

echo "→ rsync a $USER@$HOST:$DEST"
sshpass -e rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude 'api/config.php' \
  -e "ssh $SSH_OPTS" ./ "$USER@$HOST:$DEST/"

echo "→ permisos + recarga Apache"
sshpass -e ssh $SSH_OPTS "$USER@$HOST" \
  "chown -R www-data:www-data $DEST && \
   find $DEST -type d -exec chmod 755 {} + && \
   find $DEST -type f -exec chmod 644 {} + && \
   chmod 640 $DEST/api/config.php && \
   systemctl reload apache2"

echo "✔ Deploy completo en $USER@$HOST:$DEST"
