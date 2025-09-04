<template>
  <el-dialog
    :model-value="modelValue"
    title="会员转移"
    :width="dialogWidth"
    :fullscreen="isMobile"
    :close-on-click-modal="!isMobile"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '80px' : '120px'"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          <div style="font-size: 14px;">
            <div>注意事项：</div>
            <div style="margin-top: 5px;">1. 会员转移操作不可逆，请仔细核对账号</div>
            <div>2. 源账号的会员权益将完全转移到目标账号</div>
            <div>3. 转移后源账号会员信息将被清空</div>
          </div>
        </template>
      </el-alert>

      <el-form-item label="源账号" prop="source_account">
        <el-input
          v-model="formData.source_account"
          placeholder="请输入要转出会员的账号"
          @blur="validateSourceAccount"
          :size="isMobile ? 'large' : 'default'"
        >
          <template #append>
            <el-button @click="validateSourceAccount">验证</el-button>
          </template>
        </el-input>
        <div v-if="sourceInfo" style="margin-top: 8px; color: #909399; font-size: 12px;">
          <div v-if="sourceInfo.valid" style="color: #67C23A;">
            ✓ 会员等级：{{ getMembershipLevelLabel(sourceInfo.level) }}，
            到期时间：{{ sourceInfo.expire_date }}，
            剩余天数：{{ sourceInfo.remaining_days }}天
            <div v-if="sourceInfo.remarks" style="margin-top: 4px;">
              备注：{{ sourceInfo.remarks }}
            </div>
          </div>
          <div v-else style="color: #F56C6C;">
            ✗ {{ sourceInfo.message }}
          </div>
        </div>
      </el-form-item>

      <el-form-item label="目标账号" prop="target_account">
        <el-input
          v-model="formData.target_account"
          placeholder="请输入要转入会员的账号"
          @blur="validateTargetAccount"
          :size="isMobile ? 'large' : 'default'"
        >
          <template #append>
            <el-button @click="validateTargetAccount">验证</el-button>
          </template>
        </el-input>
        <div v-if="targetInfo" style="margin-top: 8px; color: #909399; font-size: 12px;">
          <div v-if="targetInfo.valid" style="color: #67C23A;">
            ✓ 当前会员等级：{{ getMembershipLevelLabel(targetInfo.level) }}，
            到期时间：{{ targetInfo.expire_date || '无' }}
            <div v-if="targetInfo.remarks" style="margin-top: 4px;">
              当前备注：{{ targetInfo.remarks }}
            </div>
          </div>
          <div v-else style="color: #F56C6C;">
            ✗ {{ targetInfo.message }}
          </div>
        </div>
      </el-form-item>

      <el-divider />

      <div v-if="sourceInfo?.valid && targetInfo?.valid" style="padding: 0 20px;">
        <h4 style="margin-bottom: 15px;">转移预览</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="转移天数">
            {{ sourceInfo.remaining_days }} 天
          </el-descriptions-item>
          <el-descriptions-item label="转移金额">
            ¥{{ sourceInfo.pay_money }}
          </el-descriptions-item>
          <el-descriptions-item label="目标账号新等级">
            {{ getMembershipLevelLabel(Math.max(sourceInfo.level, targetInfo.level >= 0 ? targetInfo.level : 0)) }}
          </el-descriptions-item>
          <el-descriptions-item label="目标账号新到期时间">
            {{ calculateNewExpireDate() }}
          </el-descriptions-item>
          <el-descriptions-item label="源账号备注">
            {{ sourceInfo.remarks || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标账号新备注">
            {{ calculateNewRemarks() }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canTransfer"
        @click="handleConfirm"
      >
        确认转移
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserDetail } from '../api/users'
import { MEMBERSHIP_LEVELS } from '../utils/constants'
import { useResponsive, useDialogResponsive } from '../utils/responsive'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式配置
const { isMobile } = useResponsive()
const { dialogWidth } = useDialogResponsive()

const formRef = ref()
const formData = reactive({
  source_account: '',
  target_account: ''
})

const formRules = {
  source_account: [
    { required: true, message: '请输入源账号', trigger: 'blur' }
  ],
  target_account: [
    { required: true, message: '请输入目标账号', trigger: 'blur' }
  ]
}

const sourceInfo = ref(null)
const targetInfo = ref(null)

const canTransfer = computed(() => {
  return sourceInfo.value?.valid && targetInfo.value?.valid &&
         formData.source_account && formData.target_account &&
         formData.source_account !== formData.target_account
})

const getMembershipLevelLabel = (level) => {
  if (level === -1) return '无会员'
  return MEMBERSHIP_LEVELS[level]?.label || '未知'
}

const calculateNewExpireDate = () => {
  if (!sourceInfo.value?.remaining_days || !targetInfo.value) return ''
  
  const now = new Date()
  let baseDate = now
  
  if (targetInfo.value.expire_date) {
    const targetExpire = new Date(targetInfo.value.expire_date)
    if (targetExpire > now) {
      baseDate = targetExpire
    }
  }
  
  const newDate = new Date(baseDate)
  newDate.setDate(newDate.getDate() + sourceInfo.value.remaining_days)
  
  return newDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

const calculateNewRemarks = () => {
  if (!sourceInfo.value || !targetInfo.value) return ''
  
  let newRemarks = sourceInfo.value.remarks || ''
  
  // 如果目标账号已有备注，合并备注
  if (targetInfo.value.remarks) {
    newRemarks = targetInfo.value.remarks + (newRemarks ? '|' + newRemarks : '')
  }
  
  // 添加转移来源信息
  if (newRemarks) {
    newRemarks += '|转移自账号' + formData.source_account
  } else {
    newRemarks = '转移自账号' + formData.source_account
  }
  
  return newRemarks
}

const validateSourceAccount = async () => {
  if (!formData.source_account) {
    sourceInfo.value = null
    return
  }
  
  try {
    const res = await getUserDetail(formData.source_account)
    if (res.code === 0 && res.data) {
      const user = res.data
      const expireDate = user.membership_expire_date
      const now = new Date()
      
      if (user.membership_level < 0 || !expireDate) {
        sourceInfo.value = {
          valid: false,
          message: '该账号没有会员权益'
        }
      } else {
        const expire = new Date(expireDate)
        if (expire <= now) {
          sourceInfo.value = {
            valid: false,
            message: '该账号会员已过期'
          }
        } else {
          const remainingDays = Math.ceil((expire - now) / (1000 * 60 * 60 * 24))
          sourceInfo.value = {
            valid: true,
            level: user.membership_level,
            expire_date: expireDate,
            pay_money: user.membership_pay_money || 0,
            remaining_days: remainingDays,
            remarks: user.remarks || ''
          }
        }
      }
    } else {
      sourceInfo.value = {
        valid: false,
        message: '账号不存在'
      }
    }
  } catch (error) {
    sourceInfo.value = {
      valid: false,
      message: '验证失败：' + error.message
    }
  }
}

const validateTargetAccount = async () => {
  if (!formData.target_account) {
    targetInfo.value = null
    return
  }
  
  if (formData.target_account === formData.source_account) {
    targetInfo.value = {
      valid: false,
      message: '目标账号不能与源账号相同'
    }
    return
  }
  
  try {
    const res = await getUserDetail(formData.target_account)
    if (res.code === 0 && res.data) {
      const user = res.data
      targetInfo.value = {
        valid: true,
        level: user.membership_level || -1,
        expire_date: user.membership_expire_date,
        pay_money: user.membership_pay_money || 0,
        remarks: user.remarks || ''
      }
    } else {
      targetInfo.value = {
        valid: false,
        message: '账号不存在'
      }
    }
  } catch (error) {
    targetInfo.value = {
      valid: false,
      message: '验证失败：' + error.message
    }
  }
}

const handleClose = () => {
  formData.source_account = ''
  formData.target_account = ''
  sourceInfo.value = null
  targetInfo.value = null
  emit('update:modelValue', false)
}

const handleConfirm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  
  if (!canTransfer.value) {
    ElMessage.error('请先验证两个账号的有效性')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将账号 ${formData.source_account} 的会员权益转移到账号 ${formData.target_account} 吗？此操作不可逆！`,
      '确认转移',
      {
        confirmButtonText: '确定转移',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('confirm', {
      source_account: formData.source_account,
      target_account: formData.target_account
    })
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-descriptions__label) {
  width: 140px;
}

/* 移动端样式优化 */
@media (max-width: 767px) {
  :deep(.el-dialog__header) {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  :deep(.el-dialog__footer) {
    border-top: 1px solid #e4e7ed;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
  }
  
  :deep(.el-alert) {
    padding: 12px;
  }
  
  :deep(.el-descriptions__label) {
    width: 100px;
  }
}
</style>