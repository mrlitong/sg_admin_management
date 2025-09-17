# 三国小助手客服管理后台 - API 参考文档

## 概述

本文档详细描述了三国小助手客服管理后台系统的所有API接口，包括HTTP REST API和WebSocket API。

### 基础信息

- **API Base URL**: `http://218.78.128.120:8567/api`
  - 开发环境: `http://218.78.128.120:8567/api`
  - 生产环境: `http://218.78.128.120:8567/api`
- **WebSocket URL**: `ws://218.78.128.120:8567/api/ws/chat`
- **浏览器服务API**: `http://218.78.128.120:8888`

### 认证方式

所有需要认证的接口都使用 Bearer Token 方式：

```
Authorization: Bearer <access_token>
```

### 通用响应格式

#### 成功响应
```json
{
  "code": 200,
  "msg": "success",
  "data": {},
  "total": 100  // 仅分页接口有此字段
}
```

#### 错误响应
```json
{
  "code": 400|401|403|404|500,
  "msg": "错误信息",
  "detail": "详细错误描述"
}
```

### 常见状态码

- `0`: 操作成功（实际使用）
- `200`: 操作成功（HTTP状态码）
- `400`: 请求参数错误
- `401`: 未认证或token无效
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

**注意**：在实际实现中，成功响应的 `code` 字段值为 `0`，而不是文档中描述的 `200`。

---

## HTTP API 接口

### 1. 认证模块

#### 1.1 管理员登录

**接口路径**: `POST /admin/login`

**接口描述**: 管理员账号登录系统

**请求参数**:
```json
{
  "username": "string",  // 必选，用户名
  "password": "string"   // 必选，密码
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "access_token": "string",    // JWT token
  "user_info": {
    "id": "integer",
    "username": "string",
    "is_super": "boolean",     // 是否超级管理员
    "is_admin": "boolean",     // 是否管理员
    "user_type": "string",     // 用户类型
    "created_at": "string",    // 创建时间
    "last_login": "string"     // 最后登录时间
  }
}
```

**请求示例**:
```bash
curl -X POST http://218.78.128.120:8567/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

#### 1.2 退出登录

**接口路径**: `POST /logout`

**接口描述**: 用户退出登录

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "登出成功"
}
```

#### 1.3 获取当前用户信息

**接口路径**: `GET /me`

**接口描述**: 获取当前登录用户的详细信息

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": "integer",
    "username": "string",
    "is_super": "boolean",
    "is_admin": "boolean",
    "user_type": "string",
    "created_at": "string",
    "last_login": "string"
  }
}
```

#### 1.4 刷新Token

**接口路径**: `POST /refresh`

**接口描述**: 刷新访问令牌

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "access_token": "string"
}
```

#### 1.5 客服登录

**接口路径**: `POST /cs_login`

**接口描述**: 客服专用登录接口

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应参数**: 同管理员登录

---

### 2. 用户管理模块

#### 2.1 获取用户列表

**接口路径**: `GET /admin/users`

**接口描述**: 获取用户列表，支持分页和筛选

