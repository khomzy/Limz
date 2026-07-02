import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages URL: https://khomzy.github.io/Limz/
  // The base path must match your repository name on GitHub
  base: '/Limz/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
