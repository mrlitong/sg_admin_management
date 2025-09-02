<!-- 聊天区域组件 -->
<template>
  <div class="main-chat" :class="{ 
    'mobile-hidden': isMobile && mobileView === 'sessions',
    'mobile-full': isMobile && mobileView === 'chat'
  }">
    <div v-if="!currentSessionId" class="no-session">
      <div class="no-session-icon">💼</div>
      <h3>请选择一个会话开始服务</h3>
      <p>从左侧会话列表中选择需要处理的客户咨询</p>
    </div>
    
    <div v-else class="chat-container">
      <!-- 用户信息栏 -->
      <UserInfoBar
        :current-session="currentSession"
        :user-membership-info="userMembershipInfo"
        :is-mobile="isMobile"
        :mobile-user-info-expanded="mobileUserInfoExpanded"
        @back-to-session-list="backToSessionList"
        @toggle-mobile-user-info="toggleMobileUserInfo"
        @end-session="endCurrentSession"
        @mark-important="markSessionImportant"
      />

      <!-- 消息列表 -->
      <MessageList
        ref="messageListRef"
        :messages="messages"
        :is-loading="isLoading"
      />

      <!-- 快捷回复 -->
      <div class="quick-replies">
        <button 
          v-for="reply in quickReplies" 
          :key="reply.id"
          @click="useQuickReply(reply.content)"
          class="quick-reply-btn"
        >
          {{ reply.label }}
        </button>
      </div>

      <!-- 输入区域 -->
      <InputArea
        ref="inputAreaRef"
        :is-connected="isConnected"
        :is-sending="isSending"
        :is-loading="isLoading"
        :current-session-id="currentSessionId"
        @send-message="sendMessage"
        @clear-history="clearHistory"
        @reconnect="reconnect"
        @open-recharge="openRechargeDialog"
      />
    </div>
    
    <!-- 充值弹窗 -->
    <RechargeDialog
      :visible="showRechargeDialog"
      :user-account="currentSession?.account || `游客${currentSession?.guest_id}`"
      @close="closeRechargeDialog"
      @submit="handleRechargeSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { customerServiceAPI } from '@/utils/api';
import UserInfoBar from './UserInfoBar.vue';
import MessageList from './MessageList.vue';
import InputArea from './InputArea.vue';
import RechargeDialog from './RechargeDialog.vue';

