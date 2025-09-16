<!-- 客服工作台 - 移动端版本 -->
<template>
  <div class="cs-panel-mobile">
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
      <!-- 会话列表视图 -->
      <div
        v-if="mobileView === 'sessions'"
        class="mobile-view-sessions"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <SessionSidebar
          ref="sessionSidebarRef"
          :current-session-id="currentSessionId"
          :is-mobile="true"
          :mobile-view="mobileView"
          @select-session="handleSelectSession"
          @update-filter="onFilterUpdate"
        />
      </div>

      <!-- 聊天视图 -->
      <div
        v-else-if="mobileView === 'chat'"
        class="mobile-view-chat"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <ChatArea
          ref="chatAreaRef"
          :current-session-id="currentSessionId"
          :current-session="currentSessionData"
          :user-membership-info="userMembershipInfo"
          :is-mobile="true"
          :mobile-view="mobileView"
          :mobile-user-info-expanded="mobileUserInfoExpanded"
          @back-to-session-list="handleBackToSessionList"
          @toggle-mobile-user-info="toggleMobileUserInfo"
          @session-ended="onSessionEnded"
          @force-refresh-sessions="forceRefreshSessions"
        />
      </div>
    </template>

    <!-- 错误提示 -->
    <div v-if="chatStore.lastError && chatStore.isInitialized" class="error-toast">
      <span>{{ chatStore.lastError }}</span>
      <button @click="clearError" class="close-error">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useChat } from '@/composables/useChat'
import { useTouchSwipe } from '@/utils/responsive'
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

// 移动端特有状态
const mobileView = ref('sessions') // 'sessions' | 'chat'
const mobileUserInfoExpanded = ref(false)

// 移动端特定的会话选择处理
const handleSelectSession = async (session) => {
  await selectSession(session)
  // 移动端切换到聊天视图
  mobileView.value = 'chat'
  mobileUserInfoExpanded.value = false
}

// 移动端返回会话列表
const handleBackToSessionList = () => {
  mobileView.value = 'sessions'
  mobileUserInfoExpanded.value = false
  backToSessionList()
}

// 切换移动端用户信息展开状态
const toggleMobileUserInfo = () => {
  mobileUserInfoExpanded.value = !mobileUserInfoExpanded.value
}

// 触摸手势处理
const { handleTouchStart, handleTouchEnd } = useTouchSwipe((direction) => {
  // 在聊天视图时，右滑返回会话列表
  if (mobileView.value === 'chat' && direction === 'right') {
    handleBackToSessionList()
  }
})

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
.cs-panel-mobile {
  height: calc(100vh - var(--mobile-header-height) - var(--tabbar-height) - 24px);
  background: var(--bg-color-page);
  position: relative;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0); /* 适配iPhone底部安全区域 */
}

.mobile-view-sessions,
.mobile-view-chat {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--card-bg);
  transition: transform 0.3s ease-in-out;
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
  padding: 30px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--box-shadow-light);
  max-width: 90%;
  width: 90%;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color-light);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h3 {
  margin: 0 0 12px 0;
  color: var(--text-color-primary);
  font-size: 16px;
  font-weight: 500;
}

.loading-text p {
  margin: 0;
  color: var(--text-color-regular);
  font-size: 13px;
  line-height: 1.4;
}

.error-message {
  color: var(--danger-color) !important;
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid var(--danger-color);
  border-radius: 6px;
  padding: 10px;
  margin: 12px 0 0 0;
  font-size: 12px;
}

.retry-btn {
  margin-left: 6px;
  padding: 3px 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: var(--primary-color);
  opacity: 0.9;
}

.error-toast {
  position: fixed;
  top: 10px;
  right: 10px;
  left: 10px;
  background: rgba(245, 108, 108, 0.9);
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: 4px;
  padding: 8px 12px;
  max-width: none;
  z-index: 1001;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-shadow: var(--box-shadow-base);
  font-size: 12px;
}

.close-error {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  min-width: 20px;
  padding: 0;
}

/* 触摸优化 */
.mobile-view-sessions,
.mobile-view-chat {
  touch-action: pan-y; /* 允许垂直滚动，限制水平滑动用于手势 */
}

/* 避免移动端双击缩放 */
.cs-panel-mobile * {
  touch-action: manipulation;
}

/* 优化移动端按钮点击区域 */
.cs-panel-mobile button {
  min-height: 44px; /* iOS推荐的最小触摸目标尺寸 */
  min-width: 44px;
}

/* 移动端安全区域适配 */
@supports(padding: max(0px)) {
  .cs-panel-mobile {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
</style>