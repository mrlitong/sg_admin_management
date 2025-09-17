# 主题样式开发规范

## 📖 概述

本项目实现了完整的亮色/暗色主题切换系统，所有新增的页面和组件都能自动支持主题切换，**无需手动实现**。只需遵循本文档的规范，使用预定义的 CSS 变量即可。

## 🏗 主题系统架构

### 核心组成
1. **主题 Store** (`src/stores/theme.js`) - 管理主题状态和切换逻辑
2. **CSS 变量定义** (`src/styles/theme.css`) - 定义所有主题相关的 CSS 变量
3. **自动应用机制** - 通过在 HTML 根元素添加 `dark` 类来切换主题

### 工作原理
```javascript
// 主题切换时的 DOM 变化
<html>           // 亮色模式（默认）
<html class="dark">  // 暗色模式
```

当切换到暗色模式时，`html.dark` 选择器下定义的 CSS 变量会覆盖默认值，实现主题切换。

## 🎨 CSS 变量参考

### 颜色系统

#### 主色调
| 变量名 | 用途 | 亮色值 | 暗色值 |
|--------|------|--------|--------|
| `--primary-color` | 主题色/品牌色 | #409eff | #409eff |
| `--success-color` | 成功状态 | #67c23a | #67c23a |
| `--warning-color` | 警告状态 | #e6a23c | #e6a23c |
| `--danger-color` | 危险/错误状态 | #f56c6c | #f56c6c |
| `--info-color` | 信息提示 | #909399 | #909399 |

#### 背景色
| 变量名 | 用途 | 亮色值 | 暗色值 |
|--------|------|--------|--------|
| `--bg-color` | 主要背景色 | #ffffff | #141414 |
| `--bg-color-page` | 页面背景色 | #f5f7fa | #0a0a0a |
| `--bg-color-overlay` | 弹层/覆盖背景 | #ffffff | #1d1e1f |
| `--bg-color-secondary` | 次要背景色 | #f5f7fa | #232324 |

#### 文字颜色
| 变量名 | 用途 | 亮色值 | 暗色值 |
|--------|------|--------|--------|
| `--text-color-primary` | 主要文字 | #303133 | #E5EAF3 |
| `--text-color-regular` | 常规文字 | #606266 | #CFD3DC |
| `--text-color-secondary` | 次要文字 | #909399 | #A3A6AD |
| `--text-color-placeholder` | 占位符文字 | #c0c4cc | #8D9095 |

#### 边框颜色
| 变量名 | 用途 | 亮色值 | 暗色值 |
|--------|------|--------|--------|
| `--border-color-base` | 基础边框 | #dcdfe6 | #4C4D4F |
| `--border-color-light` | 浅色边框 | #e4e7ed | #414243 |
| `--border-color-lighter` | 更浅边框 | #ebeef5 | #363637 |
| `--border-color-extra-light` | 极浅边框 | #f2f6fc | #2B2B2C |

#### 其他
| 变量名 | 用途 |
|--------|------|
| `--box-shadow-base` | 基础阴影 |
| `--box-shadow-light` | 浅阴影 |
| `--card-bg` | 卡片背景 |
| `--input-bg` | 输入框背景 |
| `--table-header-bg` | 表格头背景 |

## ✅ 开发规范

### 必须遵循的规则

#### 1. 使用 CSS 变量，禁止硬编码颜色

```css
/* ✅ 正确 */
.my-component {
  background-color: var(--bg-color);
  color: var(--text-color-primary);
  border: 1px solid var(--border-color-base);
}

/* ❌ 错误 */
.my-component {
  background-color: #ffffff;
  color: #333333;
  border: 1px solid #dcdfe6;
}
```

#### 2. 特殊颜色处理

如果确实需要使用特定颜色（如品牌特定颜色），需要同时定义亮色和暗色版本：

```css
/* 定义主题相关的特殊颜色 */
.special-component {
  /* 亮色模式 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 暗色模式覆盖 */
html.dark .special-component {
  background: linear-gradient(135deg, #434190 0%, #5a3880 100%);
}
```

#### 3. 使用语义化变量

选择最符合用途的变量，而不是仅凭颜色相似：

```css
/* ✅ 正确 - 使用语义化变量 */
.card {
  background: var(--card-bg);  /* 卡片背景 */
}

/* ❌ 错误 - 仅凭颜色选择 */
.card {
  background: var(--bg-color);  /* 虽然颜色可能相同，但语义不准确 */
}
```

## 💻 实战示例

### 创建新组件

```vue
<template>
  <div class="my-component">
    <div class="header">
      <h2 class="title">{{ title }}</h2>
      <span class="subtitle">{{ subtitle }}</span>
    </div>
    <div class="content">
      <p class="description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.my-component {
  /* 容器样式 - 自动适配主题 */
  background: var(--card-bg);
  border: 1px solid var(--border-color-base);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--box-shadow-base);
}

.header {
  border-bottom: 1px solid var(--border-color-lighter);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.title {
  color: var(--text-color-primary);
  font-size: 18px;
  margin: 0;
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.description {
  color: var(--text-color-regular);
  line-height: 1.6;
}

/* 悬停效果 */
.my-component:hover {
  box-shadow: var(--box-shadow-light);
}
</style>
```

### 创建新页面

