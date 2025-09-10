<!-- 会话列表侧边栏组件 -->
<template>
  <div class="sidebar" :class="{ 
    'mobile-hidden': isMobile && mobileView === 'chat',
    'mobile-full': isMobile && mobileView === 'sessions'
  }">
    <div class="sidebar-header">
      <h3>会话列表</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="{ 
          online: currentStatus === 'online' && chatStore.isConnected,
          busy: currentStatus === 'busy' && chatStore.isConnected,
          offline: currentStatus === 'offline' || !chatStore.isConnected
        }"></span>
        <span class="status-text">
          {{ currentStatus === 'offline' || !chatStore.isConnected ? '离线' : getStatusDisplayText(currentStatus) }}
        </span>
        <button @click="forceRefreshSessions" style="margin-left: 8px; padding: 2px 6px; font-size: 10px; background: var(--primary-color); color: white; border: none; border-radius: 3px; cursor: pointer;">
          强制刷新
        </button>
      </div>
    </div>
    
    <!-- 客服状态控制 -->
    <div class="cs-status-control">
      <label>状态:</label>
      <select v-model="currentStatus" @change="updateStatus">
        <option value="online">在线</option>
        <option value="busy">忙碌</option>
        <option value="offline">离线</option>
      </select>
      <button @click="logout" class="logout-btn" title="退出登录">
        退出
      </button>
    </div>
    
    <!-- 会话过滤 -->
    <div class="session-filters">
      <button 
        v-for="filter in sessionFilters" 
        :key="filter.value"
        @click="activeFilter = filter.value"
        :class="{ active: activeFilter === filter.value }"
        class="filter-btn"
      >
        {{ filter.label }}
        <span v-if="getFilterCount(filter.value)" class="count-badge">
          {{ getFilterCount(filter.value) }}
        </span>
      </button>
    </div>
    
    <!-- 会话列表 -->
    <div ref="sessionListContainer" class="session-list" @scroll="onSessionListScroll">
      <div v-if="chatStore.isLoading" class="loading-sessions">
        <div class="loading-spinner"></div>
        <span>加载会话中...</span>
      </div>
      
      <div v-else-if="displaySessions.length === 0" class="empty-sessions">
        <p>暂无会话</p>
      </div>
      
      <div 
        v-else
        v-for="session in displaySessions" 
        :key="session.session_id"
        class="session-item"
        :class="{ 
          active: currentSessionId === session.session_id,
          important: session.is_important,
          'has-unread': session.cs_unread_count > 0
        }"
        @click="selectSession(session)"
      >
        <div class="session-avatar">
          <div class="avatar-circle" v-if="!session.avatar_url || imageLoadError[session.session_id]">
            {{ getUserAvatar(session) }}
          </div>
          <img 
            v-else
            :src="session.avatar_url" 
            :alt="getUserName(session)"
            class="avatar-image"
            @error="handleImageError(session.session_id)"
            @load="handleImageLoad(session.session_id)"
          />
        </div>
        <div class="session-info">
          <div class="user-name">
            {{ session.account || `游客${session.guest_id}` }}
            <span v-if="session.is_important" class="important-badge">重要</span>
          </div>
          <div class="last-message-preview">
            {{ getLastMessagePreview(session.last_message) }}
          </div>
          <div class="last-message-time">
            {{ formatTime(session.last_message?.create_time || session.update_time) }}
          </div>
          <div v-if="session.user_info" class="user-meta">
            <span class="membership">{{ getMembershipText(session.user_info.membership_level) }}</span>
          </div>
        </div>
        <div class="session-status">
          <span v-if="session.cs_unread_count > 0" class="unread-badge">
            {{ session.cs_unread_count }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 分页控件 -->
    <div class="pagination-container">
      <Pagination
        v-if="!chatStore.isLoading"
        :current-page="chatStore.currentPage"
        :page-size="chatStore.pageSize" 
        :total="chatStore.sessionsTotal"
        @change="handlePageChange"
      />
      <div v-else class="pagination-loading">
        <span style="color: var(--text-color-regular); font-size: 12px;">加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { customerServiceAPI } from '@/utils/api';
import Pagination from './Pagination.vue';

const props = defineProps({
  currentSessionId: {
    type: String,
    default: null
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  mobileView: {
    type: String,
    default: 'sessions'
  }
});

const emit = defineEmits(['select-session', 'update-filter']);

const chatStore = useChatStore();
const router = useRouter();
const currentStatus = ref('online');
const activeFilter = ref('all');
const sessionListContainer = ref(null);

// 图片加载错误状态管理
const imageLoadError = ref({});

// 会话过滤选项
const sessionFilters = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '重要', value: 'important' }
];

