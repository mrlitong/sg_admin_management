<template>
  <el-dialog 
    :model-value="modelValue" 
    :title="userData ? '编辑用户' : '新增用户'"
    :width="dialogWidth"
    :fullscreen="isMobile"
    :close-on-click-modal="!isMobile"
    @close="handleClose"
    class="user-edit-dialog"
  >
    <!-- 顶部操作按钮 -->
    <div class="top-actions" :class="{ 'mobile-top-actions': isMobile }">
      <el-button @click="handleClose" :size="isMobile ? 'small' : 'small'">
        <el-icon><Close /></el-icon>
        <span v-if="!isMobile">取消</span>
      </el-button>
      <el-button type="primary" @click="handleSave" :size="isMobile ? 'small' : 'small'">
        <el-icon><Check /></el-icon>
        <span v-if="!isMobile">保存</span>
      </el-button>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '70px' : '85px'"
      :label-position="isMobile ? 'left' : 'right'"
      :size="isMobile ? 'small' : 'small'"
      :class="{ 'mobile-form': isMobile }"
    >
      <!-- 基本信息区域 -->
      <div class="form-section" :class="{ 'mobile-section': isMobile }">
        <h4 :class="['section-title', { 'mobile-title': isMobile }]">基本信息</h4>
        
        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="账号" prop="account">
              <el-input 
                v-model="formData.account" 
                placeholder="账号"
                :disabled="!!userData"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="formData.password" 
                placeholder="密码"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="关联账户" prop="real_account">
              <el-input 
                v-model="formData.real_account" 
                placeholder="关联账户"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="主账户" prop="main_account">
              <el-input 
                v-model="formData.main_account" 
                placeholder="主账户"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="联系方式" prop="contact">
              <el-input 
                v-model="formData.contact" 
                placeholder="微信号"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="游戏版本" prop="game_platform">
              <el-select 
                v-model="formData.game_platform" 
                placeholder="游戏版本"
                :size="isMobile ? 'small' : 'small'"
                style="width: 100%"
              >
                <el-option 
                  v-for="(label, value) in GAME_PLATFORMS" 
                  :key="value" 
                  :label="label" 
                  :value="Number(value)" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6" v-if="formData.game_platform === 0">
            <el-form-item label="校验">
              <el-button 
                type="primary" 
                :size="isMobile ? 'small' : 'small'"
                @click="validateAccount"
                :loading="validating"
                style="width: 100%"
              >
                校验账号
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 游戏信息区域 -->
      <div class="form-section" :class="{ 'mobile-section': isMobile }">
        <h4 :class="['section-title', { 'mobile-title': isMobile }]">游戏信息</h4>
        
        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="区名" prop="server_name">
              <el-input 
                v-model="formData.server_name" 
                placeholder="区名"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="区服" prop="server_info">
              <el-input 
                v-model="formData.server_info" 
                placeholder="4_5"
                :size="isMobile ? 'small' : 'small'"
              >
                <template #prepend>h</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="区号" prop="server_zone">
              <el-input 
                v-model="formData.server_zone" 
                placeholder="区号"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="WebSocket" prop="websocket_url">
              <el-input 
                v-model="formData.websocket_url" 
                placeholder="服务器地址"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="6">
            <el-form-item label="游戏链接" prop="game_web_url">
              <el-input 
                v-model="formData.game_web_url" 
                placeholder="游戏链接"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 会员与系统设置区域 -->
      <div class="form-section" :class="{ 'mobile-section': isMobile }">
        <h4 :class="['section-title', { 'mobile-title': isMobile }]">会员与系统</h4>
        
        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="会员级别" prop="membership_level">
              <el-select 
                v-model="formData.membership_level" 
                placeholder="会员级别"
                :size="isMobile ? 'small' : 'small'"
                style="width: 100%"
              >
                <el-option 
                  v-for="(info, value) in MEMBERSHIP_LEVELS" 
                  :key="value" 
                  :label="info.label" 
                  :value="Number(value)" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="充值金额" prop="membership_pay_money">
              <el-input-number 
                v-model="formData.membership_pay_money" 
                :min="0"
                placeholder="金额"
                style="width: 100%"
                :size="isMobile ? 'small' : 'small'"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="3">
            <el-form-item label="分桶号" prop="bucket">
              <el-input-number 
                v-model="formData.bucket" 
                :min="0"
                :max="255"
                placeholder="自动"
                style="width: 100%"
                disabled
                :size="isMobile ? 'small' : 'small'"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="3">
            <el-form-item label="开启状态" prop="is_open">
              <el-switch 
                v-model="formData.is_open" 
                :active-value="1" 
                :inactive-value="0"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="3">
            <el-form-item label="钉钉通知" prop="dingding">
              <el-switch 
                v-model="formData.dingding" 
                :active-value="1" 
                :inactive-value="0"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="6">
            <el-form-item label="到期时间" prop="membership_expire_date">
              <el-text :size="isMobile ? 'default' : 'small'" v-if="formData.membership_expire_date">
                {{ formatExpireDate(formData.membership_expire_date) }}
              </el-text>
              <el-text :size="isMobile ? 'default' : 'small'" v-else type="info">无</el-text>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="24" :md="10" :lg="8">
            <el-form-item label="横幅通知" prop="banner">
              <el-input 
                v-model="formData.banner" 
                placeholder="横幅通知内容"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="14" :lg="16">
            <el-form-item label="备注" prop="remarks">
              <el-input 
                v-model="formData.remarks" 
                placeholder="备注信息"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 扩展数据区域 -->
      <div class="form-section" :class="{ 'mobile-section': isMobile }" style="border-bottom: none;">
        <h4 :class="['section-title', { 'mobile-title': isMobile }]">扩展数据</h4>
        
        <el-row :gutter="isMobile ? 0 : 10">
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="登录数据" prop="user_login_data">
              <el-input 
                v-model="formData.user_login_data" 
                type="textarea" 
                :rows="isMobile ? 3 : 4"
                placeholder="用户登录数据"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="游戏信息" prop="game_info">
              <el-input 
                v-model="gameInfoText" 
                type="textarea" 
                :rows="isMobile ? 3 : 4"
                placeholder="JSON格式"
                @blur="handleGameInfoChange"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" :lg="8">
            <el-form-item label="用户设置" prop="user_setting">
              <el-input 
                v-model="userSettingText" 
                type="textarea" 
                :rows="isMobile ? 3 : 4"
                placeholder="JSON格式"
                @blur="handleUserSettingChange"
                :size="isMobile ? 'small' : 'small'"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Check } from '@element-plus/icons-vue'
