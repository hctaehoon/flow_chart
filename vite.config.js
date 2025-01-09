import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 모든 IP에서 접근 가능하도록 설정
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://43.203.179.67:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env': {}
  }
})
