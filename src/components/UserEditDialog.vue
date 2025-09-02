<template>
  <el-dialog 
    :model-value="modelValue" 
    :title="userData ? '编辑用户' : '新增用户'"
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
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="账号" prop="account">
                <el-input 
                  v-model="formData.account" 
                  placeholder="请输入账号"
                  :disabled="!!userData"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="密码" prop="password">
                <div style="display: flex; gap: 8px;">
                  <el-input 
                    v-model="formData.password" 
                    placeholder="请输入密码"
                    :size="isMobile ? 'large' : 'default'"
                    :style="formData.game_platform === 0 ? 'flex: 1;' : ''"
                  />
                  <el-button 
                    v-if="formData.game_platform === 0"
                    type="primary" 
                    :size="isMobile ? 'large' : 'default'"
                    @click="validateAccount"
                    :loading="validating"
                  >
                    校验
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="关联账户" prop="real_account">
                <el-input 
                  v-model="formData.real_account" 
                  placeholder="请输入关联账户"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="主账户" prop="main_account">
                <el-input 
                  v-model="formData.main_account" 
                  placeholder="请输入主账户"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="联系方式" prop="contact">
                <el-input 
                  v-model="formData.contact" 
                  placeholder="请输入联系方式（微信号）"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="区名" prop="server_name">
                <el-input 
                  v-model="formData.server_name" 
                  placeholder="请输入区名"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="区服" prop="server_info">
                <el-input 
                  v-model="formData.server_info" 
                  placeholder="请输入区服号（如：4_5）"
                  :size="isMobile ? 'large' : 'default'"
                >
                  <template #prepend>h</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="区号" prop="server_zone">
                <el-input 
                  v-model="formData.server_zone" 
                  placeholder="请输入区号"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="游戏版本" prop="game_platform">
                <el-select 
                  v-model="formData.game_platform" 
                  placeholder="请选择游戏版本"
                  :size="isMobile ? 'large' : 'default'"
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
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="会员级别" prop="membership_level">
                <el-select 
                  v-model="formData.membership_level" 
                  placeholder="请选择会员级别"
                  :size="isMobile ? 'large' : 'default'"
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
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="充值金额" prop="membership_pay_money">
                <el-input-number 
                  v-model="formData.membership_pay_money" 
                  :min="0"
                  placeholder="请输入充值金额"
                  style="width: 100%"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="分桶号" prop="bucket">
                <el-input-number 
                  v-model="formData.bucket" 
                  :min="0"
                  :max="255"
                  placeholder="分桶号（系统自动分配）"
                  style="width: 100%"
                  disabled
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="24" :md="12">
              <el-form-item label="开启状态" prop="is_open">
                <el-switch 
                  v-model="formData.is_open" 
                  :active-value="1" 
                  :inactive-value="0"
                  :size="isMobile ? 'large' : 'default'"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="会员到期时间" prop="membership_expire_date">
            <el-text v-if="formData.membership_expire_date">
              {{ formatExpireDate(formData.membership_expire_date) }}
            </el-text>
            <el-text v-else type="info">无</el-text>
            <div style="margin-top: 8px;">
              <el-text type="info" size="small">
                提示：请使用充值功能来延长会员时长
              </el-text>
            </div>
          </el-form-item>

          <el-form-item label="备注" prop="remarks">
            <el-input 
              v-model="formData.remarks" 
              type="textarea" 
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="高级设置" name="advanced">
          <el-form-item label="钉钉通知" prop="dingding">
            <el-switch 
              v-model="formData.dingding" 
              :active-value="1" 
              :inactive-value="0"
              :size="isMobile ? 'large' : 'default'"
            />
          </el-form-item>

          <el-form-item label="横幅通知" prop="banner">
            <el-input v-model="formData.banner" placeholder="请输入横幅通知内容" />
          </el-form-item>

          <el-form-item label="WebSocket URL" prop="websocket_url">
            <el-input v-model="formData.websocket_url" placeholder="请输入游戏服务器地址" />
          </el-form-item>

          <el-form-item label="游戏链接" prop="game_web_url">
            <el-input v-model="formData.game_web_url" placeholder="请输入游戏链接" />
          </el-form-item>

          <el-form-item label="登录数据" prop="user_login_data">
            <el-input 
              v-model="formData.user_login_data" 
              type="textarea" 
              :rows="3"
              placeholder="请输入用户登录数据"
            />
          </el-form-item>

          <el-form-item label="游戏信息" prop="game_info">
            <el-input 
              v-model="gameInfoText" 
              type="textarea" 
              :rows="5"
              placeholder="请输入JSON格式的游戏信息"
              @blur="handleGameInfoChange"
            />
          </el-form-item>

          <el-form-item label="用户设置" prop="user_setting">
            <el-input 
              v-model="userSettingText" 
              type="textarea" 
              :rows="5"
              placeholder="请输入JSON格式的用户设置"
              @blur="handleUserSettingChange"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const activeTab = ref('basic')
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
    activeTab.value = 'basic'
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
:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 区服输入框的前缀样式 */
:deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  color: #909399;
  font-weight: 600;
  padding: 0 15px;
  min-width: 30px;
  text-align: center;
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
  
  :deep(.el-tabs__nav-wrap) {
    padding: 0;
  }
  
  :deep(.el-tabs__item) {
    padding: 0 12px;
    height: 44px;
    line-height: 44px;
  }
}

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  :deep(.el-dialog__body) {
    max-height: 75vh;
  }
}
</style>