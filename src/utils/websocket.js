import config from '../config/index.js';

// WebSocket聊天连接管理类
export class ChatWebSocket {
  constructor(token, userType, callbacks = {}) {
    this.token = token;
    this.userType = userType; // 'user' 或 'customer_service'
    this.callbacks = callbacks;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10; // 增加重连次数
    this.isManualClose = false;
    this.heartbeatInterval = null;
    this.heartbeatTimer = 30000; // 30秒心跳
    this.heartbeatTimeout = 5000; // 5秒pong超时
    this.pongTimer = null; // pong超时定时器
    this.reconnectTimer = null;
    this.lastPingTime = null; // 最后一次ping时间
    this.networkStateListening = false; // 网络状态监听标志
  }

  connect() {
    // 修正用户类型参数名
    const userTypeParam = this.userType === 'customer_service' ? 'customer_service' : 'user';
    // 使用动态配置的WebSocket地址，注意添加 /api 前缀
    const wsUrl = `${config.wsUrl}/api/ws/chat?token=${encodeURIComponent(this.token)}&user_type=${userTypeParam}`;
    
    console.log('WebSocket连接URL:', wsUrl);
    
    // 开始监听网络状态
    this.startNetworkStateListening();
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = (event) => {
        console.log('WebSocket连接成功', { userType: this.userType, token: this.token });
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onOpen?.(event);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket消息解析失败:', error, event.data);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        this.stopHeartbeat();
        this.callbacks.onClose?.(event);
        
        // 根据关闭码智能处理重连
        if (!this.isManualClose) {
          if (event.code === 4001) {
            // 认证失败，不重连
            console.error('认证失败，不再重连');
            this.callbacks.onAuthFailed?.();
          } else if (this.shouldReconnect()) {
            this.scheduleReconnect(event.code);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('达到最大重连次数，停止重连');
            // 继续监听网络状态，等待网络恢复后重连
            if (navigator.onLine) {
              // 如果网络正常但达到最大重连次数，延迟更长时间后再试
              setTimeout(() => {
                if (!this.isManualClose && !this.isConnected()) {
                  console.log('尝试延迟重连...');
                  this.reconnectAttempts = Math.floor(this.maxReconnectAttempts / 2); // 重置为一半
                  this.scheduleReconnect();
                }
              }, 60000); // 1分钟后再试
            }
          }
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        this.callbacks.onError?.(error);
      };
      
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.callbacks.onError?.(error);
      
      // 连接创建失败也尝试重连
      if (!this.isManualClose && this.shouldReconnect()) {
        this.scheduleReconnect();
      }
    }
  }

  shouldReconnect() {
    return this.reconnectAttempts < this.maxReconnectAttempts && navigator.onLine;
  }

  handleMessage(data) {
    const { type, data: messageData } = data;
    
    switch (type) {
      case 'connected':
        console.log('WebSocket连接确认:', messageData);
        this.callbacks.onConnected?.(messageData);
        break;
        
      case 'new_message':
        console.log('收到新消息:', messageData);
        this.callbacks.onNewMessage?.(messageData);
        break;
        
      case 'message_sent':
        console.log('消息发送确认:', messageData);
        this.callbacks.onMessageSent?.(messageData);
        break;
        
      case 'error':
        console.error('WebSocket错误消息:', messageData);
        this.callbacks.onMessageError?.(messageData);
        break;
        
      case 'pong':
        console.log('收到心跳响应');
        this.handlePongResponse();
        this.callbacks.onPong?.();
        break;
        
      case 'session_list_updated':
        console.log('会话列表更新:', messageData);
        this.callbacks.onSessionListUpdated?.(messageData);
        break;
        
      case 'unread_count_updated':
        console.log('未读数量更新:', messageData);
        this.callbacks.onUnreadCountUpdated?.(messageData);
        break;
        
      case 'new_session_created':
        console.log('新会话创建:', messageData);
        this.callbacks.onNewSessionCreated?.(messageData);
        break;
        
      case 'session_status_changed':
        console.log('会话状态变更:', messageData);
        this.callbacks.onSessionStatusChanged?.(messageData);
        break;
        
      case 'unread_counts_synced':
        console.log('未读数量全量同步:', messageData);
        this.callbacks.onUnreadCountsSynced?.(messageData);
        break;
        
      case 'unread_count_absolute_update':
        console.log('未读数量绝对值更新:', messageData);
        this.callbacks.onUnreadCountAbsoluteUpdate?.(messageData);
        break;
        
      // 新增的WebSocket事件类型
      case 'sessions_response':
        console.log('收到会话列表响应:', messageData);
        this.callbacks.onSessionsResponse?.(messageData);
        break;
        
      case 'sessions_count_response':
        console.log('收到会话数量响应:', messageData);
        this.callbacks.onSessionsCountResponse?.(messageData);
        break;
        
      case 'session_read_success':
        console.log('会话标记已读成功:', messageData);
        this.callbacks.onSessionReadSuccess?.(messageData);
        break;
        
      case 'session_importance_updated':
        console.log('会话重要性更新成功:', messageData);
        this.callbacks.onSessionImportanceUpdated?.(messageData);
        break;
        
      case 'session_ended':
        console.log('会话结束成功:', messageData);
        this.callbacks.onSessionEnded?.(messageData);
        break;
        
      case 'chat_history_cleared':
        console.log('聊天记录清理成功:', messageData);
        this.callbacks.onChatHistoryCleared?.(messageData);
        break;
        
      case 'unread_count_response':
        console.log('收到未读数响应:', messageData);
        this.callbacks.onUnreadCountResponse?.(messageData);
        break;
        
      case 'unread_count_recalculated':
        console.log('未读数重新计算完成:', messageData);
        this.callbacks.onUnreadCountRecalculated?.(messageData);
        break;
        
      case 'cs_status_update_success':
        console.log('客服状态更新成功:', messageData);
        this.callbacks.onCsStatusUpdateSuccess?.(messageData);
        break;
        
      case 'cs_status_updated':
        console.log('收到客服状态广播更新:', messageData);
        this.callbacks.onCsStatusUpdated?.(messageData);
        break;
        
      case 'cs_status_response':
        console.log('收到客服状态响应:', messageData);
        this.callbacks.onCsStatusResponse?.(messageData);
        break;
        
      case 'chat_history_response':
        console.log('收到聊天历史响应:', messageData);
        this.callbacks.onChatHistoryResponse?.(messageData);
        break;
        
      default:
        console.warn('未知的WebSocket消息类型:', type, messageData);
        break;
    }
  }

