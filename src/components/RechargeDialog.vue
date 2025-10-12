<template>
  <el-dialog
    v-model="visible"
    title="用户充值"
    :width="dialogWidth"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="rechargeFormRef"
      :model="rechargeForm"
      :rules="rules"
      :label-width="isMobile ? 'auto' : '100px'"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item label="充值账号">
        <el-input 
          v-model="userData.account" 
          disabled
          :size="'default'"
        />
      </el-form-item>
      
      <el-form-item label="当前等级">
        <el-tag :type="getMembershipTagType(userData.membership_level)">
          {{ getMembershipLabel(userData.membership_level) }}
        </el-tag>
      </el-form-item>
      
      <el-form-item label="修改等级" prop="membershipLevel">
        <el-select
          v-model="rechargeForm.membershipLevel"
          placeholder="保持当前等级"
          clearable
          style="width: 100%"
          :size="'default'"
        >
          <el-option
            v-for="(level, key) in availableLevels"
            :key="key"
            :label="level.label"
            :value="Number(key)"
          >
            <span style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span>{{ level.label }}</span>
              <el-tag :type="level.type" size="small">{{ level.label }}</el-tag>
            </span>
          </el-option>
        </el-select>
        <div v-if="rechargeForm.membershipLevel !== null && rechargeForm.membershipLevel !== userData.membership_level" 
             style="margin-top: 8px; color: #409EFF; font-size: 12px;">
          <i class="el-icon-info" style="margin-right: 4px;"></i>
          将从 {{ getMembershipLabel(userData.membership_level) }} 变更为 {{ getMembershipLabel(rechargeForm.membershipLevel) }}
        </div>
      </el-form-item>
      
      <el-form-item v-if="!isMobile" label="当前充值金额">
        <span style="display: inline-block; line-height: 32px; color: var(--el-text-color-regular);">
          ￥{{ userData.membership_pay_money || 0 }}
        </span>
      </el-form-item>
      <div v-else class="mobile-info-item">
        <span class="mobile-info-label">累计金额：</span>
        <span class="mobile-info-value">￥{{ userData.membership_pay_money || 0 }}</span>
      </div>

      <el-form-item v-if="!isMobile" label="当前到期时间">
        <div style="display: flex; align-items: center; flex-wrap: wrap;">
          <el-text>{{ formatDate(userData.membership_expire_date) }}</el-text>
          <template v-if="calculatedExpireDate">
            <span style="margin: 0 8px; color: #909399;">→</span>
            <el-text type="success">{{ formatDate(calculatedExpireDate) }}</el-text>
            <span style="margin-left: 8px; color: #67c23a; font-size: 12px;">
              (延长{{ addedDays }}天)
            </span>
          </template>
        </div>
      </el-form-item>
      <div v-else class="mobile-info-item">
        <span class="mobile-info-label">到期时间：</span>
        <span class="mobile-info-value">{{ formatDate(userData.membership_expire_date) }}</span>
        <template v-if="calculatedExpireDate">
          <div style="margin-top: 4px; color: #67c23a; font-size: 12px;">
            → {{ formatDate(calculatedExpireDate) }} (延长{{ addedDays }}天)
          </div>
        </template>
      </div>

      
      <el-form-item label="充值金额" prop="amount">
        <el-input-number
          v-model="rechargeForm.amount"
          :min="0"
          :precision="2"
          placeholder="请输入充值金额"
          style="width: 100%"
          :size="'default'"
        >
          <template #prefix>¥</template>
        </el-input-number>
        <div v-if="rechargeForm.amount === 0" style="margin-top: 8px; color: #E6A23C; font-size: 12px;">
          <i class="el-icon-warning" style="margin-right: 4px;"></i>
          金额为0，将作为赠送或补偿，不累计充值金额
        </div>
      </el-form-item>
      
      <el-form-item label="充值时长" prop="duration">
        <!-- 模式选择标签页 -->
        <el-radio-group
          v-model="durationModeType"
          style="margin-bottom: 8px; width: 100%;"
          :size="isMobile ? 'small' : 'default'"
        >
          <el-radio-button label="quick">快速选择</el-radio-button>
          <el-radio-button label="days">自定义天数</el-radio-button>
          <el-radio-button label="calendar">日历选择</el-radio-button>
        </el-radio-group>
        
        <!-- 快速选择模式 -->
        <div v-if="durationModeType === 'quick'" style="width: 100%;">
          <el-select
            v-model="quickSelect"
            placeholder="请选择充值类型"
            style="width: 100%;"
            @change="handleQuickSelect"
            :size="'default'"
          >
            <el-option label="1天卡" :value="1" />
            <el-option label="3天卡" :value="3" />
            <el-option label="周卡(7天)" :value="7" />
            <el-option label="推荐赠送(20天)" :value="20" />
            <el-option label="月卡(30天)" :value="30" />
            <el-option label="月卡优惠(45天)" :value="45" />
            <el-option label="季卡(90天)" :value="90" />
            <el-option label="半年卡(180天)" :value="180" />
            <el-option label="半年卡优惠(200天)" :value="200" />
            <el-option label="年卡(360天)" :value="360" />
            <el-option label="年卡优惠(480天)" :value="480" />
            <el-option label="永久(到2100年)" :value="'permanent'" />
          </el-select>
        </div>
        
        <!-- 自定义天数模式 -->
        <div v-if="durationModeType === 'days'" style="width: 100%;">
          <el-input-number
            v-model="rechargeForm.days"
            :min="0"
            :max="36500"
            placeholder="请输入充值天数"
            style="width: 100%;"
            :controls-position="'right'"
            @change="handleDaysChange"
            :size="'default'"
          />
        </div>
        
        <!-- 日历选择模式 -->
        <div v-if="durationModeType === 'calendar'" style="width: 100%;">
          <el-date-picker
            v-model="directExpireDate"
            type="datetime"
            placeholder="请选择到期时间"
            style="width: 100%;"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            @change="handleDirectDateChange"
            :size="'default'"
          />
        </div>
      </el-form-item>
      
      <el-form-item label="备注信息" prop="remark">
        <el-input
          v-model="rechargeForm.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注信息（选填）"
          :size="'default'"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">
          确认充值
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMembershipLabel, getMembershipTagType, MEMBERSHIP_LEVELS } from '../utils/constants'
import { useResponsive, useDialogResponsive } from '../utils/responsive'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'recharge'])

