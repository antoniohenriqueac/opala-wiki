import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// GitHub Pages: BASE_PATH=/opala-wiki/  |  Render / custom domain: BASE_PATH=/
const base = process.env.BASE_PATH ?? '/opala-wiki/'
const normalizedBase = base.endsWith('/') ? base : `${base}/`

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: normalizedBase,
  server: {
    proxy: {
      '/coins-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coins-api/, ''),
      },
    },
  },
})
