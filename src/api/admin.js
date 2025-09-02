import request from '../utils/request'

// 获取管理员列表
export function getAdminList() {
  return request({
    url: '/admin/admins',
    method: 'get'
  })
}

// 创建管理员
export function createAdmin(data) {
  return request({
    url: '/admin/admins',
    method: 'post',
    data
  })
}

// 修改密码
export function changePassword(id, data) {
  return request({
    url: `/admin/admins/${id}/password`,
    method: 'put',
    data
  })
}

// 更新管理员状态
export function updateAdminStatus(id, data) {
  return request({
    url: `/admin/admins/${id}/status`,
    method: 'put',
    data
  })
}

// 删除管理员
export function deleteAdmin(id) {
  return request({
    url: `/admin/admins/${id}`,
    method: 'delete'
  })
}