```vue
<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <el-card class="page-header">
      <h1>页面标题</h1>
    </el-card>

    <!-- 主要内容 -->
    <el-card class="main-content">
      <!-- 内容区域 -->
    </el-card>
  </div>
</template>

<style scoped>
.page-container {
  /* 页面容器使用页面背景色 */
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  /* 标题使用主要文字颜色 */
  color: var(--text-color-primary);
  margin: 0;
}

.main-content {
  /* Element Plus 组件会自动适配主题 */
}
</style>
```

### 表单输入组件

```vue
<template>
  <div class="custom-input">
    <label class="input-label">{{ label }}</label>
    <input
      class="input-field"
      v-model="value"
      :placeholder="placeholder"
    />
    <span class="input-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.custom-input {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  color: var(--text-color-regular);
  font-size: 14px;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  background: var(--input-bg);
  color: var(--text-color-primary);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-field::placeholder {
  color: var(--text-color-placeholder);
}

.input-field:hover {
  border-color: var(--input-hover-border);
}

.input-field:focus {
  outline: none;
  border-color: var(--input-focus-border);
}

.input-hint {
  display: block;
  color: var(--text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}
</style>
```

## 🔧 在组件中使用主题

### 获取当前主题状态

```vue
<script setup>
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 判断是否暗色模式
if (themeStore.isDark) {
  console.log('当前是暗色模式')
}

// 切换主题
const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 设置特定主题
const setLightTheme = () => {
  themeStore.setTheme('light')
}
</script>

<template>
  <div>
    <button @click="toggleTheme">
      {{ themeStore.isDark ? '切换到亮色' : '切换到暗色' }}
    </button>
  </div>
</template>
```

### 条件渲染不同主题内容

```vue
<template>
  <div class="theme-aware-component">
    <!-- 根据主题显示不同图标 -->
    <el-icon v-if="themeStore.isDark">
      <Moon />
    </el-icon>
    <el-icon v-else>
      <Sunny />
    </el-icon>

    <!-- 根据主题使用不同的类名 -->
    <div :class="themeStore.isDark ? 'dark-style' : 'light-style'">
      内容区域
    </div>
  </div>
</template>
```

## 🎯 最佳实践

### 1. 组件库集成
- Element Plus 组件已自动适配主题系统
- 使用 Element Plus 组件时无需额外配置
- 自定义组件样式覆盖时仍需使用 CSS 变量

### 2. 图片和图标
- SVG 图标：使用 `currentColor` 继承文字颜色
- 图片：考虑提供亮色/暗色两个版本
- 背景图：使用 CSS 根据主题切换

```css
/* SVG 图标自适应 */
.icon {
  color: var(--text-color-primary);
}

/* 背景图切换 */
.hero-section {
  background-image: url('/images/hero-light.jpg');
}

html.dark .hero-section {
  background-image: url('/images/hero-dark.jpg');
}
```

### 3. 第三方组件
如果使用第三方组件库，需要额外配置主题适配：

```css
/* 为第三方组件添加主题支持 */
html.dark .third-party-component {
  background: var(--bg-color);
  color: var(--text-color-primary);
}
```

## ❓ 常见问题

### Q: 某个颜色在 CSS 变量中找不到怎么办？
A: 首先检查是否有语义相近的变量可用。如果确实需要新颜色，可以：
1. 在 `theme.css` 中添加新的 CSS 变量
2. 或在组件中定义局部的主题相关样式

### Q: Element Plus 组件样式没有切换？
A: 检查：
1. 是否正确引入了 `theme.css`
2. HTML 根元素是否有 `dark` 类
3. 是否有自定义样式覆盖了主题样式

### Q: 如何测试主题切换？
A:
1. 使用浏览器开发工具，手动给 `<html>` 添加/移除 `dark` 类
2. 使用页面上的主题切换按钮
3. 检查所有颜色是否正确切换

### Q: 性能影响如何？
A:
- CSS 变量切换性能很好，几乎无感知
- 过渡动画已配置为 0.3s，可根据需要调整
- 主题状态保存在 localStorage，刷新页面会保持

## 📝 检查清单

开发新组件/页面时，请确认：

- [ ] 所有颜色都使用了 CSS 变量
- [ ] 没有硬编码的颜色值（除非有特殊需求）
- [ ] 在亮色和暗色模式下都测试过
- [ ] 文字在两种主题下都清晰可读
- [ ] 边框和阴影效果都正常显示
- [ ] 交互状态（hover、active、focus）都有合适的样式
- [ ] Element Plus 组件正常切换主题

## 🔍 调试技巧

### 快速切换主题测试
```javascript
// 在浏览器控制台执行
document.documentElement.classList.toggle('dark')
```

### 查看当前使用的 CSS 变量值
```javascript
// 获取某个 CSS 变量的实际值
getComputedStyle(document.documentElement).getPropertyValue('--bg-color')
```

### 批量检查硬编码颜色
使用 VSCode 搜索正则表达式：
```
#[0-9a-fA-F]{3,6}|rgb|rgba
```

## 📚 相关文件

- **主题 Store**: `src/stores/theme.js`
- **CSS 变量定义**: `src/styles/theme.css`
- **应用入口**: `src/App.vue`
- **示例页面**: `src/views/` 目录下的所有页面

---

遵循以上规范，你的组件和页面将自动支持主题切换，无需任何额外工作！如有疑问，请参考现有组件的实现或联系项目维护者。