// 响应式配置
const { isMobile } = useResponsive()
const { dialogWidth } = useDialogResponsive()

const visible = ref(props.modelValue)
const loading = ref(false)
const rechargeFormRef = ref()
const durationModeType = ref('quick') // 模式类型：quick/days/calendar
const quickSelect = ref(null) // 快速选择的值
const directExpireDate = ref(null) // 直接选择的日期
const calculatedExpireDate = ref(null) // 计算后的到期时间
const addedDays = ref(0) // 添加的天数

// 计算可用的会员级别选项（排除游客）
const availableLevels = computed(() => {
  const levels = {}
  for (const [key, value] of Object.entries(MEMBERSHIP_LEVELS)) {
    if (key !== '-1') {  // 排除游客级别
      levels[key] = value
    }
  }
  return levels
})

const rechargeForm = reactive({
  amount: null,
  days: null,
  remark: '',
  membershipLevel: null  // 新增会员级别字段
})

const rules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '充值金额必须大于等于0', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    resetForm()
    // 设置默认备注
    if (props.userData?.remarks) {
      rechargeForm.remark = props.userData.remarks
    }
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const resetForm = () => {
  if (rechargeFormRef.value) {
    rechargeFormRef.value.resetFields()
  }
  Object.assign(rechargeForm, {
    amount: null,
    days: null,
    remark: props.userData?.remarks || '',
    membershipLevel: null  // 重置会员级别
  })
  // 重置时长选择相关
  durationModeType.value = 'quick'
  quickSelect.value = null
  directExpireDate.value = null
  calculatedExpireDate.value = null
  addedDays.value = 0
}

// 格式化日期
const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 处理快速选择
const handleQuickSelect = (value) => {
  if (value !== null) {
    if (value === 'permanent') {
      // 永久卡设置为2100年的当天时间
      const now = new Date()
      const permanentDate = new Date(2100, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())
      const currentExpireDate = props.userData?.membership_expire_date ? new Date(props.userData.membership_expire_date) : now
      const baseDate = currentExpireDate > now ? currentExpireDate : now
      const days = Math.floor((permanentDate - baseDate) / (1000 * 60 * 60 * 24))
      rechargeForm.days = days
      calculatedExpireDate.value = permanentDate
      addedDays.value = days
    } else {
      rechargeForm.days = value
      handleDaysChange(value)
    }
  }
}

// 处理天数变化
const handleDaysChange = (value) => {
  if (value >= 0) {
    const now = new Date()
    const currentExpireDate = props.userData?.membership_expire_date ? new Date(props.userData.membership_expire_date) : now
    const baseDate = currentExpireDate > now ? currentExpireDate : now
    
    const newExpireDate = new Date(baseDate)
    newExpireDate.setDate(newExpireDate.getDate() + value)
    calculatedExpireDate.value = newExpireDate
    addedDays.value = value
  } else {
    calculatedExpireDate.value = null
    addedDays.value = 0
  }
}

