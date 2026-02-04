
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'utils-vendor': ['date-fns', 'framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'ai-vendor': ['@google/generative-ai'],
          'calendar-vendor': ['react-big-calendar'],
          'export-vendor': ['html2canvas', 'jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    }
  }
})
