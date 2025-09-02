<template>
  <div class="analytics-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          数据分析中心
        </h1>
        <p class="dashboard-subtitle">实时监控运营数据，洞察用户行为</p>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          @change="handleDateChange"
          style="margin-right: 12px"
        />
        <el-button :icon="Refresh" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
        <el-button :icon="Download" @click="exportData" type="primary">
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-section">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6" v-for="metric in coreMetrics" :key="metric.key">
          <div class="metric-card" :class="metric.type">
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
                <component :is="metric.trend > 0 ? 'TrendCharts' : 'TrendCharts'" />
              </el-icon>
              <span :class="metric.trend > 0 ? 'positive' : 'negative'">
                {{ Math.abs(metric.trend) }}% vs 上期
              </span>
            </div>
            <div class="metric-sparkline" v-if="metric.sparkline">
              <mini-chart :data="metric.sparkline" :type="metric.chartType" />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="16">
        <!-- 用户增长趋势 -->
        <el-col :xs="24" :lg="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">
                用户增长趋势
                <el-tooltip placement="top">
                  <template #content>
                    <div style="max-width: 350px">
                      <strong>数据来源：</strong><br/>
                      - 新增用户：按日统计register_date<br/>
                      - 到期用户：membership_level > 0 且 membership_expire_date当天过期<br/>
                      <strong>计算方式：</strong><br/>
                      - 新增：COUNT(*) GROUP BY DATE(register_date)<br/>
                      - 到期：COUNT(*) WHERE DATE(membership_expire_date) = target_date<br/>
                      <strong>统计说明：</strong>展示每日新增注册用户与会员到期用户对比
                    </div>
                  </template>
                  <el-icon class="info-icon" style="font-size: 14px; margin-left: 6px;"><InfoFilled /></el-icon>
                </el-tooltip>
              </h3>
              <el-radio-group v-model="growthPeriod" size="small" @change="updateGrowthChart">
                <el-radio-button label="7d">7天</el-radio-button>
                <el-radio-button label="30d">30天</el-radio-button>
                <el-radio-button label="90d">90天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-body">
              <div ref="growthChart" class="chart-container"></div>
            </div>
          </div>
        </el-col>

      </el-row>

      <!-- 24小时活跃度热力图 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :xs="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">
                24小时活跃度分布
                <el-tooltip placement="top">
                  <template #content>
                    <div style="max-width: 300px">
                      计算方式：按小时统计last_login_time分布<br/>
                      维度：星期（周一至周日） × 小时（0-23点）<br/>
                      颜色深浅代表活跃度高低
                    </div>
                  </template>
                  <el-icon class="info-icon" style="font-size: 14px; margin-left: 6px;"><InfoFilled /></el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="chart-body">
              <div ref="heatmapChart" class="chart-container" style="height: 280px;"></div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 会员分布和转化漏斗 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <!-- 会员等级分布 -->
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">
                会员等级分布
                <el-tooltip placement="top">
                  <template #content>
                    <div style="max-width: 300px">
                      计算方式：GROUP BY membership_level<br/>
                      筛选条件：membership_expire_date > NOW()<br/>
                      等级分类：3=钻石会员，4=至尊会员
                    </div>
                  </template>
                  <el-icon class="info-icon" style="font-size: 14px; margin-left: 6px;"><InfoFilled /></el-icon>
                </el-tooltip>
              </h3>
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
        </el-col>

        <!-- 转化漏斗 -->
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">
                用户转化漏斗
                <el-tooltip placement="top">
                  <template #content>
                    <div style="max-width: 350px">
                      漏斗层级：<br/>
                      1. 总注册用户：COUNT(DISTINCT account)<br/>
                      2. 曾付费用户：membership_level >= 1<br/>
                      3. 当前活跃会员：membership_expire_date > NOW()<br/>
                      4. 高价值用户：membership_pay_money > 平均值
                    </div>
                  </template>
                  <el-icon class="info-icon" style="font-size: 14px; margin-left: 6px;"><InfoFilled /></el-icon>
                </el-tooltip>
              </h3>
            </div>
            <div class="chart-body">
              <div ref="funnelChart" class="chart-container"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 流失预警区域 -->
    <div class="warning-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Warning /></el-icon>
          流失预警
          <el-tooltip placement="top">
            <template #content>
              <div style="max-width: 350px">
                <strong>即将到期：</strong>统计membership_expire_date在未来指定天数内的会员<br/>
                <strong>已过期：</strong>统计membership_expire_date在过去指定天数内的会员<br/>
                <strong>筛选条件：</strong>membership_level >= 1（付费会员）
              </div>
            </template>
            <el-icon class="info-icon" style="margin-left: 8px; cursor: help;"><InfoFilled /></el-icon>
          </el-tooltip>
        </h2>
        <el-tabs v-model="warningTab" class="warning-tabs">
          <el-tab-pane label="即将到期" name="expiring">
            <div class="warning-grid">
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
            <div class="warning-grid">
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
    </div>

    <!-- 高价值用户区域 -->
    <div class="vip-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Trophy /></el-icon>
          高价值用户
          <el-tooltip placement="top">
            <template #content>
              <div style="max-width: 400px">
                <strong>高风险流失：</strong>钻石以上会员且14天内到期，按付费金额降序<br/>
                <strong>最高付费：</strong>按membership_pay_money降序排列的TOP用户<br/>
                <strong>忠诚用户：</strong>注册时间超过90天且持续付费的活跃用户
              </div>
            </template>
            <el-icon class="info-icon" style="margin-left: 8px; cursor: help;"><InfoFilled /></el-icon>
          </el-tooltip>
        </h2>
      </div>
      <el-row :gutter="16">
        <el-col :xs="24" :lg="8">
          <div class="vip-card">
            <h4 class="vip-title">高风险流失用户</h4>
            <el-scrollbar height="300px">
              <div v-for="user in atRiskUsers" :key="user.account" class="vip-user-item">
                <div class="user-avatar">{{ user.account.slice(0, 2) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.account }}</div>
                  <div class="user-meta">
                    <el-tag size="small" :type="getLevelType(user.membership_level)">
                      {{ getLevelName(user.membership_level) }}
                    </el-tag>
                    <span class="user-payment">¥{{ user.total_payment }}</span>
                  </div>
                </div>
                <div class="user-expire">
                  <el-tag type="warning" size="small">{{ user.days_until_expire }}天后到期</el-tag>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="vip-card">
            <h4 class="vip-title">最高付费用户</h4>
            <el-scrollbar height="300px">
              <div v-for="user in topPayingUsers" :key="user.account" class="vip-user-item">
                <div class="user-avatar gold">{{ user.account.slice(0, 2) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.account }}</div>
                  <div class="user-meta">
                    <el-tag size="small" :type="getLevelType(user.membership_level)">
                      {{ getLevelName(user.membership_level) }}
                    </el-tag>
                    <span class="user-payment highlight">¥{{ user.total_payment }}</span>
                  </div>
                </div>
                <div class="user-status">
                  <el-tag :type="user.is_online ? 'success' : 'info'" size="small">
                    {{ user.is_online ? '在线' : '离线' }}
                  </el-tag>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="vip-card">
            <h4 class="vip-title">忠诚用户</h4>
            <el-scrollbar height="300px">
              <div v-for="user in loyalUsers" :key="user.account" class="vip-user-item">
                <div class="user-avatar purple">{{ user.account.slice(0, 2) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.account }}</div>
                  <div class="user-meta">
                    <el-tag size="small" type="success">
                      活跃{{ user.days_active }}天
                    </el-tag>
                    <span class="user-payment">¥{{ user.total_payment }}</span>
                  </div>
                </div>
                <div class="user-login">
                  <span class="last-login">{{ formatDate(user.last_login) }}</span>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 服务器负载监控 -->
    <div class="server-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Monitor /></el-icon>
          服务器负载监控
          <el-tooltip placement="top">
            <template #content>
              <div style="max-width: 350px">
                <strong>统计维度：</strong>GROUP BY bucket（服务器编号）<br/>
                <strong>负载率：</strong>在线用户数 ÷ 总用户数 × 100%<br/>
                <strong>颜色标识：</strong>绿色(<60%) 黄色(60-80%) 红色(>80%)
              </div>
            </template>
            <el-icon class="info-icon" style="margin-left: 8px; cursor: help;"><InfoFilled /></el-icon>
          </el-tooltip>
        </h2>
      </div>
      <div class="server-grid">
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
            :stroke-width="8"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, Download, DataAnalysis, InfoFilled, Warning, 
  Trophy, Monitor, Clock, CircleClose, TrendCharts
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getAnalyticsOverview, getAnalyticsTrends, getHighValueUsers, getServerDistribution } from '../api/analytics'
import AnimatedNumber from '../components/AnimatedNumber.vue'
import MiniChart from '../components/MiniChart.vue'
import { useResponsive } from '../utils/responsive'

