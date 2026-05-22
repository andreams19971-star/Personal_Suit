import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase':     ['@supabase/supabase-js'],
          'finanz':       ['./src/apps/FinanzApp.jsx'],
          'planner':      ['./src/apps/Planner.jsx'],
          'flota':        ['./src/apps/FlotaTracker.jsx'],
          'apartamento':  ['./src/apps/ApartamentoApp.jsx'],
        }
      }
    }
  }
})

