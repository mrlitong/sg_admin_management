import request from '../utils/request'

// 获取数据分析总览
export function getAnalyticsOverview() {
  return request({
    url: '/admin/analytics/overview',
    method: 'get'
  })
}

// 获取趋势数据
export function getAnalyticsTrends(days = 30) {
  return request({
    url: '/admin/analytics/trends',
    method: 'get',
    params: { days }
  })
}

// 获取高价值用户
export function getHighValueUsers(limit = 20) {
  return request({
    url: '/admin/analytics/high-value-users',
    method: 'get',
    params: { limit }
  })
}

// 获取服务器分布
export function getServerDistribution() {
  return request({
    url: '/admin/analytics/server-distribution',
    method: 'get'
  })
}