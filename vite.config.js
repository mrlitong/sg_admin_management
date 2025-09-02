import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0', // 允许外部访问
      port: 5173,
      strictPort: true,
      proxy: {
        // HTTP API 代理
        '/api': {
          target: 'http://127.0.0.1:8567',
          changeOrigin: true,
          rewrite: (path) => path
        },
        // WebSocket 代理
        '/api/ws': {
          target: 'ws://127.0.0.1:8567',
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
})
