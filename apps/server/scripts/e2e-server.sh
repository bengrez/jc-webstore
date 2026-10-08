#!/usr/bin/env bash
# Servidor para Playwright: base y almacenamiento propios, recreados en cada corrida.
# Las variables (DATABASE_URL=file:./e2e.db, MAIL_TRANSPORT=outbox, etc.) las define playwright.config.ts.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -f prisma/e2e.db prisma/e2e.db-journal
rm -rf storage/e2e
npx prisma migrate deploy > /dev/null
npx tsx scripts/e2e-seed.ts
exec npx tsx src/index.ts
