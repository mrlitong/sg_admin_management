import request from '../utils/request'

function ensureToken(token) {
  const value = token || localStorage.getItem('token')
  if (!value) {
    throw new Error('缺少用户凭证')
  }
  return value
}

function withAuthHeaders(token, extra = {}) {
  const accessToken = ensureToken(token)
  return {
    ...extra,
    headers: {
      ...(extra.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  }
}

export function getFeedbackList(token) {
  return request({
    url: '/get_feedback',
    method: 'post',
    data: {},
    ...withAuthHeaders(token)
  })
}

export function replyFeedback({ token, content, result, status }) {
  return request({
    url: '/replay_feedback',
    method: 'post',
    data: {
      content,
      feedback_result: result,
      feedback_status: String(status)
    },
    ...withAuthHeaders(token)
  })
}

export function updateFeedbackFunction({ token, content, functionName }) {
  return request({
    url: '/submit_feedback',
    method: 'post',
    data: {
      content,
      feedback_function: functionName
    },
    ...withAuthHeaders(token)
  })
}

export function deleteFeedback({ token, content }) {
  return request({
    url: '/delete_feedback',
    method: 'post',
    data: {
      key: content
    },
    ...withAuthHeaders(token)
  })
}