  sendMessage(sessionId, content, contentType = 'text') {
    if (!this.isConnected()) {
      console.error('WebSocket未连接，无法发送消息');
      return false;
    }

    const message = {
      type: 'message',
      data: {
        session_id: sessionId,
        content: content,
        content_type: contentType
      }
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('WebSocket消息已发送:', message);
      return true;
    } catch (error) {
      console.error('WebSocket发送消息失败:', error);
      return false;
    }
  }

  sendPing() {
    if (!this.isConnected()) {
      return false;
    }

    try {
      // 清除之前的pong超时定时器
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
      }

      // 记录ping发送时间
      this.lastPingTime = Date.now();
      
      // 发送ping
      this.ws.send(JSON.stringify({ type: 'ping' }));
      console.log('发送心跳ping');
      
      // 设置pong超时定时器
      this.pongTimer = setTimeout(() => {
        console.error('心跳响应超时，触发重连');
        // 心跳超时，认为连接已断开，触发重连
        this.ws.close();
      }, this.heartbeatTimeout);
      
      return true;
    } catch (error) {
      console.error('发送心跳失败:', error);
      return false;
    }
  }

  handlePongResponse() {
    // 清除pong超时定时器
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    
    // 计算延迟
    if (this.lastPingTime) {
      const latency = Date.now() - this.lastPingTime;
      console.log(`心跳延迟: ${latency}ms`);
      
      // 如果延迟过高，可以触发警告
      if (latency > 3000) {
        console.warn('WebSocket连接延迟过高:', latency);
        this.callbacks.onHighLatency?.(latency);
      }
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, this.heartbeatTimer);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // 清除pong超时定时器
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  scheduleReconnect(closeCode) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    
    // 根据关闭码调整延迟策略
    let delay;
    if (closeCode >= 4000 && closeCode < 5000) {
      // 客户端错误，延迟更长时间
      delay = Math.min(5000 * this.reconnectAttempts, 60000);
    } else {
      // 正常的指数退避
      delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    }
    
    console.log(`WebSocket将在${delay}ms后进行第${this.reconnectAttempts}次重连 (关闭码: ${closeCode})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isManualClose && navigator.onLine) {
        console.log(`开始第${this.reconnectAttempts}次重连...`);
        this.connect();
      } else if (!navigator.onLine) {
        console.log('网络离线，等待网络恢复后重连');
      }
    }, delay);
  }

  startNetworkStateListening() {
    if (this.networkStateListening) return;
    
    this.networkStateListening = true;
    
    // 监听网络在线事件
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  stopNetworkStateListening() {
    if (!this.networkStateListening) return;
    
    this.networkStateListening = false;
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    console.log('网络已恢复');
    
    // 如果当前未连接且不是手动关闭，立即尝试重连
    if (!this.isConnected() && !this.isManualClose) {
      console.log('网络恢复，尝试重新连接WebSocket');
      // 重置重连次数
      this.reconnectAttempts = 0;
      this.connect();
    }
  }

  handleOffline = () => {
    console.log('网络已断开');
    
    // 清除重连定时器，等待网络恢复
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.callbacks.onOffline?.();
  }

  reconnect() {
    if (this.isManualClose) return;
    
    this.close(false);
    this.reconnectAttempts = 0;
    this.connect();
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'DISCONNECTING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  close(manual = true) {
    this.isManualClose = manual;
    this.stopHeartbeat();
    this.stopNetworkStateListening();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  updateToken(newToken) {
    this.token = newToken;
    
    // 如果当前已连接，需要重新连接以使用新token
    if (this.isConnected()) {
      console.log('Token已更新，重新建立WebSocket连接');
      this.reconnect();
    }
  }
}

export default ChatWebSocket;