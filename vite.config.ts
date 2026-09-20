import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 2026-09-20 (Ver.2 migration, docs/jibun-choice-v2/MIGRATION_PLAN.md T-01 = plan A):
// Ver.2 lives in the same repo behind a second HTML entry (v2.html ->
// src/v2/). The dev server always serves it, but the production build
// includes it ONLY when VITE_INCLUDE_V2=1 — so the CI build on main keeps
// publishing Ver.1 alone until a Human decides to expose Ver.2 (T-02).
const includeV2 = process.env.VITE_INCLUDE_V2 === '1'
const html = (name: string) => fileURLToPath(new URL(`./${name}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /jibun-choice-town/
  base: "/jibun-choice-town/",
  plugins: [react()],
  server: {
    port: 5177,
  },
  build: {
    rollupOptions: {
      input: {
        main: html('index.html'),
        ...(includeV2 ? { v2: html('v2.html') } : {}),
      },
    },
  },
})