import { MEMBERSHIP_LEVELS, GAME_PLATFORMS } from '../utils/constants'
import { useResponsive, useDialogResponsive } from '../utils/responsive'
import request from '../utils/request'

const props = defineProps({
  modelValue: Boolean,
  userData: Object
})

const emit = defineEmits(['update:modelValue', 'save'])

// 响应式配置
const { isMobile, isTablet } = useResponsive()
const { dialogWidth } = useDialogResponsive()

const formRef = ref()
const originalData = ref(null) // 保存原始数据用于对比
const validating = ref(false) // 校验状态

const formData = reactive({
  account: '',
  real_account: '',
  main_account: '',
  password: '',
  contact: '',
  server_name: '',
  server_info: '',
  server_zone: '',
  membership_pay_money: 0,
  membership_level: -1,
  membership_expire_date: null,
  game_platform: -1,
  websocket_url: '',
  game_web_url: '',
  user_login_data: '',
  remarks: '',
  auxiliary_online: 0,
  game_info: null,
  user_setting: null,
  dingding: 1,
  bucket: null,
  banner: '',
  is_open: 1
})

const gameInfoText = ref('')
const userSettingText = ref('')

const formRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  server_name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' }
  ]
}


// 格式化日期显示
const formatExpireDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 监听userData变化
watch(() => props.userData, (newVal) => {
  if (newVal) {
    Object.assign(formData, newVal)
    // 保存原始数据的深拷贝
    originalData.value = JSON.parse(JSON.stringify(newVal))
    // 处理区服字段 - 去掉 h 前缀
    if (newVal.server_info && newVal.server_info.startsWith('h')) {
      formData.server_info = newVal.server_info.substring(1)
      // 原始数据也要保存处理后的值
      originalData.value.server_info = formData.server_info
    }
    // 处理JSON字段
    gameInfoText.value = newVal.game_info ? JSON.stringify(newVal.game_info, null, 2) : ''
    userSettingText.value = newVal.user_setting ? JSON.stringify(newVal.user_setting, null, 2) : ''
  } else {
    originalData.value = null
    // 重置表单
    Object.keys(formData).forEach(key => {
      if (key === 'membership_level' || key === 'game_platform') {
        formData[key] = -1
      } else if (key === 'membership_pay_money' || key === 'auxiliary_online') {
        formData[key] = 0
      } else if (key === 'dingding' || key === 'is_open') {
        formData[key] = 1
      } else if (key === 'bucket' || key === 'game_info' || key === 'user_setting') {
        formData[key] = null
      } else {
        formData[key] = ''
      }
    })
    gameInfoText.value = ''
    userSettingText.value = ''
  }
}, { immediate: true })

const handleGameInfoChange = () => {
  try {
    if (gameInfoText.value) {
      formData.game_info = JSON.parse(gameInfoText.value)
    } else {
      formData.game_info = null
    }
  } catch (error) {
    ElMessage.error('游戏信息JSON格式错误')
  }
}

