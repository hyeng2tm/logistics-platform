import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const FRONTEND_HOST = 'localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        // auth-server의 302 Location 헤더를 localhost:3000으로 재작성
        // → 브라우저가 항상 localhost:3000에 머물러 세션 쿠키가 유지됨
        autoRewrite: true,
        cookieDomainRewrite: 'localhost',
        headers: {
          'X-Forwarded-Host': FRONTEND_HOST,
          'X-Forwarded-Proto': 'http',
        },
      },
      '/login': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        headers: {
          'X-Forwarded-Host': FRONTEND_HOST,
          'X-Forwarded-Proto': 'http',
        },
      },
      '/logout': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        headers: {
          'X-Forwarded-Host': FRONTEND_HOST,
          'X-Forwarded-Proto': 'http',
        },
      },
      '/css': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
})


