<!-- 客服工作台 - 重构后的主文件 -->
<template>
  <div class="cs-panel" :class="{ 'mobile-view': isMobile }">
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
        :is-mobile="isMobile"
        :mobile-view="mobileView"
        @select-session="selectSession"
        @update-filter="onFilterUpdate"
      />

      <!-- 主聊天区域 -->
      <ChatArea
        ref="chatAreaRef"
        :current-session-id="currentSessionId"
        :current-session="currentSessionData"
        :user-membership-info="userMembershipInfo"
        :is-mobile="isMobile"
        :mobile-view="mobileView"
        :mobile-user-info-expanded="mobileUserInfoExpanded"
        @back-to-session-list="backToSessionList"
        @toggle-mobile-user-info="toggleMobileUserInfo"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { customerServiceAPI } from '@/utils/api';
import SessionSidebar from './SessionSidebar.vue';
import ChatArea from './ChatArea.vue';

const chatStore = useChatStore();
const router = useRouter();
const currentSessionId = ref(null);

// 移动端视图状态管理
const isMobile = ref(false);
const mobileView = ref('sessions'); // 'sessions' | 'chat'
const mobileUserInfoExpanded = ref(false); // 移动端用户信息展开状态

// 组件引用
const sessionSidebarRef = ref(null);
const chatAreaRef = ref(null);

// 加载状态管理
const currentLoadingStep = ref(0);
const loadingSteps = [
  '正在建立WebSocket连接...',
  '正在验证客服身份...',
  '正在加载会话列表...',
  '正在同步未读消息...',
  '初始化完成'
];

// 用户会员信息状态
const userMembershipInfo = ref({
  membership_level: -1,
  membership_expire_date: null,
  game_platform: -1,
  remarks: null,
  last_online_time: null,
  auxiliary_online: 0
});

// 获取客服账号 - 在实际应用中应从认证系统获取
const getCSAccount = () => {
  return localStorage.getItem('cs_account') || 'xiuluoguiwang';
};

// 计算属性
const currentSessionData = computed(() => {
  return chatStore.sessions.find(s => s.session_id === currentSessionId.value);
});

// 检测是否为移动端
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 返回到会话列表（移动端）
const backToSessionList = () => {
  mobileView.value = 'sessions';
  currentSessionId.value = null;
  mobileUserInfoExpanded.value = false; // 重置展开状态
};

// 切换移动端用户信息展开状态
const toggleMobileUserInfo = () => {
  if (isMobile.value) {
    mobileUserInfoExpanded.value = !mobileUserInfoExpanded.value;
  }
};

// 获取用户会员信息
const fetchUserMembershipInfo = async (account) => {
  if (!account || account.trim() === '') {
    console.log('fetchUserMembershipInfo: account为空，跳过');
    userMembershipInfo.value = {
      membership_level: -1,
      membership_expire_date: null,
      game_platform: -1,
      remarks: null,
      last_online_time: null,
      auxiliary_online: 0,
      membership_pay_money: 0
    };
    return;
  }
  
  console.log('=== CustomerServicePanel fetchUserMembershipInfo ===');
  console.log('正在获取用户会员信息，account:', account);
  
  try {
    const response = await customerServiceAPI.getUserMembershipInfo(account);
    console.log('getUserMembershipInfo API响应:', response);
    
    if (response && response.data) {
      console.log('会员信息获取成功:', response.data);
      userMembershipInfo.value = response.data;
      console.log('userMembershipInfo.value已更新:', userMembershipInfo.value);
    } else {
      console.log('API响应中没有data字段');
      userMembershipInfo.value = {
        membership_level: -1,
        membership_expire_date: null,
        game_platform: -1,
        remarks: null,
        last_online_time: null,
        auxiliary_online: 0,
        membership_pay_money: 0
      };
    }
  } catch (error) {
    console.error('获取用户会员信息失败', error);
    userMembershipInfo.value = {
      membership_level: -1,
      membership_expire_date: null,
      game_platform: -1,
      remarks: null,
      last_online_time: null,
      auxiliary_online: 0,
      membership_pay_money: 0
    };
  }
};

// 选择会话
const selectSession = async (session) => {
  console.log('=== CustomerServicePanel selectSession ===');
  console.log('选择会话:', session);
  console.log('会话account:', session.account);
  
  currentSessionId.value = session.session_id;
  
  await chatStore.selectSession(session);
  
  // 如果是注册用户，获取会员信息
  if (session.account && session.account.trim() !== '') {
    console.log('✅ 检测到注册用户，开始获取会员信息:', session.account);
    await fetchUserMembershipInfo(session.account);
  } else {
    console.log('❌ 未检测到注册用户，清空会员信息');
    userMembershipInfo.value = {
      membership_level: -1,
      membership_expire_date: null,
      game_platform: -1,
      remarks: null,
      last_online_time: null,
      auxiliary_online: 0,
      membership_pay_money: 0
    };
  }
  
  // 移动端切换到聊天视图
  if (isMobile.value) {
    mobileView.value = 'chat';
    mobileUserInfoExpanded.value = false; // 重置展开状态
  }
  
  // 滚动到底部
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollToBottom();
  }
};