const handleUserSettingChange = () => {
  try {
    if (userSettingText.value) {
      formData.user_setting = JSON.parse(userSettingText.value)
    } else {
      formData.user_setting = null
    }
  } catch (error) {
    ElMessage.error('用户设置JSON格式错误')
  }
}

// 账号密码校验
const validateAccount = async () => {
  // 检查必要字段
  if (!formData.account) {
    ElMessage.warning('请先输入账号')
    return
  }
  
  if (!formData.password) {
    ElMessage.warning('请先输入密码')
    return
  }
  
  if (formData.game_platform === -1 || formData.game_platform === undefined) {
    ElMessage.warning('请先选择游戏版本')
    return
  }
  
  validating.value = true
  
  try {
    const response = await request.post('/validate_account', {
      game_platform: formData.game_platform,
      account: formData.account
    })
    
    if (response.code === 0) {
      ElMessage.success(response.message || '账号密码验证成功')
    } else {
      ElMessage.error(response.message || '账号密码验证失败')
    }
  } catch (error) {
    console.error('账号密码验证错误:', error)
    ElMessage.error(error.response?.data?.message || '账号密码验证失败')
  } finally {
    validating.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

// 对比两个值是否相等（处理JSON对象的情况）
const isEqual = (val1, val2) => {
  // 处理null和undefined
  if (val1 === val2) return true
  if (val1 === null || val2 === null) return false
  if (val1 === undefined || val2 === undefined) return false
  
  // 处理对象和数组
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    return JSON.stringify(val1) === JSON.stringify(val2)
  }
  
  return val1 === val2
}

const handleSave = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return

  // 验证JSON格式
  try {
    if (gameInfoText.value) {
      JSON.parse(gameInfoText.value)
    }
    if (userSettingText.value) {
      JSON.parse(userSettingText.value)
    }
  } catch (error) {
    ElMessage.error('JSON格式错误，请检查')
    return
  }

  // 如果是编辑模式，只发送改变的字段
  let saveData = {}
  
  if (originalData.value) {
    // 编辑模式：对比每个字段，只保留改变的
    const currentData = { ...formData }
    
    // 处理区服字段
    if (currentData.server_info && currentData.server_info.trim()) {
      if (!currentData.server_info.startsWith('h')) {
        currentData.server_info = 'h' + currentData.server_info
      }
    }
    
    // 对比每个字段
    for (const key in currentData) {
      // 跳过account字段（主键不应该被修改）
      if (key === 'account') continue
      
      // 处理server_info的特殊情况（原始数据可能有h前缀）
      if (key === 'server_info') {
        const originalServerInfo = originalData.value.server_info || ''
        const currentServerInfo = currentData.server_info || ''
        // 统一格式后比较
        const normalizedOriginal = originalServerInfo.startsWith('h') ? originalServerInfo : ('h' + originalServerInfo)
        const normalizedCurrent = currentServerInfo.startsWith('h') ? currentServerInfo : ('h' + currentServerInfo)
        if (normalizedOriginal !== normalizedCurrent) {
          saveData[key] = currentData[key]
        }
      } 
      // 特殊处理密码字段：空字符串不发送
      else if (key === 'password') {
        if (currentData[key] && currentData[key] !== originalData.value[key]) {
          saveData[key] = currentData[key]
        }
      }
      // 其他字段正常对比
      else if (!isEqual(currentData[key], originalData.value[key])) {
        saveData[key] = currentData[key]
      }
    }
    
    // 如果没有任何改变
    if (Object.keys(saveData).length === 0) {
      ElMessage.info('没有任何修改')
      return
    }
  } else {
    // 新增模式：发送所有字段
    saveData = { ...formData }
    
    // 处理区服字段
    if (saveData.server_info && saveData.server_info.trim()) {
      if (!saveData.server_info.startsWith('h')) {
        saveData.server_info = 'h' + saveData.server_info
      }
    } else if (saveData.server_info === '') {
      saveData.server_info = ''
    }
  }

  emit('save', saveData)
}
</script>

<style scoped>
/* 顶部操作按钮样式 */
.top-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  background: var(--el-bg-color);
  z-index: 10;
}

.top-actions .el-button {
  min-width: 80px;
}

.top-actions .el-button .el-icon {
  margin-right: 4px;
}

.form-section {
  margin-bottom: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #e4e7ed;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 8px 0;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  max-height: calc(85vh - 60px);
  overflow-y: auto;
  padding: 12px 16px;
  padding-top: 0;
}

/* 紧凑布局 */
:deep(.el-form-item) {
  margin-bottom: 10px;
}

/* 区服输入框的前缀样式 */
:deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  color: #909399;
  font-weight: 600;
  padding: 0 10px;
  min-width: 20px;
  text-align: center;
}

