import { defineComponent, h, Suspense, ref, watch } from 'vue'
import { useResponsive } from './responsive'
import { ElLoading } from 'element-plus'

/**
 * 创建响应式组件
 * 根据设备类型自动选择加载桌面端或移动端组件
 * @param {Object} options - 配置选项
 * @param {Component} options.desktop - 桌面端组件
 * @param {Component} options.mobile - 移动端组件
 * @param {Component} options.tablet - 平板端组件（可选）
 * @param {Object} options.breakpoints - 自定义断点（可选）
 * @param {Component} options.loading - 加载中组件（可选）
 * @returns {Component} 响应式组件
 */
export function createResponsiveComponent(options) {
  const {
    desktop,
    mobile,
    tablet = null,
    breakpoints = null,
    loading = null
  } = options

  return defineComponent({
    name: 'ResponsiveComponent',

    setup(props, { attrs, slots, emit, expose }) {
      const { isMobile, isTablet, isDesktop } = useResponsive()

      // 暴露所有方法和属性，使父组件可以访问子组件
      const componentRef = ref(null)
      expose(new Proxy({}, {
        get(target, prop) {
          return componentRef.value?.[prop]
        },
        set(target, prop, value) {
          if (componentRef.value) {
            componentRef.value[prop] = value
            return true
          }
          return false
        }
      }))

      return () => {
        let Component = desktop

        // 根据设备类型选择组件
        if (isMobile.value) {
          Component = mobile
        } else if (isTablet.value && tablet) {
          Component = tablet
        }

        // 如果提供了自定义加载组件，使用Suspense包装
        if (loading) {
          return h(Suspense, {
            default: () => h(Component, {
              ref: componentRef,
              ...attrs,
              ...props,
              onVnodeUpdated: (vnode) => {
                if (vnode.component) {
                  componentRef.value = vnode.component.proxy
                }
              }
            }, slots),
            fallback: () => h(loading)
          })
        }

        // 直接渲染组件
        return h(Component, {
          ref: componentRef,
          ...attrs,
          ...props,
          onVnodeUpdated: (vnode) => {
            if (vnode.component) {
              componentRef.value = vnode.component.proxy
            }
          }
        }, slots)
      }
    }
  })
}

/**
 * 创建异步响应式组件
 * 支持懒加载和代码分割
 * @param {Object} options - 配置选项
 * @param {Function} options.desktop - 返回桌面端组件Promise的函数
 * @param {Function} options.mobile - 返回移动端组件Promise的函数
 * @param {Function} options.tablet - 返回平板端组件Promise的函数（可选）
 * @returns {Component} 异步响应式组件
 */
export function createAsyncResponsiveComponent(options) {
  const {
    desktop,
    mobile,
    tablet = null
  } = options

  return defineComponent({
    name: 'AsyncResponsiveComponent',

    setup(props, { attrs, slots }) {
      const { isMobile, isTablet, isDesktop } = useResponsive()
      const loadedComponents = ref({})
      const currentComponent = ref(null)
      const loading = ref(true)
      const error = ref(null)

      // 加载组件的函数
      const loadComponent = async () => {
        loading.value = true
        error.value = null

        try {
          // 根据设备类型选择加载器
          let componentLoader = desktop
          let cacheKey = 'desktop'

          if (isMobile.value) {
            componentLoader = mobile
            cacheKey = 'mobile'
          } else if (isTablet.value && tablet) {
            componentLoader = tablet
            cacheKey = 'tablet'
          }

          // 检查缓存
          if (!loadedComponents.value[cacheKey]) {
            const Component = await componentLoader()
            loadedComponents.value[cacheKey] = Component.default || Component
          }

          currentComponent.value = loadedComponents.value[cacheKey]
        } catch (err) {
          error.value = err
          console.error('Failed to load responsive component:', err)
        } finally {
          loading.value = false
        }
      }

      // 初始加载
      loadComponent()

      // 监听响应式变化，重新加载组件
      watch([isMobile, isTablet], () => {
        loadComponent()
      })

      return () => {
        if (loading.value) {
          return h('div', {
            style: 'padding: 20px; text-align: center;'
          }, '加载中...')
        }

        if (error.value) {
          return h('div', {
            style: 'padding: 20px; color: red; text-align: center;'
          }, `加载失败: ${error.value.message}`)
        }

        if (!currentComponent.value) {
          return h('div', {
            style: 'padding: 20px; text-align: center;'
          }, '组件未找到')
        }

        return h(currentComponent.value, {
          ...attrs,
          ...props
        }, slots)
      }
    }
  })
}

