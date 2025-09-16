<template>
  <div class="analytics-dashboard mobile-layout">
    <!-- 移动端页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          数据分析中心
        </h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData" :loading="loading" size="small" circle />
        <el-button :icon="Download" @click="exportData" size="small" circle />
      </div>
    </div>

    <!-- 日期选择器 - 移动端单独区域 -->
    <div class="mobile-date-picker">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="shortcuts"
        @change="handleDateChange"
        size="small"
        style="width: 100%;"
      />
    </div>

    <!-- 核心指标卡片 - 移动端优化布局 -->
    <div class="metrics-section">
      <div class="metrics-grid">
        <div v-for="metric in coreMetrics" :key="metric.key" class="metric-card" :class="metric.type">
          <div class="metric-header">
            <span class="metric-label">{{ metric.label }}</span>
            <el-tooltip :content="metric.tooltip" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="metric-value">
            <animated-number :value="metric.value" :format="metric.format" />
            <span class="metric-unit">{{ metric.unit }}</span>
          </div>
          <div class="metric-trend" v-if="metric.trend">
            <el-icon :class="metric.trend > 0 ? 'trend-up' : 'trend-down'">
              <TrendCharts />
            </el-icon>
            <span :class="metric.trend > 0 ? 'positive' : 'negative'">
              {{ Math.abs(metric.trend) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端标签页导航 -->
    <div class="mobile-tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="趋势分析" name="trends">
          <!-- 用户增长趋势图 - 移动端优化 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">用户增长趋势</h3>
              <el-radio-group v-model="growthPeriod" size="small" @change="updateGrowthChart">
                <el-radio-button label="7d">7天</el-radio-button>
                <el-radio-button label="30d">30天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-body">
              <div ref="growthChart" class="chart-container"></div>
            </div>
          </div>

          <!-- 会员分布饼图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">会员等级分布</h3>
            </div>
            <div class="chart-body">
              <div ref="membershipChart" class="chart-container"></div>
            </div>
            <div class="chart-legend">
              <div v-for="item in membershipData" :key="item.name" class="legend-item">
                <span class="legend-dot" :style="{backgroundColor: item.color}"></span>
                <span class="legend-label">{{ item.name }}</span>
                <span class="legend-value">{{ item.value }}人</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户行为" name="behavior">
          <!-- 24小时活跃度热力图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">24小时活跃度</h3>
            </div>
            <div class="chart-body">
              <div ref="heatmapChart" class="chart-container"></div>
            </div>
          </div>

          <!-- 转化漏斗 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">用户转化漏斗</h3>
            </div>
            <div class="chart-body">
              <div ref="funnelChart" class="chart-container"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="预警中心" name="warnings">
          <!-- 流失预警 - 移动端卡片化 -->
          <div class="warning-section">
            <el-tabs v-model="warningTab" size="small">
              <el-tab-pane label="即将到期" name="expiring">
                <div class="warning-cards">
                  <div v-for="period in expiringPeriods" :key="period.key"
                       class="warning-card" @click="showUserList('expiring', period.days)">
                    <div class="warning-icon">
                      <el-icon :style="{color: period.color}"><Clock /></el-icon>
                    </div>
                    <div class="warning-content">
                      <div class="warning-value">{{ period.count }}</div>
                      <div class="warning-label">{{ period.label }}</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="已过期" name="expired">
                <div class="warning-cards">
                  <div v-for="period in expiredPeriods" :key="period.key"
                       class="warning-card" @click="showUserList('expired', period.days)">
                    <div class="warning-icon">
                      <el-icon :style="{color: period.color}"><CircleClose /></el-icon>
                    </div>
                    <div class="warning-content">
                      <div class="warning-value">{{ period.count }}</div>
                      <div class="warning-label">{{ period.label }}</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <el-tab-pane label="高价值用户" name="vip">
          <!-- 高价值用户 - 移动端优化 -->
          <div class="vip-section">
            <el-collapse v-model="activeVipSection">
              <el-collapse-item title="高风险流失用户" name="at-risk">
                <div class="vip-user-list">
                  <div v-for="user in atRiskUsers" :key="user.account" class="vip-user-item">
                    <div class="user-avatar">{{ user.account.slice(0, 2) }}</div>
                    <div class="user-info">
                      <div class="user-name">{{ user.account }}</div>
                      <div class="user-tags">
                        <el-tag size="small" :type="getLevelType(user.membership_level)">
                          {{ getLevelName(user.membership_level) }}
                        </el-tag>
                        <el-tag type="warning" size="small">{{ user.days_until_expire }}天后到期</el-tag>
                      </div>
                      <div class="user-payment">¥{{ user.total_payment }}</div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>

              <el-collapse-item title="最高付费用户" name="top-paying">
                <div class="vip-user-list">
                  <div v-for="user in topPayingUsers" :key="user.account" class="vip-user-item">
                    <div class="user-avatar gold">{{ user.account.slice(0, 2) }}</div>
                    <div class="user-info">
                      <div class="user-name">{{ user.account }}</div>
                      <div class="user-tags">
                        <el-tag size="small" :type="getLevelType(user.membership_level)">
                          {{ getLevelName(user.membership_level) }}
                        </el-tag>
                        <el-tag :type="user.is_online ? 'success' : 'info'" size="small">
                          {{ user.is_online ? '在线' : '离线' }}
                        </el-tag>
                      </div>
                      <div class="user-payment highlight">¥{{ user.total_payment }}</div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>

              <el-collapse-item title="忠诚用户" name="loyal">
                <div class="vip-user-list">
                  <div v-for="user in loyalUsers" :key="user.account" class="vip-user-item">
                    <div class="user-avatar purple">{{ user.account.slice(0, 2) }}</div>
                    <div class="user-info">
                      <div class="user-name">{{ user.account }}</div>
                      <div class="user-tags">
                        <el-tag size="small" type="success">
                          活跃{{ user.days_active }}天
                        </el-tag>
                      </div>
                      <div class="user-meta">
                        <span class="user-payment">¥{{ user.total_payment }}</span>
                        <span class="last-login">{{ formatDate(user.last_login) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <el-tab-pane label="系统监控" name="monitoring">
          <!-- 服务器负载监控 - 移动端优化 -->
          <div class="server-section">
            <h3 class="section-title">服务器负载</h3>
            <div class="server-cards">
              <div v-for="server in serverLoad" :key="server.bucket" class="server-card">
                <div class="server-header">
                  <span class="server-name">服务器 {{ server.bucket }}</span>
                  <el-tag :type="getLoadType(server.load_rate)" size="small">
                    {{ server.load_rate }}%
                  </el-tag>
                </div>
                <el-progress
                  :percentage="server.load_rate"
                  :color="getLoadColor(server.load_rate)"
                  :stroke-width="6"
                />
                <div class="server-stats">
                  <div class="stat-item">
                    <span class="stat-label">总用户</span>
                    <span class="stat-value">{{ server.total }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">在线数</span>
                    <span class="stat-value">{{ server.online }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 浏览器监控 - 移动端优化 -->
          <div class="browser-section" v-if="browserMetrics">
            <div class="section-header">
              <h3 class="section-title">浏览器负载监控</h3>
              <el-button
                :icon="Refresh"
                @click="refreshBrowserMetrics"
                :loading="browserLoading"
                size="small"
                type="primary"
                plain
                circle>
              </el-button>
            </div>

            <!-- 浏览器状态卡片 -->
            <div class="browser-cards">
              <div class="browser-stat-card" :class="browserMetrics.health.status === 'healthy' ? 'healthy' : 'unhealthy'">
                <div class="stat-header">
                  <span class="stat-label">服务状态</span>
                  <el-icon v-if="browserMetrics.health.status === 'healthy'" class="status-icon success">
                    <CircleCheck />
                  </el-icon>
                  <el-icon v-else class="status-icon danger"><CircleClose /></el-icon>
                </div>
                <div class="stat-value">{{ browserMetrics.health.status === 'healthy' ? '正常' : '异常' }}</div>
              </div>

              <div class="browser-stat-card">
                <div class="stat-header">
                  <span class="stat-label">池利用率</span>
                </div>
                <div class="stat-value">
                  <animated-number :value="browserMetrics.health.pool_status.utilization * 100" format="percent" />
                  <span class="stat-unit">%</span>
                </div>
                <div class="stat-meta">
                  {{ browserMetrics.health.pool_status.busy }}/{{ browserMetrics.health.pool_status.total }} 使用中
                </div>
                <el-progress
                  :percentage="browserMetrics.health.pool_status.utilization * 100"
                  :color="getBrowserLoadColor(browserMetrics.health.pool_status.utilization * 100)"
                  :show-text="false"
                  :stroke-width="4"
                />
              </div>

              <div class="browser-stat-card">
                <div class="stat-header">
                  <span class="stat-label">请求成功率</span>
                </div>
                <div class="stat-value" :class="getSuccessRateClass(browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate)">
                  <animated-number
                    :value="(browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate || 0) * 100"
                    format="percent"
                  />
                  <span class="stat-unit">%</span>
                </div>
              </div>
            </div>

            <!-- 浏览器实例状态 - 简化显示 -->
            <div class="browser-instances">
              <h4 class="subsection-title">实例状态</h4>
              <div class="instance-cards">
                <div
                  v-for="browser in browserMetrics.poolStatus?.pool?.browsers"
                  :key="browser.browser_id"
                  class="instance-card">
                  <div class="instance-header">
                    <span class="instance-name">{{ browser.browser_id }}</span>
                    <el-tag
                      :type="browser.is_healthy ? 'success' : 'danger'"
                      size="small">
                      {{ browser.is_healthy ? '健康' : '异常' }}
                    </el-tag>
                  </div>
                  <div class="instance-progress">
                    <el-progress
                      :percentage="(browser.busy_contexts / browser.total_contexts) * 100"
                      :color="getBrowserLoadColor((browser.busy_contexts / browser.total_contexts) * 100)"
                      :stroke-width="4"
                      :show-text="false"
                    />
                    <span class="progress-text">
                      {{ browser.busy_contexts }}/{{ browser.total_contexts }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  Refresh, Download, DataAnalysis, InfoFilled, Warning,
  Trophy, Monitor, Clock, CircleClose, TrendCharts,
  CircleCheck
} from '@element-plus/icons-vue'
import AnimatedNumber from '../components/AnimatedNumber.vue'
import { useAnalyticsDashboard } from '../composables/useAnalyticsDashboard'

// 使用业务逻辑
const {
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

  // 数据状态
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

  // 业务方法
  refreshData,
  refreshBrowserMetrics,
  exportData,
  showUserList,
  navigateToUserList,
  handleDateChange,
  updateGrowthChart,

  // 生命周期方法
  initializeData,
  cleanup,

  // 设置图表实例的方法
  setGrowthChartInstance,
  setMembershipChartInstance,
  setHeatmapChartInstance,
  setFunnelChartInstance
} = useAnalyticsDashboard()

// 移动端特有状态
const activeTab = ref('trends')
const activeVipSection = ref(['at-risk'])

// 初始化移动端图表
const initMobileCharts = () => {
  // 用户增长趋势图 - 移动端优化
  if (growthChart.value) {
    const growthChartInstance = echarts.init(growthChart.value)
    setGrowthChartInstance(growthChartInstance)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        confine: true,
        textStyle: { fontSize: 10 },
        padding: 4
      },
      legend: {
        data: ['新增用户', '到期用户'],
        bottom: 5,
        textStyle: { fontSize: 10 },
        itemGap: 8
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '18%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLabel: {
          fontSize: 9,
          rotate: 45,
          interval: 'auto',
          hideOverlap: true
        },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 9,
          formatter: '{value}'
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            opacity: 0.5
          }
        }
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#409EFF' },
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          symbolSize: 4,
          cursor: 'pointer'
        },
        {
          name: '到期用户',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#FF6B6B' },
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 107, 0.1)' }
            ])
          },
          symbolSize: 4,
          cursor: 'pointer'
        }
      ]
    }
    growthChartInstance.setOption(option)

    // 添加点击事件
    growthChartInstance.off('click')
    growthChartInstance.on('click', (params) => {
      const date = params.name
      const seriesName = params.seriesName
      const value = params.value

      if (value > 0) {
        navigateToUserList(date, seriesName)
      }
    })
  }

  // 会员等级分布饼图 - 移动端优化
  if (membershipChart.value) {
    const membershipChartInstance = echarts.init(membershipChart.value)
    setMembershipChartInstance(membershipChartInstance)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        textStyle: { fontSize: 10 }
      },
      series: [
        {
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: []
        }
      ]
    }
    membershipChartInstance.setOption(option)
  }

  // 活跃度热力图 - 移动端优化
  if (heatmapChart.value) {
    const heatmapChartInstance = echarts.init(heatmapChart.value)
    setHeatmapChartInstance(heatmapChartInstance)

    const hours = Array.from({ length: 24 }, (_, i) => `${i}`)
    const days = ['一', '二', '三', '四', '五', '六', '日']

    const option = {
      tooltip: {
        position: 'top',
        formatter: function(params) {
          const dayName = `周${days[params.value[0]]}`
          return `${params.value[1]}:00 ${dayName}<br/>活跃用户: ${params.value[2]}人`
        },
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: '30px',
        right: '10px',
        top: '10px',
        bottom: '10px',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: false },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisTick: { show: false },
        axisLabel: {
          interval: 3,
          color: '#909399',
          fontSize: 9
        }
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: { show: false },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#606266',
          fontSize: 9
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        show: false,
        inRange: {
          color: ['#f5f7fa', '#ecf5ff', '#d9ecff', '#c6e2ff', '#a0cfff', '#79bbff', '#409eff']
        }
      },
      series: [{
        name: '活跃度',
        type: 'heatmap',
        data: generateHeatmapData(),
        label: { show: false },
        itemStyle: {
          borderRadius: 2,
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            borderColor: '#409eff',
            shadowBlur: 4,
            shadowColor: 'rgba(64, 158, 255, 0.5)'
          }
        }
      }]
    }
    heatmapChartInstance.setOption(option)
  }

  // 转化漏斗图 - 移动端优化
  if (funnelChart.value) {
    const funnelChartInstance = echarts.init(funnelChart.value)
    setFunnelChartInstance(funnelChartInstance)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const data = params[0]
          return `${data.name}<br/>人数: ${data.value.toLocaleString()}人<br/>占比: ${data.data.rate}%`
        },
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: '60px',
        right: '50px',
        top: '20px',
        bottom: '20px',
        containLabel: false
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: '#606266',
          fontWeight: 400,
          align: 'right',
          padding: [0, 10, 0, 0]
        },
        data: []
      },
      series: [{
        type: 'bar',
        barWidth: 16,
        itemStyle: {
          borderRadius: 8,
          color: function(params) {
            const colors = ['#667eea', '#8b5cf6', '#a855f7', '#c084fc']
            return colors[params.dataIndex] || '#667eea'
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(102, 126, 234, 0.3)'
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) {
            return `${params.value.toLocaleString()}\n${params.data.rate}%`
          },
          color: '#606266',
          fontSize: 9,
          fontWeight: 500
        },
        data: []
      }]
    }
    funnelChartInstance.setOption(option)
  }
}

