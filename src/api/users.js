import request from '../utils/request'

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

// 获取默认用户列表（每个game_platform 3条数据）
export function getDefaultUserList() {
  return request({
    url: '/admin/users/default',
    method: 'get'
  })
}

// 获取用户详情
export function getUserDetail(account) {
  return request({
    url: `/admin/users/${account}`,
    method: 'get'
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/admin/users',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(account, data) {
  return request({
    url: `/admin/users/${account}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(account) {
  return request({
    url: `/admin/users/${account}`,
    method: 'delete'
  })
}

// 批量删除用户
export function batchDeleteUsers(accounts) {
  return request({
    url: '/admin/users/batch/delete',
    method: 'post',
    data: { accounts }
  })
}

// 用户充值
export function rechargeUser(account, data) {
  return request({
    url: `/admin/users/${account}/recharge`,
    method: 'put',
    data
  })
}

// 会员转移
export function transferMembership(data) {
  return request({
    url: '/admin/users/transfer-membership',
    method: 'post',
    data
  })
}