// 存储各筛选条件的计数
const filterCounts = ref({
  all: 0,
  unread: 0,
  important: 0
});

// 获取客服账号
const getCSAccount = () => {
  return localStorage.getItem('cs_account') || 'xiuluoguiwang';
};

// 计算属性 - 重构版本（移除前端筛选，完全信任后端数据）
const displaySessions = computed(() => {
  // 🔒 完全信任后端返回的会话列表，不进行任何前端筛选或排序
  // 后端已经处理了所有筛选条件、排序和分页逻辑
  const sessions = chatStore.sessions || [];
  
  if (process.env.NODE_ENV === 'development' && sessions.length > 0) {
    console.log('📋 会话列表显示数据:');
    console.log(`📊 总计: ${sessions.length} 条会话 (${chatStore.currentPage}/${chatStore.totalPages}页)`);
    sessions.slice(0, 3).forEach((session, index) => {
      const userName = session.account || `游客${session.guest_id}`;
      const unreadCount = session.cs_unread_count || 0;
      const lastTime = session.last_message?.create_time || session.update_time;
      console.log(`${index + 1}. ${userName} - 未读:${unreadCount} - 时间:${formatTime(lastTime)}`);
    });
    
    // 分页数据验证
    const expectedCount = Math.min(chatStore.pageSize, 
      chatStore.sessionsTotal - (chatStore.currentPage - 1) * chatStore.pageSize);
    if (sessions.length !== expectedCount && chatStore.sessionsTotal > 0) {
      console.warn(`⚠️ 分页数据异常: 显示${sessions.length}条，预期${expectedCount}条`);
    }
  }
  
  return sessions;
});

// 监听会话过滤状态变化
watch(() => activeFilter.value, async () => {
  chatStore.setPreserveScrollPosition(false);
  try {
    const { status, importance, unread_only } = getFilterParams(activeFilter.value);
    await chatStore.loadSessions(status, importance, 1, false, unread_only);
    await loadFilterCounts();
    emit('update-filter', activeFilter.value);
  } catch (error) {
    console.error('切换筛选条件失败:', error);
  }
});

// 监听会话列表变化，恢复滚动位置
watch(() => chatStore.sessions.length, () => {
  restoreSessionListPosition();
});

// 获取会话的最后活动时间
const getSessionLastTime = (session) => {
  let timeStr = session.last_message?.create_time || session.update_time;
  
  if (!timeStr) return 0;
  
  try {
    const date = new Date(timeStr);
    
    if (isNaN(date.getTime())) {
      console.warn('无效的时间格式:', timeStr, 'session:', session.session_id);
      return 0;
    }
    
    return date.getTime();
  } catch (error) {
    console.error('时间转换错误:', timeStr, error);
    return 0;
  }
};

// 会话列表滚动位置保存
const onSessionListScroll = () => {
  if (sessionListContainer.value) {
    const scrollTop = sessionListContainer.value.scrollTop;
    chatStore.saveSessionListScrollPosition(scrollTop);
  }
};

// 恢复会话列表滚动位置
const restoreSessionListPosition = async () => {
  if (chatStore.preserveScrollPosition && sessionListContainer.value) {
    await nextTick();
    const savedPosition = chatStore.getSavedScrollPosition();
    sessionListContainer.value.scrollTop = savedPosition;
    console.log(`恢复滚动位置: ${savedPosition}`);
  }
};

// 选择会话
const selectSession = async (session) => {
  console.log('=== SessionSidebar selectSession ===');
  console.log('选择会话:', session);
  
  if (session.cs_unread_count > 0) {
    try {
      const csAccount = getCSAccount();
      console.log('🔵 会话有未读消息，标记为已读:', {
        sessionId: session.session_id,
        unreadCount: session.cs_unread_count,
        csAccount: csAccount
      });
      
      const originalUnreadCount = session.cs_unread_count;
      session.cs_unread_count = 0;
      
      console.log('🟡 使用WebSocket标记会话已读');
      await chatStore.sendWebSocketMessage({
        type: 'mark_session_read',
        data: { session_id: session.session_id }
      }, 'session_read_success');
      
      console.log('✅ 会话已标记为已读，WebSocket调用成功');
      
    } catch (error) {
      console.error('❌ 标记会话已读失败:', error);
      session.cs_unread_count = originalUnreadCount;
      console.log('🔴 WebSocket失败，已恢复原始未读数:', originalUnreadCount);
    }
  } else {
    console.log('🟢 会话未读数为0，无需标记为已读');
  }
  
  emit('select-session', session);
};

