import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import router from '../router'
import config from '../config/index.js'

/**
 * HTTP 请求工具
 * 
 * ⚠️ 重要提示：
 * baseURL 已配置为 '/api' 或 'http://xxx:8567/api'
 * 调用时不要重复添加 /api 前缀！
 * 
 * 正确：request.post('/validate_account')
 * 错误：request.post('/api/validate_account')
 * 
 * 详见：./API_USAGE.md
 */
// 创建axios实例
const request = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    // 优先从 store 获取 token，如果没有则从 localStorage 获取
    let token = authStore.token
    if (!token) {
      token = localStorage.getItem('token')
      // 如果 localStorage 有 token 但 store 没有，更新 store
      if (token) {
        authStore.setToken(token)
      }
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const authStore = useAuthStore()
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token过期或无效
          ElMessage.error('登录已过期，请重新登录')
          authStore.setToken('')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          // 不显示404错误弹窗，让具体的业务代码处理
          // ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          ElMessage.error(error.response.data?.detail || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default request