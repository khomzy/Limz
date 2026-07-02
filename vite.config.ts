import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app at: https://<username>.github.io/<repo-name>/
  // Change '/zingwangwa-lims/' below if your GitHub repo name is different.
  base: '/Limz/',
})
