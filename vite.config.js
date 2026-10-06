import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { careshiftRealtime } from './realtime/server.js'

// https://vite.dev/config/
export default defineConfig({
  // careshiftRealtime: WebSocket relay so patient / nurse / hospital screens update live across devices.
  plugins: [react(), careshiftRealtime()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
