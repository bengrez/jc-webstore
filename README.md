# JC Webstore (Confecciones Juany)

Monorepo para el sitio de catálogo + carrito de cotización (web + backend juntos).

## Estructura
- `apps/web` – Frontend React + Vite.
- `apps/server` – Backend Node (Express) + SQLite (Prisma) que también sirve el frontend en producción.

## Requisitos
- Node.js 18+

## Desarrollo
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```
   - Para Gmail usa **App Password** (no tu contraseña normal).
3. Crear DB y seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Levantar web + API:
   ```bash
   npm run dev
   ```
   - Web: `http://localhost:5173`
   - API: `http://localhost:3001/api/health`

## Admin
- Login en `http://localhost:5173/admin/login`
- Usuario/clave: se crean desde `ADMIN_EMAIL` / `ADMIN_PASSWORD` con `npm run db:seed`.

## Producción (todo junto)
```bash
npm run db:deploy
# opcional (solo 1 vez o cuando cambies credenciales)
npm run db:seed
npm run build
npm start
```

En producción el backend sirve el build de `apps/web`, por lo que todo queda en un solo servicio/URL.
