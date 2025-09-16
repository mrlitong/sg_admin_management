/**
 * 数据分析仪表板业务逻辑
 * 提供所有数据分析相关的业务逻辑和状态管理
 */

import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { getAnalyticsOverview, getAnalyticsTrends, getHighValueUsers, getServerDistribution } from '../api/analytics'
import { getAllBrowserMetrics } from '../api/browserService'
import { useResponsive } from '../utils/responsive'

export function useAnalyticsDashboard() {
  const router = useRouter()
  const { isMobile, isTablet, isDesktop } = useResponsive()

  // 基础状态
  const loading = ref(false)
  const dateRange = ref([])
  const growthPeriod = ref('30d')
  const warningTab = ref('expiring')

  // 图表引用
  const growthChart = ref(null)
  const membershipChart = ref(null)
  const heatmapChart = ref(null)
  const funnelChart = ref(null)

  // 图表实例
  let growthChartInstance = null
  let membershipChartInstance = null
  let heatmapChartInstance = null
  let funnelChartInstance = null

  // 数据状态
  const analyticsData = reactive({
    overview: null,
    trends: null,
    highValueUsers: null,
    serverDistribution: null
  })

  // 浏览器监控数据
  const browserMetrics = ref(null)
  const browserLoading = ref(false)

  // 日期快捷选项
  const shortcuts = [
    {
      text: '最近一周',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
        return [start, end]
      }
    },
    {
      text: '最近一月',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
        return [start, end]
      }
    },
    {
      text: '最近三月',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
        return [start, end]
      }
    }
  ]

  // 核心指标计算
  const coreMetrics = computed(() => {
    const overview = analyticsData.overview
    if (!overview) return []

    return [
      {
        key: 'total_users',
        label: '总用户数',
        value: overview.core_metrics.total_users,
        format: 'number',
        unit: '人',
        type: 'primary',
        tooltip: '计算方式：COUNT(DISTINCT account) FROM user_data_v1\n统计所有注册账号的去重总数',
        trend: 5.2,
        sparkline: [100, 120, 115, 134, 168, 132, 200],
        chartType: 'line'
      },
      {
        key: 'active_members',
        label: '活跃会员',
        value: overview.core_metrics.active_members,
        format: 'number',
        unit: '人',
        type: 'success',
        tooltip: '计算方式：COUNT(account) WHERE membership_level >= 1 AND membership_expire_date > NOW()\n统计会员等级≥1且会员未过期的用户数',
        trend: -2.3,
        sparkline: [200, 180, 190, 170, 160, 180, 165],
        chartType: 'line'
      },
      {
        key: 'conversion_rate',
        label: '付费转化率',
        value: overview.conversion_rates.active,
        format: 'percent',
        unit: '%',
        type: 'warning',
        tooltip: '计算方式：活跃会员数 ÷ 总用户数 × 100%\n反映当前付费用户占比',
        trend: 1.8
      },
      {
        key: 'avg_payment',
        label: '客单价',
        value: overview.core_metrics.avg_payment,
        format: 'currency',
        unit: '元',
        type: 'danger',
        tooltip: '计算方式：AVG(membership_pay_money) WHERE membership_pay_money > 0\n所有付费用户的平均付费金额',
        trend: 3.5
      }
    ]
  })

  // 到期预警数据
  const expiringPeriods = computed(() => {
    const warning = analyticsData.overview?.churn_warning?.will_expire
    if (!warning) return []

    return [
      { key: '7d', days: 7, label: '7天内到期', count: warning.in_7_days, color: '#ff9800' },
      { key: '14d', days: 14, label: '14天内到期', count: warning.in_14_days, color: '#ff5722' },
      { key: '30d', days: 30, label: '30天内到期', count: warning.in_30_days, color: '#f44336' }
    ]
  })

  // 已过期数据
  const expiredPeriods = computed(() => {
    const warning = analyticsData.overview?.churn_warning?.recently_expired
    if (!warning) return []

    return [
      { key: '7d', days: 7, label: '过期7天内', count: warning.last_7_days, color: '#9e9e9e' },
      { key: '14d', days: 14, label: '过期14天内', count: warning.last_14_days, color: '#757575' },
      { key: '30d', days: 30, label: '过期30天内', count: warning.last_30_days, color: '#616161' }
    ]
  })

  // 会员分布数据
  const membershipData = computed(() => {
    const dist = analyticsData.overview?.membership_distribution
    if (!dist) return []

    const colors = {
      3: '#9c27b0',  // 钻石会员 - 紫色
      4: '#ff9800',  // 至尊会员 - 橙色
    }

    return dist.map(item => ({
      name: item.name,
      value: item.count,
      color: colors[item.level] || '#2196f3'
    }))
  })

  // 高价值用户列表
  const atRiskUsers = computed(() => analyticsData.highValueUsers?.at_risk_users || [])
  const topPayingUsers = computed(() => analyticsData.highValueUsers?.top_paying_users || [])
  const loyalUsers = computed(() => analyticsData.highValueUsers?.loyal_users || [])

  // 服务器负载
  const serverLoad = computed(() => analyticsData.overview?.server_load || [])

  // 工具函数
  const getLevelType = (level) => {
    const types = {
      3: 'warning',  // 钻石
      4: 'danger'    // 至尊
    }
    return types[level] || 'info'
  }

  const getLevelName = (level) => {
    const names = {
      '-1': '游客',
      '0': '游客',
      '3': '钻石会员',
      '4': '至尊会员'
    }
    return names[level] || `等级${level}`
  }

  const getLoadType = (rate) => {
    if (rate < 30) return 'danger'    // 低于30% 红色
    if (rate < 60) return 'warning'   // 30-60% 黄色
    return 'success'                  // 60%以上 绿色
  }

  const getLoadColor = (rate) => {
    if (rate < 30) return '#f56c6c'   // 低于30% 红色
    if (rate < 60) return '#e6a23c'   // 30-60% 黄色
    return '#67c23a'                  // 60%以上 绿色
  }

  const getBrowserLoadColor = (percentage) => {
    if (percentage >= 90) return '#f56c6c'
    if (percentage >= 70) return '#e6a23c'
    if (percentage >= 50) return '#67c23a'
    return '#909399'
  }

  const getSuccessRateClass = (rate) => {
    if (!rate || rate === 0) return 'danger'
    if (rate < 0.5) return 'warning'
    if (rate < 0.8) return 'info'
    return 'success'
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return date.toLocaleDateString()
  }

  // 生成热力图数据（模拟）
  const generateHeatmapData = () => {
    const data = []
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 24; j++) {
        data.push([j, i, Math.floor(Math.random() * 100)])
      }
    }
    return data
  }

  // 数据加载函数
  const refreshData = async () => {
    loading.value = true
    try {
      // 并行加载所有数据
      const [overview, trends, highValueUsers, serverDist] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsTrends(30),
        getHighValueUsers(10),
        getServerDistribution()
      ])

      analyticsData.overview = overview
      analyticsData.trends = trends
      analyticsData.highValueUsers = highValueUsers
      analyticsData.serverDistribution = serverDist

      // 更新图表
      await nextTick()
      updateCharts()

      // 同时加载浏览器监控数据
      loadBrowserMetrics()

      ElMessage.success('数据刷新成功')
    } catch (error) {
      ElMessage.error('加载数据失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 加载浏览器监控数据
  const loadBrowserMetrics = async () => {
    try {
      const metrics = await getAllBrowserMetrics()
      browserMetrics.value = metrics
    } catch (error) {
      console.error('Failed to load browser metrics:', error)
      // 不显示错误消息，因为这是外部服务
    }
  }

  // 刷新浏览器监控数据
  const refreshBrowserMetrics = async () => {
    browserLoading.value = true
    try {
      const metrics = await getAllBrowserMetrics()
      browserMetrics.value = metrics
      ElMessage.success('浏览器监控数据已刷新')
    } catch (error) {
      ElMessage.error('刷新浏览器监控失败')
    } finally {
      browserLoading.value = false
    }
  }

  // 导出数据
  const exportData = async () => {
    try {
      await ElMessageBox.confirm('确定要导出数据分析报表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      })

      // TODO: 实现导出功能
      ElMessage.info('导出功能开发中...')
    } catch {
      // 取消操作
    }
  }

  // 显示用户列表
  const showUserList = (type, days) => {
    router.push({
      path: '/users',
      query: { filter: type, days: days }
    })
  }

  // 跳转到用户列表页面
  const navigateToUserList = (date, type) => {
    const queryParams = {
      dataType: type === '新增用户' ? 'new' : 'expired',
      date: date
    }

    router.push({
      path: '/users',
      query: queryParams
    })
  }

  // 处理日期变化
  const handleDateChange = () => {
    refreshData()
  }

  // 更新增长图表
  const updateGrowthChart = () => {
    const days = parseInt(growthPeriod.value)
    getAnalyticsTrends(days).then(trends => {
      analyticsData.trends = trends
      updateCharts()
    })
  }

  // 图表相关函数
  const getChartBaseOptions = () => {
    return {
      tooltip: {
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        },
        padding: isMobile.value ? 4 : 8,
        confine: true
      },
      grid: {
        left: isMobile.value ? '8%' : '3%',
        right: isMobile.value ? '8%' : '4%',
        bottom: isMobile.value ? '18%' : '10%',
        top: isMobile.value ? '10%' : '5%',
        containLabel: true
      }
    }
  }

  const initCharts = () => {
    // 初始化图表 - 具体实现会在各个组件中完成
    console.log('Chart initialization should be handled in specific components')
  }

  const updateCharts = () => {
    // 更新增长趋势图
    if (growthChartInstance && analyticsData.trends) {
      const growth = analyticsData.trends.user_growth
      growthChartInstance.setOption({
        xAxis: {
          data: growth.map(item => item.date)
        },
        series: [
          { data: growth.map(item => item.new_users) },
          { data: growth.map(item => item.expired_users || 0) }
        ]
      })
    }

    // 更新会员分布图
    if (membershipChartInstance && analyticsData.overview) {
      const dist = analyticsData.overview.membership_distribution
      membershipChartInstance.setOption({
        series: [{
          data: dist.map(item => ({
            name: item.name,
            value: item.count
          }))
        }]
      })
    }

    // 更新转化漏斗
    if (funnelChartInstance && analyticsData.overview) {
      const metrics = analyticsData.overview.core_metrics
      const total = metrics.total_users
      const funnelData = [
        {
          value: metrics.total_users,
          rate: 100,
          name: '注册用户'
        },
        {
          value: metrics.total_paid_ever,
          rate: total > 0 ? Math.round((metrics.total_paid_ever / total) * 100) : 0,
          name: '历史付费'
        },
        {
          value: metrics.active_members,
          rate: total > 0 ? Math.round((metrics.active_members / total) * 100) : 0,
          name: '活跃会员'
        },
        {
          value: metrics.online_now,
          rate: total > 0 ? Math.round((metrics.online_now / total) * 100) : 0,
          name: '当前在线'
        }
      ]
      funnelChartInstance.setOption({
        yAxis: {
          data: funnelData.map(item => item.name)
        },
        series: [{ data: funnelData }]
      })
    }
  }

  const disposeCharts = () => {
    // 销毁图表实例
    growthChartInstance?.dispose()
    membershipChartInstance?.dispose()
    heatmapChartInstance?.dispose()
    funnelChartInstance?.dispose()
  }

  // 监听窗口大小变化
  let resizeTimer = null
  const handleResize = () => {
    // 添加防抖处理
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      // 重新获取响应式状态
      const isCurrentlyMobile = window.innerWidth < 768

      // 如果响应式状态发生变化，重新初始化图表
      if (isCurrentlyMobile !== isMobile.value) {
        nextTick(() => {
          initCharts()
          updateCharts()
        })
      } else {
        // 只是resize
        growthChartInstance?.resize()
        membershipChartInstance?.resize()
        heatmapChartInstance?.resize()
        funnelChartInstance?.resize()
      }
    }, 300)
  }

  // 生命周期处理
  let browserMetricsTimer = null

  const initializeData = async () => {
    await refreshData()
    await nextTick()
    initCharts()
    updateCharts()

    // 加载浏览器监控数据
    loadBrowserMetrics()

    // 设置定时刷新浏览器监控数据（每30秒）
    browserMetricsTimer = setInterval(() => {
      loadBrowserMetrics()
    }, 30000)

    window.addEventListener('resize', handleResize)
  }

  const cleanup = () => {
    window.removeEventListener('resize', handleResize)
    if (browserMetricsTimer) {
      clearInterval(browserMetricsTimer)
    }
    disposeCharts()
  }

  return {
    // 响应式状态
    isMobile,
    isTablet,
    isDesktop,

    // 基础状态
    loading,
    dateRange,
    growthPeriod,
    warningTab,

    // 图表引用
    growthChart,
    membershipChart,
    heatmapChart,
    funnelChart,

    // 图表实例
    growthChartInstance,
    membershipChartInstance,
    heatmapChartInstance,
    funnelChartInstance,

    // 数据状态
    analyticsData,
    browserMetrics,
    browserLoading,

    // 计算属性
    coreMetrics,
    expiringPeriods,
    expiredPeriods,
    membershipData,
    atRiskUsers,
    topPayingUsers,
    loyalUsers,
    serverLoad,

    // 配置
    shortcuts,

    // 工具函数
    getLevelType,
    getLevelName,
    getLoadType,
    getLoadColor,
    getBrowserLoadColor,
    getSuccessRateClass,
    formatDuration,
    formatDate,
    generateHeatmapData,
    getChartBaseOptions,

    // 业务方法
    refreshData,
    loadBrowserMetrics,
    refreshBrowserMetrics,
    exportData,
    showUserList,
    navigateToUserList,
    handleDateChange,
    updateGrowthChart,

    // 图表方法
    initCharts,
    updateCharts,
    disposeCharts,

    // 生命周期方法
    initializeData,
    cleanup,
    handleResize,

    // 设置图表实例的方法
    setGrowthChartInstance: (instance) => { growthChartInstance = instance },
    setMembershipChartInstance: (instance) => { membershipChartInstance = instance },
    setHeatmapChartInstance: (instance) => { heatmapChartInstance = instance },
    setFunnelChartInstance: (instance) => { funnelChartInstance = instance }
  }
}