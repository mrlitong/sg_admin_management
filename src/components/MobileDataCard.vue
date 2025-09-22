<template>
  <div class="mobile-card" @click="handleCardClick">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="card-title">
        <span class="account">{{ userData.account }}</span>
      </div>
      <el-dropdown
        v-if="showActions"
        @command="handleCommand"
        @click.stop
        trigger="click"
        placement="bottom-end"
      >
        <el-button
          type="text"
          :icon="MoreFilled"
          circle
          size="small"
          @click.stop
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="recharge" :icon="Wallet">
              充值
            </el-dropdown-item>
            <el-dropdown-item command="edit" :icon="Edit">
              编辑
            </el-dropdown-item>
            <el-dropdown-item command="delete" :icon="Delete" divided>
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-body">
      <!-- 第一行：在线状态和最后在线时间 -->
      <div class="info-row-compact">
        <div class="compact-item">
          <span class="compact-label">状态:</span>
          <span class="compact-value" :class="localAuxiliaryOnline ? 'text-success' : 'text-regular'">
            {{ localAuxiliaryOnline ? '在线' : '离线' }}
          </span>
        </div>
        <div class="compact-item">
          <span class="compact-label">最后在线:</span>
          <span class="compact-value">{{ userData.last_online_time ? formatDateTime(userData.last_online_time) : '-' }}</span>
        </div>
      </div>

      <!-- 第二行：会员级别和充值金额 -->
      <div class="info-row-compact">
        <div class="compact-item">
          <span class="compact-label">会员:</span>
          <el-tag
            v-if="membershipLevel !== null && membershipLevel >= 0"
            :type="getMembershipTagType(membershipLevel)"
            size="small"
            effect="dark"
          >
            {{ getMembershipLabel(membershipLevel) }}
          </el-tag>
          <span v-else class="compact-value">未开通</span>
        </div>
        <div class="compact-item">
          <span class="compact-label">充值:</span>
          <span class="compact-value text-primary">¥{{ userData.membership_pay_money || 0 }}</span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="info-row" v-if="userData.real_account">
        <span class="info-label">真实账号:</span>
        <span class="info-value">{{ userData.real_account }}</span>
      </div>

      <div class="info-row" v-if="userData.main_account">
        <span class="info-label">主账号:</span>
        <span class="info-value">{{ userData.main_account }}</span>
      </div>

      <!-- 第三行：区服和到期时间 -->
      <div class="info-row-compact" v-if="userData.server_name || membershipExpireDate">
        <div class="compact-item" v-if="userData.server_name">
          <span class="compact-label">区服:</span>
          <span class="compact-value">{{ userData.server_name }}{{ userData.server_info ? `-${userData.server_info}` : '' }}</span>
        </div>
        <div class="compact-item" v-if="membershipExpireDate">
          <span class="compact-label">到期:</span>
          <span class="compact-value" :class="{ 'text-danger': isExpiringSoon }">
            {{ formatDate(membershipExpireDate) }}
          </span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="info-row remark" v-if="userData.remarks">
        <span class="info-label">备注:</span>
        <span class="info-value text-ellipsis-2">{{ userData.remarks }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Edit, Delete, Wallet } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getMembershipLabel, getMembershipTagType } from '../utils/constants'

const props = defineProps({
  userData: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'click', 'recharge'])

// 本地状态
const localAuxiliaryOnline = ref(props.userData.auxiliary_online === 1)

// 计算属性
const membershipLevel = computed(() => props.userData.membership_level)
const membershipExpireDate = computed(() => props.userData.membership_expire_date)

// 判断是否即将过期（7天内）
const isExpiringSoon = computed(() => {
  if (!membershipExpireDate.value) return false
  const daysLeft = dayjs(membershipExpireDate.value).diff(dayjs(), 'day')
  return daysLeft <= 7 && daysLeft >= 0
})

// 使用从 constants.js 导入的函数
// getMembershipTagType 和 getMembershipLabel 已经从 constants.js 导入

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  const date = dayjs(datetime)
  const now = dayjs()
  const diffDays = now.diff(date, 'day')
  
  if (diffDays === 0) {
    return date.format('今天 HH:mm')
  } else if (diffDays === 1) {
    return date.format('昨天 HH:mm')
  } else if (diffDays < 7) {
    return date.format('MM-DD HH:mm')
  } else {
    return date.format('YYYY-MM-DD')
  }
}

// 处理卡片点击
const handleCardClick = () => {
  if (props.selectable) {
    emit('click', props.userData)
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'recharge':
      emit('recharge', props.userData)
      break
    case 'edit':
      emit('edit', props.userData)
      break
    case 'delete':
      handleDelete()
      break
  }
}

// 处理删除
const handleDelete = () => {
  ElMessageBox.confirm(
    `确定要删除用户 "${props.userData.account}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('delete', props.userData)
  }).catch(() => {
    // 用户取消
  })
}

</script>

<style scoped>
.mobile-card {
  background: var(--card-bg);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  cursor: pointer;
}

.mobile-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.account {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary);
}

/* 卡片内容 */
.card-body {
  margin-bottom: 6px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.info-row.remark {
  margin-top: 6px;
}

.info-label {
  color: var(--text-color-regular);
  min-width: 60px;
  flex-shrink: 0;
  font-size: 12px;
}

.info-value {
  color: var(--text-color-secondary);
  flex: 1;
  word-break: break-all;
  font-size: 12px;
}

.info-value.text-primary {
  color: var(--primary-color);
  font-weight: 600;
}

.info-value.text-danger {
  color: var(--danger-color);
}

/* 紧凑信息行样式 */
.info-row-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  line-height: 1.4;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 4px 6px;
}

:global(.dark) .info-row-compact {
  background: rgba(255, 255, 255, 0.02);
}

.compact-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.compact-label {
  color: var(--text-color-regular);
  font-size: 11px;
  margin-right: 2px;
  flex-shrink: 0;
}

.compact-value {
  color: var(--text-color-secondary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.compact-value.text-primary {
  color: var(--primary-color);
  font-weight: 600;
}

.compact-value.text-danger {
  color: var(--danger-color);
}

.compact-value.text-success {
  color: var(--success-color, #67c23a);
  font-weight: 600;
}

.compact-value.text-regular {
  color: var(--text-color-regular);
}

/* 会员标签在紧凑行中的样式 */
.compact-item :deep(.el-tag) {
  margin-left: 2px;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
}


/* 文本省略 */
.text-ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 标签样式覆盖 */
:deep(.el-tag) {
  height: 18px;
  line-height: 16px;
  padding: 0 5px;
  font-size: 11px;
}


/* 下拉按钮样式 */
:deep(.el-button.is-circle) {
  width: 24px;
  height: 24px;
  padding: 4px;
}

/* 选中状态 */
.mobile-card.selected {
  border: 2px solid var(--primary-color);
  background: var(--primary-color-light-9);
}

/* 加载状态 */
.mobile-card.loading {
  opacity: 0.6;
  pointer-events: none;
}
</style>