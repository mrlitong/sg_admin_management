/**
 * 异步响应式组件工厂
 * 根据设备类型动态加载对应的组件
 */

import { defineAsyncComponent, computed, h } from 'vue'
import { useResponsive } from './responsive'

/**
 * 创建响应式异步组件
 * @param {Object} options 配置选项
 * @param {Function} options.desktop 桌面端组件加载函数
 * @param {Function} options.mobile 移动端组件加载函数
 * @param {Function} [options.tablet] 平板端组件加载函数（可选，默认使用桌面端）
 * @param {Object} [options.loadingComponent] 加载中组件
 * @param {Object} [options.errorComponent] 错误组件
 * @param {number} [options.delay] 延迟显示加载组件的时间
 * @param {number} [options.timeout] 超时时间
 * @returns {Object} Vue异步组件
 */
export function createAsyncResponsiveComponent(options) {
  const {
    desktop,
    mobile,
    tablet = desktop, // 默认平板使用桌面端组件
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout = 3000
  } = options

  if (!desktop || typeof desktop !== 'function') {
    throw new Error('desktop component loader is required and must be a function')
  }

  if (!mobile || typeof mobile !== 'function') {
    throw new Error('mobile component loader is required and must be a function')
  }

  return defineAsyncComponent(() => {
    const { isMobile, isTablet } = useResponsive()

    // 根据设备类型选择对应的组件加载器
    let componentLoader
    if (isMobile.value) {
      componentLoader = mobile
    } else if (isTablet.value) {
      componentLoader = tablet
    } else {
      componentLoader = desktop
    }

    return componentLoader()
      .then(module => {
        // 确保返回的是有效的Vue组件
        if (module && typeof module === 'object') {
          return module.default || module
        }
        throw new Error('Invalid component module')
      })
      .catch(error => {
        console.error('Failed to load responsive component:', error)
        throw error
      })
  }, {
    loadingComponent,
    errorComponent,
    delay,
    timeout
  })
}

/**
 * 创建简单的响应式组件（同步加载）
 * @param {Object} options 配置选项
 * @param {Object} options.desktop 桌面端组件
 * @param {Object} options.mobile 移动端组件
 * @param {Object} [options.tablet] 平板端组件
 * @returns {Object} Vue组件
 */
export function createResponsiveComponent(options) {
  const {
    desktop,
    mobile,
    tablet = desktop
  } = options

  if (!desktop || typeof desktop !== 'object') {
    throw new Error('desktop component is required and must be a Vue component')
  }

  if (!mobile || typeof mobile !== 'object') {
    throw new Error('mobile component is required and must be a Vue component')
  }

  return {
    name: 'ResponsiveComponent',
    setup(props, { attrs, slots, emit }) {
      const { isMobile, isTablet } = useResponsive()

      const currentComponent = computed(() => {
        if (isMobile.value) return mobile
        if (isTablet.value) return tablet
        return desktop
      })

      return () => {
        const Component = currentComponent.value
        return Component ? h(Component, { ...props, ...attrs }, slots) : null
      }
    }
  }
}

/**
 * 创建条件渲染的响应式组件
 * @param {Object} options 配置选项
 * @param {Function} options.desktop 桌面端渲染函数
 * @param {Function} options.mobile 移动端渲染函数
 * @param {Function} [options.tablet] 平板端渲染函数
 * @returns {Object} Vue组件
 */
export function createConditionalResponsiveComponent(options) {
  const {
    desktop,
    mobile,
    tablet = desktop
  } = options

  if (!desktop || typeof desktop !== 'function') {
    throw new Error('desktop renderer is required and must be a function')
  }

  if (!mobile || typeof mobile !== 'function') {
    throw new Error('mobile renderer is required and must be a function')
  }

  return {
    name: 'ConditionalResponsiveComponent',
    setup(props, context) {
      const { isMobile, isTablet } = useResponsive()

      return () => {
        if (isMobile.value) {
          return mobile(props, context)
        } else if (isTablet.value) {
          return tablet(props, context)
        } else {
          return desktop(props, context)
        }
      }
    }
  }
}