const props = defineProps({
  currentSessionId: {
    type: String,
    default: null
  },
  currentSession: {
    type: Object,
    default: null
  },
  userMembershipInfo: {
    type: Object,
    default: () => ({
      membership_level: -1,
      membership_expire_date: null,
      game_platform: -1,
      remarks: null,
      last_online_time: null,
      auxiliary_online: 0
    })
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  mobileView: {
    type: String,
    default: 'sessions'
  },
  mobileUserInfoExpanded: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'back-to-session-list', 
  'toggle-mobile-user-info', 
  'session-ended',
  'force-refresh-sessions'
]);

const chatStore = useChatStore();
const messageListRef = ref(null);
const inputAreaRef = ref(null);
const showRechargeDialog = ref(false);

// 快捷回复
const quickReplies = [
  { id: 1, label: '问候语', content: '您好，很高兴为您服务，请问有什么可以帮助您的？' },
  { id: 2, label: '查询中', content: '请稍等，我正在为您查询相关信息...' },
  { id: 3, label: '感谢语', content: '感谢您的咨询，祝您使用愉快！如有其他问题，随时联系我们。' },
  { id: 4, label: '结束语', content: '还有其他问题需要帮助吗？' }
];

// 计算属性
const messages = computed(() => chatStore.currentSessionMessages);
const isLoading = computed(() => chatStore.isLoading);
const isConnected = computed(() => chatStore.isConnected);
const isSending = computed(() => chatStore.isSending);

// 返回到会话列表（移动端）
const backToSessionList = () => {
  emit('back-to-session-list');
};

// 切换移动端用户信息展开状态
const toggleMobileUserInfo = () => {
  emit('toggle-mobile-user-info');
};

// 发送消息
const sendMessage = async (message) => {
  try {
    chatStore.isSending = true;
    await chatStore.sendMessage(message);
    
    // 滚动到底部
    if (messageListRef.value) {
      messageListRef.value.scrollToBottom();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    chatStore.lastError = error.message || '发送消息失败';
  } finally {
    chatStore.isSending = false;
  }
};

// 使用快捷回复
const useQuickReply = (content) => {
  if (inputAreaRef.value) {
    inputAreaRef.value.setInputMessage(content);
  }
};

// 标记会话重要性
const markSessionImportant = async ({ sessionId, isImportant, reason }) => {
  try {
    await chatStore.markSessionImportant(sessionId, isImportant, reason);
  } catch (error) {
    console.error('标记重要性失败:', error);
  }
};

// 结束会话
const endCurrentSession = async (sessionId) => {
  try {
    await chatStore.endSession(sessionId, '客服手动结束');
    
    // 移动端返回到会话列表
    if (props.isMobile) {
      backToSessionList();
    }
    
    emit('session-ended');
    emit('force-refresh-sessions');
  } catch (error) {
    console.error('结束会话失败:', error);
  }
};

// 清理聊天记录
const clearHistory = async () => {
  try {
    chatStore.isLoading = true;
    
    const response = await chatStore.clearChatHistory(props.currentSessionId);
    
    alert('聊天记录清理成功！');
    console.log('清理聊天记录成功:', response.msg);
  } catch (error) {
    console.error('清理记录失败:', error);
    alert(`清理失败: ${error.message || '网络错误'}`);
  } finally {
    chatStore.isLoading = false;
  }
};

// 重连
const reconnect = () => {
  chatStore.reconnectWebSocket();
};

// 打开充值弹窗
const openRechargeDialog = () => {
  showRechargeDialog.value = true;
};

// 关闭充值弹窗
const closeRechargeDialog = () => {
  showRechargeDialog.value = false;
};

// 处理充值提交
const handleRechargeSubmit = async (rechargeData) => {
  try {
    console.log('提交充值数据:', rechargeData);
    
    // 调用充值API
    const response = await customerServiceAPI.rechargeUser({
      account: rechargeData.account,
      amount: rechargeData.amount,
      duration: rechargeData.duration,
      service_agent: rechargeData.serviceAgent
    });
    
    if (response.code === 0) {
      alert('充值成功！');
      closeRechargeDialog();
      
      // 发送系统消息通知充值成功
      const systemMessage = `系统通知：用户 ${rechargeData.account} 充值成功！金额：¥${rechargeData.amount}，时长：${rechargeData.duration}天，充值客服：${rechargeData.serviceAgent}`;
      await chatStore.sendMessage(systemMessage, true); // true 表示系统消息
    } else {
      alert(`充值失败: ${response.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('充值失败:', error);
    alert(`充值失败: ${error.message || '网络错误'}`);
  }
};

// 暴露方法给父组件
defineExpose({
  scrollToBottom: () => {
    if (messageListRef.value) {
      messageListRef.value.scrollToBottom();
    }
  }
});
</script>

<style scoped>
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
  height: 100%; /* 确保高度为100%而不是超出 */
}

.no-session {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;
  padding: 40px;
}

.no-session-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-session h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.quick-replies {
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  background: #f8f9fa;
  align-items: center;
}

.quick-reply-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.quick-reply-btn:hover {
  background: #e9ecef;
  border-color: #409EFF;
}

.quick-reply-btn:active {
  transform: scale(0.95);
  background: #dee2e6;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .main-chat.mobile-hidden {
    transform: translateX(100%);
  }
  
  .main-chat.mobile-full {
    transform: translateX(0);
  }
  
  .quick-replies {
    padding: 10px 12px;
    gap: 8px;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    background: #ffffff;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }
  
  .quick-replies::-webkit-scrollbar {
    display: none;
  }
  
  .quick-reply-btn {
    flex-shrink: 0;
    padding: 10px 16px;
    font-size: 14px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: #f0f2f5;
    border: 1px solid transparent;
    font-weight: 500;
  }
  
  .quick-reply-btn:active {
    background: #409EFF;
    color: white;
    transform: none;
  }
}
</style>