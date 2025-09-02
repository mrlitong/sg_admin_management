<!-- 消息列表组件 -->
<template>
  <div class="message-list" ref="messageList">
    <div v-if="isLoading" class="loading-messages">
      <div class="loading-spinner"></div>
      <span>加载消息中...</span>
    </div>
    
    <div v-else-if="messages.length === 0" class="empty-messages">
      <div class="empty-icon">💬</div>
      <p>暂无消息记录</p>
    </div>
    
    <div 
      v-else
      v-for="message in messages" 
      :key="message.message_id"
      class="message-item"
      :class="`message-${message.sender_type}`"
    >
      <div class="message-bubble">
        <div class="content">{{ message.content }}</div>
        <div class="time">{{ formatMessageTime(message.create_time || message.timestamp) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const messageList = ref(null);

// 监听消息变化，自动滚动到底部
watch(() => props.messages.length, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

// 滚动到底部
const scrollToBottom = () => {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 暴露方法给父组件
defineExpose({
  scrollToBottom
});
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.loading-messages,
.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.message-item {
  display: flex;
  margin-bottom: 8px;
}

.message-user {
  justify-content: flex-start;
}

.message-customer_service {
  justify-content: flex-end;
}

.message-system {
  justify-content: center;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f1f1f1;
  word-wrap: break-word;
}

.message-customer_service .message-bubble {
  background: #007bff;
  color: white;
}

.message-system .message-bubble {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  text-align: center;
  font-size: 12px;
  max-width: 60%;
}

.content {
  line-height: 1.4;
  white-space: pre-wrap;
}

.time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

/* 滚动条优化 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .message-list {
    padding: 12px;
    gap: 8px;
    /* 优化滚动性能 */
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
    /* 防止iOS橡皮筋效果影响体验 */
    position: relative;
  }
  
  .message-list::-webkit-scrollbar {
    width: 0;
    display: none;
  }
  
  .message-item {
    margin-bottom: 4px;
  }
  
  .message-bubble {
    max-width: 80%;
    padding: 10px 14px;
    font-size: 15px;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
  
  .message-user .message-bubble {
    background: #f5f5f5;
    margin-right: auto;
  }
  
  .message-customer_service .message-bubble {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin-left: auto;
  }
  
  .message-system .message-bubble {
    max-width: 90%;
    font-size: 13px;
    padding: 8px 12px;
  }
  
  .content {
    line-height: 1.5;
    word-break: break-word;
  }
  
  .time {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 6px;
  }
  
  .loading-messages,
  .empty-messages {
    padding: 60px 20px;
  }
  
  .empty-icon {
    font-size: 56px;
  }
}
</style>