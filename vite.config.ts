import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /jibun-choice-town/
  base: "/jibun-choice-town/",
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5177,
  },
})
