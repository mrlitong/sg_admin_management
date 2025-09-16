<template>
  <div class="responsive-test-container">
    <h1>响应式组件测试页面</h1>

    <div class="info-card">
      <h2>当前设备信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>设备类型：</label>
          <span class="value">{{ deviceType }}</span>
        </div>
        <div class="info-item">
          <label>屏幕宽度：</label>
          <span class="value">{{ screenWidth }}px</span>
        </div>
        <div class="info-item">
          <label>屏幕高度：</label>
          <span class="value">{{ screenHeight }}px</span>
        </div>
        <div class="info-item">
          <label>断点：</label>
          <span class="value">{{ breakpoint }}</span>
        </div>
        <div class="info-item">
          <label>是否移动端：</label>
          <span class="value">{{ isMobile ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <label>是否平板：</label>
          <span class="value">{{ isTablet ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <label>是否桌面端：</label>
          <span class="value">{{ isDesktop ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <label>是否触摸设备：</label>
          <span class="value">{{ isTouchDevice ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <label>是否横屏：</label>
          <span class="value">{{ isLandscape ? '是' : '否' }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>响应式组件加载测试</h2>
      <p>以下组件会根据设备类型自动切换PC端和移动端版本：</p>

      <div class="component-list">
        <div class="component-card" v-for="component in components" :key="component.name">
          <h3>{{ component.name }}</h3>
          <p class="status">
            <span :class="['status-badge', component.status]">
              {{ component.status === 'loaded' ? '✓ 已加载' : '⏳ 加载中...' }}
            </span>
            <span class="version">{{ component.version }}</span>
          </p>
          <router-link :to="component.path" class="test-link">
            访问页面 →
          </router-link>
        </div>
      </div>
    </div>

    <div class="tips-section">
      <h2>测试提示</h2>
      <ul>
        <li>在浏览器开发者工具中切换设备模式可以测试不同设备的响应式效果</li>
        <li>调整浏览器窗口大小也可以触发响应式切换</li>
        <li>移动端断点：&lt; 768px</li>
        <li>平板端断点：768px - 1024px</li>
        <li>桌面端断点：&gt; 1024px</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResponsive } from '../utils/responsive'

const {
  screenWidth,
  screenHeight,
  isMobile,
  isTablet,
  isDesktop,
  isXs,
  isSm,
  isMd,
  isLg,
  isXl,
  isXxl,
  isTouchDevice,
  isLandscape
} = useResponsive()

// 设备类型计算
const deviceType = computed(() => {
  if (isMobile.value) return '移动设备'
  if (isTablet.value) return '平板设备'
  if (isDesktop.value) return '桌面设备'
  return '未知设备'
})

// 断点计算
const breakpoint = computed(() => {
  if (isXs.value) return 'xs (< 576px)'
  if (isSm.value) return 'sm (576px - 768px)'
  if (isMd.value) return 'md (768px - 1024px)'
  if (isLg.value) return 'lg (1024px - 1200px)'
  if (isXl.value) return 'xl (1200px - 1920px)'
  if (isXxl.value) return 'xxl (> 1920px)'
  return '未知'
})

// 组件列表
const components = ref([
  {
    name: 'UserData 用户数据',
    path: '/user-data',
    status: 'loaded',
    version: ''
  },
  {
    name: 'AnalyticsDashboard 数据分析',
    path: '/analytics',
    status: 'loaded',
    version: ''
  },
  {
    name: 'Chat 聊天系统',
    path: '/chat',
    status: 'loaded',
    version: ''
  },
  {
    name: 'AdminList 管理员列表',
    path: '/admin-list',
    status: 'loaded',
    version: ''
  }
])

// 更新组件版本信息
const updateComponentVersions = () => {
  components.value.forEach(component => {
    component.version = isMobile.value ? '📱 移动端版本' : '💻 桌面端版本'
  })
}

onMounted(() => {
  updateComponentVersions()
  // 监听窗口变化更新组件版本
  window.addEventListener('resize', updateComponentVersions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateComponentVersions)
})
</script>

<style scoped>
.responsive-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 30px;
  text-align: center;
}

.info-card {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: var(--bg-color-secondary);
  border-radius: 4px;
}

.info-item label {
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-right: 10px;
}

.info-item .value {
  color: var(--primary-color);
  font-weight: 600;
}

.test-section {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.component-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.component-card {
  background: var(--bg-color-secondary);
  padding: 20px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.component-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.component-card h3 {
  color: var(--text-color);
  margin-bottom: 10px;
  font-size: 16px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.loaded {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.loading {
  background: #fff3e0;
  color: #e65100;
}

.version {
  color: var(--text-color-secondary);
  font-size: 13px;
}

.test-link {
  display: inline-block;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  transition: opacity 0.3s;
}

.test-link:hover {
  opacity: 0.9;
}

.tips-section {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tips-section ul {
  margin-top: 15px;
  padding-left: 20px;
}

.tips-section li {
  color: var(--text-color-secondary);
  line-height: 1.8;
  margin-bottom: 8px;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .responsive-test-container {
    padding: 15px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .component-list {
    grid-template-columns: 1fr;
  }

  .info-card,
  .test-section,
  .tips-section {
    padding: 15px;
    margin-bottom: 20px;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .status-badge.loaded {
    background: #1b5e20;
    color: #a5d6a7;
  }

  .status-badge.loading {
    background: #e65100;
    color: #ffcc80;
  }
}
</style>