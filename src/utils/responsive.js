/**
 * 响应式工具模块
 * 提供设备检测、断点管理、响应式hooks等功能
 */

import { ref, computed, onMounted, onUnmounted, h } from 'vue'

// 响应式断点定义
export const BREAKPOINTS = {
  xs: 0,     // 移动端
  sm: 576,   // 大屏手机
  md: 768,   // 平板
  lg: 1024,  // 桌面
  xl: 1200,  // 大屏桌面
  xxl: 1920  // 超大屏
}

// 设备类型枚举
export const DEVICE_TYPE = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
}

/**
 * 响应式Hook - 检测设备类型和屏幕尺寸
 */
export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)
  
  // 设备类型检测
  const isMobile = computed(() => windowWidth.value < BREAKPOINTS.md)
  const isTablet = computed(() => windowWidth.value >= BREAKPOINTS.md && windowWidth.value < BREAKPOINTS.lg)
  const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.lg)
  
  // 详细的断点检测
  const isXs = computed(() => windowWidth.value < BREAKPOINTS.sm)
  const isSm = computed(() => windowWidth.value >= BREAKPOINTS.sm && windowWidth.value < BREAKPOINTS.md)
  const isMd = computed(() => windowWidth.value >= BREAKPOINTS.md && windowWidth.value < BREAKPOINTS.lg)
  const isLg = computed(() => windowWidth.value >= BREAKPOINTS.lg && windowWidth.value < BREAKPOINTS.xl)
  const isXl = computed(() => windowWidth.value >= BREAKPOINTS.xl && windowWidth.value < BREAKPOINTS.xxl)
  const isXxl = computed(() => windowWidth.value >= BREAKPOINTS.xxl)
  
  // 设备类型
  const deviceType = computed(() => {
    if (isMobile.value) return DEVICE_TYPE.MOBILE
    if (isTablet.value) return DEVICE_TYPE.TABLET
    return DEVICE_TYPE.DESKTOP
  })
  
  // 是否为触摸设备
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })
  
  // 是否为横屏
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  
  // 更新窗口尺寸
  const updateWindowSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }
  
  // 防抖处理
  let resizeTimer = null
  const handleResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateWindowSize, 150)
  }
  
  onMounted(() => {
    updateWindowSize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', updateWindowSize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', updateWindowSize)
    clearTimeout(resizeTimer)
  })
  
  return {
    // 窗口尺寸
    windowWidth,
    windowHeight,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    
    // 断点检测
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    
    // 其他
    isTouchDevice,
    isLandscape,
    
    // 方法
    updateWindowSize
  }
}

/**
 * 获取当前断点名称
 */
export function getCurrentBreakpoint() {
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.sm) return 'xs'
  if (width < BREAKPOINTS.md) return 'sm'
  if (width < BREAKPOINTS.lg) return 'md'
  if (width < BREAKPOINTS.xl) return 'lg'
  if (width < BREAKPOINTS.xxl) return 'xl'
  return 'xxl'
}

/**
 * 检查是否匹配指定断点
 */
export function matchBreakpoint(breakpoint) {
  const width = window.innerWidth
  const bp = BREAKPOINTS[breakpoint]
  
  if (!bp && bp !== 0) return false
  
  switch (breakpoint) {
    case 'xs':
      return width < BREAKPOINTS.sm
    case 'sm':
      return width >= BREAKPOINTS.sm && width < BREAKPOINTS.md
    case 'md':
      return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
    case 'lg':
      return width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl
    case 'xl':
      return width >= BREAKPOINTS.xl && width < BREAKPOINTS.xxl
    case 'xxl':
      return width >= BREAKPOINTS.xxl
    default:
      return false
  }
}

/**
 * 表格响应式配置Hook
 */