// 处理直接日期选择
const handleDirectDateChange = (value) => {
  if (value) {
    const selectedDate = new Date(value)
    const now = new Date()
    const currentExpireDate = props.userData?.membership_expire_date ? new Date(props.userData.membership_expire_date) : now
    const baseDate = currentExpireDate > now ? currentExpireDate : now
    const days = Math.floor((selectedDate - baseDate) / (1000 * 60 * 60 * 24))
    
    rechargeForm.days = days >= 0 ? days : 0
    calculatedExpireDate.value = selectedDate
    addedDays.value = days >= 0 ? days : 0
  }
}

// 禁用过去的日期
const disabledDate = (date) => {
  // 只能选择今天及以后的日期
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

const handleClose = () => {
  visible.value = false
}

const handleConfirm = async () => {
  await rechargeFormRef.value.validate(async (valid) => {
    if (valid) {
      // 验证是否选择了充值时长
      if (!rechargeForm.days || rechargeForm.days <= 0) {
        ElMessage.error('请选择充值时长')
        return
      }
      
      // 如果金额为0，显示确认提示
      if (rechargeForm.amount === 0) {
        ElMessage.info('本次充值金额为0，将作为赠送或补偿处理')
      }
      
      loading.value = true
      try {
        const rechargeData = {
          account: props.userData.account,
          amount: rechargeForm.amount,
          days: rechargeForm.days,
          remark: rechargeForm.remark,
          isGift: rechargeForm.amount === 0, // 标记是否为赠送
          membershipLevel: rechargeForm.membershipLevel  // 新的会员级别
        }
        
        // 如果修改了会员级别，显示确认提示
        if (rechargeForm.membershipLevel !== null && rechargeForm.membershipLevel !== props.userData.membership_level) {
          ElMessage.info(`将同时修改会员级别为${getMembershipLabel(rechargeForm.membershipLevel)}`)
        }
        
        emit('recharge', rechargeData)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 移动端信息项样式 */
.mobile-info-item {
  padding: 8px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
}

.mobile-info-label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  display: inline-block;
  min-width: 70px;
}

.mobile-info-value {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 500;
}

/* 移动端样式优化 */
@media (max-width: 767px) {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0 !important;
  }

  :deep(.el-dialog__header) {
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;
  }

  :deep(.el-dialog__title) {
    font-size: 16px;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    /* 为底部按钮栏预留空间，避免内容被遮挡 */
    padding-bottom: 70px;
  }

  :deep(.el-dialog__footer) {
    border-top: 1px solid #e4e7ed;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--el-bg-color);
    z-index: 10;
    padding: 12px 16px;
    /* 减小底部预留空间 */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  /* 暗色主题适配 */
  :deep(.el-dialog__footer[data-theme="dark"]) {
    background: var(--el-bg-color-page);
  }

  /* 减小表单项间距 */
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 2px;
    font-size: 13px;
    line-height: 1.2;
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
    width: auto !important;
    max-width: 100%;
    text-align: left !important;
    display: block !important;
  }

  /* 减小输入控件字体大小 */
  :deep(.el-input__inner),
  :deep(.el-input-number__input-inner),
  :deep(.el-select__input),
  :deep(.el-textarea__inner) {
    font-size: 14px;
  }

  /* 减小标签字体大小 */
  :deep(.el-tag) {
    font-size: 12px;
  }

  /* 优化单选按钮组 */
  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
  }

  :deep(.el-radio-button) {
    margin-bottom: 6px;
  }

  :deep(.el-radio-button__inner) {
    font-size: 12px;
    padding: 5px 8px;
  }

  /* 减小备注框高度和最后一项的间距 */
  :deep(.el-form-item:last-child) {
    margin-bottom: 8px;
  }

  /* 限制textarea高度 */
  :deep(.el-textarea__inner) {
    max-height: 60px;
    min-height: 50px;
    resize: none;
    font-size: 13px;
  }

  /* 优化按钮大小和间距 */
  :deep(.el-button) {
    font-size: 14px;
    padding: 8px 15px;
  }

  /* 优化选择器下拉项的高度 */
  :deep(.el-select-dropdown__item) {
    font-size: 13px;
    padding: 0 10px;
    height: 32px;
    line-height: 32px;
  }

  /* 优化日期选择器 */
  :deep(.el-date-editor) {
    font-size: 14px;
  }

  /* 优化提示文字 */
  :deep(.el-form-item__error) {
    font-size: 11px;
  }

  /* 提示信息字体大小 */
  div[style*="color: #409EFF"],
  div[style*="color: #E6A23C"] {
    font-size: 11px !important;
  }
}
</style>