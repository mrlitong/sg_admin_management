// 会员等级映射
export const MEMBERSHIP_LEVELS = {
  '-1': { label: '游客', type: 'info' },
  '0': { label: '体验会员', type: '' },
  '1': { label: '基础会员', type: 'success' },
  '2': { label: '高级会员', type: 'warning' },
  '3': { label: '钻石会员', type: 'danger' },
  '4': { label: '至尊会员', type: 'warning', isVipGold: true }
}

// 游戏平台映射
export const GAME_PLATFORMS = {
  '-1': '未知版本',
  '0': '兵临天下App',
  '1': '37游戏',
  '2': '今鸿互动',
  '3': '63游戏',
  '4': '皇者天下',
  '5': '如玩网页',
  '6': 'G妹游戏',
  '7': '小程序'
}

// 获取会员等级标签
export function getMembershipLabel(level) {
  return MEMBERSHIP_LEVELS[String(level)]?.label || '未知'
}

// 获取会员等级标签类型
export function getMembershipTagType(level) {
  const membership = MEMBERSHIP_LEVELS[String(level)]
  if (membership?.isVipGold) {
    return 'warning vip-gold'  // 使用warning作为基础类型，添加vip-gold自定义类
  }
  return membership?.type || 'info'
}

// 获取游戏平台名称
export function getGamePlatformName(platform) {
  return GAME_PLATFORMS[String(platform)] || '未知平台'
}