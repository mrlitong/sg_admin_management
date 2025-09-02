// HTTP API接口封装 - 支持HTTP+WebSocket混合架构
import { config } from '@/config'

// 统一使用配置中心的地址
const getApiBaseUrl = () => {
  const baseUrl = config.apiBaseUrl
  // 如果是相对路径，直接返回
  if (baseUrl.startsWith('/')) {
    return ''
  }
  // 如果是完整URL，去掉/api后缀（因为请求时会添加）
  return baseUrl.replace(/\/api$/, '')
}

/**
 * 发送HTTP请求的通用方法
 * @param {string} url - API端点路径
 * @param {string} method - HTTP方法 (GET, POST等)
 * @param {object} data - 请求体数据
 * @param {object} params - URL查询参数
 * @returns {Promise} - 返回响应的Promise
 */
export const request = async (url, method = 'GET', data = null, params = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 处理URL参数
  let requestUrl = `${getApiBaseUrl()}${url}`;
  if (params && method === 'GET') {
    const urlParams = new URLSearchParams(params);
    requestUrl += `?${urlParams.toString()}`;
  }

  // 添加请求体
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(requestUrl, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // 处理错误响应
    if (responseData.code !== 0 && responseData.code !== undefined) {
      throw new Error(responseData.msg || responseData.message || '请求失败');
    }
    
    return responseData;
  } catch (error) {
    console.error('API请求错误:', error);
    // 如果是网络错误或JSON解析错误，提供更友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络或服务器状态');
    } else if (error.name === 'SyntaxError') {
      throw new Error('服务器响应格式错误');
    }
    throw error;
  }
};

/**
 * 发送聊天服务HTTP请求的通用方法
 * @param {string} url - API端点路径
 * @param {string} method - HTTP方法 (GET, POST等)
 * @param {object} data - 请求体数据
 * @param {object} params - URL查询参数
 * @returns {Promise} - 返回响应的Promise
 */
export const chatRequest = async (url, method = 'GET', data = null, params = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 处理URL参数
  let requestUrl = `${getApiBaseUrl()}${url}`;
  if (params && method === 'GET') {
    const urlParams = new URLSearchParams(params);
    requestUrl += `?${urlParams.toString()}`;
  }

  // 添加请求体
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(requestUrl, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // 处理错误响应
    if (responseData.code !== 0 && responseData.code !== undefined) {
      throw new Error(responseData.msg || responseData.message || '请求失败');
    }
    
    return responseData;
  } catch (error) {
    console.error('聊天API请求错误:', error);
    // 如果是网络错误或JSON解析错误，提供更友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('聊天服务连接失败，请检查网络或服务器状态');
    } else if (error.name === 'SyntaxError') {
      throw new Error('聊天服务响应格式错误');
    }
    throw error;
  }
};

/**
 * 用户端聊天API
 */
export const userChatAPI = {
  // 创建聊天会话
  createSession: (token, guestId = null, deviceInfo = null) => {
    return chatRequest('/api/chat/create_session', 'POST', {
      token,
      guest_id: guestId,
      device_info: deviceInfo
    });
  },

  // 用户发送消息 (HTTP备用，主要使用WebSocket)
  sendMessage: (token, sessionId, content, contentType = 'text') => {
    return chatRequest('/api/chat/send_message', 'POST', {
      token,
      session_id: sessionId,
      content,
      content_type: contentType
    });
  },

  // 获取聊天历史
  getHistory: (token, sessionId = null, limit = 50, userType = 'user') => {
    return chatRequest('/api/chat/get_history', 'POST', {
      token,
      session_id: sessionId,
      limit,
      user_type: userType
    });
  },

  // 获取未读消息数量
  getUnreadCount: (token) => {
    return chatRequest('/api/chat/unread_count', 'POST', {
      token
    });
  }
};

/**
 * 客服端API
 */
export const customerServiceAPI = {
  // 客服登录
  login: (csAccount, password) => {
    return chatRequest('/api/cs/login', 'POST', {
      cs_account: csAccount,
      cs_password: password
    });
  },

  // 获取会话列表 - 已迁移到WebSocket
  // getSessions: 已使用 WebSocket 'get_sessions' 事件替代

  // 获取会话总数 - 已迁移到WebSocket  
  // getSessionsCount: 已使用 WebSocket 'get_sessions_count' 事件替代

  // 客服发送消息 (HTTP备用，主要使用WebSocket)
  sendMessage: (csAccount, sessionId, content, contentType = 'text') => {
    return chatRequest('/api/cs/send_message', 'POST', {
      cs_account: csAccount,
      session_id: sessionId,
      content,
      content_type: contentType
    });
  },

  // 获取会话消息历史
  getSessionMessages: (csAccount, sessionId, limit = 50) => {
    return chatRequest('/api/cs/get_chat_history', 'POST', {
      cs_account: csAccount,
      session_id: sessionId,
      limit
    });
  },

  // 获取用户会员信息
  getUserMembershipInfo: (account) => {
    return chatRequest('/api/chat/get_user_membership_info', 'POST', {
      account: account
    });
  },

  // 客服退出登录
  logout: (csAccount) => {
    return chatRequest('/api/cs/logout', 'POST', {
      cs_account: csAccount
    });
  },

  // 客服接待等待中的会话
  acceptSession: (csAccount, sessionId) => {
    return chatRequest('/api/cs/accept_session', 'POST', {
      cs_account: csAccount,
      session_id: sessionId
    });
  },
  
  // 用户充值
  rechargeUser: (rechargeData) => {
    const rechargeUrl = `${getApiBaseUrl()}/api/cs_recharge`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: rechargeData.account,
        amount: rechargeData.amount,
        duration: rechargeData.duration,
        service_agent: rechargeData.service_agent
      })
    };
    
    return fetch(rechargeUrl, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(responseData => {
        if (responseData.code !== 0 && responseData.code !== undefined) {
          throw new Error(responseData.msg || responseData.message || '请求失败');
        }
        return responseData;
      })
      .catch(error => {
        console.error('充值API请求错误:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('网络连接失败，请检查网络或服务器状态');
        } else if (error.name === 'SyntaxError') {
          throw new Error('服务器响应格式错误');
        }
        throw error;
      });
  }
};

// 导出所有API
export default {
  request,
  userChatAPI,
  customerServiceAPI
}; 