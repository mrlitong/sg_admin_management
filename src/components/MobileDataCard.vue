<template>
  <div class="mobile-card" @click="handleCardClick">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="card-title">
        <span class="account">{{ userData.account }}</span>
        <el-tag 
          v-if="membershipLevel !== null && membershipLevel >= 0"
          :type="getMembershipTagType(membershipLevel)" 
          size="small"
          effect="dark"
        >
          {{ getMembershipLabel(membershipLevel) }}
        </el-tag>
        <el-tag 
          v-else
          type="info"
          size="small"
        >
          未开通
        </el-tag>
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
      <!-- 基本信息 -->
      <div class="info-row" v-if="userData.real_account">
        <span class="info-label">真实账号:</span>
        <span class="info-value">{{ userData.real_account }}</span>
      </div>
      
      <div class="info-row" v-if="userData.main_account">
        <span class="info-label">主账号:</span>
        <span class="info-value">{{ userData.main_account }}</span>
      </div>
      
      <div class="info-row" v-if="userData.contact">
        <span class="info-label">联系方式:</span>
        <span class="info-value">{{ userData.contact }}</span>
      </div>
      
      <div class="info-row" v-if="userData.server_name">
        <span class="info-label">区服:</span>
        <span class="info-value">{{ userData.server_name }}{{ userData.server_info ? ` - ${userData.server_info}` : '' }}</span>
      </div>
      
      <!-- 会员信息 -->
      <div class="info-row" v-if="membershipExpireDate">
        <span class="info-label">到期时间:</span>
        <span class="info-value" :class="{ 'text-danger': isExpiringSoon }">
          {{ formatDate(membershipExpireDate) }}
        </span>
      </div>
      
      <div class="info-row" v-if="userData.membership_pay_money">
        <span class="info-label">付费金额:</span>
        <span class="info-value text-primary">¥{{ userData.membership_pay_money }}</span>
      </div>
      
      <!-- 备注 -->
      <div class="info-row remark" v-if="userData.remarks">
        <span class="info-label">备注:</span>
        <span class="info-value text-ellipsis-2">{{ userData.remarks }}</span>
      </div>
    </div>
    
    <!-- 卡片底部操作 -->
    <div class="card-footer" v-if="showFooterActions">
      <div class="footer-actions">
        <el-switch
          v-if="showToggle"
          v-model="localAuxiliaryOnline"
          :loading="toggleLoading"
          size="small"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleToggleChange"
          @click.stop
        />
        <span v-if="userData.last_online_time" class="last-online">
          最后在线: {{ formatDateTime(userData.last_online_time) }}
        </span>
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
  showToggle: {
    type: Boolean,
    default: true
  },
  showFooterActions: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle', 'click', 'recharge'])

// 本地状态
const localAuxiliaryOnline = ref(props.userData.auxiliary_online === 1)
const toggleLoading = ref(false)

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

// 处理开关切换
const handleToggleChange = async (value) => {
  toggleLoading.value = true
  try {
    await emit('toggle', props.userData, value)
    ElMessage.success(value ? '已开启挂机' : '已关闭挂机')
  } catch (error) {
    // 恢复原状态
    localAuxiliaryOnline.value = !value
    ElMessage.error('操作失败')
  } finally {
    toggleLoading.value = false
  }
}
</script>

<style scoped>
.mobile-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
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
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.account {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

/* 卡片内容 */
.card-body {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  font-size: 14px;
}

.info-row.remark {
  margin-top: 8px;
}

.info-label {
  color: var(--text-color-regular);
  min-width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: var(--text-color-secondary);
  flex: 1;
  word-break: break-all;
}

.info-value.text-primary {
  color: var(--primary-color);
  font-weight: 600;
}

.info-value.text-danger {
  color: var(--danger-color);
}

/* 卡片底部 */
.card-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color-lighter);
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-online {
  font-size: 12px;
  color: var(--text-color-regular);
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
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
  font-size: 12px;
}

/* 开关样式覆盖 */
:deep(.el-switch) {
  height: 20px;
}

:deep(.el-switch__core) {
  height: 20px;
  min-width: 40px;
}

:deep(.el-switch__inner) {
  font-size: 11px;
}

/* 下拉按钮样式 */
:deep(.el-button.is-circle) {
  width: 28px;
  height: 28px;
  padding: 6px;
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