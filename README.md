# JC Webstore

JC Webstore is a single-page React application that showcases a curated catalog of graduation essentials such as embroidered stoles, signature mortarboards, and customizable gift kits. The experience is built to help parents and schools browse offerings, learn about the brand, and start a purchase flow through cart management and contact options.

## Features
- **Home hero & value props** highlighting the ceremony aesthetic and call-to-action buttons for catalog browsing.
- **Product catalog** with price, lead time, and promotional badges sourced from `src/data/products.ts`.
- **Persistent layout** with navigation, footer, and branded styling shared across pages.
- **Cart experience** that summarizes selected products and costs.
- **About & contact pages** to present the company story and provide outreach channels.
- **Responsive design** optimized for desktop and mobile via modular SCSS styles.

## Tech stack
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- Routing with [React Router](https://reactrouter.com/)
- Styling with modular SCSS under `src/styles`

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   Vite will print a local URL (typically `http://localhost:5173`) for live reloading.
3. **Run lint checks**
   ```bash
   npm run lint
   ```
4. **Create a production build**
   ```bash
   npm run build
   ```

## Project structure
- `src/App.tsx` – Route map for home, catalog, about, contact, cart, and 404 pages.
- `src/components/` – Reusable UI such as layout, headers, product cards, and cart elements.
- `src/pages/` – Page-level screens composed from components.
- `src/data/` – Product catalog seed data and shared types.
- `src/styles/` – Global and component-scoped SCSS styles.

## Deployment notes
- This template is configured as an SPA suitable for static hosting platforms (Netlify, Vercel, GitHub Pages).
- Ensure `npm run build` completes successfully before deploying the `dist/` output.

## License
This project is provided for educational and portfolio use. Customize and extend it to fit your graduation merchandising needs.
