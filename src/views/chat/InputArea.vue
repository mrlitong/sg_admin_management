<!-- 输入区域组件 -->
<template>
  <div class="input-area">
    <div v-if="!isConnected" class="connection-warning">
      <span>⚠️ WebSocket连接已断开，正在重连...</span>
      <button @click="reconnect" class="reconnect-btn">手动重连</button>
    </div>
    
    <div class="input-wrapper">
      <textarea 
        ref="textareaRef"
        v-model="inputMessage"
        @keydown.enter.prevent="handleEnterKey"
        placeholder="输入回复内容..."
        rows="3"
        :disabled="isSending"
      ></textarea>
      <div class="input-actions">
        <button 
          @click="clearHistory" 
          class="clear-btn"
          :disabled="isLoading || !currentSessionId"
        >
          {{ isLoading ? '清理中...' : '清理记录' }}
        </button>
        <button 
          @click="openRecharge" 
          class="recharge-btn"
          :disabled="!currentSessionId"
        >
          充值
        </button>
        <button 
          @click="sendMessage" 
          :disabled="!inputMessage.trim() || isSending"
          class="send-btn"
        >
          {{ isSending ? '发送中...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  isConnected: {
    type: Boolean,
    default: true
  },
  isSending: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  currentSessionId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['send-message', 'clear-history', 'reconnect', 'open-recharge']);

const inputMessage = ref('');
const textareaRef = ref(null);

// 处理回车键
const handleEnterKey = async (event) => {
  console.log('Enter key pressed'); // 调试信息
  event.preventDefault();
  await sendMessage();
};

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    console.log('Empty message, not sending'); // 调试信息
    return;
  }
  
  const message = inputMessage.value.trim();
  console.log('Sending message:', message); // 调试信息
  
  emit('send-message', message);
  
  // 清空输入框
  inputMessage.value = '';
  console.log('Message cleared, maintaining focus...'); // 调试信息
  
  // 多种方式确保焦点保持在输入框
  const maintainFocus = () => {
    if (textareaRef.value) {
      console.log('Attempting to focus textarea'); // 调试信息
      textareaRef.value.focus();
      
      // 验证焦点是否成功
      setTimeout(() => {
        if (document.activeElement === textareaRef.value) {
          console.log('Focus maintained successfully');
        } else {
          console.log('Focus lost, active element:', document.activeElement);
        }
      }, 20);
    }
  };
  
  // 1. 立即尝试聚焦
  maintainFocus();
  
  // 2. 使用 nextTick 再次尝试
  await nextTick();
  maintainFocus();
  
  // 3. 延迟再次尝试（解决某些浏览器的异步问题）
  setTimeout(() => {
    maintainFocus();
  }, 50);
  
  // 4. 更长延迟再次尝试（适应慢速设备）
  setTimeout(() => {
    maintainFocus();
  }, 200);
};

// 清理聊天记录
const clearHistory = async () => {
  if (!props.currentSessionId) {
    console.warn('没有选中的会话，无法清理记录');
    alert('请先选择一个会话');
    return;
  }
  
  if (confirm('确定要清理此会话的所有聊天记录吗？此操作不可恢复！')) {
    emit('clear-history');
  }
};

// 重连
const reconnect = () => {
  emit('reconnect');
};

// 打开充值弹窗
const openRecharge = () => {
  emit('open-recharge');
};

// 暴露方法给父组件
defineExpose({
  setInputMessage: (message) => {
    inputMessage.value = message;
  },
  clearInput: () => {
    inputMessage.value = '';
  },
  focusInput: () => {
    if (textareaRef.value) {
      textareaRef.value.focus();
    }
  }
});
</script>

<style scoped>
.input-area {
  padding: 16px;
  border-top: 1px solid var(--border-color-light);
}

.connection-warning {
  background: var(--warning-color);
  border: 1px solid var(--warning-color);
  opacity: 0.1;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--warning-color);
}

.reconnect-btn {
  padding: 4px 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

textarea {
  width: 100%;
  border: 1px solid var(--border-color-base);
  border-radius: 6px;
  padding: 10px;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
}

textarea:focus {
  border-color: var(--primary-color);
}

textarea:disabled {
  background: var(--bg-color-secondary);
  color: var(--info-color);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.clear-btn {
  padding: 8px 12px;
  background: var(--info-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.recharge-btn {
  padding: 8px 12px;
  background: var(--success-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.send-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.send-btn:disabled,
.clear-btn:disabled,
.recharge-btn:disabled {
  background: var(--info-color);
  cursor: not-allowed;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .input-area {
    padding: 8px;
  }
  
  textarea {
    font-size: 16px; /* 防止移动端自动缩放 */
    min-height: 60px;
  }
  
  .input-actions {
    gap: 6px;
  }
  
  .clear-btn,
  .recharge-btn,
  .send-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
}
</style>