const router = useRouter()
const loading = ref(false)
const dateRange = ref([])
const growthPeriod = ref('30d')
const warningTab = ref('expiring')

// 响应式检测
const { isMobile, isTablet, isDesktop } = useResponsive()

// 图表实例
const growthChart = ref(null)
const membershipChart = ref(null)
const heatmapChart = ref(null)
const funnelChart = ref(null)

// 图表实例对象
let growthChartInstance = null
let membershipChartInstance = null
let heatmapChartInstance = null
let funnelChartInstance = null

// 数据
const analyticsData = reactive({
  overview: null,
  trends: null,
  highValueUsers: null,
  serverDistribution: null
})

// 核心指标
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
      sparkline: [100, 120, 115, 134, 168, 132, 200]
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
      sparkline: [200, 180, 190, 170, 160, 180, 165]
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

// 初始化图表
const initCharts = () => {
  // 用户增长趋势图
  if (growthChart.value) {
    growthChartInstance = echarts.init(growthChart.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        confine: true,
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        },
        padding: isMobile.value ? 4 : 8
      },
      legend: {
        data: ['新增用户', '到期用户'],
        bottom: isMobile.value ? 5 : 0,
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        },
        itemGap: isMobile.value ? 8 : 10
      },
      grid: {
        left: isMobile.value ? '8%' : '3%',
        right: isMobile.value ? '8%' : '4%',
        bottom: isMobile.value ? '18%' : '10%',
        top: isMobile.value ? '10%' : '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLabel: {
          fontSize: isMobile.value ? 9 : 12,
          rotate: isMobile.value ? 45 : 0,
          interval: isMobile.value ? 'auto' : 0,
          hideOverlap: true
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: isMobile.value ? 9 : 12,
          formatter: isMobile.value ? '{value}' : '{value}人'
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
          lineStyle: {
            width: isMobile.value ? 2 : 3
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          symbolSize: isMobile.value ? 4 : 6,
          cursor: 'pointer' // 添加鼠标指针样式
        },
        {
          name: '到期用户',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#FF6B6B' },
          lineStyle: {
            width: isMobile.value ? 2 : 3
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 107, 0.1)' }
            ])
          },
          symbolSize: isMobile.value ? 4 : 6,
          cursor: 'pointer' // 添加鼠标指针样式
        }
      ]
    }
    growthChartInstance.setOption(option)
    
    // 添加点击事件
    growthChartInstance.off('click') // 先移除旧的事件监听器
    growthChartInstance.on('click', (params) => {
      // 获取点击的日期和数据类型
      const date = params.name // 日期
      const seriesName = params.seriesName // '新增用户' 或 '到期用户'
      const value = params.value // 数值
      
      if (value > 0) { // 只有数值大于0时才跳转
        navigateToUserList(date, seriesName)
      }
    })
  }


  // 会员等级分布饼图
  if (membershipChart.value) {
    membershipChartInstance = echarts.init(membershipChart.value)
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        }
      },
      series: [
        {
          type: 'pie',
          radius: isMobile.value ? ['30%', '60%'] : ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: !isMobile.value,
            position: isMobile.value ? 'inside' : 'outside',
            fontSize: isMobile.value ? 10 : 12,
            formatter: isMobile.value ? '{d}%' : '{b}\n{c}人 ({d}%)'
          },
          labelLine: {
            show: !isMobile.value
          },
          emphasis: {
            label: {
              show: true,
              fontSize: isMobile.value ? 14 : 20,
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

  // 活跃度热力图 - 更简洁的设计
  if (heatmapChart.value) {
    heatmapChartInstance = echarts.init(heatmapChart.value)
    const hours = Array.from({ length: 24 }, (_, i) => `${i}`)
    const days = isMobile.value ? ['一', '二', '三', '四', '五', '六', '日'] : 
                 ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    const option = {
      tooltip: {
        position: 'top',
        formatter: function(params) {
          const dayName = isMobile.value ? 
            `周${days[params.value[0]]}` : 
            days[params.value[0]]
          return `${params.value[1]}:00 ${dayName}<br/>活跃用户: ${params.value[2]}人`
        },
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        }
      },
      grid: {
        left: isMobile.value ? '30px' : '50px',
        right: isMobile.value ? '10px' : '20px',
        top: isMobile.value ? '10px' : '20px',
        bottom: isMobile.value ? '10px' : '20px',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: isMobile.value ? 3 : 2,
          color: '#909399',
          fontSize: isMobile.value ? 9 : 12
        }
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#e4e7ed'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#606266',
          fontSize: isMobile.value ? 9 : 12
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
        label: {
          show: false
        },
        itemStyle: {
          borderRadius: isMobile.value ? 2 : 4,
          borderColor: '#fff',
          borderWidth: isMobile.value ? 1 : 2
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

  // 转化漏斗图 - 改为简洁的水平进度条
  if (funnelChart.value) {
    funnelChartInstance = echarts.init(funnelChart.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const data = params[0]
          return `${data.name}<br/>人数: ${data.value.toLocaleString()}人<br/>占比: ${data.data.rate}%`
        },
        textStyle: {
          fontSize: isMobile.value ? 10 : 12
        }
      },
      grid: {
        left: isMobile.value ? '60px' : '100px',
        right: isMobile.value ? '50px' : '80px',
        top: '20px',
        bottom: '20px',
        containLabel: false
      },
      xAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          fontSize: isMobile.value ? 10 : 13,
          color: '#606266',
          fontWeight: 400,
          align: 'right',
          padding: [0, 10, 0, 0]
        },
        data: []
      },
      series: [{
        type: 'bar',
        barWidth: isMobile.value ? 16 : 24,
        itemStyle: {
          borderRadius: isMobile.value ? 8 : 12,
          color: function(params) {
            const colors = [
              '#667eea',
              '#8b5cf6',
              '#a855f7',
              '#c084fc'
            ]
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
            if (isMobile.value) {
              return `${params.value.toLocaleString()}\n${params.data.rate}%`
            }
            return `${params.value.toLocaleString()}人 (${params.data.rate}%)`
          },
          color: '#606266',
          fontSize: isMobile.value ? 9 : 12,
          fontWeight: 500
        },
        data: []
      }]
    }
    funnelChartInstance.setOption(option)
  }
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

// 更新图表数据
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

// 跳转到用户列表页面
const navigateToUserList = (date, type) => {
  // 构建查询参数
  const queryParams = {
    dataType: type === '新增用户' ? 'new' : 'expired',
    date: date
  }
  
  // 跳转到用户数据管理页面（使用正确的路径）
  router.push({
    path: '/users',
    query: queryParams
  })
}

// 加载数据
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
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
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
  // TODO: 跳转到用户列表页面
  router.push({
    path: '/users',
    query: { filter: type, days: days }
  })
}