export function useTableResponsive() {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  
  // 根据设备类型返回不同的表格配置
  const tableSize = computed(() => {
    if (isMobile.value) return 'small'
    if (isTablet.value) return 'default'
    return 'default'
  })
  
  // 是否显示表格（移动端显示卡片）
  const showTable = computed(() => !isMobile.value)
  
  // 分页配置
  const paginationLayout = computed(() => {
    if (isMobile.value) {
      return 'prev, pager, next'
    }
    if (isTablet.value) {
      return 'total, prev, pager, next, jumper'
    }
    return 'total, sizes, prev, pager, next, jumper'
  })
  
  const pageSize = computed(() => {
    if (isMobile.value) return 10
    if (isTablet.value) return 15
    return 20
  })
  
  return {
    tableSize,
    showTable,
    paginationLayout,
    pageSize
  }
}

/**
 * 对话框响应式配置Hook
 */
export function useDialogResponsive() {
  const { isMobile, isTablet, windowWidth } = useResponsive()

  // 对话框宽度 - 针对编辑表单优化
  const dialogWidth = computed(() => {
    if (isMobile.value) return '95%'
    if (isTablet.value) return '90%'

    // 桌面端根据屏幕宽度动态调整
    if (windowWidth.value >= 1920) return '85%'  // 4K屏幕
    if (windowWidth.value >= 1600) return '90%'  // 大屏幕
    if (windowWidth.value >= 1366) return '95%'  // 标准桌面
    return '98%'  // 小屏桌面
  })

  // 是否全屏显示
  const fullscreen = computed(() => isMobile.value)

  // 对话框最大高度
  const maxHeight = computed(() => {
    if (isMobile.value) return '100vh'
    return '90vh'
  })

  return {
    dialogWidth,
    fullscreen,
    maxHeight
  }
}

/**
 * 栅格系统响应式配置
 */
export function useGridResponsive() {
  const { deviceType } = useResponsive()
  
  // 返回Element Plus栅格系统的响应式配置
  const getColSpan = (mobile = 24, tablet = 12, desktop = 8) => {
    return {
      xs: mobile,
      sm: mobile,
      md: tablet,
      lg: desktop,
      xl: desktop
    }
  }
  
  // 表单项栅格配置
  const formColSpan = computed(() => {
    switch (deviceType.value) {
      case DEVICE_TYPE.MOBILE:
        return 24
      case DEVICE_TYPE.TABLET:
        return 12
      default:
        return 8
    }
  })
  
  return {
    getColSpan,
    formColSpan
  }
}

/**
 * 触摸事件处理Hook
 */
export function useTouchSwipe(callback) {
  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0

  const minSwipeDistance = 50

  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].clientX
    touchEndY = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // 水平滑动
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        callback('right')
      } else {
        callback('left')
      }
    }

    // 垂直滑动
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        callback('down')
      } else {
        callback('up')
      }
    }
  }

  return {
    handleTouchStart,
    handleTouchEnd
  }
}

/**
 * 创建异步响应式组件工厂
 * 根据设备类型动态加载对应的组件
 */
export function createAsyncResponsiveComponent(options) {
  const {
    desktopComponent,
    mobileComponent,
    loadingComponent = null,
    errorComponent = null,
    delay = 200,
    timeout = 30000
  } = options

  return {
    name: 'ResponsiveComponent',

    setup() {
      const { isMobile } = useResponsive()
      return { isMobile }
    },

    render() {
      // 根据设备类型返回对应的异步组件
      const AsyncComponent = this.isMobile
        ? mobileComponent
        : desktopComponent

      return h(AsyncComponent)
    },

    // 配置异步组件选项
    __asyncResolved: false,
    __asyncFactory: () => {
      const { isMobile } = useResponsive()
      return isMobile.value ? mobileComponent() : desktopComponent()
    },

    // 异步组件配置
    loading: loadingComponent,
    error: errorComponent,
    delay,
    timeout
  }
}

/**
 * 简化版本的响应式组件工厂
 * 直接传入组件构造函数
 */
export function createResponsiveComponent(desktopComponent, mobileComponent) {
  return {
    name: 'ResponsiveComponent',

    setup() {
      const { isMobile } = useResponsive()
      return { isMobile }
    },

    render() {
      const Component = this.isMobile ? mobileComponent : desktopComponent
      return h(Component)
    }
  }
}