<template>
  <el-dialog
    v-model="visible"
    title="用户充值"
    :width="dialogWidth"
    :fullscreen="isMobile"
    :close-on-click-modal="!isMobile"
    @close="handleClose"
  >
    <el-form
      ref="rechargeFormRef"
      :model="rechargeForm"
      :rules="rules"
      :label-width="isMobile ? '80px' : '100px'"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item label="充值账号">
        <el-input 
          v-model="userData.account" 
          disabled
          :size="isMobile ? 'large' : 'default'"
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
          :size="isMobile ? 'large' : 'default'"
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
      
      <el-form-item label="当前充值金额">
        <el-text>￥{{ userData.membership_pay_money || 0 }}</el-text>
      </el-form-item>
      
      <el-form-item label="当前到期时间">
        <el-text>{{ formatDate(userData.membership_expire_date) }}</el-text>
      </el-form-item>
      
      <el-form-item label="充值金额" prop="amount">
        <el-input-number
          v-model="rechargeForm.amount"
          :min="0"
          :precision="2"
          placeholder="请输入充值金额"
          style="width: 100%"
          :size="isMobile ? 'large' : 'default'"
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
          style="margin-bottom: 12px;"
          :size="isMobile ? 'default' : 'default'"
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
            :size="isMobile ? 'large' : 'default'"
          >
            <el-option label="天卡(1天)" :value="1" />
            <el-option label="周卡(7天)" :value="7" />
            <el-option label="月卡(30天)" :value="30" />
            <el-option label="季卡(90天)" :value="90" />
            <el-option label="年卡(365天)" :value="365" />
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
            :size="isMobile ? 'large' : 'default'"
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
            :size="isMobile ? 'large' : 'default'"
          />
        </div>
        
        <!-- 显示计算后的到期时间 -->
        <div v-if="calculatedExpireDate" style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-radius: 4px;">
          <div style="color: #1890ff; font-size: 14px; font-weight: 500;">
            新到期时间：{{ formatDate(calculatedExpireDate) }}
          </div>
          <div v-if="addedDays > 0" style="color: #52c41a; font-size: 12px; margin-top: 4px;">
            延长天数：{{ addedDays }} 天
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="备注信息" prop="remark">
        <el-input
          v-model="rechargeForm.remark"
          type="textarea"
          :rows="isMobile ? 2 : 3"
          placeholder="请输入备注信息（选填）"
          :size="isMobile ? 'large' : 'default'"
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

/* 移动端样式优化 */
@media (max-width: 767px) {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0 !important;
  }
  
  :deep(.el-dialog__header) {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;
  }
  
  :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    /* 为系统UI预留底部安全区域 */
    padding-bottom: 20px;
    /* 支持iOS安全区域 */
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  }
  
  :deep(.el-dialog__footer) {
    border-top: 1px solid #e4e7ed;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 10;
    flex-shrink: 0;
    /* 为系统按钮预留底部空间 */
    padding-bottom: 60px;
    /* 支持iOS安全区域 */
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  }
  
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
  }
  
  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
  }
  
  :deep(.el-radio-button) {
    margin-bottom: 8px;
  }
  
  /* 减少备注框最后一项的间距，避免过多占用空间 */
  :deep(.el-form-item:last-child) {
    margin-bottom: 12px;
  }
  
  /* 确保textarea不会过高 */
  :deep(.el-textarea__inner) {
    max-height: 80px;
    resize: none;
  }
}
</style>