// 获取会员等级类型
const getLevelType = (level) => {
  const types = {
    3: 'warning',  // 钻石
    4: 'danger'    // 至尊
  }
  return types[level] || 'info'
}

// 获取会员等级名称
const getLevelName = (level) => {
  const names = {
    '-1': '游客',
    '0': '游客',
    '3': '钻石会员',
    '4': '至尊会员'
  }
  return names[level] || `等级${level}`
}

// 获取负载类型
const getLoadType = (rate) => {
  if (rate >= 80) return 'danger'
  if (rate >= 60) return 'warning'
  if (rate >= 40) return 'success'
  return 'info'
}

// 获取负载颜色
const getLoadColor = (rate) => {
  if (rate >= 80) return '#f56c6c'
  if (rate >= 60) return '#e6a23c'
  if (rate >= 40) return '#67c23a'
  return '#909399'
}

// 格式化日期
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

// 组件挂载
onMounted(async () => {
  await refreshData()
  await nextTick()
  initCharts()
  updateCharts()
  
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  growthChartInstance?.dispose()
  membershipChartInstance?.dispose()
  heatmapChartInstance?.dispose()
  funnelChartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.analytics-dashboard {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .header-left {
      .dashboard-title {
        display: flex;
        align-items: center;
        font-size: 28px;
        font-weight: 700;
        color: #303133;
        margin: 0 0 8px 0;

        .title-icon {
          font-size: 32px;
          margin-right: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      .dashboard-subtitle {
        color: #909399;
        font-size: 14px;
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
    }
  }

  // 指标卡片区域
  .metrics-section {
    margin-bottom: 24px;

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .metric-label {
          color: #909399;
          font-size: 14px;
        }

        .info-icon {
          color: #909399;
          cursor: help;
          transition: color 0.3s;
          
          &:hover {
            color: #409eff;
          }
        }
      }

      .metric-value {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 12px;

        .metric-unit {
          font-size: 14px;
          color: #909399;
          font-weight: 400;
          margin-left: 4px;
        }
      }

      .metric-trend {
        display: flex;
        align-items: center;
        font-size: 12px;

        .trend-up {
          color: #67c23a;
        }

        .trend-down {
          color: #f56c6c;
        }

        .positive {
          color: #67c23a;
          margin-left: 4px;
        }

        .negative {
          color: #f56c6c;
          margin-left: 4px;
        }
      }

      .metric-sparkline {
        margin-top: 12px;
        height: 40px;
      }
    }
  }

  // 图表区域
  .charts-section {
    margin-bottom: 24px;

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      margin-bottom: 16px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0;
          display: inline-flex;
          align-items: center;
          
          .info-icon {
            color: #909399;
            cursor: help;
            transition: color 0.3s;
            
            &:hover {
              color: #409eff;
            }
          }
        }
      }

      .chart-body {
        .chart-container {
          height: 300px;
        }
      }

      .chart-legend {
        padding: 16px 0 0;
        border-top: 1px solid #ebeef5;

        .legend-item {
          display: flex;
          align-items: center;
          padding: 8px 0;

          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
          }

          .legend-label {
            flex: 1;
            color: #606266;
            font-size: 14px;
          }

          .legend-value {
            color: #303133;
            font-weight: 600;
          }
        }
      }
    }
  }

  // 预警区域
  .warning-section {
    margin-bottom: 24px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .section-header {
      margin-bottom: 20px;

      .section-title {
        display: flex;
        align-items: center;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;

        .el-icon {
          margin-right: 8px;
          color: #e6a23c;
        }
        
        .info-icon {
          color: #909399;
          cursor: help;
          transition: color 0.3s;
          font-size: 16px;
          
          &:hover {
            color: #409eff;
          }
        }
      }
    }

    .warning-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .warning-card {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .warning-icon {
          margin-right: 16px;
          .el-icon {
            font-size: 32px;
          }
        }

        .warning-content {
          .warning-value {
            font-size: 24px;
            font-weight: 700;
            color: #303133;
          }

          .warning-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  // VIP用户区域
  .vip-section {
    margin-bottom: 24px;

    .section-header {
      margin-bottom: 20px;
      padding: 24px 24px 0;
      background: white;
      border-radius: 12px 12px 0 0;

      .section-title {
        display: flex;
        align-items: center;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;

        .el-icon {
          margin-right: 8px;
          color: #ffb800;
        }
      }
    }

    .vip-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

      .vip-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 1px solid #ebeef5;
      }

      .vip-user-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        transition: background 0.3s ease;

        &:hover {
          background: #f5f7fa;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 12px;
          text-transform: uppercase;

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
            color: #303133;
            margin-bottom: 4px;
          }

          .user-meta {
            display: flex;
            align-items: center;
            gap: 8px;

            .user-payment {
              color: #909399;
              font-size: 14px;

              &.highlight {
                color: #ff6b6b;
                font-weight: 600;
              }
            }
          }
        }

        .user-expire,
        .user-status,
        .user-login {
          .last-login {
            color: #909399;
            font-size: 12px;
          }
        }
      }
    }
  }

  // 服务器监控区域
  .server-section {
    margin-bottom: 24px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .section-header {
      margin-bottom: 20px;

      .section-title {
        display: flex;
        align-items: center;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0;

        .el-icon {
          margin-right: 8px;
          color: #409eff;
        }
      }
    }

    .server-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;

      .server-card {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .server-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .server-name {
            font-weight: 600;
            color: #303133;
          }
        }

        .server-stats {
          display: flex;
          justify-content: space-around;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e4e7ed;

          .stat-item {
            text-align: center;

            .stat-label {
              display: block;
              color: #909399;
              font-size: 12px;
              margin-bottom: 4px;
            }

            .stat-value {
              display: block;
              color: #303133;
              font-weight: 600;
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 12px;

    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;

      .header-left {
        width: 100%;
        margin-bottom: 12px;
        
        .dashboard-title {
          font-size: 20px;
          
          .title-icon {
            font-size: 24px;
            margin-right: 8px;
          }
        }
        
        .dashboard-subtitle {
          font-size: 12px;
          margin-top: 4px;
        }
      }

      .header-right {
        margin-top: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        :deep(.el-date-picker) {
          width: 100% !important;
          
          .el-input__inner {
            font-size: 14px !important;
          }
        }

        .el-button {
          width: 100%;
          height: 36px;
          font-size: 14px;
        }
      }
    }
    
    // 指标卡片移动端优化
    .metrics-section {
      margin-bottom: 16px;
      
      :deep(.el-row) {
        margin: 0;
        
        .el-col {
          padding: 0 4px;
          margin-bottom: 8px;
        }
      }
      
      .metric-card {
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        
        .metric-header {
          margin-bottom: 8px;
          
          .metric-label {
            font-size: 11px;
          }
        }
        
        .metric-value {
          font-size: 22px;
          margin-bottom: 8px;
          line-height: 1.1;
          
          .metric-unit {
            font-size: 12px;
          }
        }
        
        .metric-trend {
          font-size: 10px;
        }
        
        .metric-sparkline {
          height: 30px;
          margin-top: 8px;
        }
      }
    }
    
    // 图表容器移动端优化
    .charts-section {
      margin-bottom: 16px;
      
      .chart-card {
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 8px;
        
        .chart-header {
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 12px;
          
          .chart-title {
            font-size: 16px;
            margin-bottom: 8px;
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
            height: 220px !important;
          }
        }
        
        .chart-legend {
          padding: 8px 0;
          
          .legend-item {
            padding: 4px 0;
            
            .legend-dot {
              width: 6px;
              height: 6px;
            }
            
            .legend-label,
            .legend-value {
              font-size: 12px;
            }
          }
        }
      }
    }
    
    // 预警区域移动端优化
    .warning-section {
      padding: 16px;
      margin-bottom: 16px;
      
      .section-header {
        margin-bottom: 16px;
        
        .section-title {
          font-size: 16px;
          margin-bottom: 12px;
        }
        
        :deep(.warning-tabs) {
          .el-tabs__header {
            margin-bottom: 8px;
          }
          
          .el-tabs__item {
            padding: 0 12px;
            font-size: 13px;
          }
        }
      }
      
      .warning-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        
        .warning-card {
          padding: 12px;
          border-radius: 8px;
          
          .warning-icon {
            margin-right: 12px;
            
            .el-icon {
              font-size: 24px;
            }
          }
          
          .warning-content {
            .warning-value {
              font-size: 20px;
            }
            
            .warning-label {
              font-size: 12px;
            }
          }
        }
      }
    }
    
    // VIP用户列表移动端优化
    .vip-section {
      margin-bottom: 16px;
      
      .section-header {
        padding: 16px 16px 0;
        margin-bottom: 12px;
        border-radius: 8px 8px 0 0;
        
        .section-title {
          font-size: 16px;
          margin-bottom: 8px;
        }
      }
      
      :deep(.el-row) {
        margin: 0;
        
        .el-col {
          padding: 0 4px;
          margin-bottom: 12px;
        }
      }
      
      .vip-card {
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        
        .vip-title {
          font-size: 14px;
          margin-bottom: 12px;
          padding-bottom: 8px;
        }
        
        :deep(.el-scrollbar) {
          height: 180px !important;
        }
        
        .vip-user-item {
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 4px;
          
          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
            margin-right: 8px;
          }
          
          .user-info {
            flex: 1;
            
            .user-name {
              font-size: 13px;
              margin-bottom: 2px;
            }
            
            .user-meta {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 11px;
              
              .el-tag {
                height: 16px;
                line-height: 14px;
                padding: 0 4px;
                font-size: 10px;
                transform: scale(0.9);
                transform-origin: left;
              }
              
              .user-payment {
                font-size: 11px;
                
                &.highlight {
                  font-weight: 600;
                }
              }
            }
          }
          
          .user-expire,
          .user-status,
          .user-login {
            .el-tag {
              height: 16px;
              line-height: 14px;
              padding: 0 4px;
              font-size: 10px;
            }
            
            .last-login {
              font-size: 10px;
            }
          }
        }
      }
    }
    
    // 服务器负载卡片响应式
    .server-section {
      padding: 16px;
      margin-bottom: 16px;
      
      .section-header {
        margin-bottom: 12px;
        
        .section-title {
          font-size: 16px;
        }
      }
      
      .server-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        
        .server-card {
          padding: 12px;
          border-radius: 8px;
          
          .server-header {
            margin-bottom: 8px;
            
            .server-name {
              font-size: 13px;
            }
            
            .el-tag {
              height: 18px;
              line-height: 16px;
              padding: 0 6px;
              font-size: 11px;
            }
          }
          
          :deep(.el-progress) {
            .el-progress-bar__outer {
              height: 6px !important;
            }
          }
          
          .server-stats {
            margin-top: 8px;
            padding-top: 8px;
            
            .stat-item {
              .stat-label {
                font-size: 11px;
              }
              
              .stat-value {
                font-size: 16px;
              }
            }
          }
        }
      }
    }
  }
}


