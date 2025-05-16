// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将所有 /api/v1 开头的请求代理到你的后端服务
      '/api/v1': {
        target: 'http://localhost:3001', // <--- 修改这里为你的后端端口号
        changeOrigin: true,
        // 如果你的后端API路径本身不包含 /api/v1，你可能需要 rewrite
        // rewrite: (path) => path.replace(/^\/api\/v1/, '')
      },
    }
  }
})