**请求参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |
| keyword | string | 否 | 搜索关键词 |
| account | string | 否 | 用户账号 |
| real_account | string | 否 | 真实账号 |
| main_account | string | 否 | 主账号 |
| contact | string | 否 | 联系方式 |
| server_name | string | 否 | 服务器名称 |
| server_info | string | 否 | 服务器信息 |
| membership_level_list | string | 否 | 会员级别列表（逗号分隔） |
| membership_pay_money_min | number | 否 | 最小充值金额 |
| membership_pay_money_max | number | 否 | 最大充值金额 |
| membership_expire_date_start | string | 否 | 会员到期开始日期 |
| membership_expire_date_end | string | 否 | 会员到期结束日期 |
| game_platform_list | string | 否 | 游戏平台列表（逗号分隔） |
| auxiliary_online | string | 否 | 辅助在线状态 |
| is_open | string | 否 | 是否开启 |
| register_date_start | string | 否 | 注册开始日期 |
| register_date_end | string | 否 | 注册结束日期 |
| remarks | string | 否 | 备注 |
| sort_by | string | 否 | 排序字段 |
| sort_order | string | 否 | 排序方向（asc/desc） |

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "account": "string",
      "real_account": "string",
      "main_account": "string",
      "contact": "string",
      "server_name": "string",
      "server_info": "string",
      "membership_level": "integer",
      "membership_pay_money": "number",
      "membership_expire_date": "string",
      "game_platform": "integer",
      "auxiliary_online": "integer",
      "is_open": "integer",
      "register_date": "string",
      "remarks": "string"
    }
  ],
  "total": "integer"
}
```

#### 2.2 获取默认用户列表

**接口路径**: `GET /admin/users/default`

**接口描述**: 获取每个游戏平台的默认示例用户（每个平台3条）

**请求参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| sort_by | string | 否 | 排序字段 |
| sort_order | string | 否 | 排序方向（asc/desc） |

**响应参数**: 同用户列表

#### 2.3 获取用户详情

**接口路径**: `GET /admin/users/{account}`

**接口描述**: 根据账号获取用户详细信息

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| account | string | 是 | 用户账号 |

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "account": "string",
    "real_account": "string",
    "main_account": "string",
    "contact": "string",
    "server_name": "string",
    "server_info": "string",
    "membership_level": "integer",
    "membership_pay_money": "number",
    "membership_expire_date": "string",
    "game_platform": "integer",
    "auxiliary_online": "integer",
    "is_open": "integer",
    "register_date": "string",
    "remarks": "string",
    "websocket_url": "string",
    "game_web_url": "string",
    "user_login_data": "string"
  }
}
```

#### 2.4 创建用户

**接口路径**: `POST /admin/users`

**接口描述**: 创建新用户

**请求参数**:
```json
{
  "account": "string",           // 必选，用户账号
  "real_account": "string",      // 可选，真实账号
  "main_account": "string",      // 可选，主账号
  "contact": "string",           // 可选，联系方式
  "server_name": "string",       // 可选，服务器名称
  "server_info": "string",       // 可选，服务器信息
  "membership_level": "integer", // 可选，会员级别
  "membership_pay_money": "number", // 可选，充值金额
  "membership_expire_date": "string", // 可选，会员到期日期
  "game_platform": "integer",   // 可选，游戏平台
  "auxiliary_online": "integer", // 可选，辅助在线状态
  "is_open": "integer",         // 可选，是否开启
  "remarks": "string",          // 可选，备注
  "websocket_url": "string",    // 可选，WebSocket地址
  "game_web_url": "string",     // 可选，游戏网页地址
  "user_login_data": "string"   // 可选，用户登录数据
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "用户创建成功",
  "data": {
    "account": "string"
  }
}
```

#### 2.5 更新用户

**接口路径**: `PUT /admin/users/{account}`

**接口描述**: 更新用户信息

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| account | string | 是 | 用户账号 |

**请求参数**: 同创建用户，所有字段均为可选

**响应参数**:
```json
{
  "code": 200,
  "msg": "用户更新成功"
}
```

#### 2.6 删除用户

**接口路径**: `DELETE /admin/users/{account}`

**接口描述**: 删除指定用户

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| account | string | 是 | 用户账号 |

**响应参数**:
```json
{
  "code": 200,
  "msg": "用户删除成功"
}
```

#### 2.7 批量删除用户

**接口路径**: `POST /admin/users/batch/delete`

**接口描述**: 批量删除多个用户

**请求参数**:
```json
{
  "accounts": ["string"]  // 必选，用户账号数组
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "批量删除成功",
  "data": {
    "deleted_count": "integer"
  }
}
```

#### 2.8 用户充值

**接口路径**: `PUT /admin/users/{account}/recharge`

**接口描述**: 为用户充值或赠送会员时长

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| account | string | 是 | 用户账号 |

