# 用户数据管理系统 - 前端

## 项目介绍
这是用户数据管理系统的前端部分，使用 Vue 3 + Vite + Element Plus 构建。

## 技术栈
- Vue 3 - 前端框架
- Vite - 构建工具
- Element Plus - UI组件库
- Vue Router - 路由管理
- Pinia - 状态管理
- Axios - HTTP请求

## 功能特性
- 管理员登录认证
- 用户数据管理（增删改查）
- 高级搜索和筛选
- 数据导出功能
- 管理员账户管理
- 响应式设计

## 开发环境要求
- Node.js 16+
- npm 7+

## 安装和运行

### 安装依赖
```bash
cd admin_fe
npm install
```

### 开发环境运行
```bash
npm run dev
```
默认访问地址：http://localhost:5173

### 生产环境构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 环境配置
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

主要配置项：
- `VITE_API_BASE_URL` - API基础地址

## 项目结构
```
admin_fe/
├── src/
│   ├── api/          # API接口
│   ├── components/   # 公共组件
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia状态管理
│   ├── utils/        # 工具函数
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   └── main.js       # 入口文件
├── public/           # 静态资源
├── .env.development  # 开发环境配置
├── .env.production   # 生产环境配置
└── package.json      # 项目配置
```

## 注意事项
1. 开发时需要先启动后端服务
2. 默认管理员账号密码会在后端初始化时创建
3. 生产环境部署时需要配置正确的API地址