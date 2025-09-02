# API 调用规范

## 重要提示 ⚠️

本项目已在 `request.js` 中配置了 `baseURL`，**不要在 API 路径中重复添加 `/api` 前缀**！

## 正确用法

```javascript
// ✅ 正确
await request.post('/validate_account', data)
await request.get('/user_search', params)

// ❌ 错误 - 会导致路径变成 /api/api/xxx
await request.post('/api/validate_account', data)
await request.get('/api/user_search', params)
```

## baseURL 配置说明

- 开发环境：`/api` (通过 vite 代理转发)
- 生产环境：`http://218.78.128.120:8567/api`

配置文件位置：`src/config/index.js`

## 后端路由对应关系

| 前端调用路径 | 实际请求路径 | 后端路由定义 |
|------------|------------|------------|
| `/validate_account` | `{baseURL}/validate_account` | `@router.post("/validate_account")` |
| `/user_search` | `{baseURL}/user_search` | `@router.post("/user_search")` |
| `/admin/users/list` | `{baseURL}/admin/users/list` | 管理后台用户列表 |

## 新增 API 开发流程

1. 后端在对应的 router 文件中添加路由（已自动包含 `/api` 前缀）
2. 前端直接使用路径，**不要加 `/api` 前缀**
3. 如有疑问，查看浏览器 Network 面板确认实际请求路径