**请求参数**:
```json
{
  "amount": "number",           // 必选，充值金额
  "duration": "integer",        // 必选，时长（天数）
  "service_agent": "string",    // 必选，服务客服
  "remark": "string",          // 可选，备注
  "is_gift": "boolean",        // 可选，是否赠送
  "membership_level": "integer" // 可选，会员级别
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "充值成功",
  "data": {
    "account": "string",
    "amount": "number",
    "duration": "integer",
    "new_expire_date": "string"
  }
}
```

#### 2.9 会员转移

**接口路径**: `POST /admin/users/transfer-membership`

**接口描述**: 将一个账号的会员权益转移到另一个账号

**请求参数**:
```json
{
  "source_account": "string",  // 必选，源账号
  "target_account": "string"   // 必选，目标账号
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "会员转移成功",
  "data": {
    "source_account": "string",
    "target_account": "string",
    "transferred_days": "integer",
    "transferred_amount": "number"
  }
}
```

---

### 3. 管理员管理模块

#### 3.1 获取管理员列表

**接口路径**: `GET /admin/admins`

**接口描述**: 获取所有管理员账号列表（仅超级管理员可访问）

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "integer",
      "username": "string",
      "is_super": "boolean",
      "is_admin": "boolean",
      "user_type": "string",
      "status": "string",
      "created_at": "string",
      "last_login": "string"
    }
  ]
}
```

#### 3.2 创建管理员

**接口路径**: `POST /admin/admins`

**接口描述**: 创建新的管理员账号

**请求参数**:
```json
{
  "username": "string",     // 必选，用户名
  "password": "string",     // 必选，密码
  "is_super": "boolean",    // 可选，是否超级管理员
  "user_type": "string"     // 可选，用户类型
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "管理员创建成功",
  "data": {
    "id": "integer",
    "username": "string"
  }
}
```

#### 3.3 修改管理员密码

**接口路径**: `PUT /admin/admins/{id}/password`

**接口描述**: 修改指定管理员的密码

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 管理员ID |

**请求参数**:
```json
{
  "new_password": "string"  // 必选，新密码
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "密码修改成功"
}
```

#### 3.4 更新管理员状态

**接口路径**: `PUT /admin/admins/{id}/status`

**接口描述**: 更新管理员账号状态（启用/禁用）

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 管理员ID |

**请求参数**:
```json
{
  "status": "string"  // 必选，状态（active/inactive）
}
```

**响应参数**:
```json
{
  "code": 200,
  "msg": "状态更新成功"
}
```

#### 3.5 删除管理员

**接口路径**: `DELETE /admin/admins/{id}`

**接口描述**: 删除指定管理员账号

**路径参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 管理员ID |

**响应参数**:
```json
{
  "code": 200,
  "msg": "管理员删除成功"
}
```

---

### 4. 数据分析模块

#### 4.1 获取数据分析总览

**接口路径**: `GET /admin/analytics/overview`

**接口描述**: 获取系统数据概览统计

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total_users": "integer",           // 总用户数
    "active_users": "integer",          // 活跃用户数
    "total_revenue": "number",          // 总收入
    "monthly_revenue": "number",        // 月收入
    "new_users_today": "integer",       // 今日新增用户
    "new_users_this_month": "integer",  // 本月新增用户
    "expired_users_today": "integer",   // 今日到期用户
    "expired_users_this_month": "integer" // 本月到期用户
  }
}
```

#### 4.2 获取趋势数据

**接口路径**: `GET /admin/analytics/trends`

**接口描述**: 获取指定天数的趋势分析数据

**请求参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| days | integer | 否 | 天数，默认30天 |

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "dates": ["string"],           // 日期数组
    "new_users": ["integer"],      // 每日新增用户
    "revenue": ["number"],         // 每日收入
    "active_users": ["integer"]    // 每日活跃用户
  }
}
```

#### 4.3 获取高价值用户

**接口路径**: `GET /admin/analytics/high-value-users`

**接口描述**: 获取高价值用户列表

**请求参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| limit | integer | 否 | 返回数量，默认20 |

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "account": "string",
      "total_payment": "number",
      "membership_level": "integer",
      "register_date": "string",
      "last_payment_date": "string"
    }
  ]
}
```