/**
 * HOC: 为现有组件添加响应式数据
 * @param {Component} Component - 需要增强的组件
 * @returns {Component} 增强后的组件
 */
export function withResponsive(Component) {
  return defineComponent({
    name: `WithResponsive(${Component.name || 'Anonymous'})`,

    setup(props, { attrs, slots }) {
      const responsiveData = useResponsive()

      return () => h(Component, {
        ...attrs,
        ...props,
        responsive: responsiveData
      }, slots)
    }
  })
}

/**
 * 创建共享业务逻辑的响应式组件
 * 允许桌面端和移动端组件共享同一个setup函数
 * @param {Object} options - 配置选项
 * @param {Function} options.setup - 共享的setup函数
 * @param {Function} options.desktopRender - 桌面端渲染函数
 * @param {Function} options.mobileRender - 移动端渲染函数
 * @param {Function} options.tabletRender - 平板端渲染函数（可选）
 * @returns {Component} 响应式组件
 */
export function createSharedLogicComponent(options) {
  const {
    setup: sharedSetup,
    desktopRender,
    mobileRender,
    tabletRender = null,
    name = 'SharedLogicComponent'
  } = options

  return defineComponent({
    name,

    setup(props, context) {
      const { isMobile, isTablet, isDesktop } = useResponsive()

      // 执行共享的setup逻辑
      const setupResult = sharedSetup(props, context)

      return () => {
        // 根据设备类型选择渲染函数
        let renderFn = desktopRender

        if (isMobile.value) {
          renderFn = mobileRender
        } else if (isTablet.value && tabletRender) {
          renderFn = tabletRender
        }

        // 调用对应的渲染函数
        return renderFn(setupResult, { ...context, responsive: { isMobile, isTablet, isDesktop } })
      }
    }
  })
}

/**
 * 批量创建响应式路由
 * @param {Array} routes - 路由配置数组
 * @returns {Array} 处理后的路由数组
 */
export function createResponsiveRoutes(routes) {
  return routes.map(route => {
    if (route.meta?.responsive) {
      const { desktop, mobile, tablet } = route.meta.responsive

      // 创建响应式组件
      const ResponsiveComponent = createAsyncResponsiveComponent({
        desktop: desktop || route.component,
        mobile: mobile || route.component,
        tablet: tablet
      })

      return {
        ...route,
        component: ResponsiveComponent
      }
    }

    return route
  })
}

/**
 * 条件渲染组件
 * 根据响应式状态决定是否渲染组件
 * @param {Object} options - 配置选项
 * @param {Component} options.component - 要渲染的组件
 * @param {Array} options.showOn - 显示条件 ['mobile', 'tablet', 'desktop']
 * @param {Array} options.hideOn - 隐藏条件 ['mobile', 'tablet', 'desktop']
 * @returns {Component} 条件渲染组件
 */
export function createConditionalComponent(options) {
  const {
    component,
    showOn = [],
    hideOn = []
  } = options

  return defineComponent({
    name: 'ConditionalComponent',

    setup(props, { attrs, slots }) {
      const { isMobile, isTablet, isDesktop } = useResponsive()

      return () => {
        const deviceStates = {
          mobile: isMobile.value,
          tablet: isTablet.value,
          desktop: isDesktop.value
        }

        // 检查隐藏条件
        if (hideOn.some(device => deviceStates[device])) {
          return null
        }

        // 检查显示条件
        if (showOn.length > 0 && !showOn.some(device => deviceStates[device])) {
          return null
        }

        // 渲染组件
        return h(component, {
          ...attrs,
          ...props
        }, slots)
      }
    }
  })
}