// 更新客服状态
const updateStatus = async () => {
  const oldStatus = chatStore.csStatus;
  try {
    await chatStore.updateCSStatus(currentStatus.value);
    localStorage.setItem('cs_status', currentStatus.value);
    console.log(`状态已更新为: ${getStatusDisplayText(currentStatus.value)}`);
  } catch (error) {
    console.error('更新状态失败:', error);
    currentStatus.value = oldStatus;
    chatStore.lastError = error.message || '状态更新失败';
  }
};

// 获取状态显示文本
const getStatusDisplayText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线', 
    'busy': '忙碌'
  };
  return statusMap[status] || status;
};

// 退出登录
const logout = async () => {
  if (confirm('确定要退出登录吗？')) {
    try {
      const csAccount = getCSAccount();
      
      await customerServiceAPI.logout(csAccount);
      
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_account');
      localStorage.removeItem('cs_info');
      localStorage.removeItem('cs_status');
      
      chatStore.clearState();
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_account');
      localStorage.removeItem('cs_info');
      localStorage.removeItem('cs_status');
      
      chatStore.clearState();
      router.push('/login');
    }
  }
};

// 获取各筛选条件的计数
const loadFilterCounts = async () => {
  try {
    const conditions = [
      { key: 'all', importance: 'all', unread_only: false },
      { key: 'unread', importance: 'all', unread_only: true },
      { key: 'important', importance: 'important', unread_only: false }
    ];

    for (const condition of conditions) {
      const count = await chatStore.getSessionsCount('all', condition.importance, condition.unread_only);
      filterCounts.value[condition.key] = count;
    }
  } catch (error) {
    console.error('加载筛选计数失败:', error);
  }
};

// 根据前端筛选条件获取后端API参数
const getFilterParams = (filterValue) => {
  let status = 'all';
  let importance = 'all';
  let unread_only = false;
  
  if (filterValue === 'important') {
    importance = 'important';
  } else if (filterValue === 'unread') {
    unread_only = true;
  } else {
    importance = 'all';
  }
  
  return { status, importance, unread_only };
};

// 分页处理
const handlePageChange = async (page) => {
  try {
    const { status, importance, unread_only } = getFilterParams(activeFilter.value);
    await chatStore.goToPage(page, status, importance, unread_only);
  } catch (error) {
    console.error('页码切换失败:', error);
    chatStore.lastError = error.message || '页码切换失败';
  }
};

// 强制刷新会话列表
const forceRefreshSessions = async () => {
  console.log('=== 强制刷新会话列表 ===');
  try {
    chatStore.sessionUnreadMap.clear();
    
    const { status, importance, unread_only } = getFilterParams(activeFilter.value);
    await chatStore.loadSessions(status, importance, 1, false, unread_only);
    
    await loadFilterCounts();
    
    chatStore.validatePaginationConsistency();
    
    console.log('强制刷新完成，当前状态:', {
      sessionsTotal: chatStore.sessionsTotal,
      sessionsLength: chatStore.sessions.length,
      currentPage: chatStore.currentPage,
      totalPages: chatStore.totalPages
    });
  } catch (error) {
    console.error('强制刷新失败:', error);
  }
};


// 辅助函数
const getFilterCount = (filterType) => {
  return filterCounts.value[filterType] || null;
};

const getUserName = (session) => {
  return session?.account || `游客${session?.guest_id}`;
};

const getUserAvatar = (session) => {
  const name = getUserName(session);
  return name.charAt(0).toUpperCase();
};

const getMembershipText = (level) => {
  const levels = {
    '-1': '游客',
    '0': '游客',
    '1': '基础会员',
    '2': '高级会员',
    '3': '钻石会员',
    '4': '永久会员'
  };
  return levels[level] || '未知';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前';
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前';
  } else {
    return date.toLocaleDateString();
  }
};

const getLastMessagePreview = (lastMessage) => {
  if (!lastMessage || !lastMessage.content) {
    return '暂无消息';
  }
  
  const content = lastMessage.content.trim();
  if (content.length > 30) {
    return content.substring(0, 30) + '...';
  }
  return content;
};

// 图片加载相关函数
const handleImageError = (sessionId) => {
  imageLoadError.value[sessionId] = true;
  console.log(`用户头像加载失败，会话ID: ${sessionId}`);
};

const handleImageLoad = (sessionId) => {
  imageLoadError.value[sessionId] = false;
  console.log(`用户头像加载成功，会话ID: ${sessionId}`);
};