#### 4.4 获取服务器分布

**接口路径**: `GET /admin/analytics/server-distribution`

**接口描述**: 获取用户在各服务器的分布统计

**请求参数**: 无

**响应参数**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "server_name": "string",
      "user_count": "integer",
      "percentage": "number"
    }
  ]
}
```

---

### 5. 聊天系统 HTTP API

> **注意**: 聊天系统采用 HTTP + WebSocket 混合架构，当 WebSocket 不可用时会降级使用 HTTP API

#### 5.1 用户端聊天 API

##### 5.1.1 创建聊天会话

**接口路径**: `POST /chat/create_session`

**接口描述**: 用户创建新的聊天会话

**请求参数**:
```json
{
  "user_account": "string"  // 必选，用户账号
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "session_id": "string",
    "created_at": "string"
  }
}
```

##### 5.1.2 发送消息（HTTP备用）

**接口路径**: `POST /chat/send_message`

**接口描述**: 用户通过HTTP发送消息（WebSocket不可用时的备用方案）

**请求参数**:
```json
{
  "session_id": "string",
  "content": "string",
  "content_type": "string"  // 可选，默认"text"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message_id": "string",
    "sent_at": "string"
  }
}
```

##### 5.1.3 获取聊天历史

**接口路径**: `POST /chat/get_history`

**接口描述**: 获取指定会话的聊天历史

**请求参数**:
```json
{
  "session_id": "string",
  "page": "integer",
  "limit": "integer"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "messages": [
      {
        "message_id": "string",
        "sender_account": "string",
        "content": "string",
        "content_type": "string",
        "sent_at": "string",
        "is_read": "boolean"
      }
    ],
    "total": "integer"
  }
}
```

##### 5.1.4 获取未读消息数量

**接口路径**: `POST /chat/unread_count`

**接口描述**: 获取用户的未读消息数量

**请求参数**:
```json
{
  "user_account": "string"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "unread_count": "integer"
  }
}
```

#### 5.2 客服端 API

##### 5.2.1 客服发送消息（HTTP备用）

**接口路径**: `POST /cs/send_message`

**接口描述**: 客服通过HTTP发送消息（WebSocket不可用时的备用方案）

**请求参数**:
```json
{
  "session_id": "string",
  "content": "string",
  "content_type": "string"
}
```

**响应参数**: 同用户发送消息

##### 5.2.2 获取会话消息历史

**接口路径**: `POST /cs/get_chat_history`

**接口描述**: 客服获取指定会话的历史消息

**请求参数**:
```json
{
  "session_id": "string",
  "page": "integer",
  "limit": "integer"
}
```

**响应参数**: 同用户获取聊天历史

##### 5.2.3 获取用户会员信息

**接口路径**: `POST /chat/get_user_membership_info`

**接口描述**: 获取用户的会员详细信息

**请求参数**:
```json
{
  "account": "string"  // 必选，用户账号
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "account": "string",
    "membership_level": "integer",
    "membership_expire_date": "string",
    "membership_pay_money": "number"
  }
}
```

##### 5.2.4 接待等待中的会话

**接口路径**: `POST /cs/accept_session`

**接口描述**: 客服接待等待中的会话

**请求参数**:
```json
{
  "session_id": "string",
  "cs_account": "string"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "会话接待成功",
  "data": {
    "session_id": "string",
    "status": "active"
  }
}
```

##### 5.2.5 客服端用户充值

**接口路径**: `POST /cs_recharge`

**接口描述**: 客服端为用户进行充值操作

**请求参数**:
```json
{
  "account": "string",
  "amount": "number",
  "duration": "integer",
  "service_agent": "string",
  "remark": "string"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "充值成功",
  "data": {
    "account": "string",
    "new_expire_date": "string"
  }
}
```

---

### 6. 浏览器服务模块

> **注意**: 浏览器服务模块使用独立的API地址：`http://218.78.128.120:8888`

