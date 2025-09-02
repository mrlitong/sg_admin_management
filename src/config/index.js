// 统一的配置文件
export const config = {
  // API基础地址
  get apiBaseUrl() {
    // 优先使用环境变量配置
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL
    }
    
    // 开发环境默认使用代理
    if (import.meta.env.DEV) {
      return '/api'
    }
    
    // 生产环境默认值
    return 'http://218.78.128.120:8567/api'
  },
  
  // WebSocket地址
  get wsUrl() {
    // 优先使用环境变量配置
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL
    }
    
    // 根据API地址自动推断WebSocket地址
    const apiUrl = this.apiBaseUrl
    if (apiUrl.startsWith('/')) {
      // 使用相对路径时，基于当前页面构建WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}`
    }
    
    // 从API URL推断WebSocket URL
    try {
      const url = new URL(apiUrl)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProtocol}//${url.host}`
    } catch {
      // 默认值
      return 'ws://218.78.128.120:8567'
    }
  }
}

export default config