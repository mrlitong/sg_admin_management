/**
 * Chat业务逻辑Composable
 * 提取所有聊天相关的业务逻辑，包括WebSocket连接、消息处理、会话管理等
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { customerServiceAPI } from '@/utils/api'

export function useChat() {
  const chatStore = useChatStore()
  const router = useRouter()

  // ===== 状态管理 =====
  const currentSessionId = ref(null)
  const currentLoadingStep = ref(0)
  const userMembershipInfo = ref({
    membership_level: -1,
    membership_expire_date: null,
    game_platform: -1,
    remarks: null,
    last_online_time: null,
    auxiliary_online: 0,
    membership_pay_money: 0
  })

  // 组件引用
  const sessionSidebarRef = ref(null)
  const chatAreaRef = ref(null)

  // 加载步骤提示
  const loadingSteps = [
    '正在建立WebSocket连接...',
    '正在验证客服身份...',
    '正在加载会话列表...',
    '正在同步未读消息...',
    '初始化完成'
  ]

  // ===== 计算属性 =====
  const currentSessionData = computed(() => {
    return chatStore.sessions.find(s => s.session_id === currentSessionId.value)
  })

  // ===== 工具方法 =====

  /**
   * 获取客服账号
   */
  const getCSAccount = () => {
    return localStorage.getItem('cs_account') || 'xiuluoguiwang'
  }

  /**
   * 获取用户会员信息
   */
  const fetchUserMembershipInfo = async (account) => {
    if (!account || account.trim() === '') {
      console.log('fetchUserMembershipInfo: account为空，跳过')
      userMembershipInfo.value = {
        membership_level: -1,
        membership_expire_date: null,
        game_platform: -1,
        remarks: null,
        last_online_time: null,
        auxiliary_online: 0,
        membership_pay_money: 0
      }
      return
    }

    console.log('=== useChat fetchUserMembershipInfo ===')
    console.log('正在获取用户会员信息，account:', account)

    try {
      const response = await customerServiceAPI.getUserMembershipInfo(account)
      console.log('getUserMembershipInfo API响应:', response)

      if (response && response.data) {
        console.log('会员信息获取成功:', response.data)
        userMembershipInfo.value = response.data
        console.log('userMembershipInfo.value已更新:', userMembershipInfo.value)
      } else {
        console.log('API响应中没有data字段')
        userMembershipInfo.value = {
          membership_level: -1,
          membership_expire_date: null,
          game_platform: -1,
          remarks: null,
          last_online_time: null,
          auxiliary_online: 0,
          membership_pay_money: 0
        }
      }
    } catch (error) {
      console.error('获取用户会员信息失败', error)
      userMembershipInfo.value = {
        membership_level: -1,
        membership_expire_date: null,
        game_platform: -1,
        remarks: null,
        last_online_time: null,
        auxiliary_online: 0,
        membership_pay_money: 0
      }
    }
  }

  // ===== 会话管理 =====

  /**
   * 选择会话
   */
  const selectSession = async (session) => {
    console.log('=== useChat selectSession ===')
    console.log('选择会话:', session)
    console.log('会话account:', session.account)

    currentSessionId.value = session.session_id

    await chatStore.selectSession(session)

    // 如果是注册用户，获取会员信息
    if (session.account && session.account.trim() !== '') {
      console.log('✅ 检测到注册用户，开始获取会员信息:', session.account)
      await fetchUserMembershipInfo(session.account)
    } else {
      console.log('❌ 未检测到注册用户，清空会员信息')
      userMembershipInfo.value = {
        membership_level: -1,
        membership_expire_date: null,
        game_platform: -1,
        remarks: null,
        last_online_time: null,
        auxiliary_online: 0,
        membership_pay_money: 0
      }
    }

    // 滚动到底部
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollToBottom()
    }

    return session
  }

  /**
   * 返回到会话列表
   */
  const backToSessionList = () => {
    currentSessionId.value = null
    return true
  }

  /**
   * 会话结束处理
   */
  const onSessionEnded = () => {
    console.log('会话已结束')
  }

  /**
   * 强制刷新会话列表
   */
  const forceRefreshSessions = () => {
    if (sessionSidebarRef.value) {
      sessionSidebarRef.value.forceRefreshSessions()
    }
  }

  // ===== 筛选处理 =====

  /**
   * 筛选条件更新
   */
  const onFilterUpdate = (filterValue) => {
    console.log('筛选条件更新为:', filterValue)
  }

  // ===== 错误处理 =====

  /**
   * 清除错误
   */
  const clearError = () => {
    chatStore.lastError = null
  }

  /**
   * 重试初始化
   */
  const retryInitialization = async () => {
    const csAccount = getCSAccount()
    await initializeWorkspace(csAccount)
  }

  // ===== 初始化管理 =====

  /**
   * 初始化工作台
   */
  const initializeWorkspace = async (csAccount) => {
    try {
      currentLoadingStep.value = 0

      // 使用新的完整初始化方法
      const success = await chatStore.initializeCustomerService(csAccount)

      if (success) {
        currentLoadingStep.value = 4 // 初始化完成
        console.log('客服工作台初始化成功')
      } else {
        console.error('客服工作台初始化失败')
      }
    } catch (error) {
      console.error('初始化过程出错:', error)
      chatStore.lastError = error.message || '初始化失败'
    }
  }

  // ===== 生命周期管理 =====

  /**
   * 初始化Chat
   */
  const initializeChat = async () => {
    try {
      const csAccount = getCSAccount()

      // 使用新的初始化方法
      await initializeWorkspace(csAccount)

      // 监听浏览器关闭/刷新事件
      const handleBeforeUnload = async (event) => {
        try {
          if (chatStore.userType === 'customer_service' && chatStore.csInfo?.cs_account) {
            // 使用navigator.sendBeacon进行可靠的状态更新
            const data = JSON.stringify({
              cs_account: chatStore.csInfo.cs_account,
              status: 'offline'
            })

            navigator.sendBeacon(`${window.location.origin.replace(':5173', ':8000')}/api/cs/update_status`, data)
            localStorage.setItem('cs_status', 'offline')
          }
        } catch (error) {
          console.error('浏览器关闭时设置离线状态失败:', error)
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      // 返回清理函数
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }

    } catch (error) {
      console.error('初始化客服工作台失败:', error)
      chatStore.lastError = error.message || '页面初始化失败'
      return null
    }
  }

  /**
   * 清理Chat
   */
  const cleanupChat = async () => {
    // 设置状态为离线
    try {
      if (chatStore.userType === 'customer_service' && chatStore.csInfo?.cs_account) {
        await chatStore.updateCSStatus('offline')
        localStorage.setItem('cs_status', 'offline')
      }
    } catch (error) {
      console.error('设置离线状态失败:', error)
    }

    // 断开WebSocket连接
    chatStore.disconnect()
  }

  return {
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

    // 工具方法
    getCSAccount,
    fetchUserMembershipInfo,

    // 会话管理
    selectSession,
    backToSessionList,
    onSessionEnded,
    forceRefreshSessions,

    // 筛选处理
    onFilterUpdate,

    // 错误处理
    clearError,
    retryInitialization,

    // 初始化管理
    initializeWorkspace,
    initializeChat,
    cleanupChat,

    // Store访问
    chatStore
  }
}