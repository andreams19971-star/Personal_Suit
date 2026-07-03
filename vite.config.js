import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BUILD_STAMP = '1780928780';

export default defineConfig({
  plugins: [react()],
  define: {
    '__BUILD_STAMP__': JSON.stringify(BUILD_STAMP),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
