// 聊天系统状态管理 - 支持HTTP+WebSocket混合架构
import { defineStore } from 'pinia';
import { ChatWebSocket } from '@/utils/websocket';
import { MessageQueue, MessageStatus } from '@/utils/messageQueue';
import { userChatAPI, customerServiceAPI } from '@/utils/api';
// 简单的调试函数
const debugLog = (...args) => console.log('[Chat Store]', ...args);
const errorLog = (...args) => console.error('[Chat Store Error]', ...args);
const validateCSInfo = (info) => {
  return info && info.cs_account && info.token;
};

export const useChatStore = defineStore('chat', {
  state: () => ({
    // 连接状态
    isConnected: false,
    userType: null, // 'user' 或 'customer_service'
    userId: null,
    
    // WebSocket实例
    websocket: null,
    
    // 会话信息
    currentSession: null,
    sessions: [], // 客服端会话列表
    sessionsTotal: 0, // 会话总数
    currentPage: 1, // 当前页码
    pageSize: 10, // 每页大小
    
    // 消息相关
    messages: [],
    messageMap: new Map(), // 消息ID映射，用于去重
    unreadCount: 0,
    totalUnreadCount: 0, // 总未读消息数
    sessionUnreadMap: new Map(), // 各会话的未读消息数映射
    
    // 加载状态
    isLoading: false,
    isSending: false,
    isReconnecting: false,
    isInitializing: false, // 是否正在初始化（WebSocket连接+首次加载会话列表）
    isInitialized: false, // 是否已完成初始化
    
    // 错误信息
    lastError: null,
    
    // 客服信息
    csInfo: null,
    csStatus: 'offline', // online, busy, offline
    
    // 用户信息
    userToken: null,
    
    // 会话列表滚动位置记录
    sessionListScrollPosition: 0,
    selectedSessionId: null, // 当前选中的会话ID
    preserveScrollPosition: false, // 是否需要保持滚动位置
    
    // 消息队列
    messageQueue: null
  }),

  getters: {
    // 获取连接状态文本
    connectionStatusText: (state) => {
      if (state.isReconnecting) return '重连中...';
      return state.isConnected ? '已连接' : '未连接';
    },
    
    // 获取当前会话的消息
    currentSessionMessages: (state) => {
      if (!state.currentSession) {
        console.log('currentSessionMessages - 没有当前会话');
        return [];
      }
      
      const sessionMessages = state.messages.filter(msg => 
        msg.session_id === state.currentSession.session_id
      );
      
      console.log('currentSessionMessages - 计算结果:', {
        currentSessionId: state.currentSession.session_id,
        totalMessages: state.messages.length,
        sessionMessages: sessionMessages.length,
        allMessages: state.messages.map(m => ({ id: m.message_id, sessionId: m.session_id }))
      });
      
      return sessionMessages;
    },
    
    // 获取未读会话数量
    unreadSessionsCount: (state) => {
      if (state.userType === 'customer_service') {
        return state.sessions.filter(session => session.cs_unread_count > 0).length;
      } else {
        return state.sessions.filter(session => session.unread_count > 0).length;
      }
    },
    
    // 获取总未读消息数
    totalUnreadMessages: (state) => {
      if (state.userType === 'customer_service') {
        return state.sessions.reduce((total, session) => total + (session.cs_unread_count || 0), 0);
      } else {
        return state.sessions.reduce((total, session) => total + (session.unread_count || 0), 0);
      }
    },
    
    // 获取指定会话的未读消息数
    getSessionUnreadCount: (state) => (sessionId) => {
      const session = state.sessions.find(s => s.session_id === sessionId);
      if (!session) return 0;
      
      if (state.userType === 'customer_service') {
        return session.cs_unread_count || 0;
      } else {
        return session.unread_count || 0;
      }
    },
    
    // 检查是否为客服
    isCustomerService: (state) => state.userType === 'customer_service',
    
    // 检查是否为用户
    isUser: (state) => state.userType === 'user',

    // 分页相关计算属性
    totalPages: (state) => {
      return Math.max(1, Math.ceil(state.sessionsTotal / state.pageSize));
    },

    // 是否有上一页
    hasPreviousPage: (state) => {
      return state.currentPage > 1;
    },

    // 是否有下一页
    hasNextPage: (state, getters) => {
      return state.currentPage < getters.totalPages;
    }
  },

  actions: {
    // 初始化WebSocket连接
    initWebSocket(token, userType) {
      if (this.websocket) {
        this.websocket.close();
      }

      this.userType = userType;
      this.userToken = userType === 'user' ? token : null;
      
      // 确保客服信息正确设置
      if (userType === 'customer_service') {
        this.csInfo = { cs_account: token };
        console.log('客服信息已设置:', this.csInfo);
      }

      // 初始化消息队列
      if (!this.messageQueue) {
        this.messageQueue = new MessageQueue({
          maxRetries: 3,
          retryDelay: 1000,
          persistKey: `message_queue_${userType}_${token}`,
          onStatusChange: (message) => {
            // 更新消息状态
            this.updateMessageStatus(message);
          }
        });
      }

      this.websocket = new ChatWebSocket(token, userType, {
        onOpen: this.handleWebSocketOpen,
        onClose: this.handleWebSocketClose,
        onError: this.handleWebSocketError,
        onConnected: this.handleWebSocketConnected,
        onNewMessage: this.handleNewMessage,
        onMessageSent: this.handleMessageSent,
        onMessageError: this.handleMessageError,
        onPong: this.handlePong,
        // 现有的WebSocket事件处理
        onSessionListUpdated: this.handleSessionListUpdated,
        onUnreadCountUpdated: this.handleUnreadCountUpdated,
        onNewSessionCreated: this.handleNewSessionCreated,
        onSessionStatusChanged: this.handleSessionStatusChanged,
        onUnreadCountsSynced: this.handleUnreadCountsSynced,
        onUnreadCountAbsoluteUpdate: this.handleUnreadCountAbsoluteUpdate,
        // 新增的WebSocket事件处理
        onSessionsResponse: this.handleSessionsResponse,
        onSessionsCountResponse: this.handleSessionsCountResponse,
        onSessionReadSuccess: this.handleSessionReadSuccess,
        onSessionImportanceUpdated: this.handleSessionImportanceUpdated,
        onSessionEnded: this.handleSessionEnded,
        onChatHistoryCleared: this.handleChatHistoryCleared,
        onUnreadCountResponse: this.handleUnreadCountResponse,
        onUnreadCountRecalculated: this.handleUnreadCountRecalculated,
        onCsStatusUpdateSuccess: this.handleCsStatusUpdateSuccess,
        onCsStatusUpdated: this.handleCsStatusUpdated,
        onCsStatusResponse: this.handleCsStatusResponse,
        onChatHistoryResponse: this.handleChatHistoryResponse
      });

      this.websocket.connect();
    },

    // 带完整事件监听的WebSocket初始化
    initWebSocketWithEvents(token, userType) {
      this.initWebSocket(token, userType);
    },

    // 完整的客服工作台初始化（WebSocket连接 + 首次数据加载）
    async initializeCustomerService(csAccount) {
      console.log('=== 开始客服工作台完整初始化 ===');
      this.isInitializing = true;
      this.isInitialized = false;
      this.lastError = null;

      try {
        // 1. 初始化WebSocket连接
        this.initWebSocketWithEvents(csAccount, 'customer_service');
        
        // 2. 等待WebSocket连接成功（最多等待5秒）
        let waitCount = 0;
        const maxWaitTime = 50; // 5秒
        
        while (!this.isConnected && waitCount < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        if (!this.isConnected) {
          throw new Error('WebSocket连接超时，请检查网络连接');
        }
        
        // 3. 如果WebSocket连接成功但还没有初始化完成，等待handleWebSocketConnected完成
        waitCount = 0;
        while (this.isInitializing && !this.isInitialized && waitCount < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        // 4. 如果handleWebSocketConnected没有自动加载，手动加载
        if (!this.isInitialized) {
          console.log('手动加载会话列表...');
          await this.loadSessions('all', 'all', 1, false);
          this.isInitialized = true;
        }
        
        console.log('=== 客服工作台初始化完成 ===');
        return true;
        
      } catch (error) {
        console.error('=== 客服工作台初始化失败 ===', error);
        this.lastError = error.message || '初始化失败';
        this.isInitialized = false;
        return false;
      } finally {
        this.isInitializing = false;
      }
    },

    // WebSocket事件处理
    handleWebSocketOpen() {
      this.isConnected = true;
      this.isReconnecting = false;
      this.lastError = null;
      console.log('WebSocket连接成功');
    },

    handleWebSocketClose(event) {
      this.isConnected = false;
      if (!event.wasClean) {
        this.isReconnecting = true;
      }
      console.log('WebSocket连接关闭');
    },

    handleWebSocketError(error) {
      this.lastError = error.message || 'WebSocket连接错误';
      console.error('WebSocket错误:', error);
    },

    async handleWebSocketConnected(data) {
      this.userId = data.user_id;
      console.log(`${this.userType}连接确认:`, data);
      
      // 设置消息队列的WebSocket实例和HTTP降级函数
      if (this.messageQueue) {
        this.messageQueue.setWebSocket(this.websocket);
        
        // 设置HTTP降级函数
        const httpFallback = async (messageData) => {
          if (this.userType === 'customer_service') {
            await customerServiceAPI.sendMessage(
              this.csInfo.cs_account,
              messageData.session_id,
              messageData.content,
              messageData.content_type
            );
          } else {
            await userChatAPI.sendMessage(
              this.userToken,
              messageData.session_id,
              messageData.content,
              messageData.content_type
            );
          }
        };
        this.messageQueue.setHttpFallback(httpFallback);
        
        // 处理队列中的待发送消息
        this.messageQueue.processQueue();
      }
      
      // 如果是客服用户且正在初始化，则自动加载会话列表
      if (this.userType === 'customer_service' && this.isInitializing) {
        try {
          console.log('WebSocket连接成功，开始自动加载会话列表...');
          await this.loadSessions('all', 'all', 1, false);
          this.isInitialized = true;
          console.log('初始化完成：WebSocket连接成功 + 会话列表加载完成');
        } catch (error) {
          console.error('初始化过程中加载会话列表失败:', error);
          this.lastError = '初始化失败：无法加载会话列表';
        } finally {
          this.isInitializing = false;
        }
      }
    },

    handleNewMessage(message) {
      this.addMessage(message);
    },

    handleMessageSent(data) {
      // 更新本地消息状态
      const localMsg = this.messages.find(m => 
        m.content === data.content && 
        m.session_id === data.session_id &&
        m.sender_type === this.userType === 'customer_service' ? 'customer_service' : 'user'
      );
      
      if (localMsg) {
        localMsg.message_id = data.message_id;
        localMsg.create_time = data.timestamp;
        
        // 更新消息队列中的消息状态
        if (this.messageQueue && localMsg.status) {
          this.messageQueue.updateMessageStatus(localMsg.message_id, MessageStatus.DELIVERED);
        }
      }
      
      console.log('消息发送确认:', data);
    },

    handleMessageError(error) {
      this.lastError = error.message || '消息发送失败';
      console.error('消息错误:', error);
    },

    handlePong() {
      // 心跳响应处理
    },

    // WebSocket消息发送工具函数 - 改进版本，解决并发请求问题
    async sendWebSocketMessage(messageData, expectedResponseType = null, timeout = 10000) {
      return new Promise((resolve, reject) => {
        if (!this.isConnected || !this.websocket || !this.websocket.ws) {
          reject(new Error('WebSocket未连接'));
          return;
        }

        const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        messageData.request_id = requestId;

        debugLog('sendWebSocketMessage', `发送请求: ${messageData.type}, ID: ${requestId}`, {
          expectedResponseType,
          timeout,
          connectionState: this.websocket.getConnectionState()
        });

        // 如果不需要等待响应，直接发送
        if (!expectedResponseType) {
          try {
            this.websocket.ws.send(JSON.stringify(messageData));
            debugLog('sendWebSocketMessage', `消息已发送 (无需响应): ${messageData.type}`);
            resolve(true);
          } catch (error) {
            errorLog('sendWebSocketMessage', `发送失败: ${messageData.type}`, error);
            reject(error);
          }
          return;
        }

        // 需要等待响应的情况 - 使用事件监听机制而不是替换处理器
        let isResolved = false;
        let timeoutHandle;

        // 创建专门的响应处理函数
        const handleResponse = (event) => {
          if (isResolved) return; // 防止重复处理

          try {
            const response = JSON.parse(event.data);
            const responseType = response.type;
            const responseRequestId = response.request_id;

            debugLog('sendWebSocketMessage', `收到消息: ${responseType}, ID: ${responseRequestId}`, {
              expected: expectedResponseType,
              requestId: requestId,
              match: responseRequestId === requestId
            });

            // 检查是否是我们等待的响应
            if (responseRequestId === requestId) {
              if (responseType === expectedResponseType) {
                clearTimeout(timeoutHandle);
                this.websocket.ws.removeEventListener('message', handleResponse);
                isResolved = true;
                debugLog('sendWebSocketMessage', `请求成功: ${messageData.type} -> ${expectedResponseType}`);
                resolve(response);
                return;
              } else if (responseType === 'error') {
                clearTimeout(timeoutHandle);
                this.websocket.ws.removeEventListener('message', handleResponse);
                isResolved = true;
                const errorMsg = response.data?.message || '服务器错误';
                errorLog('sendWebSocketMessage', `请求失败: ${messageData.type}`, errorMsg);
                reject(new Error(errorMsg));
                return;
              }
            }

            // 让原有的消息处理机制继续处理这个消息
            if (this.websocket.ws.onmessage) {
              this.websocket.ws.onmessage(event);
            }
          } catch (e) {
            debugLog('sendWebSocketMessage', `消息解析失败:`, e);
            // 让原有的消息处理机制继续处理这个消息
            if (this.websocket.ws.onmessage) {
              this.websocket.ws.onmessage(event);
            }
          }
        };

        // 设置超时
        timeoutHandle = setTimeout(() => {
          if (!isResolved) {
            this.websocket.ws.removeEventListener('message', handleResponse);
            isResolved = true;
            errorLog('sendWebSocketMessage', `请求超时: ${messageData.type} -> ${expectedResponseType}`, {
              requestId,
              timeout,
              connectionState: this.websocket.getConnectionState()
            });
            reject(new Error(`WebSocket请求超时: ${expectedResponseType} (ID: ${requestId})`));
          }
        }, timeout);

        // 添加事件监听器（而不是替换onmessage）
        this.websocket.ws.addEventListener('message', handleResponse);

        // 发送消息
        try {
          this.websocket.ws.send(JSON.stringify(messageData));
          debugLog('sendWebSocketMessage', `消息已发送: ${messageData.type}, ID: ${requestId}`);
        } catch (error) {
          clearTimeout(timeoutHandle);
          this.websocket.ws.removeEventListener('message', handleResponse);
          isResolved = true;
          errorLog('sendWebSocketMessage', `发送失败: ${messageData.type}`, error);
          reject(error);
        }
      });
    },

    // WebSocket事件处理器 - 重构版本（避免破坏分页）
    handleSessionListUpdated(data) {
      debugLog('handleSessionListUpdated', '📨 收到会话列表更新事件', data);
      
      const { change_type, session_data } = data;
      
      // 🚦 分页模式下的谨慎处理策略
      const isInPaginatedMode = this.sessionsTotal > this.pageSize;
      
      switch (change_type) {
        case 'created':
          // 🆕 新会话创建处理
          const existingIndex = this.sessions.findIndex(s => s.session_id === session_data.session_id);
          if (existingIndex === -1) {
            if (isInPaginatedMode) {
              // 📋 分页模式：不直接修改当前页面数据，只更新总数
              this.sessionsTotal += 1;
              debugLog('handleSessionListUpdated', `🔢 分页模式：新会话仅更新总数至 ${this.sessionsTotal}，不修改当前页`);
              
              // 📮 提示用户有新会话（可选）
              // this.$emit('new-session-notification', session_data);
            } else {
              // 📝 非分页模式：正常添加到列表顶部
              this.sessions.unshift(session_data);
              this.sessionsTotal += 1;
              debugLog('handleSessionListUpdated', `✅ 新会话已添加到列表顶部，总数：${this.sessionsTotal}`);
            }
          } else {
            debugLog('handleSessionListUpdated', '⚠️ 会话已存在，跳过重复添加');
          }
          break;
          
        case 'updated':
          // 🔄 会话信息更新（安全操作，不影响分页）
          const updateIndex = this.sessions.findIndex(s => s.session_id === session_data.session_id);
          if (updateIndex !== -1) {
            this.sessions[updateIndex] = { ...this.sessions[updateIndex], ...session_data };
            debugLog('handleSessionListUpdated', '✅ 会话信息已更新');
          } else {
            debugLog('handleSessionListUpdated', '⚠️ 要更新的会话不在当前页，跳过更新');
          }
          break;
          
        case 'status_changed':
          // 📊 会话状态变更（安全操作）
          const statusIndex = this.sessions.findIndex(s => s.session_id === session_data.session_id);
          if (statusIndex !== -1) {
            this.sessions[statusIndex].status = session_data.status;
            debugLog('handleSessionListUpdated', '✅ 会话状态已更新');
          } else {
            debugLog('handleSessionListUpdated', '⚠️ 要更新状态的会话不在当前页');
          }
          break;
          
        default:
          debugLog('handleSessionListUpdated', `⚠️ 未知的变更类型: ${change_type}`);
      }
      
      // 🔍 分页一致性验证（非关键操作）
      if (isInPaginatedMode) {
        this.validatePaginationConsistency();
      }
    },

    handleUnreadCountUpdated(data) {
      debugLog('handleUnreadCountUpdated', '收到未读数更新', data);
      
      const { session_id, unread_count_delta } = data;
      
      // 更新本地未读数量
      this.updateUnreadCount(session_id, unread_count_delta);
    },

    handleNewSessionCreated(sessionData) {
      debugLog('handleNewSessionCreated', '收到新会话创建通知', sessionData);
      
      // 检查会话是否已存在，避免重复添加
      const existingIndex = this.sessions.findIndex(s => s.session_id === sessionData.session_id);
      if (existingIndex === -1) {
        this.sessions.unshift(sessionData);
        debugLog('handleNewSessionCreated', '新会话已添加到列表顶部');
      }
    },

    handleSessionStatusChanged(data) {
      debugLog('handleSessionStatusChanged', '收到会话状态变更', data);
      
      const { session_id, status } = data;
      const session = this.sessions.find(s => s.session_id === session_id);
      if (session) {
        session.status = status;
        debugLog('handleSessionStatusChanged', `会话 ${session_id} 状态已更新为 ${status}`);
      }
    },

    // 新增的WebSocket事件处理器
    handleSessionsResponse(data) {
      debugLog('handleSessionsResponse', '收到会话列表响应', data);
      // 这个在loadSessions中通过Promise处理，不需要额外处理
    },

    handleSessionsCountResponse(data) {
      debugLog('handleSessionsCountResponse', '收到会话数量响应', data);
      // 这个在getSessionsCount中通过Promise处理，不需要额外处理
    },

    handleSessionReadSuccess(data) {
      debugLog('handleSessionReadSuccess', '会话标记已读成功', data);
    },

    handleSessionImportanceUpdated(data) {
      debugLog('handleSessionImportanceUpdated', '会话重要性更新成功', data);
    },

    handleSessionEnded(data) {
      debugLog('handleSessionEnded', '会话结束成功', data);
    },

    handleChatHistoryCleared(data) {
      debugLog('handleChatHistoryCleared', '聊天记录清理成功', data);
    },

    handleUnreadCountResponse(data) {
      debugLog('handleUnreadCountResponse', '收到未读数响应', data);
    },

    handleUnreadCountRecalculated(data) {
      debugLog('handleUnreadCountRecalculated', '未读数重新计算完成', data);
    },

    handleCsStatusUpdateSuccess(data) {
      debugLog('handleCsStatusUpdateSuccess', '客服状态更新成功', data);
    },

    handleCsStatusUpdated(data) {
      debugLog('handleCsStatusUpdated', '收到客服状态广播更新', data);
      // 可以在这里更新其他客服的状态显示
    },

    handleCsStatusResponse(data) {
      debugLog('handleCsStatusResponse', '收到客服状态响应', data);
    },

    handleChatHistoryResponse(data) {
      debugLog('handleChatHistoryResponse', '收到聊天历史响应', data);
      // 这个在getChatHistory中通过Promise处理，不需要额外处理
    },

    // 添加消息到列表（去重处理）
    addMessage(message) {
      console.log('addMessage - 尝试添加消息:', message); // 调试日志
      
      // 检查消息基本结构
      if (!message || !message.message_id) {
        console.warn('addMessage - 消息缺少必要字段:', message);
        return;
      }
      
      // 检查消息是否已存在
      if (this.messageMap.has(message.message_id)) {
        console.log('addMessage - 消息已存在，跳过:', message.message_id);
        return;
      }

      // 添加时间戳处理
      const processedMessage = {
        ...message,
        timestamp: message.create_time ? new Date(message.create_time) : new Date(),
        // 确保必要字段存在，但保持原有的session_id
        sender_type: message.sender_type || 'user',
        content: message.content || ''
      };
      
      // 如果消息没有session_id，尝试使用当前会话的session_id
      if (!processedMessage.session_id) {
        if (this.currentSession && this.currentSession.session_id) {
          console.warn('addMessage - 消息缺少session_id，使用当前会话ID:', this.currentSession.session_id);
          processedMessage.session_id = this.currentSession.session_id;
        } else {
          console.warn('addMessage - 消息缺少session_id且无当前会话:', processedMessage);
        }
      }

      this.messages.push(processedMessage);
      this.messageMap.set(message.message_id, processedMessage);

      // 排序消息
      this.messages.sort((a, b) => {
        const timeA = a.create_time ? new Date(a.create_time) : new Date(0);
        const timeB = b.create_time ? new Date(b.create_time) : new Date(0);
        return timeA - timeB;
      });

      console.log('addMessage - 成功添加消息，当前消息总数:', this.messages.length); // 调试日志

      // 如果是接收的消息且不是当前用户发送的，增加未读计数
      if (message.sender_id !== this.userId) {
        this.updateUnreadCount(message.session_id, 1);
      }
    },

    // 发送消息（优先使用WebSocket，降级到HTTP）
    async sendMessage(content, contentType = 'text') {
      if (!this.currentSession) {
        throw new Error('没有活跃的会话');
      }

      // 使用消息队列发送消息
      if (this.messageQueue) {
        const message = {
          session_id: this.currentSession.session_id,
          sender_type: this.userType === 'customer_service' ? 'customer_service' : 'user',
          sender_id: this.userId,
          content: content,
          content_type: contentType,
          create_time: new Date().toISOString(),
          timestamp: new Date()
        };

        // 乐观UI更新：立即添加消息到本地
        const tempMessage = {
          ...message,
          message_id: 'temp_' + Date.now(),
          status: MessageStatus.PENDING
        };
        
        this.addMessage(tempMessage);

        try {
          // 添加到消息队列
          const queuedMessage = await this.messageQueue.addMessage(message);
          
          // 更新临时消息ID为队列消息ID
          const index = this.messages.findIndex(m => m.message_id === tempMessage.message_id);
          if (index >= 0) {
            this.messages[index].message_id = queuedMessage.id;
            this.messageMap.delete(tempMessage.message_id);
            this.messageMap.set(queuedMessage.id, this.messages[index]);
          }
          
          debugLog('sendMessage', '消息已加入队列', queuedMessage);
          return true;
        } catch (error) {
          // 发送失败，移除乐观更新的消息
          this.messages = this.messages.filter(m => m.message_id !== tempMessage.message_id);
          this.messageMap.delete(tempMessage.message_id);
          
          errorLog('sendMessage', '消息加入队列失败', error);
          throw error;
        }
      } else {
        // 降级到原来的发送逻辑（如果消息队列未初始化）
        const tempMessage = {
          message_id: 'temp_' + Date.now(),
          session_id: this.currentSession.session_id,
          sender_type: this.userType === 'customer_service' ? 'customer_service' : 'user',
          sender_id: this.userId,
          content: content,
          content_type: contentType,
          create_time: new Date().toISOString(),
          timestamp: new Date()
        };
        
        this.addMessage(tempMessage);

        try {
          // 首先尝试WebSocket发送
          if (this.websocket && this.websocket.isConnected()) {
            const success = this.websocket.sendMessage(
              this.currentSession.session_id, 
              content, 
              contentType
            );
            
            if (success) {
              debugLog('sendMessage', 'WebSocket发送成功');
              return true;
            }
          }

          // WebSocket失败或未连接，使用HTTP API发送
          debugLog('sendMessage', '使用HTTP API发送消息');
          
          if (this.userType === 'customer_service') {
            await customerServiceAPI.sendMessage(
              this.csInfo.cs_account,
              this.currentSession.session_id,
              content,
              contentType
            );
          } else {
            await userChatAPI.sendMessage(
              this.userToken,
              this.currentSession.session_id,
              content,
              contentType
            );
          }
          
          debugLog('sendMessage', 'HTTP API发送成功');
          return true;
        } catch (error) {
          // 发送失败，移除乐观更新的消息
          this.messages = this.messages.filter(m => m.message_id !== tempMessage.message_id);
          this.messageMap.delete(tempMessage.message_id);
          
          errorLog('sendMessage', '消息发送失败', error);
          throw error;
        }
      }
    },

    // 创建会话
    async createSession(token, guestId = null, deviceInfo = null) {
      try {
        this.isLoading = true;
        const response = await userChatAPI.createSession(token, guestId, deviceInfo);
        
        this.currentSession = response;
        this.messages = []; // 清空之前的消息
        this.messageMap.clear();
        
        return response;
      } catch (error) {
        this.lastError = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // 加载历史消息
    async loadHistory(token, sessionId, limit = 50, offset = 0) {
      try {
        this.isLoading = true;
        
        debugLog('loadHistory', `开始加载历史消息: userType=${this.userType}, token=${token}, sessionId=${sessionId}`);
        
        const response = this.userType === 'customer_service' 
          ? await customerServiceAPI.getSessionMessages(token, sessionId, limit)
          : await userChatAPI.getHistory(token, sessionId, limit, 'user');

        debugLog('loadHistory', 'API响应:', response);

        if (response) {
          // 清空现有消息（如果是第一次加载）
          if (offset === 0) {
            this.messages = [];
            this.messageMap.clear();
          }

          // 解析消息数据
          let messages = [];
          let sessionInfo = null;
          
          if (response) {
            // 兼容不同的响应格式
            // 格式1: response直接包含数据
            // 格式2: response.data 包含数据
            const responseData = response.data || response;
            messages = responseData.messages || [];
            sessionInfo = {
              session_id: responseData.session_id,
              cs_account: responseData.cs_account,
              cs_name: responseData.cs_name,
              status: responseData.status
            };
          }
          
          debugLog('loadHistory', `解析到${messages.length}条消息`);
          
          if (Array.isArray(messages) && messages.length > 0) {
            // 为每个消息添加session_id（如果缺失的话）
            const sessionIdToUse = sessionId || sessionInfo?.session_id;
            messages.forEach(msg => {
              // 确保消息有session_id
              if (!msg.session_id && sessionIdToUse) {
                msg.session_id = sessionIdToUse;
              }
              this.addMessage(msg);
            });
            debugLog('loadHistory', `成功加载${messages.length}条消息`);
          } else {
            debugLog('loadHistory', '未找到消息数据');
          }
          
          // 更新会话信息
          if (sessionInfo && sessionInfo.session_id === sessionId) {
            this.currentSession = { ...this.currentSession, ...sessionInfo };
          }
        }
      } catch (error) {
        this.lastError = error.message;
        errorLog('loadHistory', '加载历史消息失败', error);
      } finally {
        this.isLoading = false;
      }
    },

    // 客服端：加载会话列表 - 使用WebSocket（重构版本）
    async loadSessions(status = 'all', importance = 'all', page = null, preservePosition = false, unreadOnly = false) {
      debugLog('loadSessions', `🔄 开始加载会话列表: userType=${this.userType}, importance=${importance}, page=${page}, preservePosition=${preservePosition}, unreadOnly=${unreadOnly}`);
      
      if (this.userType !== 'customer_service') {
        debugLog('loadSessions', '❌ 非客服用户，跳过加载会话列表');
        return;
      }
      
      // 确保客服信息存在
      if (!this.csInfo || !this.csInfo.cs_account) {
        errorLog('loadSessions', '❌ 客服信息验证失败', { csInfo: this.csInfo });
        return;
      }

      // 确保WebSocket连接
      if (!this.websocket || !this.isConnected) {
        errorLog('loadSessions', '❌ WebSocket未连接，无法加载会话列表');
        return;
      }

      // 如果page为null，使用当前页码，但确保页码有效
      const targetPage = Math.max(1, page !== null ? page : this.currentPage);

      try {
        this.isLoading = true;
        
        // 构建优化的WebSocket消息
        const messageData = {
          type: 'get_sessions',
          data: {
            status: status,
            importance: importance,
            page: targetPage,
            page_size: this.pageSize,
            sort_by: unreadOnly ? 'last_message_time' : 'update_time',
            sort_order: 'desc',
            unread_only: unreadOnly
          }
        };
        
        debugLog('loadSessions', '📤 发送WebSocket消息:', messageData);
        const response = await this.sendWebSocketMessage(messageData, 'sessions_response', 15000); // 增加超时时间
        
        if (response && response.data) {
          const data = response.data;
          
          // 📊 记录详细的响应数据分析
          debugLog('loadSessions', '📨 WebSocket响应详情:', {
            totalSessions: data.total,
            returnedSessions: data.sessions?.length || 0,
            currentPage: data.page,
            pageSize: data.page_size,
            totalPages: data.total_pages,
            hasNext: data.has_next,
            hasPrevious: data.has_previous,
            debugInfo: data.debug_info
          });
          
          // 🔒 完全信任后端返回的数据，不进行任何前端筛选
          this.sessions = data.sessions || [];
          this.sessionsTotal = data.total || 0;
          this.currentPage = data.page || targetPage;
          
          // 🧹 清理并重建未读状态映射
          this.sessionUnreadMap.clear();
          this.sessions.forEach(session => {
            const unreadCount = this.userType === 'customer_service' 
              ? (session.cs_unread_count || 0)
              : (session.unread_count || 0);
            this.sessionUnreadMap.set(session.session_id, unreadCount);
          });
          
          // ✅ 分页数据一致性验证
          this.validatePaginationConsistency();
          
          debugLog('loadSessions', `✅ 会话列表加载成功: ${this.sessions.length}/${this.sessionsTotal}，页码：${this.currentPage}/${this.totalPages}`);
          
          // 🔄 滚动位置管理
          if (!preservePosition) {
            this.setPreserveScrollPosition(false);
          }
        } else {
          // 📭 空数据处理
          this.sessions = [];
          this.sessionsTotal = 0;
          this.currentPage = 1;
          this.sessionUnreadMap.clear();
          debugLog('loadSessions', '📭 未找到会话数据，重置为空状态');
        }
      } catch (error) {
        this.lastError = error.message;
        errorLog('loadSessions', '❌ 加载会话列表失败', error);
        
        // 🚨 错误恢复：保持当前状态，不清空数据
        // this.sessions = [];
        // this.sessionsTotal = 0;
      } finally {
        this.isLoading = false;
      }
    },

    // 获取会话总数（用于分页计算）- 使用WebSocket
    async getSessionsCount(status = 'all', importance = 'all', unreadOnly = false) {
      if (this.userType !== 'customer_service' || !this.csInfo?.cs_account) {
        return 0;
      }

      // 确保WebSocket连接
      if (!this.websocket) {
        errorLog('getSessionsCount', 'WebSocket实例不存在，无法获取会话总数');
        return 0;
      }
      
      // 如果WebSocket正在连接中，等待一段时间
      if (!this.isConnected && this.websocket) {
        console.log('WebSocket正在连接中，等待连接完成...');
        let waitCount = 0;
        while (!this.isConnected && waitCount < 30) { // 最多等待3秒
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        if (!this.isConnected) {
          errorLog('getSessionsCount', 'WebSocket连接等待超时，无法获取会话总数');
          return 0;
        }
      }

      try {
        const messageData = {
          type: 'get_sessions_count',
          data: {
            status: status,
            importance: importance,
            unread_only: unreadOnly
          }
        };
        
        const response = await this.sendWebSocketMessage(messageData, 'sessions_count_response');
        
        if (response && response.data) {
          const count = response.count || 0;
          debugLog('getSessionsCount', `获取会话总数: ${count} (不覆盖sessionsTotal: ${this.sessionsTotal})`);
          // 注意：这里不再覆盖 sessionsTotal，只返回 count 值
          // sessionsTotal 应该只在 loadSessions 中设置，保持分页的一致性
          return count;
        }
        return 0;
      } catch (error) {
        errorLog('getSessionsCount', '获取会话总数失败', error);
        return 0;
      }
    },

    // 跳转到指定页码
    async goToPage(page, status = 'all', importance = 'all', unreadOnly = false) {
      console.log('goToPage called:', { page, status, importance, unreadOnly, currentPage: this.currentPage, totalPages: this.totalPages });
      if (page >= 1 && page <= this.totalPages) {
        await this.loadSessions(status, importance, page, false, unreadOnly);
      }
    },

    // 上一页
    async previousPage(status = 'all', importance = 'all') {
      if (this.hasPreviousPage) {
        await this.goToPage(this.currentPage - 1, 'all', importance);
      }
    },

    // 下一页
    async nextPage(status = 'all', importance = 'all') {
      if (this.hasNextPage) {
        await this.goToPage(this.currentPage + 1, 'all', importance);
      }
    },

    // 选择会话
    async selectSession(session) {
      console.log('selectSession - 选择会话:', session); // 调试日志
      
      // 设置保持滚动位置标志
      this.setPreserveScrollPosition(true);
      
      // 记录选中的会话ID
      this.selectedSessionId = session.session_id;
      
      this.currentSession = session;
      this.messages = [];
      this.messageMap.clear();
      this.unreadCount = 0;
      
      // 不再在这里自动标记已读，已移到组件中处理

      console.log('selectSession - 清空消息后，准备加载历史消息'); // 调试日志

      // 加载该会话的历史消息
      if (this.userType === 'customer_service' && this.csInfo && this.csInfo.cs_account) {
        console.log('selectSession - 开始加载历史消息:', {
          userType: this.userType,
          csAccount: this.csInfo.cs_account,
          sessionId: session.session_id
        });
        await this.loadHistory(this.csInfo.cs_account, session.session_id);
        
        console.log('selectSession - 历史消息加载完成，当前消息数:', this.messages.length);
      } else {
        console.warn('selectSession - 无法加载历史消息，检查条件:', {
          userType: this.userType,
          csInfo: this.csInfo
        });
      }
    },

    // 更新客服状态
    async updateCSStatus(status) {
      if (this.userType !== 'customer_service' || !this.csInfo || !this.csInfo.cs_account) {
        return;
      }

      // 确保WebSocket连接
      if (!this.isConnected || !this.websocket) {
        throw new Error('WebSocket未连接，无法更新客服状态');
      }

      try {
        const messageData = {
          type: 'update_cs_status',
          data: { status }
        };
        
        await this.sendWebSocketMessage(messageData, 'cs_status_update_success');
        this.csStatus = status;
      } catch (error) {
        this.lastError = error.message;
        throw error;
      }
    },

    // 标记会话为重要
    async markSessionImportant(sessionId, isImportant, reason = null) {
      if (this.userType !== 'customer_service' || !this.csInfo || !this.csInfo.cs_account) {
        return;
      }

      // 确保WebSocket连接
      if (!this.isConnected || !this.websocket) {
        throw new Error('WebSocket未连接，无法标记会话重要性');
      }

      try {
        const messageData = {
          type: 'mark_session_important',
          data: {
            session_id: sessionId,
            is_important: isImportant,
            reason: reason
          }
        };
        
        await this.sendWebSocketMessage(messageData, 'session_importance_updated');
        
        // 更新本地会话信息
        const session = this.sessions.find(s => s.session_id === sessionId);
        if (session) {
          session.is_important = isImportant;
          session.importance_reason = reason;
        }
        
        if (this.currentSession && this.currentSession.session_id === sessionId) {
          this.currentSession.is_important = isImportant;
          this.currentSession.importance_reason = reason;
        }
      } catch (error) {
        this.lastError = error.message;
        throw error;
      }
    },

    // 结束会话 - 使用WebSocket
    async endSession(sessionId, reason = '手动结束') {
      if (!this.csInfo || !this.csInfo.cs_account) {
        return;
      }

      // 确保WebSocket连接
      if (!this.isConnected || !this.websocket) {
        throw new Error('WebSocket未连接，无法结束会话');
      }

      try {
        const messageData = {
          type: 'end_session',
          data: {
            session_id: sessionId,
            reason: reason
          }
        };
        
        await this.sendWebSocketMessage(messageData, 'session_ended');
        
        // 更新本地会话状态
        const session = this.sessions.find(s => s.session_id === sessionId);
        if (session) {
          session.status = 'closed';
        }
        
        if (this.currentSession && this.currentSession.session_id === sessionId) {
          this.currentSession.status = 'closed';
        }
      } catch (error) {
        this.lastError = error.message;
        throw error;
      }
    },

    // 清理聊天记录 - 使用WebSocket
    async clearChatHistory(sessionId) {
      if (!this.csInfo || !this.csInfo.cs_account) {
        throw new Error('客服信息不存在');
      }

      // 确保WebSocket连接
      if (!this.isConnected || !this.websocket) {
        throw new Error('WebSocket未连接，无法清理聊天记录');
      }

      try {
        debugLog('clearChatHistory', `开始清理会话 ${sessionId} 的聊天记录`);
        
        const messageData = {
          type: 'clear_chat_history',
          data: {
            session_id: sessionId
          }
        };
        
        const response = await this.sendWebSocketMessage(messageData, 'chat_history_cleared');
        
        if (response && response.data) {
          // 清理成功，清空相关的本地消息
          if (this.currentSession && this.currentSession.session_id === sessionId) {
            this.messages = [];
            this.messageMap.clear();
            debugLog('clearChatHistory', '本地消息列表已清空');
          }
          
          debugLog('clearChatHistory', '清理聊天记录成功');
          return { code: 0, msg: '清理成功', data: response.data };
        } else {
          throw new Error('清理失败');
        }
      } catch (error) {
        this.lastError = error.message;
        errorLog('clearChatHistory', '清理聊天记录失败', error);
        throw error;
      }
    },

    // 重连WebSocket
    reconnectWebSocket() {
      if (this.websocket && !this.isReconnecting) {
        this.isReconnecting = true;
        this.websocket.reconnect();
      }
    },

    // 断开连接
    disconnect() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      
      this.isConnected = false;
      this.isReconnecting = false;
      this.userId = null;
    },

    // 保存会话列表滚动位置
    saveSessionListScrollPosition(scrollTop) {
      this.sessionListScrollPosition = scrollTop;
      debugLog('scrollPosition', `保存滚动位置: ${scrollTop}`);
    },

    // 设置需要保持滚动位置的标志
    setPreserveScrollPosition(preserve = true) {
      this.preserveScrollPosition = preserve;
      debugLog('scrollPosition', `设置保持滚动位置: ${preserve}`);
    },

    // 获取保存的滚动位置
    getSavedScrollPosition() {
      return this.sessionListScrollPosition;
    },

    // 清理状态
    clearState() {
      this.disconnect();
      this.currentSession = null;
      this.sessions = [];
      this.messages = [];
      this.messageMap.clear();
      this.unreadCount = 0;
      this.lastError = null;
      this.csInfo = null;
      this.userToken = null;
      // 清理分页相关状态
      this.sessionsTotal = 0;
      this.currentPage = 1;
      this.pageSize = 20;
      // 清理滚动位置相关状态
      this.sessionListScrollPosition = 0;
      this.selectedSessionId = null;
      this.preserveScrollPosition = false;
      // 清理未读数量相关状态
      this.totalUnreadCount = 0;
      this.sessionUnreadMap.clear();
    },

    // 新增的WebSocket事件处理器 - 实时未读消息数同步
    handleUnreadCountsSynced(data) {
      debugLog('handleUnreadCountsSynced', '收到全量未读数量同步', data);
      
      // 临时禁用WebSocket全量同步，避免覆盖API数据
      console.warn('🚫 临时禁用WebSocket全量同步，避免数据冲突');
      return;
      
      // 更新所有会话的未读数量
      if (data.unread_data && typeof data.unread_data === 'object') {
        let totalUnread = 0;
        let updatedSessions = 0;
        
        Object.entries(data.unread_data).forEach(([sessionId, unreadInfo]) => {
          const session = this.sessions.find(s => s.session_id === sessionId);
          if (session) {
            if (this.userType === 'customer_service') {
              session.cs_unread_count = unreadInfo.cs_unread_count || 0;
              totalUnread += session.cs_unread_count;
              this.sessionUnreadMap.set(sessionId, session.cs_unread_count);
            } else {
              session.unread_count = unreadInfo.user_unread_count || 0;
              totalUnread += session.unread_count;
              this.sessionUnreadMap.set(sessionId, session.unread_count);
            }
            updatedSessions++;
            
            debugLog('handleUnreadCountsSynced', `会话${sessionId}未读数更新`, {
              sessionId,
              csUnreadCount: unreadInfo.cs_unread_count,
              userUnreadCount: unreadInfo.user_unread_count,
              isCS: this.userType === 'customer_service'
            });
          } else {
            debugLog('handleUnreadCountsSynced', `未找到会话${sessionId}`, {
              sessionId,
              totalSessions: this.sessions.length,
              sessionIds: this.sessions.map(s => s.session_id)
            });
          }
        });
        
        // 更新总未读数量（优先使用服务器提供的总数）
        this.totalUnreadCount = data.total_unread !== undefined ? data.total_unread : totalUnread;
        
        debugLog('handleUnreadCountsSynced', '全量同步完成', {
          totalUnread: this.totalUnreadCount,
          updatedSessions,
          totalSessions: this.sessions.length,
          unreadDataKeys: Object.keys(data.unread_data).length
        });
      } else {
        debugLog('handleUnreadCountsSynced', '未收到有效的未读数据', data);
      }
    },

    handleUnreadCountAbsoluteUpdate(data) {
      debugLog('handleUnreadCountAbsoluteUpdate', '收到绝对值未读数量更新', data);
      
      const { session_id, cs_unread_count, user_unread_count } = data;
      
      // 检查是否是当前选中的会话，如果是已读状态（未读数为0）则允许更新
      if (this.selectedSessionId === session_id) {
        const currentUnreadCount = this.userType === 'customer_service' ? cs_unread_count : user_unread_count;
        if (currentUnreadCount > 0) {
          // 如果是当前会话且未读数大于0，则跳过更新（避免在阅读过程中干扰）
          debugLog('handleUnreadCountAbsoluteUpdate', '跳过当前选中会话的未读数增加更新', {
            sessionId: session_id,
            selectedSessionId: this.selectedSessionId,
            unreadCount: currentUnreadCount
          });
          return;
        } else {
          // 如果是当前会话且未读数为0，则允许更新（标记为已读）
          debugLog('handleUnreadCountAbsoluteUpdate', '允许当前选中会话的已读状态更新', {
            sessionId: session_id,
            selectedSessionId: this.selectedSessionId,
            unreadCount: currentUnreadCount
          });
        }
      }
      
      // 更新指定会话的未读数量
      const session = this.sessions.find(s => s.session_id === session_id);
      if (session) {
        const oldUnreadCount = this.userType === 'customer_service' 
          ? (session.cs_unread_count || 0)
          : (session.unread_count || 0);
        
        // 使用绝对值更新
        if (this.userType === 'customer_service') {
          session.cs_unread_count = cs_unread_count;
          this.sessionUnreadMap.set(session_id, cs_unread_count);
        } else {
          session.unread_count = user_unread_count;
          this.sessionUnreadMap.set(session_id, user_unread_count);
        }
        
        // 更新总未读数量（基于差值）
        const newUnreadCount = this.userType === 'customer_service' ? cs_unread_count : user_unread_count;
        const unreadDelta = newUnreadCount - oldUnreadCount;
        this.totalUnreadCount = Math.max(0, this.totalUnreadCount + unreadDelta);
        
        debugLog('handleUnreadCountAbsoluteUpdate', '会话未读数量已更新', {
          sessionId: session_id,
          oldCount: oldUnreadCount,
          newCount: newUnreadCount,
          totalUnread: this.totalUnreadCount
        });
      }
    },

    // 更新未读消息数量
    updateUnreadCount(sessionId, increment = 1) {
      if (!sessionId) return;
      
      // 更新会话列表中的未读数量
      const session = this.sessions.find(s => s.session_id === sessionId);
      if (session) {
        if (this.userType === 'customer_service') {
          session.cs_unread_count = (session.cs_unread_count || 0) + increment;
        } else {
          session.unread_count = (session.unread_count || 0) + increment;
        }
      }
      
      // 更新总未读数量
      this.totalUnreadCount += increment;
      
      // 更新本地映射
      const currentCount = this.sessionUnreadMap.get(sessionId) || 0;
      this.sessionUnreadMap.set(sessionId, Math.max(0, currentCount + increment));
    },

    // 更新本地会话已读状态（仅本地状态更新，不调用API）
    // API调用已移到组件层处理
    markSessionAsRead(sessionId) {
      if (!sessionId) return;
      
      try {
        // 更新本地状态
        const session = this.sessions.find(s => s.session_id === sessionId);
        if (session) {
          const unreadCount = this.userType === 'customer_service' 
            ? (session.cs_unread_count || 0)
            : (session.unread_count || 0);
          
          debugLog('markSessionAsRead', `本地标记会话已读，原未读数: ${unreadCount}`, {
            sessionId,
            oldCs: session.cs_unread_count,
            oldUser: session.unread_count,
            userType: this.userType
          });
          
          // 减少总未读数量
          this.totalUnreadCount = Math.max(0, this.totalUnreadCount - unreadCount);
          
          // 清零会话未读数量
          if (this.userType === 'customer_service') {
            session.cs_unread_count = 0;
          } else {
            session.unread_count = 0;
          }
          
          // 清零本地映射
          this.sessionUnreadMap.set(sessionId, 0);
          
          debugLog('markSessionAsRead', `本地会话已标记为已读，新状态: cs=${session.cs_unread_count}, user=${session.unread_count}`);
        }
      } catch (error) {
        errorLog('markSessionAsRead', '本地标记已读失败', error);
      }
    },

    // 数据一致性验证（重构版本）
    validatePaginationConsistency() {
      const actualSessions = this.sessions.length;
      const calculatedTotalPages = Math.max(1, Math.ceil(this.sessionsTotal / this.pageSize));
      const isLastPage = this.currentPage === calculatedTotalPages;
      const expectedSessionsOnPage = isLastPage 
        ? Math.min(this.pageSize, this.sessionsTotal - (this.currentPage - 1) * this.pageSize)
        : this.pageSize;
      
      // 📊 详细的一致性检查日志
      const consistencyReport = {
        actualSessions,
        expectedSessions: expectedSessionsOnPage,
        totalSessions: this.sessionsTotal,
        currentPage: this.currentPage,
        totalPages: calculatedTotalPages,
        pageSize: this.pageSize,
        isLastPage,
        offset: (this.currentPage - 1) * this.pageSize
      };
      
      debugLog('validatePaginationConsistency', '📊 分页一致性报告:', consistencyReport);
      
      // 🚨 异常情况检测
      const issues = [];
      
      // 检查1：会话数量异常
      if (actualSessions > this.pageSize) {
        issues.push(`会话数(${actualSessions})超过页面大小(${this.pageSize})`);
      }
      
      // 检查2：空页面检测
      if (this.sessionsTotal > 0 && actualSessions === 0 && this.currentPage <= calculatedTotalPages) {
        issues.push(`页面${this.currentPage}为空，但总数为${this.sessionsTotal}`);
      }
      
      // 检查3：页码超出范围
      if (this.currentPage > calculatedTotalPages && this.sessionsTotal > 0) {
        issues.push(`当前页码(${this.currentPage})超出总页数(${calculatedTotalPages})`);
      }
      
      // 检查4：最后一页数量异常
      if (isLastPage && this.sessionsTotal > 0) {
        const remainingSessions = this.sessionsTotal % this.pageSize;
        const expectedLastPageSessions = remainingSessions === 0 ? this.pageSize : remainingSessions;
        if (actualSessions !== expectedLastPageSessions) {
          issues.push(`最后一页会话数不匹配: 实际${actualSessions}, 预期${expectedLastPageSessions}`);
        }
      }
      
      // 📢 报告问题
      if (issues.length > 0) {
        console.warn('🚨 分页一致性问题检测到:', issues);
        console.warn('📊 详细报告:', consistencyReport);
        
        // 🔧 自动修复机制（谨慎使用）
        if (issues.some(issue => issue.includes('页码超出范围'))) {
          console.log('🔧 自动修复：重置到第一页');
          this.currentPage = 1;
        }
      } else {
        debugLog('validatePaginationConsistency', '✅ 分页数据一致性验证通过');
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        report: consistencyReport
      };
    },

    // 更新消息状态（用于消息队列回调）
    updateMessageStatus(queuedMessage) {
      const message = this.messages.find(m => m.message_id === queuedMessage.id);
      if (message) {
        message.status = queuedMessage.status;
        message.lastError = queuedMessage.lastError;
        
        // 如果消息发送失败，可以在UI上显示错误
        if (queuedMessage.status === MessageStatus.FAILED) {
          console.error('消息发送失败:', queuedMessage.id, queuedMessage.lastError);
          // 可以触发UI提示
          this.lastError = `消息发送失败: ${queuedMessage.lastError}`;
        }
        
        // 如果消息发送成功，更新消息ID（如果服务器返回了新ID）
        if (queuedMessage.status === MessageStatus.SENT && queuedMessage.serverId) {
          const oldId = message.message_id;
          message.message_id = queuedMessage.serverId;
          this.messageMap.delete(oldId);
          this.messageMap.set(queuedMessage.serverId, message);
        }
      }
    },

    // 重试失败的消息
    retryFailedMessages() {
      if (this.messageQueue) {
        this.messageQueue.retryFailedMessages();
      }
    },

    // 获取消息队列状态
    getMessageQueueStatus() {
      if (this.messageQueue) {
        return this.messageQueue.getStatus();
      }
      return null;
    },

    // 获取未读消息数量（从服务器同步）
    async fetchUnreadCount() {
      if (!this.userType || !this.userId) return;
      
      try {
        let response;
        if (this.userType === 'customer_service') {
          response = await customerServiceAPI.getUnreadCount(this.csInfo?.cs_account);
        } else {
          response = await userChatAPI.getUnreadCount(this.userToken);
        }
        
        if (response && response.data) {
          this.totalUnreadCount = response.total_unread || 0;
          
          // 更新各会话的未读数量
          if (response.sessions) {
            response.sessions.forEach(sessionData => {
              const session = this.sessions.find(s => s.session_id === sessionData.session_id);
              if (session) {
                if (this.userType === 'customer_service') {
                  session.cs_unread_count = sessionData.cs_unread_count || 0;
                } else {
                  session.unread_count = sessionData.unread_count || 0;
                }
                this.sessionUnreadMap.set(sessionData.session_id, sessionData.unread_count || sessionData.cs_unread_count || 0);
              }
            });
          }
        }
      } catch (error) {
        errorLog('fetchUnreadCount', '获取未读消息数失败', error);
      }
    }
  }
});