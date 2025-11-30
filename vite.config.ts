import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [
          ['@babel/preset-env', {
            modules: false,
            targets: {
              electron: '28.0.0'
            }
          }],
          ['@babel/preset-react', {
            runtime: 'automatic'
          }],
          '@babel/preset-typescript'
        ]
      }
    })
  ],
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer/index.html')
    }
  },
  css: {
    devSourcemap: true
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  },
  optimizeDeps: {
    exclude: ['electron']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@preload': path.resolve(__dirname, 'src/preload')
    }
  }
})