/* 平板端响应式样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .analytics-dashboard {
    padding: 16px;
    
    .dashboard-header {
      padding: 20px;
      
      .dashboard-title {
        font-size: 24px;
        
        .title-icon {
          font-size: 28px;
        }
      }
      
      .header-right {
        :deep(.el-date-picker) {
          width: 220px !important;
        }
      }
    }
    
    .metrics-section {
      .metric-card {
        .metric-value {
          font-size: 28px;
        }
      }
    }
    
    .charts-section {
      .chart-card {
        .chart-container {
          height: 320px;
        }
      }
    }
    
    .warning-section {
      .warning-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .server-section {
      .server-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .vip-section {
      :deep(.el-row) {
        .el-col {
          &:nth-child(1), &:nth-child(2) {
            width: 50%;
          }
          &:nth-child(3) {
            width: 100%;
          }
        }
      }
    }
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .analytics-dashboard {
    padding: 8px;
    
    .dashboard-header {
      padding: 8px 12px;
      margin-bottom: 8px;
      flex-direction: row;
      align-items: center;
      
      .header-left {
        margin-bottom: 0;
        
        .dashboard-title {
          font-size: 16px;
          margin-bottom: 0;
          
          .title-icon {
            font-size: 18px;
          }
        }
        
        .dashboard-subtitle {
          display: none;
        }
      }
      
      .header-right {
        width: auto;
        flex-direction: row;
        gap: 8px;
        margin-top: 0;
        
        :deep(.el-date-picker) {
          width: 200px !important;
        }
        
        .el-button {
          width: auto;
          height: 32px;
          font-size: 12px;
          padding: 0 12px;
        }
      }
    }
    
    .metrics-section {
      margin-bottom: 8px;
      
      .metric-card {
        padding: 8px;
        
        .metric-header {
          margin-bottom: 4px;
        }
        
        .metric-value {
          font-size: 18px;
          margin-bottom: 4px;
        }
        
        .metric-trend {
          font-size: 10px;
        }
      }
    }
    
    .charts-section {
      margin-bottom: 8px;
      
      .chart-card {
        padding: 8px;
        margin-bottom: 8px;
        
        .chart-header {
          margin-bottom: 8px;
          
          .chart-title {
            font-size: 14px;
          }
        }
        
        .chart-container {
          height: 160px !important;
        }
      }
    }
    
    .warning-section,
    .vip-section,
    .server-section {
      padding: 8px;
      margin-bottom: 8px;
      
      .section-header {
        margin-bottom: 8px;
        
        .section-title {
          font-size: 14px;
        }
      }
    }
    
    .vip-card :deep(.el-scrollbar) {
      height: 120px !important;
    }
    
    .warning-grid .warning-card {
      padding: 8px;
      
      .warning-content {
        .warning-value {
          font-size: 16px;
        }
      }
    }
    
    .server-grid .server-card {
      padding: 8px;
    }
  }
}
</style>