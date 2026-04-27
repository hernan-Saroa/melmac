import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4300,
    proxy: {
      // Proxy API calls to Melmac Django backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
    // SPA fallback: serve index.html for all routes (e.g., /:token)
    historyApiFallback: true,
  },
  build: {
    outDir: '../src/assets/public-forms',
    emptyOutDir: true,
  }
})
