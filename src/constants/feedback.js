// 反馈功能相关常量与辅助工具

export const FEEDBACK_TYPES = [
  { value: 1, label: 'BUG反馈' },
  { value: 2, label: '使用问题' },
  { value: 3, label: '功能建议' }
]

export const FEEDBACK_STATUSES = [
  { value: -1, label: '待处理', type: 'warning' },
  { value: 0, label: '处理中', type: 'info' },
  { value: 1, label: '已解决', type: 'success' }
]

export const FUNCTION_CATEGORIES = [
  {
    label: '钻石功能',
    value: 'diamond',
    functions: [
      '钻石功能', '自动派兵', '城池建设', '产业施政', '自动擂台',
      '智能跨服', '襄阳国战', '朝廷密旨', '恒古梦魇', '寻龙分金',
      '安邦之路', '镇魂塔', '聊天记录'
    ]
  },
  {
    label: '高级功能',
    value: 'advanced',
    functions: [
      '高级功能', '异邦挑战', '城池拜访', '自动民情', '每日政务',
      '每日黄巾', '异族入侵', '封地管理', '每日切磋'
    ]
  },
  {
    label: '基础功能',
    value: 'basic',
    functions: [
      '基础功能', '日常收益', '沙盘演绎', '比武大会', '蓬莱寻宝',
      '过关斩将', '群雄逐鹿', '见证传奇', '酒馆招募', '珍宝阁（开发中）', '每日商店'
    ]
  },
  {
    label: '其他功能',
    value: 'other',
    functions: ['其他功能']
  }
]

export const feedbackTypeMap = FEEDBACK_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const feedbackStatusMap = FEEDBACK_STATUSES.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export function findCategoryByFunction(functionName) {
  if (!functionName) return null
  return FUNCTION_CATEGORIES.find(category =>
    category.functions.includes(functionName)
  ) || null
}

export function getFunctionsByCategory(categoryValue) {
  const target = FUNCTION_CATEGORIES.find(item => item.value === categoryValue)
  return target ? target.functions : []
}
