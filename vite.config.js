import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://sankar.work/Pre-Authorization/ (GitHub Pages project site)
  base: '/Pre-Authorization/',
  plugins: [react(), tailwindcss()],
  build: {
    // Second entry: the standalone popup that renders the source packet PDF.
    rollupOptions: {
      input: { main: 'index.html', packetViewer: 'packet-viewer.html' },
    },
  },
})
