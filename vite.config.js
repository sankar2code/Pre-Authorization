import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Second entry: the standalone popup that renders the source packet PDF.
    rollupOptions: {
      input: { main: 'index.html', packetViewer: 'packet-viewer.html' },
    },
  },
})
