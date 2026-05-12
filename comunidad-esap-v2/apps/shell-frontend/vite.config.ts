import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4000, // Corremos en 4000 para no chocar con Angular (4200) en el modo híbrido
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Apunta al API Gateway de NestJS
        changeOrigin: true,
      }
    }
  }
})
