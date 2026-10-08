import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API_PROXY_TARGET permite otro puerto (tests e2e, o si 3001 está ocupado)
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
      '/uploads': process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
    },
  },
})
