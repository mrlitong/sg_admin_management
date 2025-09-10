import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 从localStorage读取主题设置，默认为light
  const currentTheme = ref(localStorage.getItem('theme') || 'light')
  
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  // 设置主题
  const setTheme = (theme) => {
    currentTheme.value = theme
  }
  
  // 应用主题到HTML元素
  const applyTheme = () => {
    const html = document.documentElement
    if (currentTheme.value === 'dark') {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      // Element Plus暗色模式
      html.classList.add('el-theme-dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
      html.classList.remove('el-theme-dark')
    }
  }
  
  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }, { immediate: true })
  
  // 判断是否为暗色模式
  const isDark = computed(() => currentTheme.value === 'dark')
  
  return {
    currentTheme,
    isDark,
    toggleTheme,
    setTheme,
    applyTheme
  }
})