/* PC端超紧凑样式 */
@media (min-width: 1024px) {
  .user-edit-dialog :deep(.el-dialog) {
    margin-top: 5vh !important;
  }
  
  :deep(.el-dialog__body) {
    max-height: calc(88vh - 50px);
    padding: 10px 16px;
    padding-top: 0;
  }

  :deep(.el-dialog__header) {
    padding: 12px 16px;
  }
  
  .form-section {
    padding: 4px 0;
    margin-bottom: 6px;
  }
  
  .section-title {
    font-size: 11px;
    margin-bottom: 6px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 8px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 12px;
    padding-right: 8px;
  }
  
  :deep(.el-input--small) {
    font-size: 12px;
  }
  
  :deep(.el-input--small .el-input__inner) {
    height: 28px;
    line-height: 28px;
  }
  
  :deep(.el-select--small) {
    font-size: 12px;
  }
  
  :deep(.el-textarea__inner) {
    font-size: 12px;
    padding: 3px 7px;
  }
  
  :deep(.el-input-number--small) {
    width: 100%;
  }
  
  :deep(.el-input-number--small .el-input__inner) {
    height: 28px;
    line-height: 28px;
  }
  
  :deep(.el-button--small) {
    padding: 5px 11px;
    font-size: 12px;
  }
  
  :deep(.el-switch--small) {
    height: 16px;
  }
  
  :deep(.el-text) {
    font-size: 12px;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1920px) {
  :deep(.el-dialog__body) {
    max-height: calc(90vh - 50px);
  }
}

/* 移动端样式优化 */
@media (max-width: 767px) {
  /* 全屏对话框的特殊处理 */
  :deep(.el-dialog.is-fullscreen) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0 !important;
  }

  :deep(.el-dialog.is-fullscreen .el-dialog__header) {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: var(--el-bg-color);
    z-index: 100;
  }

  :deep(.el-dialog.is-fullscreen .el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    padding-bottom: 20px !important;
    -webkit-overflow-scrolling: touch;
  }

  /* 移动端表单样式 */
  .mobile-form {
    padding: 0;
  }

  /* 移动端区块样式 */
  .mobile-section {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 8px 12px !important;
    margin-bottom: 8px !important;
    border: 1px solid var(--el-border-color-lighter);
  }

  .mobile-section:last-child {
    margin-bottom: 8px !important;
  }

  /* 移动端标题样式 */
  .mobile-title {
    font-size: 13px !important;
    font-weight: 600;
    color: var(--el-color-primary);
    margin: 0 0 8px 0 !important;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  /* 移动端表单项 */
  :deep(.mobile-form .el-form-item) {
    margin-bottom: 12px !important;
    display: flex;
    align-items: center;
  }

  :deep(.mobile-form .el-form-item:last-child) {
    margin-bottom: 0 !important;
  }

  :deep(.mobile-form .el-form-item__label) {
    width: 70px !important;
    padding-right: 8px !important;
    font-size: 13px !important;
    color: #606266;
    line-height: 32px !important;
    flex-shrink: 0;
  }

  :deep(.mobile-form .el-form-item__content) {
    flex: 1;
    margin-left: 0 !important;
  }

  /* 输入框样式 */
  :deep(.mobile-form .el-input--small .el-input__inner),
  :deep(.mobile-form .el-input--small .el-input__wrapper) {
    height: 32px !important;
    font-size: 14px !important;
  }

  :deep(.mobile-form .el-select--small) {
    width: 100% !important;
  }

  :deep(.mobile-form .el-input-number--small) {
    width: 100% !important;
  }

  :deep(.mobile-form .el-input-number--small .el-input__inner) {
    height: 32px !important;
  }

  /* 文本域样式 */
  :deep(.mobile-form .el-textarea__inner) {
    font-size: 13px !important;
    padding: 6px 8px !important;
    min-height: 60px !important;
  }

  /* 开关样式 */
  :deep(.mobile-form .el-switch) {
    height: 20px !important;
  }

  /* 按钮样式 */
  :deep(.mobile-form .el-button--small) {
    height: 32px !important;
    padding: 0 12px !important;
    font-size: 14px !important;
  }

  /* 移动端顶部按钮样式 */
  .mobile-top-actions {
    position: sticky;
    top: 0;
    background: var(--el-bg-color);
    z-index: 100;
    padding: 8px 0;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    gap: 8px;
  }

  .mobile-top-actions .el-button {
    flex: 1;
    height: 36px;
  }

  /* 移动端列布局优化 */
  :deep(.el-col-xs-24) {
    padding: 0 !important;
  }

  /* 隐藏部分不必要的装饰元素 */
  :deep(.el-input-group__prepend) {
    padding: 0 8px !important;
    font-size: 13px !important;
  }
}

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  :deep(.el-dialog__body) {
    max-height: calc(80vh - 55px);
    padding-top: 0;
  }

  .form-section {
    padding: 8px 0;
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>