#### 5.1 获取健康状态

**接口路径**: `GET /health`

**接口描述**: 获取浏览器服务的健康状态

**请求参数**: 无

**响应参数**:
```json
{
  "status": "string",      // 服务状态
  "uptime": "number",      // 运行时间
  "version": "string",     // 版本信息
  "timestamp": "string"    // 时间戳
}
```

#### 5.2 获取池状态详情

**接口路径**: `GET /pool/status`

**接口描述**: 获取浏览器池的详细状态

**请求参数**: 无

**响应参数**:
```json
{
  "total_browsers": "integer",     // 总浏览器数
  "active_browsers": "integer",    // 活跃浏览器数
  "idle_browsers": "integer",      // 空闲浏览器数
  "failed_browsers": "integer",    // 失败浏览器数
  "pool_health": "string"          // 池健康状态
}
```

#### 5.3 获取Context使用统计

**接口路径**: `GET /pool/usage`

**接口描述**: 获取浏览器Context的使用统计

**请求参数**: 无

**响应参数**:
```json
{
  "total_contexts": "integer",     // 总Context数
  "used_contexts": "integer",      // 已使用Context数
  "available_contexts": "integer", // 可用Context数
  "usage_percentage": "number"     // 使用率百分比
}
```

---

## WebSocket API

### 连接地址

**WebSocket URL**: `ws://218.78.128.120:8567/api/ws/chat`

**连接参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| token | string | 是 | 认证token |
| user_type | string | 是 | 用户类型（user/customer_service） |

