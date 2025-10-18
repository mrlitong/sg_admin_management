import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import {
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
  FUNCTION_CATEGORIES,
  feedbackTypeMap,
  feedbackStatusMap,
  findCategoryByFunction,
  getFunctionsByCategory
} from '../constants/feedback'
import {
  getFeedbackList,
  replyFeedback,
  updateFeedbackFunction,
  deleteFeedback
} from '../api/feedback'

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function useFeedbackManagement() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const feedbackList = ref([])
  const typeFilter = ref('all')
  const statusFilter = ref('all')

  const replyDialogVisible = ref(false)
  const deleteDialogVisible = ref(false)
  const selectedFeedback = ref(null)
  const feedbackToDelete = ref(null)

  const replyForm = reactive({
    result: '',
    status: -1,
    functionCategory: '',
    functionName: ''
  })

  const isSubmittingReply = ref(false)
  const isDeleting = ref(false)

  const token = computed(() => authStore.token || localStorage.getItem('token') || '')
  const currentAccount = computed(() => authStore.user?.username || '')

  const typeOptions = computed(() => [
    { value: 'all', label: '全部' },
    ...FEEDBACK_TYPES
  ])

  const statusOptions = computed(() => [
    { value: 'all', label: '全部', type: '' },
    ...FEEDBACK_STATUSES
  ])

  const availableFunctions = computed(() => {
    if (!replyForm.functionCategory) return []
    return getFunctionsByCategory(replyForm.functionCategory)
  })

  const solvedCount = computed(() => feedbackList.value.filter(item => item.status === 1).length)
  const processingCount = computed(() => feedbackList.value.filter(item => item.status === 0).length)
  const pendingCount = computed(() => feedbackList.value.filter(item => item.status === -1).length)
  const totalCount = computed(() => feedbackList.value.length)

  const solveRate = computed(() => {
    if (!totalCount.value) return 0
    return Math.round((solvedCount.value / totalCount.value) * 100)
  })
  const processingRate = computed(() => {
    if (!totalCount.value) return 0
    return Math.round((processingCount.value / totalCount.value) * 100)
  })
  const pendingRate = computed(() => {
    if (!totalCount.value) return 0
    return Math.round((pendingCount.value / totalCount.value) * 100)
  })

  const sortedFeedbackList = computed(() => {
    return [...feedbackList.value].sort((a, b) => b.votes - a.votes)
  })

  const filteredFeedbackList = computed(() => {
    let list = sortedFeedbackList.value

    if (typeFilter.value !== 'all') {
      list = list.filter(item => item.type === typeFilter.value)
    }

    if (statusFilter.value !== 'all') {
      list = list.filter(item => item.status === statusFilter.value)
    }

    return list
  })

  const myFeedbackCount = computed(() => {
    if (!currentAccount.value) return 0
    return feedbackList.value.filter(item => item.account === currentAccount.value).length
  })

  const myRepliedCount = computed(() => {
    if (!currentAccount.value) return 0
    return feedbackList.value.filter(item => {
      if (item.account !== currentAccount.value) return false
      return item.status !== -1 || Boolean(item.result)
    }).length
  })

  const resetReplyForm = () => {
    replyForm.result = ''
    replyForm.status = -1
    replyForm.functionCategory = ''
    replyForm.functionName = ''
  }

  const fetchFeedback = async () => {
    loading.value = true
    try {
      const tokenValue = token.value
      if (!tokenValue) {
        throw new Error('登录状态失效，请重新登录')
      }
      const response = await getFeedbackList(tokenValue)
      if (!response || response.code !== 0 || !response.data) {
        throw new Error(response?.msg || '获取反馈列表失败')
      }

      const feedbackData = response.data
      const list = []
      for (const content in feedbackData) {
        if (!Object.prototype.hasOwnProperty.call(feedbackData, content)) continue
        if (content.trim() === '') continue

        const item = feedbackData[content]
        if (!item) continue

        const typeMap = { 0: 1, 1: 2, 2: 3 }
        const votes = item.feedback_vote_num || 0
        const hasVoted = Array.isArray(item.feedback_vote_detail)
          ? item.feedback_vote_detail.some(vote => vote.vote_account === currentAccount.value)
          : false

        list.push({
          id: content,
          content,
          type: typeMap[item.feedback_type] || 1,
          votes,
          hasVoted,
          time: formatTimestamp(item.feedback_time),
          status: typeof item.feedback_status === 'number' ? item.feedback_status : Number(item.feedback_status || -1),
          result: item.feedback_result || '',
          account: item.account || '',
          function: item.feedback_function || ''
        })
      }

      feedbackList.value = list
    } catch (error) {
      console.error('获取反馈失败', error)
      ElMessage.error(error.message || '获取反馈失败')
    } finally {
      loading.value = false
    }
  }

  const handleRefresh = () => {
    fetchFeedback()
  }

  const openReplyDialog = (feedback) => {
    selectedFeedback.value = feedback
    replyForm.result = feedback.result || ''
    replyForm.status = typeof feedback.status === 'number' ? feedback.status : -1

    if (feedback.function) {
      const category = findCategoryByFunction(feedback.function)
      replyForm.functionCategory = category ? category.value : ''
      replyForm.functionName = feedback.function
    } else {
      replyForm.functionCategory = ''
      replyForm.functionName = ''
    }

    replyDialogVisible.value = true
  }

  const closeReplyDialog = () => {
    replyDialogVisible.value = false
    selectedFeedback.value = null
    resetReplyForm()
  }

  const submitReply = async () => {
    if (!selectedFeedback.value) return

    const tokenValue = token.value
    if (!tokenValue) {
      ElMessage.error('登录状态失效，请重新登录')
      return
    }

    const original = selectedFeedback.value
    const trimmedResult = replyForm.result.trim()
    const resultChanged = trimmedResult !== (original.result || '')
    const statusChanged = replyForm.status !== original.status
    const functionChanged = replyForm.functionName && replyForm.functionName !== (original.function || '')

    if (!resultChanged && !statusChanged && !functionChanged) {
      ElMessage.warning('未检测到任何更改')
      return
    }

    isSubmittingReply.value = true

    try {
      if (resultChanged || statusChanged) {
        const replyResponse = await replyFeedback({
          token: tokenValue,
          content: original.content,
          result: trimmedResult,
          status: replyForm.status
        })

        if (!replyResponse || replyResponse.code !== 0) {
          throw new Error(replyResponse?.msg || '保存回复失败')
        }
      }

      if (functionChanged) {
        const functionResponse = await updateFeedbackFunction({
          token: tokenValue,
          content: original.content,
          functionName: replyForm.functionName
        })

        if (!functionResponse || functionResponse.code !== 0) {
          throw new Error(functionResponse?.msg || '更新功能标签失败')
        }
      }

      ElMessage.success('保存成功')
      closeReplyDialog()
      await fetchFeedback()
    } catch (error) {
      console.error('保存回复失败', error)
      ElMessage.error(error.message || '保存失败，请稍后再试')
    } finally {
      isSubmittingReply.value = false
    }
  }

  const openDeleteDialog = (feedback) => {
    feedbackToDelete.value = feedback
    deleteDialogVisible.value = true
  }

  const closeDeleteDialog = () => {
    deleteDialogVisible.value = false
    feedbackToDelete.value = null
  }

  const confirmDelete = async () => {
    if (!feedbackToDelete.value) return

    const tokenValue = token.value
    if (!tokenValue) {
      ElMessage.error('登录状态失效，请重新登录')
      return
    }

    isDeleting.value = true

    try {
      const response = await deleteFeedback({
        token: tokenValue,
        content: feedbackToDelete.value.content
      })

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '删除失败，请稍后再试')
      }

      ElMessage.success('删除成功')
      closeDeleteDialog()
      await fetchFeedback()
    } catch (error) {
      console.error('删除反馈失败', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    } finally {
      isDeleting.value = false
    }
  }

  const copyAccount = async (account) => {
    if (!account) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(account)
      } else {
        const input = document.createElement('input')
        input.value = account
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      ElMessage.success('账号已复制')
    } catch (error) {
      console.error('复制账号失败', error)
      ElMessage.error('复制失败，请手动复制')
    }
  }

  onMounted(() => {
    fetchFeedback()
  })

  return {
    // 数据
    loading,
    feedbackList,
    filteredFeedbackList,
    typeFilter,
    statusFilter,
    typeOptions,
    statusOptions,
    stats: computed(() => ({
      total: totalCount.value,
      solved: solvedCount.value,
      processing: processingCount.value,
      pending: pendingCount.value,
      solveRate: solveRate.value,
      processingRate: processingRate.value,
      pendingRate: pendingRate.value
    })),
    myFeedbackCount,
    myRepliedCount,

    // 操作
    handleRefresh,
    openReplyDialog,
    closeReplyDialog,
    submitReply,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    copyAccount,

    // 对话框
    replyDialogVisible,
    deleteDialogVisible,
    selectedFeedback,
    feedbackToDelete,
    replyForm,
    isSubmittingReply,
    isDeleting,
    availableFunctions
  }
}

export {
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
  FUNCTION_CATEGORIES,
  feedbackTypeMap,
  feedbackStatusMap
}
