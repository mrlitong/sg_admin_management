<template>
  <div class="mobile-tabbar" :class="{ 'safe-area': useSafeArea }">
    <div
      v-for="item in menuItems"
      :key="item.path"
      class="tabbar-item"
      :class="{ active: isActive(item.path) }"
      @click="handleNavigation(item)"
    >
      <el-icon class="tabbar-icon">
        <component :is="item.icon" />
      </el-icon>
      <span class="tabbar-label">{{ item.label }}</span>
      <span v-if="item.badge" class="tabbar-badge">{{ item.badge }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Document, MessageBox, ChatDotRound, DataAnalysis, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const props = defineProps({
  useSafeArea: {
    type: Boolean,
    default: true
  }
})

// 获取用户信息
const userInfo = computed(() => authStore.user)

// 菜单项配置
const menuItems = computed(() => {
  const items = [
    {
      path: '/users',
      label: '用户',
      icon: Document
    },
    {
      path: '/feedback',
      label: '反馈',
      icon: MessageBox
    },
    {
      path: '/chat',
      label: '客服',
      icon: ChatDotRound,
      badge: null
    },
    {
      path: '/analytics',
      label: '分析',
      icon: DataAnalysis
    }
  ]
  
  // 超级管理员显示客服管理
  if (userInfo.value?.is_super) {
    items.push({
      path: '/admins',
      label: '管理',
      icon: User
    })
  }
  
  return items
})

// 判断是否激活
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// 处理导航
const handleNavigation = (item) => {
  if (!isActive(item.path)) {
    router.push(item.path)
  }
}
</script>

<style scoped>
.mobile-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--tabbar-height);
  background: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  z-index: var(--z-fixed);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

/* 安全区域适配 */
.mobile-tabbar.safe-area {
  padding-bottom: var(--safe-area-inset-bottom);
  height: calc(var(--tabbar-height) + var(--safe-area-inset-bottom));
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #606266;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.tabbar-item:active {
  background-color: #f5f7fa;
}

.tabbar-item.active {
  color: #409EFF;
}

.tabbar-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.tabbar-label {
  font-size: 11px;
  line-height: 1;
}

.tabbar-badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 16px);
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
}

/* 动画效果 */
@keyframes tabbar-click {
  0% { transform: scale(1); }
  50% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.tabbar-item:active .tabbar-icon {
  animation: tabbar-click 0.3s ease;
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-tabbar {
    height: 44px;
  }
  
  .mobile-tabbar.safe-area {
    height: calc(44px + var(--safe-area-inset-bottom));
  }
  
  .tabbar-icon {
    font-size: 20px;
  }
  
  .tabbar-label {
    font-size: 10px;
  }
}
</style>
