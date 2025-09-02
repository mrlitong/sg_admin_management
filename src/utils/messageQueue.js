// 消息状态枚举
export const MessageStatus = {
  PENDING: 'pending',      // 待发送
  SENDING: 'sending',      // 发送中
  SENT: 'sent',           // 已发送
  DELIVERED: 'delivered',  // 已送达
  READ: 'read',           // 已读
  FAILED: 'failed'        // 发送失败
};

// 消息队列管理类
export class MessageQueue {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 初始重试延迟
    this.queue = [];
    this.processing = false;
    this.websocket = null;
    this.httpFallback = null;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.persistKey = options.persistKey || 'message_queue';
    
    // 从本地存储恢复未发送的消息
    this.loadFromStorage();
  }

  // 设置WebSocket实例
  setWebSocket(websocket) {
    this.websocket = websocket;
  }

  // 设置HTTP降级函数
  setHttpFallback(httpFallback) {
    this.httpFallback = httpFallback;
  }

  // 添加消息到队列
  async addMessage(message) {
    const queuedMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: MessageStatus.PENDING,
      retryCount: 0,
      timestamp: Date.now(),
      lastError: null
    };

    this.queue.push(queuedMessage);
    this.saveToStorage();
    
    // 通知状态变更
    this.onStatusChange(queuedMessage);
    
    // 立即开始处理队列
    await this.processQueue();
    
    return queuedMessage;
  }

  // 处理队列中的消息
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // 处理所有待发送的消息
      for (const message of this.queue) {
        if (message.status === MessageStatus.PENDING || 
            (message.status === MessageStatus.FAILED && message.retryCount < this.maxRetries)) {
          await this.sendMessage(message);
        }
      }

      // 清理已发送的消息
      this.cleanupSentMessages();
    } finally {
      this.processing = false;
    }
  }

  // 发送单个消息
  async sendMessage(message) {
    message.status = MessageStatus.SENDING;
    this.onStatusChange(message);

    try {
      let success = false;

      // 优先尝试WebSocket
      if (this.websocket && this.websocket.isConnected()) {
        success = await this.sendViaWebSocket(message);
      }

      // WebSocket失败或不可用，尝试HTTP
      if (!success && this.httpFallback) {
        success = await this.sendViaHttp(message);
      }

      if (success) {
        message.status = MessageStatus.SENT;
        message.sentAt = Date.now();
        console.log('消息发送成功:', message.id);
      } else {
        throw new Error('所有发送方式都失败');
      }

    } catch (error) {
      message.retryCount++;
      message.lastError = error.message;
      
      if (message.retryCount >= this.maxRetries) {
        message.status = MessageStatus.FAILED;
        console.error('消息发送失败，已达最大重试次数:', message.id, error);
      } else {
        message.status = MessageStatus.PENDING;
        // 计算重试延迟（指数退避）
        const delay = this.retryDelay * Math.pow(2, message.retryCount - 1);
        console.log(`消息${message.id}将在${delay}ms后重试（第${message.retryCount}次）`);
        
        setTimeout(() => {
          this.processQueue();
        }, delay);
      }
    }

    this.onStatusChange(message);
    this.saveToStorage();
  }

  // 通过WebSocket发送消息
  async sendViaWebSocket(message) {
    try {
      const success = this.websocket.sendMessage(
        message.session_id,
        message.content,
        message.content_type
      );
      return success;
    } catch (error) {
      console.error('WebSocket发送失败:', error);
      return false;
    }
  }

  // 通过HTTP发送消息
  async sendViaHttp(message) {
    try {
      await this.httpFallback({
        session_id: message.session_id,
        content: message.content,
        content_type: message.content_type
      });
      return true;
    } catch (error) {
      console.error('HTTP发送失败:', error);
      return false;
    }
  }

  // 更新消息状态
  updateMessageStatus(messageId, status) {
    const message = this.queue.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      this.onStatusChange(message);
      this.saveToStorage();
      
      // 如果有消息被标记为已送达或已读，可以清理
      if (status === MessageStatus.DELIVERED || status === MessageStatus.READ) {
        this.cleanupSentMessages();
      }
    }
  }

  // 清理已发送的消息
  cleanupSentMessages() {
    const cutoffTime = Date.now() - 60000; // 保留1分钟内的已发送消息
    
    this.queue = this.queue.filter(message => {
      // 保留未发送、发送中、失败的消息
      if ([MessageStatus.PENDING, MessageStatus.SENDING, MessageStatus.FAILED].includes(message.status)) {
        return true;
      }
      
      // 保留1分钟内的已发送消息
      if (message.status === MessageStatus.SENT && message.sentAt > cutoffTime) {
        return true;
      }
      
      return false;
    });
    
    this.saveToStorage();
  }

  // 保存到本地存储
  saveToStorage() {
    try {
      // 只保存未发送的消息
      const pendingMessages = this.queue.filter(m => 
        [MessageStatus.PENDING, MessageStatus.FAILED].includes(m.status)
      );
      localStorage.setItem(this.persistKey, JSON.stringify(pendingMessages));
    } catch (error) {
      console.error('保存消息队列失败:', error);
    }
  }

  // 从本地存储加载
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.persistKey);
      if (stored) {
        const messages = JSON.parse(stored);
        this.queue = messages.map(m => ({
          ...m,
          status: MessageStatus.PENDING,
          retryCount: 0 // 重置重试次数
        }));
        console.log(`从本地存储恢复了${this.queue.length}条未发送消息`);
      }
    } catch (error) {
      console.error('加载消息队列失败:', error);
    }
  }

  // 清空队列
  clear() {
    this.queue = [];
    localStorage.removeItem(this.persistKey);
  }

  // 获取队列状态
  getStatus() {
    const stats = {
      total: this.queue.length,
      pending: 0,
      sending: 0,
      sent: 0,
      failed: 0
    };

    this.queue.forEach(message => {
      switch (message.status) {
        case MessageStatus.PENDING:
          stats.pending++;
          break;
        case MessageStatus.SENDING:
          stats.sending++;
          break;
        case MessageStatus.SENT:
        case MessageStatus.DELIVERED:
        case MessageStatus.READ:
          stats.sent++;
          break;
        case MessageStatus.FAILED:
          stats.failed++;
          break;
      }
    });

    return stats;
  }

  // 获取失败的消息
  getFailedMessages() {
    return this.queue.filter(m => m.status === MessageStatus.FAILED);
  }

  // 重试失败的消息
  retryFailedMessages() {
    const failedMessages = this.getFailedMessages();
    failedMessages.forEach(message => {
      message.status = MessageStatus.PENDING;
      message.retryCount = 0;
      message.lastError = null;
    });
    
    if (failedMessages.length > 0) {
      console.log(`重试${failedMessages.length}条失败的消息`);
      this.processQueue();
    }
  }
}

export default MessageQueue;