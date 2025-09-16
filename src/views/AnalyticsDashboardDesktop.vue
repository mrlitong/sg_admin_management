<template>
  <div class="analytics-dashboard desktop-layout">
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
                <strong>颜色标识：</strong>红色(<30%) 黄色(30-60%) 绿色(≥60%)
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

    <!-- 浏览器负载监控 -->
    <div class="browser-section" v-if="browserMetrics">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Monitor /></el-icon>
          浏览器负载监控
          <el-tooltip placement="top">
            <template #content>
              <div style="max-width: 350px">
                <strong>服务地址：</strong>218.78.128.120:8888<br/>
                <strong>Context池：</strong>浏览器实例 × Context数量<br/>
                <strong>实时监控：</strong>显示当前运行状态和性能指标
              </div>
            </template>
            <el-icon class="info-icon" style="margin-left: 8px; cursor: help;"><InfoFilled /></el-icon>
          </el-tooltip>
        </h2>
        <el-button
          :icon="Refresh"
          @click="refreshBrowserMetrics"
          :loading="browserLoading"
          size="small"
          type="primary"
          plain>
          刷新
        </el-button>
      </div>

      <!-- 整体状态卡片 -->
      <el-row :gutter="16" class="browser-overview">
        <el-col :span="6">
          <div class="browser-stat-card" :class="browserMetrics.health.status === 'healthy' ? 'healthy' : 'unhealthy'">
            <div class="stat-header">
              <span class="stat-label">服务状态</span>
              <el-icon v-if="browserMetrics.health.status === 'healthy'" class="status-icon success"><CircleCheck /></el-icon>
              <el-icon v-else class="status-icon danger"><CircleClose /></el-icon>
            </div>
            <div class="stat-value">{{ browserMetrics.health.status === 'healthy' ? '正常' : '异常' }}</div>
            <div class="stat-meta">{{ browserMetrics.health.service }}</div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="browser-stat-card">
            <div class="stat-header">
              <span class="stat-label">池利用率</span>
              <el-tooltip content="当前使用中的Context占比">
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
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
        </el-col>

        <el-col :span="6">
          <div class="browser-stat-card">
            <div class="stat-header">
              <span class="stat-label">请求成功率</span>
              <el-tooltip content="最近5分钟的请求成功率">
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="stat-value" :class="getSuccessRateClass(browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate)">
              <animated-number
                :value="(browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate || 0) * 100"
                format="percent"
              />
              <span class="stat-unit">%</span>
            </div>
            <div class="stat-meta">
              {{ browserMetrics.poolStatus?.metrics?.recent_5min?.success_count || 0 }}/{{ browserMetrics.poolStatus?.metrics?.recent_5min?.request_count || 0 }} 成功
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="browser-stat-card">
            <div class="stat-header">
              <span class="stat-label">活跃请求</span>
              <el-tooltip content="当前正在处理的请求数">
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="stat-value">
              {{ browserMetrics.poolStatus?.metrics?.active_requests || 0 }}
            </div>
            <div class="stat-meta">
              队列长度: {{ browserMetrics.poolStatus?.metrics?.queue_length || 0 }}
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 浏览器实例详情 -->
      <div class="browser-instances">
        <h3 class="subsection-title">浏览器实例状态</h3>
        <el-row :gutter="16">
          <el-col
            v-for="browser in browserMetrics.poolStatus?.pool?.browsers"
            :key="browser.browser_id"
            :span="6">
            <div class="browser-instance-card">
              <div class="instance-header">
                <span class="instance-name">{{ browser.browser_id }}</span>
                <el-tag
                  :type="browser.is_healthy ? 'success' : 'danger'"
                  size="small">
                  {{ browser.is_healthy ? '健康' : '异常' }}
                </el-tag>
              </div>

              <div class="instance-stats">
                <div class="stat-row">
                  <span class="stat-label">Context数</span>
                  <span class="stat-value">{{ browser.total_contexts }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">使用中</span>
                  <span class="stat-value">{{ browser.busy_contexts }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">总使用次数</span>
                  <span class="stat-value">{{ browser.total_usage }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">运行时长</span>
                  <span class="stat-value">{{ formatDuration(browser.age_seconds) }}</span>
                </div>
              </div>

              <el-progress
                :percentage="(browser.busy_contexts / browser.total_contexts) * 100"
                :color="getBrowserLoadColor((browser.busy_contexts / browser.total_contexts) * 100)"
                :stroke-width="6"
              />
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 性能指标 -->
      <div class="browser-performance">
        <h3 class="subsection-title">性能指标</h3>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="performance-card">
              <h4 class="card-title">最近1分钟</h4>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">请求数</span>
                  <span class="metric-value">{{ browserMetrics.poolStatus?.metrics?.recent_1min?.request_count || 0 }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">成功率</span>
                  <span class="metric-value" :class="getSuccessRateClass(browserMetrics.poolStatus?.metrics?.recent_1min?.success_rate)">
                    {{ ((browserMetrics.poolStatus?.metrics?.recent_1min?.success_rate || 0) * 100).toFixed(1) }}%
                  </span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">平均耗时</span>
                  <span class="metric-value">{{ (browserMetrics.poolStatus?.metrics?.recent_1min?.avg_duration || 0).toFixed(2) }}s</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">QPS</span>
                  <span class="metric-value">{{ (browserMetrics.poolStatus?.metrics?.recent_1min?.qps || 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="performance-card">
              <h4 class="card-title">最近5分钟</h4>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">请求数</span>
                  <span class="metric-value">{{ browserMetrics.poolStatus?.metrics?.recent_5min?.request_count || 0 }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">成功率</span>
                  <span class="metric-value" :class="getSuccessRateClass(browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate)">
                    {{ ((browserMetrics.poolStatus?.metrics?.recent_5min?.success_rate || 0) * 100).toFixed(1) }}%
                  </span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">平均耗时</span>
                  <span class="metric-value">{{ (browserMetrics.poolStatus?.metrics?.recent_5min?.avg_duration || 0).toFixed(2) }}s</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">P95耗时</span>
                  <span class="metric-value">{{ (browserMetrics.poolStatus?.metrics?.recent_5min?.p95_duration || 0).toFixed(2) }}s</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-section">
      <el-row :gutter="16">
        <el-col :span="6" v-for="metric in coreMetrics" :key="metric.key">
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
        <el-col :span="24">
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
        <el-col :span="24">
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
        <el-col :span="12">
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
        <el-col :span="12">
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
        <el-col :span="8">
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

        <el-col :span="8">
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

        <el-col :span="8">
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Refresh, Download, DataAnalysis, InfoFilled, Warning,
  Trophy, Monitor, Clock, CircleClose, TrendCharts,
  CircleCheck
} from '@element-plus/icons-vue'
import AnimatedNumber from '../components/AnimatedNumber.vue'
import MiniChart from '../components/MiniChart.vue'
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

// 初始化桌面端图表
const initDesktopCharts = () => {
  // 用户增长趋势图
  if (growthChart.value) {
    const growthChartInstance = echarts.init(growthChart.value)
    setGrowthChartInstance(growthChartInstance)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        confine: true
      },
      legend: {
        data: ['新增用户', '到期用户'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}人'
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
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          symbolSize: 6,
          cursor: 'pointer'
        },
        {
          name: '到期用户',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#FF6B6B' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 107, 0.1)' }
            ])
          },
          symbolSize: 6,
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

  // 会员等级分布饼图
  if (membershipChart.value) {
    const membershipChartInstance = echarts.init(membershipChart.value)
    setMembershipChartInstance(membershipChartInstance)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}人 ({d}%)'
          },
          labelLine: {
            show: true
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
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

  // 活跃度热力图
  if (heatmapChart.value) {
    const heatmapChartInstance = echarts.init(heatmapChart.value)
    setHeatmapChartInstance(heatmapChartInstance)

    const hours = Array.from({ length: 24 }, (_, i) => `${i}`)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    const option = {
      tooltip: {
        position: 'top',
        formatter: function(params) {
          return `${params.value[1]}:00 ${days[params.value[0]]}<br/>活跃用户: ${params.value[2]}人`
        }
      },
      grid: {
        left: '50px',
        right: '20px',
        top: '20px',
        bottom: '20px',
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
          interval: 2,
          color: '#909399'
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
          color: '#606266'
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
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
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

  // 转化漏斗图
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
        }
      },
      grid: {
        left: '100px',
        right: '80px',
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
          fontSize: 13,
          color: '#606266',
          fontWeight: 400,
          align: 'right',
          padding: [0, 10, 0, 0]
        },
        data: []
      },
      series: [{
        type: 'bar',
        barWidth: 24,
        itemStyle: {
          borderRadius: 12,
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
            return `${params.value.toLocaleString()}人 (${params.data.rate}%)`
          },
          color: '#606266',
          fontSize: 12,
          fontWeight: 500
        },
        data: []
      }]
    }
    funnelChartInstance.setOption(option)
  }
}

// 更新图表数据
const updateDesktopCharts = () => {
  // 这里将在useAnalyticsDashboard中实现具体的更新逻辑
}

onMounted(async () => {
  await initializeData()
  initDesktopCharts()
  updateDesktopCharts()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
@import "../styles/analytics-dashboard.scss";

.desktop-layout {
  // 桌面端特定样式
  .dashboard-header {
    flex-direction: row;
    align-items: center;

    .header-right {
      flex-direction: row;
      width: auto;
      gap: 12px;
    }
  }

  .metrics-section {
    .metric-card {
      .metric-value {
        font-size: 32px;
      }
    }
  }

  .charts-section {
    .chart-container {
      height: 300px;
    }
  }

  .warning-section {
    .warning-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .server-section {
    .server-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  .vip-section {
    .vip-card {
      height: auto;

      .el-scrollbar {
        height: 300px;
      }
    }
  }
}
</style>