onMounted(async () => {
  await initializeData()
  initMobileCharts()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.mobile-layout {
  padding: 12px;
  background: var(--bg-color-page);
  min-height: 100vh;

  // 移动端页面头部
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--box-shadow-light);
    margin-bottom: 16px;

    .header-content {
      flex: 1;

      .dashboard-title {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-color-primary);
        margin: 0;

        .title-icon {
          font-size: 20px;
          margin-right: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  // 移动端日期选择器
  .mobile-date-picker {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    box-shadow: var(--box-shadow-base);
  }

  // 指标卡片区域 - 移动端优化
  .metrics-section {
    margin-bottom: 16px;

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .metric-card {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--box-shadow-base);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        }

        &.primary {
          --color-primary: #409eff;
          --color-secondary: #66b1ff;
        }

        &.success {
          --color-primary: #67c23a;
          --color-secondary: #85ce61;
        }

        &.warning {
          --color-primary: #e6a23c;
          --color-secondary: #ebb563;
        }

        &.danger {
          --color-primary: #f56c6c;
          --color-secondary: #f78989;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .metric-label {
            color: var(--text-color-secondary);
            font-size: 11px;
          }

          .info-icon {
            color: var(--text-color-secondary);
            cursor: help;
            font-size: 12px;
          }
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-color-primary);
          line-height: 1.2;
          margin-bottom: 8px;

          .metric-unit {
            font-size: 12px;
            color: var(--text-color-secondary);
            font-weight: 400;
            margin-left: 2px;
          }
        }

        .metric-trend {
          display: flex;
          align-items: center;
          font-size: 10px;

          .trend-up {
            color: var(--success-color);
          }

          .trend-down {
            color: var(--danger-color);
          }

          .positive {
            color: var(--success-color);
            margin-left: 2px;
          }

          .negative {
            color: var(--danger-color);
            margin-left: 2px;
          }
        }
      }
    }
  }

  // 移动端标签页
  .mobile-tabs {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--box-shadow-base);

    :deep(.el-tabs) {
      .el-tabs__header {
        margin-bottom: 16px;
      }

      .el-tabs__nav-wrap {
        .el-tabs__nav-scroll {
          .el-tabs__nav {
            .el-tabs__item {
              padding: 0 12px;
              font-size: 13px;
              height: 32px;
              line-height: 32px;
            }
          }
        }
      }
    }
  }

  // 图表卡片
  .chart-card {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    box-shadow: var(--box-shadow-base);

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;

      .chart-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin: 0;
      }

      :deep(.el-radio-group) {
        .el-radio-button__inner {
          padding: 4px 8px;
          font-size: 12px;
          line-height: 1.2;
        }
      }
    }

    .chart-body {
      .chart-container {
        height: 200px;
      }
    }

    .chart-legend {
      padding: 8px 0;
      border-top: 1px solid var(--border-color-lighter);

      .legend-item {
        display: flex;
        align-items: center;
        padding: 4px 0;

        .legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .legend-label,
        .legend-value {
          font-size: 12px;
        }

        .legend-label {
          flex: 1;
          color: var(--text-color-regular);
        }

        .legend-value {
          color: var(--text-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  // 预警区域
  .warning-section {
    :deep(.el-tabs) {
      .el-tabs__header {
        margin-bottom: 12px;
      }

      .el-tabs__item {
        padding: 0 12px;
        font-size: 13px;
      }
    }

    .warning-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .warning-card {
        display: flex;
        align-items: center;
        padding: 12px;
        background: var(--bg-color-secondary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:active {
          transform: scale(0.98);
          background: var(--bg-color-overlay);
        }

        .warning-icon {
          margin-right: 12px;

          .el-icon {
            font-size: 24px;
          }
        }

        .warning-content {
          .warning-value {
            font-size: 18px;
            font-weight: 700;
            color: var(--text-color-primary);
          }

          .warning-label {
            font-size: 12px;
            color: var(--text-color-secondary);
            margin-top: 2px;
          }
        }
      }
    }
  }

  // VIP用户区域
  .vip-section {
    :deep(.el-collapse) {
      .el-collapse-item__header {
        font-size: 14px;
        font-weight: 600;
        padding: 12px 0;
      }

      .el-collapse-item__content {
        padding: 0;
      }
    }

    .vip-user-list {
      .vip-user-item {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        border-bottom: 1px solid var(--border-color-lighter);
        transition: background 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: var(--bg-color-secondary);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: var(--bg-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 12px;
          text-transform: uppercase;
          font-size: 12px;

          &.gold {
            background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
          }

          &.purple {
            background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
          }
        }

        .user-info {
          flex: 1;

          .user-name {
            font-weight: 600;
            color: var(--text-color-primary);
            margin-bottom: 4px;
            font-size: 14px;
          }

          .user-tags {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
            flex-wrap: wrap;

            .el-tag {
              height: 16px;
              line-height: 14px;
              padding: 0 4px;
              font-size: 10px;
            }
          }

          .user-payment {
            color: var(--text-color-secondary);
            font-size: 12px;

            &.highlight {
              color: var(--danger-color);
              font-weight: 600;
            }
          }

          .user-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;

            .user-payment {
              color: var(--text-color-secondary);
            }

            .last-login {
              color: var(--text-color-secondary);
            }
          }
        }
      }
    }
  }

  // 服务器监控
  .server-section {
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color-primary);
      margin: 0 0 12px 0;
    }

    .server-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .server-card {
        padding: 12px;
        background: var(--bg-color-secondary);
        border-radius: 8px;

        .server-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .server-name {
            font-weight: 600;
            color: var(--text-color-primary);
            font-size: 13px;
          }

          .el-tag {
            height: 16px;
            line-height: 14px;
            padding: 0 6px;
            font-size: 11px;
          }
        }

        :deep(.el-progress) {
          margin-bottom: 8px;

          .el-progress-bar__outer {
            height: 6px;
          }
        }

        .server-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 8px;
          border-top: 1px solid var(--border-color-light);

          .stat-item {
            text-align: center;

            .stat-label {
              display: block;
              color: var(--text-color-secondary);
              font-size: 11px;
              margin-bottom: 2px;
            }

            .stat-value {
              display: block;
              color: var(--text-color-primary);
              font-weight: 600;
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  // 浏览器监控
  .browser-section {
    margin-top: 16px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin: 0;
      }
    }

    .browser-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;

      .browser-stat-card {
        background: var(--bg-color-secondary);
        border-radius: 8px;
        padding: 12px;
        position: relative;
        transition: all 0.3s ease;

        &.healthy {
          border-left: 3px solid #67c23a;
        }

        &.unhealthy {
          border-left: 3px solid #f56c6c;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;

          .stat-label {
            color: var(--text-color-secondary);
            font-size: 12px;
          }

          .status-icon {
            font-size: 16px;

            &.success {
              color: var(--success-color);
            }

            &.danger {
              color: var(--danger-color);
            }
          }
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color-primary);
          margin-bottom: 4px;

          &.danger {
            color: var(--danger-color);
          }

          &.warning {
            color: var(--warning-color);
          }

          &.info {
            color: var(--primary-color);
          }

          &.success {
            color: var(--success-color);
          }

          .stat-unit {
            font-size: 12px;
            font-weight: 400;
            color: var(--text-color-secondary);
            margin-left: 2px;
          }
        }

        .stat-meta {
          color: var(--text-color-secondary);
          font-size: 11px;
          margin-bottom: 6px;
        }
      }
    }

    .browser-instances {
      .subsection-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color-primary);
        margin: 0 0 12px 0;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border-color-lighter);
      }

      .instance-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .instance-card {
          background: var(--bg-color-secondary);
          border-radius: 6px;
          padding: 10px;

          .instance-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .instance-name {
              font-weight: 600;
              color: var(--text-color-primary);
              font-size: 12px;
            }

            .el-tag {
              height: 16px;
              line-height: 14px;
              padding: 0 4px;
              font-size: 10px;
            }
          }

          .instance-progress {
            display: flex;
            align-items: center;
            gap: 8px;

            :deep(.el-progress) {
              flex: 1;

              .el-progress-bar__outer {
                height: 4px;
              }
            }

            .progress-text {
              color: var(--text-color-secondary);
              font-size: 10px;
              min-width: 40px;
              text-align: right;
            }
          }
        }
      }
    }
  }
}</style>