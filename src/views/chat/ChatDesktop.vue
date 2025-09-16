<!-- 客服工作台 - PC端版本 -->
<template>
  <div class="cs-panel-desktop">
    <!-- 全屏加载状态 -->
    <div v-if="chatStore.isInitializing || !chatStore.isInitialized" class="global-loading">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <h3>正在初始化客服工作台</h3>
          <p v-if="chatStore.isInitializing">{{ loadingSteps[currentLoadingStep] }}</p>
          <p v-else-if="chatStore.lastError" class="error-message">
            初始化失败: {{ chatStore.lastError }}
            <button @click="retryInitialization" class="retry-btn">重试</button>
          </p>
        </div>
      </div>
    </div>

    <!-- 主要内容（初始化完成后显示） -->
    <template v-else>
      <!-- 侧边栏 - 会话列表 -->
      <SessionSidebar
        ref="sessionSidebarRef"
        :current-session-id="currentSessionId"
        :is-mobile="false"
        :mobile-view="''"
        @select-session="handleSelectSession"
        @update-filter="onFilterUpdate"
      />

      <!-- 主聊天区域 -->
      <ChatArea
        ref="chatAreaRef"
        :current-session-id="currentSessionId"
        :current-session="currentSessionData"
        :user-membership-info="userMembershipInfo"
        :is-mobile="false"
        :mobile-view="''"
        :mobile-user-info-expanded="false"
        @back-to-session-list="backToSessionList"
        @toggle-mobile-user-info="() => {}"
        @session-ended="onSessionEnded"
        @force-refresh-sessions="forceRefreshSessions"
      />
    </template>

    <!-- 错误提示 -->
    <div v-if="chatStore.lastError && chatStore.isInitialized" class="error-toast">
      <span>{{ chatStore.lastError }}</span>
      <button @click="clearError" class="close-error">×</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useChat } from '@/composables/useChat'
import SessionSidebar from './SessionSidebar.vue'
import ChatArea from './ChatArea.vue'

// 使用共享的Chat业务逻辑
const {
  // 状态
  currentSessionId,
  currentLoadingStep,
  userMembershipInfo,
  loadingSteps,

  // 组件引用
  sessionSidebarRef,
  chatAreaRef,

  // 计算属性
  currentSessionData,

  // 方法
  selectSession,
  backToSessionList,
  onSessionEnded,
  forceRefreshSessions,
  onFilterUpdate,
  clearError,
  retryInitialization,
  initializeChat,
  cleanupChat,

  // Store
  chatStore
} = useChat()

// PC端特定的会话选择处理
const handleSelectSession = async (session) => {
  await selectSession(session)
}

// 页面挂载时初始化
let cleanupFunction = null

onMounted(async () => {
  cleanupFunction = await initializeChat()
})

// 页面卸载时清理
onUnmounted(async () => {
  if (cleanupFunction) {
    cleanupFunction()
  }
  await cleanupChat()
})
</script>

<style scoped>
/* 确保页面不会超过屏幕高度，但允许内容区域滚动 */
.cs-panel-desktop {
  display: flex;
  height: calc(100vh - var(--header-height) - 40px); /* 减去顶部导航栏高度和main容器的padding */
  background: var(--bg-color-page);
  position: relative;
  overflow: hidden; /* 防止面板整体滚动 */
}

/* 全屏加载样式 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loading-container {
  text-align: center;
  padding: 40px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--box-shadow-light);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h3 {
  margin: 0 0 16px 0;
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: 500;
}

.loading-text p {
  margin: 0;
  color: var(--text-color-regular);
  font-size: 14px;
  line-height: 1.5;
}

.error-message {
  color: var(--danger-color) !important;
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid var(--danger-color);
  border-radius: 6px;
  padding: 12px;
  margin: 16px 0 0 0;
}

.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: var(--primary-color);
  opacity: 0.9;
}

.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(245, 108, 108, 0.9);
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: 4px;
  padding: 12px 16px;
  max-width: 300px;
  z-index: 1001;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: var(--box-shadow-base);
}

.close-error {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}
</style>