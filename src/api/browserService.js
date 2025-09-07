import axios from 'axios'

// 浏览器服务基础URL
const BROWSER_SERVICE_URL = 'http://218.78.128.120:8888'

// 创建专门的axios实例用于浏览器服务
const browserServiceApi = axios.create({
  baseURL: BROWSER_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
browserServiceApi.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('Browser service API error:', error)
    return Promise.reject(error)
  }
)

// 获取健康状态
export const getBrowserHealth = () => {
  return browserServiceApi.get('/health')
}

// 获取池状态详情
export const getPoolStatus = () => {
  return browserServiceApi.get('/pool/status')
}

// 获取Context使用统计
export const getPoolUsage = () => {
  return browserServiceApi.get('/pool/usage')
}

// 获取所有监控数据（并行请求）
export const getAllBrowserMetrics = async () => {
  try {
    const [health, poolStatus, poolUsage] = await Promise.all([
      getBrowserHealth(),
      getPoolStatus(),
      getPoolUsage()
    ])
    
    return {
      health,
      poolStatus,
      poolUsage
    }
  } catch (error) {
    console.error('Failed to fetch browser metrics:', error)
    throw error
  }
}