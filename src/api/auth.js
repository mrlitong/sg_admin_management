import request from '../utils/request'

// 登录 - 使用新的管理员登录接口
export function login(data) {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 获取当前用户信息
export function getCurrentUser() {
  return request({
    url: '/me',
    method: 'get'
  })
}

// 刷新token
export function refreshToken() {
  return request({
    url: '/refresh',
    method: 'post'
  })
}

// 客服登录
export function csLogin(data) {
  return request({
    url: '/cs_login',
    method: 'post',
    data
  })
}