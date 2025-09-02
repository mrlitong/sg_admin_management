import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getCurrentUser, csLogin } from '../api/auth'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }
  
  const doLogin = async (credentials) => {
    try {
      // 统一使用login接口
      const response = await login(credentials)
      
      // 后端返回的是 access_token，需要正确处理
      const token = response.access_token || response.token
      if (!token) {
        throw new Error('登录响应中未找到token')
      }
      
      setToken(token)
      user.value = response.user_info
      
      // 保存用户信息
      if (user.value) {
        localStorage.setItem('is_admin', user.value.is_admin || false)
        localStorage.setItem('user_type', user.value.user_type || 'customer_service')
        localStorage.setItem('cs_account', user.value.username)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.detail || error.message || '登录失败' 
      }
    }
  }
  
  const doLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken('')
      user.value = null
      localStorage.removeItem('is_admin')
      localStorage.removeItem('user_type')
      localStorage.removeItem('cs_account')
      router.push('/login')
    }
  }
  
  const fetchCurrentUser = async () => {
    if (!token.value) return
    
    try {
      const response = await getCurrentUser()
      user.value = response
      // 更新本地存储的用户信息
      if (user.value) {
        localStorage.setItem('is_admin', user.value.is_admin || false)
        localStorage.setItem('user_type', user.value.user_type || 'customer_service')
        localStorage.setItem('cs_account', user.value.username)
      }
    } catch (error) {
      console.error('Fetch user error:', error)
      // 只有在真正的认证失败时才跳转到登录页
      if (error.response?.status === 401 && error.response?.data?.detail?.includes('Could not validate credentials')) {
        setToken('')
        router.push('/login')
      }
    }
  }
  
  return {
    token,
    user,
    isAuthenticated,
    doLogin,
    doLogout,
    fetchCurrentUser,
    setToken
  }
})