**连接示例**:
```javascript
const wsUrl = `ws://218.78.128.120:8567/api/ws/chat?token=${token}&user_type=customer_service`
const ws = new WebSocket(wsUrl)
```

### 消息格式

#### 通用消息格式
```json
{
  "type": "string",    // 消息类型
  "data": {}          // 消息数据
}
```

### 服务端消息类型

#### 1. 连接确认
```json
{
  "type": "connected",
  "data": {
    "user_id": "string",
    "user_type": "string",
    "connected_at": "string"
  }
}
```

#### 2. 新消息通知
```json
{
  "type": "new_message",
  "data": {
    "message_id": "string",
    "session_id": "string",
    "sender_account": "string",
    "content": "string",
    "content_type": "string",
    "sent_at": "string"
  }
}
```

#### 3. 消息发送确认
```json
{
  "type": "message_sent",
  "data": {
    "message_id": "string",
    "session_id": "string",
    "sent_at": "string"
  }
}
```

#### 4. 错误消息
```json
{
  "type": "error",
  "data": {
    "error_code": "string",
    "error_message": "string"
  }
}
```

#### 5. 心跳响应
```json
{
  "type": "pong",
  "data": {}
}
```

#### 6. 会话列表更新
```json
{
  "type": "session_list_updated",
  "data": {
    "sessions": [
      {
        "session_id": "string",
        "user_account": "string",
        "cs_account": "string",
        "status": "string",
        "unread_count": "integer",
        "last_message": "string",
        "last_message_time": "string"
      }
    ]
  }
}
```

#### 7. 未读数量更新
```json
{
  "type": "unread_count_updated",
  "data": {
    "session_id": "string",
    "unread_count": "integer"
  }
}
```

#### 8. 新会话创建
```json
{
  "type": "new_session_created",
  "data": {
    "session_id": "string",
    "user_account": "string",
    "created_at": "string"
  }
}
```

#### 9. 会话状态变更
```json
{
  "type": "session_status_changed",
  "data": {
    "session_id": "string",
    "old_status": "string",
    "new_status": "string",
    "changed_at": "string"
  }
}
```

#### 10. 会话列表响应
```json
{
  "type": "sessions_response",
  "data": {
    "sessions": [...],
    "total": "integer",
    "page": "integer"
  }
}
```

#### 11. 会话数量响应
```json
{
  "type": "sessions_count_response",
  "data": {
    "total_sessions": "integer",
    "active_sessions": "integer",
    "pending_sessions": "integer"
  }
}
```

#### 12. 聊天历史响应
```json
{
  "type": "chat_history_response",
  "data": {
    "session_id": "string",
    "messages": [
      {
        "message_id": "string",
        "sender_account": "string",
        "content": "string",
        "content_type": "string",
        "sent_at": "string",
        "is_read": "boolean"
      }
    ],
    "total": "integer",
    "page": "integer"
  }
}
```

#### 13. 未读数同步
```json
{
  "type": "unread_counts_synced",
  "data": {
    "sessions": [
      {
        "session_id": "string",
        "unread_count": "integer"
      }
    ]
  }
}
```

#### 14. 绝对值未读数更新
```json
{
  "type": "unread_count_absolute_update",
  "data": {
    "session_id": "string",
    "unread_count": "integer"
  }
}
```

#### 15. 会话已读成功
```json
{
  "type": "session_read_success",
  "data": {
    "session_id": "string"
  }
}
```

#### 16. 会话重要性更新成功
```json
{
  "type": "session_importance_updated",
  "data": {
    "session_id": "string",
    "is_important": "boolean"
  }
}
```

#### 17. 会话结束成功
```json
{
  "type": "session_ended",
  "data": {
    "session_id": "string",
    "ended_at": "string"
  }
}
```

#### 18. 聊天记录清理成功
```json
{
  "type": "chat_history_cleared",
  "data": {
    "session_id": "string"
  }
}
```

#### 19. 未读数响应
```json
{
  "type": "unread_count_response",
  "data": {
    "total_unread": "integer",
    "sessions": [
      {
        "session_id": "string",
        "unread_count": "integer"
      }
    ]
  }
}
```

#### 20. 未读数重新计算完成
```json
{
  "type": "unread_count_recalculated",
  "data": {
    "session_id": "string",
    "unread_count": "integer"
  }
}
```

#### 21. 客服状态更新成功
```json
{
  "type": "cs_status_update_success",
  "data": {
    "status": "string"
  }
}
```

#### 22. 客服状态广播更新
```json
{
  "type": "cs_status_updated",
  "data": {
    "cs_account": "string",
    "status": "string",
    "updated_at": "string"
  }
}
```

#### 23. 客服状态响应
```json
{
  "type": "cs_status_response",
  "data": {
    "status": "string",
    "last_active": "string"
  }
}
```

### 客户端消息类型

#### 1. 发送消息
```json
{
  "type": "message",
  "data": {
    "session_id": "string",
    "content": "string",
    "content_type": "string"  // 默认为 "text"
  }
}
```

#### 2. 心跳请求
```json
{
  "type": "ping",
  "data": {}
}
```

#### 3. 获取会话列表
```json
{
  "type": "get_sessions",
  "data": {
    "page": "integer",
    "limit": "integer"
  }
}
```

#### 4. 标记会话已读
```json
{
  "type": "mark_session_read",
  "data": {
    "session_id": "string"
  }
}
```

#### 5. 设置会话重要性
```json
{
  "type": "set_session_importance",
  "data": {
    "session_id": "string",
    "is_important": "boolean"
  }
}
```

#### 6. 结束会话
```json
{
  "type": "end_session",
  "data": {
    "session_id": "string"
  }
}
```

#### 7. 清理聊天记录
```json
{
  "type": "clear_chat_history",
  "data": {
    "session_id": "string"
  }
}
```

#### 8. 更新客服状态
```json
{
  "type": "update_cs_status",
  "data": {
    "status": "string"  // online/busy/offline
  }
}
```

#### 9. 获取聊天历史
```json
{
  "type": "get_chat_history",
  "data": {
    "session_id": "string",
    "page": "integer",
    "limit": "integer"
  }
}
```

#### 10. 标记会话重要性
```json
{
  "type": "mark_session_important",
  "data": {
    "session_id": "string",
    "is_important": "boolean"
  }
}
```

#### 11. 获取会话总数
```json
{
  "type": "get_sessions_count",
  "data": {}
}
```

### WebSocket 连接状态

#### 连接状态枚举
- `CONNECTING`: 正在连接
- `CONNECTED`: 已连接
- `DISCONNECTING`: 正在断开
- `DISCONNECTED`: 已断开
- `UNKNOWN`: 未知状态

#### 关闭码说明
- `1000`: 正常关闭
- `1001`: 页面离开
- `1006`: 异常断开
- `4001`: 认证失败
- `4000-4999`: 客户端错误

### 消息队列系统

系统实现了完整的消息队列机制，支持：
- **消息重试**: 失败消息自动重试，最多3次
- **离线持久化**: 离线消息保存在本地存储
- **乐观UI更新**: 消息发送后立即显示，失败后回滚
- **HTTP降级**: WebSocket不可用时自动切换到HTTP API
- **状态管理**: 消息状态（pending/sending/sent/failed）实时追踪

### 心跳机制

- **心跳间隔**: 30秒
- **超时时间**: 5秒
- **自动重连**: 支持智能重连，最多尝试10次
- **网络检测**: 自动检测网络状态，网络恢复后自动重连

### 错误处理

#### 常见错误类型
- `AUTH_FAILED`: 认证失败
- `INVALID_MESSAGE`: 消息格式无效
- `SESSION_NOT_FOUND`: 会话不存在
- `PERMISSION_DENIED`: 权限不足
- `RATE_LIMIT_EXCEEDED`: 频率限制
- `SERVER_ERROR`: 服务器错误

#### 重连策略
- 指数退避算法
- 最大重连间隔：30秒
- 客户端错误延迟更长
- 网络离线时暂停重连，网络恢复后立即重连

---

## 附录

### A. 用户字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| account | string | 用户账号，主键 |
| real_account | string | 真实账号 |
| main_account | string | 主账号 |
| contact | string | 联系方式 |
| server_name | string | 服务器名称 |
| server_info | string | 服务器详细信息 |
| membership_level | integer | 会员级别（1-普通，2-VIP，3-SVIP） |
| membership_pay_money | number | 充值金额 |
| membership_expire_date | string | 会员到期日期 |
| game_platform | integer | 游戏平台（1-安卓，2-iOS，3-PC） |
| auxiliary_online | integer | 辅助在线状态（0-离线，1-在线） |
| is_open | integer | 账号状态（0-关闭，1-开启） |
| register_date | string | 注册日期 |
| remarks | string | 备注信息 |
| websocket_url | string | WebSocket连接地址 |
| game_web_url | string | 游戏网页地址 |
| user_login_data | string | 用户登录数据 |

### B. 权限级别说明

| 权限级别 | 说明 | 可访问功能 |
|---------|------|-----------|
| 超级管理员 | is_super: true | 所有功能，包括管理员管理 |
| 普通管理员 | is_admin: true, is_super: false | 用户管理（仅账号查询）、聊天、数据分析 |
| 客服 | user_type: customer_service | 聊天功能 |

### C. 游戏平台枚举

| 值 | 说明 |
|----|------|
| -1 | 未知/未设置 |
| 1 | 安卓平台 |
| 2 | iOS平台 |
| 3 | PC平台 |

### D. 会员级别说明

| 级别 | 说明 | 权益 |
|------|------|------|
| 0 | 免费用户 | 基础功能 |
| 1 | 普通会员 | 标准功能 |
| 2 | VIP会员 | 高级功能 |
| 3 | SVIP会员 | 全部功能 |

---

**最后更新**: 2024年9月17日

此API文档基于实际代码分析生成，确保与后端接口实现保持一致。如有疑问或发现不一致之处，请及时反馈。