// 暴露方法给父组件
defineExpose({
  forceRefreshSessions,
  loadFilterCounts
});
</script>

<style scoped>
.sidebar {
  width: 320px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-color-base);
  display: flex;
  flex-direction: column;
  height: 100%; /* 使用100%而不是100vh，让父容器控制高度 */
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-color-primary);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-color-regular);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger-color);
  transition: background-color 0.3s ease;
}

.status-dot.online {
  background: var(--success-color);
}

.status-dot.busy {
  background: var(--warning-color);
}

.status-dot.offline {
  background: var(--info-color);
}

.cs-status-control {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.cs-status-control select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border-color-base);
  border-radius: 4px;
  font-size: 12px;
  background: var(--card-bg);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.cs-status-control select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.cs-status-control select:hover {
  border-color: var(--text-color-secondary);
}

.logout-btn {
  padding: 4px 8px;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-left: 8px;
}

.logout-btn:hover {
  background: var(--danger-color); opacity: 0.8;
}

.session-filters {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color-base);
  background: var(--card-bg);
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.count-badge {
  background: var(--danger-color);
  color: white;
  border-radius: 8px;
  padding: 0 4px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

.filter-btn.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.loading-sessions,
.empty-sessions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-color-regular);
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color-base);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.session-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s;
}

.session-item:hover {
  background: var(--bg-color-secondary);
}

.session-item.active {
  background: var(--bg-color-secondary);
  border-left: 3px solid var(--primary-color);
}

.session-item.important {
  border-left: 3px solid var(--warning-color);
}

.session-item.important.active {
  border-left: 3px solid var(--primary-color);
  background: var(--bg-color-secondary);
}

.session-item.has-unread {
  background: var(--bg-color-secondary);
  border-left: 4px solid var(--primary-color);
  position: relative;
}

.session-item.has-unread:hover {
  background: var(--bg-color-secondary);
}

.session-item.has-unread.active {
  background: var(--bg-color-secondary);
  border-left: 4px solid var(--primary-color); opacity: 0.8;
}

.session-item.has-unread .user-name {
  font-weight: 600;
  color: var(--primary-color); opacity: 0.8;
}

.session-item.has-unread .last-message-time {
  color: var(--primary-color);
  font-weight: 500;
}

.session-avatar {
  flex-shrink: 0;
}

.session-avatar .avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.session-avatar .avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color-base);
  transition: border-color 0.2s ease;
}

.session-avatar .avatar-image:hover {
  border-color: var(--primary-color);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.important-badge {
  background: var(--warning-color);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 6px;
}

.last-message-preview {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message-time {
  font-size: 11px;
  color: var(--text-color-regular);
  margin-bottom: 2px;
}

.user-meta {
  font-size: 10px;
  color: var(--text-color-secondary);
}

.membership {
  background: var(--bg-color-secondary);
  color: var(--primary-color);
  padding: 1px 4px;
  border-radius: 6px;
}

.session-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unread-badge {
  background: var(--danger-color);
  color: white;
  border-radius: 8px;
  padding: 1px 5px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

.pagination-container {
  flex-shrink: 0;
  border-top: 1px solid var(--border-color-light);
  padding: 8px 12px;
  background: var(--card-bg);
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .sidebar.mobile-hidden {
    transform: translateX(-100%);
  }
  
  .sidebar.mobile-full {
    transform: translateX(0);
  }
  
  .sidebar-header {
    padding: 12px;
  }
  
  .sidebar-header h3 {
    font-size: 16px;
  }
  
  .status-indicator {
    font-size: 11px;
  }
  
  .cs-status-control {
    padding: 8px 12px;
  }
  
  .cs-status-control select {
    font-size: 11px;
  }
  
  .logout-btn {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .session-filters {
    padding: 8px 12px;
  }
  
  .filter-btn {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .session-item {
    padding: 10px 12px;
    gap: 8px;
  }
  
  .session-avatar .avatar-circle {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .session-avatar .avatar-image {
    width: 32px;
    height: 32px;
    border-width: 1px;
  }
  
  .session-item.has-unread {
    border-left-width: 3px;
  }
  
  .user-name {
    font-size: 14px;
  }
  
  .last-message-time {
    font-size: 10px;
  }
  
  .user-meta {
    font-size: 9px;
  }
  
  .unread-badge {
    font-size: 9px;
    padding: 1px 4px;
    min-width: 14px;
  }
  
  .pagination-container {
    padding: 6px 8px;
    min-height: 35px;
  }
}
</style>