// 筛选条件更新
const onFilterUpdate = (filterValue) => {
  console.log('筛选条件更新为:', filterValue);
};

// 会话结束处理
const onSessionEnded = () => {
  console.log('会话已结束');
};

// 强制刷新会话列表
const forceRefreshSessions = () => {
  if (sessionSidebarRef.value) {
    sessionSidebarRef.value.forceRefreshSessions();
  }
};

// 清除错误
const clearError = () => {
  chatStore.lastError = null;
};

// 重试初始化
const retryInitialization = async () => {
  const csAccount = getCSAccount();
  await initializeWorkspace(csAccount);
};

// 初始化工作台
const initializeWorkspace = async (csAccount) => {
  try {
    currentLoadingStep.value = 0;
    
    // 使用新的完整初始化方法
    const success = await chatStore.initializeCustomerService(csAccount);
    
    if (success) {
      currentLoadingStep.value = 4; // 初始化完成
      console.log('客服工作台初始化成功');
    } else {
      console.error('客服工作台初始化失败');
    }
  } catch (error) {
    console.error('初始化过程出错:', error);
    chatStore.lastError = error.message || '初始化失败';
  }
};

// 页面挂载时初始化
onMounted(async () => {
  try {
    // 检测移动端
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    const csAccount = getCSAccount();
    
    // 使用新的初始化方法
    await initializeWorkspace(csAccount);
    
    // 监听浏览器关闭/刷新事件
    const handleBeforeUnload = async (event) => {
      try {
        if (chatStore.userType === 'customer_service' && chatStore.csInfo?.cs_account) {
          // 使用navigator.sendBeacon进行可靠的状态更新
          const data = JSON.stringify({
            cs_account: chatStore.csInfo.cs_account,
            status: 'offline'
          });
          
          navigator.sendBeacon(`${window.location.origin.replace(':5173', ':8000')}/api/cs/update_status`, data);
          localStorage.setItem('cs_status', 'offline');
        }
      } catch (error) {
        console.error('浏览器关闭时设置离线状态失败:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
  } catch (error) {
    console.error('初始化客服工作台失败:', error);
    chatStore.lastError = error.message || '页面初始化失败';
  }
});

// 页面卸载时断开连接和更新状态
onUnmounted(async () => {
  // 移除事件监听器
  window.removeEventListener('resize', checkIsMobile);
  
  // 设置状态为离线
  try {
    if (chatStore.userType === 'customer_service' && chatStore.csInfo?.cs_account) {
      await chatStore.updateCSStatus('offline');
      localStorage.setItem('cs_status', 'offline');
    }
  } catch (error) {
    console.error('设置离线状态失败:', error);
  }
  
  // 断开WebSocket连接
  chatStore.disconnect();
});
</script>

<style scoped>
/* 确保页面不会超过屏幕高度，但允许内容区域滚动 */
:global(html, body) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* 防止页面整体滚动 */
}

:global(#app) {
  height: 100vh;
  overflow: hidden; /* 防止根容器滚动 */
}

.cs-panel {
  display: flex;
  height: calc(100vh - var(--header-height) - 40px); /* 减去顶部导航栏高度和main容器的padding */
  background: #f5f5f5;
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
  background: rgba(245, 245, 245, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loading-container {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #007bff;
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
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.loading-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.error-message {
  color: #dc3545 !important;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 12px;
  margin: 16px 0 0 0;
}

.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #0056b3;
}

.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px 16px;
  max-width: 300px;
  z-index: 1001;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-error {
  background: none;
  border: none;
  color: #721c24;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cs-panel {
    flex-direction: row;
    height: calc(100vh - var(--mobile-header-height) - var(--tabbar-height) - 24px); /* 减去移动端导航栏、TabBar高度和padding */
    overflow: hidden;
    position: relative;
  }
  
  /* 移动端视图切换 */
  .cs-panel.mobile-view :deep(.sidebar) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 10;
    transition: transform 0.3s ease-in-out;
    background: #fff;
  }
  
  .cs-panel.mobile-view :deep(.main-chat) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 20;
    transition: transform 0.3s ease-in-out;
    background: #fff;
  }
  
  /* 移动端加载提示 */
  .loading-container {
    padding: 30px;
    max-width: 90%;
    
    .loading-text h3 {
      font-size: 16px;
    }
    
    .loading-text p {
      font-size: 13px;
    }
  }
  
  /* 移动端错误提示 */
  .error-toast {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style>