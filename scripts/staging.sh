#!/usr/bin/env bash
# Staging de jc-webstore en el ASUS: el server sirve el build de la web (apps/web/dist) en el puerto
# de apps/server/.env.staging (3101), con base, PDFs, subidas y correo simulado propios de staging.
#
# Uso: scripts/staging.sh [--skip-build]
#   1. build de la web y del server (salvo --skip-build)
#   2. migraciones pendientes sobre la base de staging (siempre; no borra datos)
#   3. seed (24 productos con fotos locales + admin) mientras la base no esté sembrada
#   4. arranca el server en primer plano (pensado para la unidad systemd jcw-staging.service)
#
# STAGING_ENV_FILE permite usar otro archivo de variables (por defecto apps/server/.env.staging).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="$ROOT/apps/server"
ENV_FILE="${STAGING_ENV_FILE:-$SERVER/.env.staging}"

fail() {
  echo "[staging] $*" >&2
  exit 1
}

[[ -f "$ENV_FILE" ]] || fail "Falta $ENV_FILE. Copia apps/server/.env.staging.example y complétalo."

# Vite 7 necesita Node >= 20.19
node -e '
  const [major, minor] = process.versions.node.split(".").map(Number)
  process.exit(major > 20 || (major === 20 && minor >= 19) ? 0 : 1)
' || fail "Se necesita Node >= 20.19 (hay $(node --version)). Revisa el PATH (nvm)."

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
# El server y el seed cargan dotenv: que lean este archivo y no el .env de desarrollo
export DOTENV_CONFIG_PATH="$ENV_FILE"

# Barandas: staging nunca usa la base de desarrollo ni manda correos reales
[[ "${NODE_ENV:-}" == "production" ]] || fail "NODE_ENV debe ser production en $ENV_FILE."
[[ "${STAGING:-}" == "true" ]] || fail "STAGING debe ser true en $ENV_FILE."
[[ "${MAIL_TRANSPORT:-}" == "outbox" ]] || fail "MAIL_TRANSPORT debe ser outbox: el staging no envía correos reales."
[[ "${DATABASE_URL:-}" == file:* ]] || fail "DATABASE_URL debe ser una base SQLite (file:...)."

db_file="${DATABASE_URL#file:}"
db_file="${db_file%%\?*}"
# Prisma resuelve las rutas relativas desde la carpeta del schema
[[ "$db_file" == /* ]] || db_file="$SERVER/prisma/$db_file"
[[ "$(basename "$db_file")" != "dev.db" ]] || fail "DATABASE_URL apunta a dev.db; el staging usa su propia base."

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "[staging] build de la web y del server"
  (cd "$SERVER" && npx prisma generate >/dev/null)
  (cd "$ROOT" && npm run build)
fi

# La marca se escribe sólo cuando el seed termina: una base nueva interrumpida (corte, stop) se vuelve
# a sembrar en el próximo arranque. El seed es idempotente (upsert).
seeded_mark="$db_file.seeded"
needs_seed=false
if [[ ! -f "$db_file" || ! -f "$seeded_mark" ]]; then
  needs_seed=true
  [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]] || fail "Faltan ADMIN_EMAIL y ADMIN_PASSWORD para el seed."
fi

echo "[staging] migraciones sobre $db_file"
# Con SQLite, migrate deploy crea la base si no existe
(cd "$SERVER" && npx prisma migrate deploy)

if [[ "$needs_seed" == true ]]; then
  echo "[staging] base sin sembrar: seed de productos y admin"
  (cd "$SERVER" && npx tsx prisma/seed.ts)
  touch "$seeded_mark"
fi

echo "[staging] server en http://${HOST:-localhost}:${PORT:-3001} (sitio público: ${PUBLIC_SITE_URL:-sin definir})"
cd "$SERVER"
exec node dist/index.js
