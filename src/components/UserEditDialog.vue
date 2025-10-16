<template>
  <el-dialog
    :model-value="modelValue"
    :title="userData ? '编辑用户' : '新增用户'"
    width="90%"
    :fullscreen="isMobile"
    :close-on-click-modal="!isMobile"
    @close="handleClose"
    class="user-edit-dialog"
  >
    <!-- 顶部操作按钮 -->
    <div class="dialog-header">
      <el-button @click="handleClose" :size="isMobile ? 'small' : 'default'">
        <el-icon><Close /></el-icon>
        取消
      </el-button>
      <el-button type="primary" @click="handleSave" :size="isMobile ? 'small' : 'default'" class="save-button">
        <el-icon><Check /></el-icon>
        保存
      </el-button>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="right"
      class="user-edit-form"
      :class="{ 'mobile-form': isMobile }"
    >
      <!-- 复制已有用户 - 仅新增模式显示 -->
      <div v-if="!userData" class="form-group copy-user-group">
        <h3 class="group-title">
          <el-icon><CopyDocument /></el-icon>
          复制已有用户数据
        </h3>
        <div class="copy-user-content" :class="{ 'mobile-layout': isMobile }">
          <el-input
            v-model="copyFromAccount"
            placeholder="输入要复制的账号"
            clearable
            :style="{ width: isMobile ? '100%' : '280px' }"
            @keyup.enter="handleCopyUserData"
          />
          <el-button
            type="primary"
            :loading="copying"
            @click="handleCopyUserData"
            :size="isMobile ? 'default' : 'default'"
          >
            <el-icon><CopyDocument /></el-icon>
            复制数据
          </el-button>
          <span class="copy-hint" v-if="!isMobile">
            💡 复制后会自动填充所有字段（账号除外），您只需修改新账号即可
          </span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-group">
        <h3 class="group-title">
          <el-icon><User /></el-icon>
          基本信息
        </h3>
        <div class="form-grid">
          <el-form-item label="账号" prop="account">
            <el-input
              v-model="formData.account"
              placeholder="请输入账号"
              :disabled="!!userData"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              placeholder="请输入密码"
            />
          </el-form-item>

          <el-form-item label="关联账户" prop="real_account">
            <el-input
              v-model="formData.real_account"
              placeholder="请输入关联账户"
            />
          </el-form-item>

          <el-form-item label="主账户" prop="main_account">
            <el-input
              v-model="formData.main_account"
              placeholder="请输入主账户"
            />
          </el-form-item>

          <el-form-item label="联系方式" prop="contact">
            <el-input
              v-model="formData.contact"
              placeholder="微信号/手机号"
            />
          </el-form-item>

          <el-form-item label="游戏版本" prop="game_platform">
            <el-select
              v-model="formData.game_platform"
              placeholder="请选择游戏版本"
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

          <el-form-item label="账号校验" v-if="formData.game_platform === 0">
            <el-button
              type="primary"
              @click="validateAccount"
              :loading="validating"
            >
              校验账号密码
            </el-button>
          </el-form-item>
        </div>
      </div>

      <!-- 游戏信息 -->
      <div class="form-group">
        <h3 class="group-title">
          <el-icon><Trophy /></el-icon>
          游戏信息
        </h3>
        <div class="form-grid">
          <el-form-item label="区名" prop="server_name" :class="{ 'full-width-mobile': isMobile }">
            <el-input
              v-model="formData.server_name"
              placeholder="请输入区名"
            />
          </el-form-item>

          <el-form-item label="区服" prop="server_info" :class="{ 'full-width-mobile': isMobile }">
            <el-input
              v-model="formData.server_info"
              placeholder="例如：4_5"
            >
              <template #prepend>h</template>
            </el-input>
          </el-form-item>

          <el-form-item label="区号" prop="server_zone" :class="{ 'full-width-mobile': isMobile }">
            <el-input
              v-model="formData.server_zone"
              placeholder="请输入区号"
            />
          </el-form-item>

          <div v-if="!isMobile"></div> <!-- 桌面端空占位，保持网格对齐 -->

          <el-form-item label="服务器地址" prop="websocket_url" class="full-width">
            <el-input
              v-model="formData.websocket_url"
              placeholder="服务器地址"
            />
          </el-form-item>

          <el-form-item label="游戏链接" prop="game_web_url" class="full-width">
            <el-input
              v-model="formData.game_web_url"
              placeholder="游戏Web链接地址"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 会员信息 -->
      <div class="form-group">
        <h3 class="group-title">
          <el-icon><Star /></el-icon>
          会员信息
        </h3>
        <div class="form-grid">
          <el-form-item label="会员级别" prop="membership_level">
            <el-select
              v-model="formData.membership_level"
              placeholder="请选择会员级别"
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

          <el-form-item label="充值金额" prop="membership_pay_money">
            <el-input-number
              v-model="formData.membership_pay_money"
              :min="0"
              placeholder="充值金额"
              style="width: 100%"
              :controls="false"
            />
          </el-form-item>

          <el-form-item label="分桶号" prop="bucket">
            <el-input
              :model-value="formData.bucket !== null && formData.bucket !== undefined ? String(formData.bucket) : ''"
              placeholder="系统自动分配"
              disabled
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="到期时间" prop="membership_expire_date">
            <el-date-picker
              v-model="formData.membership_expire_date"
              type="datetime"
              placeholder="选择到期时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </div>
      </div>

      <!-- 系统设置 -->
      <div class="form-group">
        <h3 class="group-title">
          <el-icon><Setting /></el-icon>
          系统设置
        </h3>
        <div class="form-grid">
          <el-form-item label="开启状态" prop="is_open">
            <el-switch
              v-model="formData.is_open"
              :active-value="1"
              :inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
          </el-form-item>

          <el-form-item label="钉钉通知" prop="dingding">
            <el-switch
              v-model="formData.dingding"
              :active-value="1"
              :inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
          </el-form-item>

          <el-form-item label="横幅通知" prop="banner" class="full-width">
            <el-input
              v-model="formData.banner"
              placeholder="横幅通知内容"
            />
          </el-form-item>

          <el-form-item label="备注信息" prop="remarks" class="full-width">
            <el-input
              v-model="formData.remarks"
              placeholder="备注信息"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 扩展数据 -->
      <div class="form-group" v-if="!isMobile">
        <h3 class="group-title">
          <el-icon><DataAnalysis /></el-icon>
          扩展数据
        </h3>
        <div class="form-grid extended-data">
          <el-form-item label="登录数据" prop="user_login_data">
            <el-input
              v-model="formData.user_login_data"
              type="textarea"
              :rows="4"
              placeholder="用户登录相关数据"
            />
          </el-form-item>

          <el-form-item label="游戏信息" prop="game_info">
            <el-input
              v-model="gameInfoText"
              type="textarea"
              :rows="4"
              placeholder="JSON格式的游戏信息"
              @blur="handleGameInfoChange"
            />
          </el-form-item>

          <el-form-item label="用户设置" prop="user_setting">
            <el-input
              v-model="userSettingText"
              type="textarea"
              :rows="4"
              placeholder="JSON格式的用户设置"
              @blur="handleUserSettingChange"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Check, User, Trophy, Star, Setting, DataAnalysis, CopyDocument } from '@element-plus/icons-vue'
import { MEMBERSHIP_LEVELS, GAME_PLATFORMS } from '../utils/constants'
import { useResponsive } from '../utils/responsive'
import request from '../utils/request'

const props = defineProps({
  modelValue: Boolean,
  userData: Object
})

const emit = defineEmits(['update:modelValue', 'save'])

// 响应式配置
const { isMobile } = useResponsive()

const formRef = ref()
const originalData = ref(null)
const validating = ref(false)

// 复制用户数据相关
const copyFromAccount = ref('')
const copying = ref(false)

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
  bucket: 0,
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
    originalData.value = JSON.parse(JSON.stringify(newVal))

    // 处理区服字段 - 去掉 h 前缀
    if (newVal.server_info && newVal.server_info.startsWith('h')) {
      formData.server_info = newVal.server_info.substring(1)
      originalData.value.server_info = formData.server_info
    }

    // 特别处理bucket字段
    if (formData.bucket === null || formData.bucket === undefined) {
      formData.bucket = 0
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
      } else if (key === 'bucket') {
        formData[key] = 0
      } else if (key === 'game_info' || key === 'user_setting') {
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

// 复制已有用户数据
const handleCopyUserData = async () => {
  if (!copyFromAccount.value || !copyFromAccount.value.trim()) {
    ElMessage.warning('请输入要复制的账号')
    return
  }

  copying.value = true

  try {
    const sourceAccount = copyFromAccount.value.trim()
    const response = await request.get(`/admin/users/${sourceAccount}`)
    const userData = response.data

    if (!userData) {
      ElMessage.error('用户不存在')
      return
    }

    // 填充表单数据，但排除account字段（账号必须手动输入）
    Object.keys(userData).forEach(key => {
      if (key !== 'account' && key in formData) {
        formData[key] = userData[key]
      }
    })

    // 1. 账号保持为空（已默认排除）
    formData.account = ''

    // 2. 主账户设置为原账号A
    formData.main_account = sourceAccount

    // 3. 区名、区服、区号、服务器地址清空
    formData.server_name = ''
    formData.server_info = ''
    formData.server_zone = ''
    formData.websocket_url = ''

    // 4. 会员信息重置
    formData.membership_level = 3  // 钻石会员
    formData.membership_pay_money = 0
    formData.bucket = 0
    formData.membership_expire_date = null

    // 5. 系统设置
    formData.is_open = 1
    formData.dingding = 1

    // 6. 扩展数据设置为空对象
    formData.user_login_data = '{}'
    formData.game_info = {}
    formData.user_setting = {}

    // 处理JSON字段的文本框显示
    gameInfoText.value = '{}'
    userSettingText.value = '{}'

    ElMessage.success({
      message: `已成功复制 ${sourceAccount} 的数据，请输入新账号后保存`,
      duration: 3000
    })

    // 清空复制账号输入框
    copyFromAccount.value = ''
  } catch (error) {
    console.error('复制用户数据失败:', error)
    if (error.response?.status === 404) {
      ElMessage.error('用户不存在')
    } else if (error.response?.status === 403) {
      ElMessage.error('无权限访问该用户')
    } else {
      ElMessage.error(error.response?.data?.message || '复制失败，请稍后重试')
    }
  } finally {
    copying.value = false
  }
}

// 账号密码校验
const validateAccount = async () => {
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

// 对比两个值是否相等
const isEqual = (val1, val2) => {
  if (val1 === val2) return true
  if (val1 === null || val2 === null) return false
  if (val1 === undefined || val2 === undefined) return false

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
      if (key === 'account') continue

      if (key === 'server_info') {
        const originalServerInfo = originalData.value.server_info || ''
        const currentServerInfo = currentData.server_info || ''
        const normalizedOriginal = originalServerInfo.startsWith('h') ? originalServerInfo : ('h' + originalServerInfo)
        const normalizedCurrent = currentServerInfo.startsWith('h') ? currentServerInfo : ('h' + currentServerInfo)
        if (normalizedOriginal !== normalizedCurrent) {
          saveData[key] = currentData[key]
        }
      }
      else if (key === 'password') {
        if (currentData[key] && currentData[key] !== originalData.value[key]) {
          saveData[key] = currentData[key]
        }
      }
      else if (!isEqual(currentData[key], originalData.value[key])) {
        saveData[key] = currentData[key]
      }
    }

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
/* 对话框样式 */
.user-edit-dialog :deep(.el-dialog) {
  max-width: 1400px;
  min-width: 800px;
  background: var(--el-bg-color-overlay) !important;
}

.user-edit-dialog :deep(.el-dialog__body) {
  padding: 0 24px 24px 24px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--el-bg-color-overlay) !important;
}

/* 顶部操作栏 */
.dialog-header {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--el-border-color-light);
  position: sticky;
  top: 0;
  background: var(--el-bg-color-overlay);
  z-index: 10;
}

/* 保存按钮突出样式 */
.save-button {
  font-weight: 600;
  padding: 0 20px !important;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.save-button:active {
  transform: translateY(0);
}

/* 表单整体样式 */
.user-edit-form {
  --form-input-height: 40px;
  --form-label-width: 100px;
}

/* 表单分组 */
.form-group {
  margin-bottom: 32px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.form-group:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-7);
}

/* 复制用户区域 - 特殊样式 */
.copy-user-group {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  border: 2px dashed var(--el-color-primary-light-5);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.copy-user-group:hover {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.15);
}

.copy-user-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.copy-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  flex: 1;
  min-width: 200px;
}

/* 移动端复制区域布局 */
.copy-user-content.mobile-layout {
  flex-direction: column;
  align-items: stretch;
}

.copy-user-content.mobile-layout .el-button {
  width: 100%;
  margin-top: 8px;
}

.group-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--el-border-color-light);
}

/* 网格布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 16px;
  align-items: start;
}

.form-grid .full-width {
  grid-column: span 2;
}

.form-grid.extended-data {
  grid-template-columns: repeat(3, 1fr);
}

/* 统一表单元素样式 */
.user-edit-form :deep(.el-input),
.user-edit-form :deep(.el-select),
.user-edit-form :deep(.el-input-number) {
  width: 100%;
}

.user-edit-form :deep(.el-input__wrapper),
.user-edit-form :deep(.el-select__wrapper),
.user-edit-form :deep(.el-input-number__wrapper) {
  height: var(--form-input-height);
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-base);
}

/* 亮色模式输入框悬停和聚焦效果 */
.user-edit-form :deep(.el-input__wrapper):hover,
.user-edit-form :deep(.el-select__wrapper):hover,
.user-edit-form :deep(.el-input-number__wrapper):hover {
  border-color: var(--el-color-primary-light-5);
}

.user-edit-form :deep(.el-input__wrapper):focus-within,
.user-edit-form :deep(.el-select__wrapper):focus-within,
.user-edit-form :deep(.el-input-number__wrapper):focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.user-edit-form :deep(.el-input__inner),
.user-edit-form :deep(.el-input-number__inner) {
  height: var(--form-input-height);
  line-height: var(--form-input-height);
  font-size: 14px;
}

.user-edit-form :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-base);
  transition: border-color 0.3s ease;
}

.user-edit-form :deep(.el-textarea__inner):hover {
  border-color: var(--el-color-primary-light-5);
}

.user-edit-form :deep(.el-textarea__inner):focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 表单项样式 */
.user-edit-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.user-edit-form :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  line-height: var(--form-input-height);
  padding-right: 12px;
}

.user-edit-form :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}

/* 开关样式 */
.user-edit-form :deep(.el-switch) {
  height: 24px;
}

/* 日期选择器样式 */
.user-edit-form :deep(.el-date-editor) {
  width: 100%;
}

.user-edit-form :deep(.el-date-editor .el-input__wrapper) {
  height: var(--form-input-height);
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-base);
}

.user-edit-form :deep(.el-date-editor .el-input__inner) {
  height: var(--form-input-height);
  line-height: var(--form-input-height);
  font-size: 14px;
}

/* 输入框前缀 */
.user-edit-form :deep(.el-input-group__prepend) {
  background: var(--el-bg-color-page);
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
  font-weight: 600;
  padding: 0 12px;
}

/* 禁用状态 */
.user-edit-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background: var(--el-bg-color-page);
  border-color: var(--el-border-color-lighter);
  opacity: 0.6;
}

.user-edit-form :deep(.el-input.is-disabled .el-input__inner) {
  color: var(--el-text-color-placeholder);
}

/* 移动端适配 */
.mobile-form .form-grid {
  grid-template-columns: 1fr;
  gap: 16px;
}

.mobile-form .group-title {
  font-size: 14px;
}

/* 移动端确保游戏信息字段占满全宽 */
.mobile-form .full-width-mobile {
  grid-column: 1 / -1;
}

/* 移动端表单项改为垂直布局 */
.mobile-form :deep(.el-form-item) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.mobile-form :deep(.el-form-item__label) {
  width: 100% !important;
  text-align: left !important;
  padding: 0 0 4px 0 !important;
  font-size: 13px;
  height: auto !important;
  line-height: 1.5 !important;
}

.mobile-form :deep(.el-form-item__content) {
  margin-left: 0 !important;
  width: 100% !important;
}

.mobile-form :deep(.el-input),
.mobile-form :deep(.el-select),
.mobile-form :deep(.el-input-number),
.mobile-form :deep(.el-date-editor) {
  width: 100% !important;
}

.mobile-form :deep(.el-input__wrapper),
.mobile-form :deep(.el-select__wrapper),
.mobile-form :deep(.el-input-number__wrapper),
.mobile-form :deep(.el-date-editor .el-input__wrapper) {
  height: 40px;
  width: 100% !important;
}

.mobile-form :deep(.el-input__inner),
.mobile-form :deep(.el-input-number__inner) {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

/* 移动端带前缀的输入框特殊处理 */
.mobile-form :deep(.el-input-group) {
  width: 100% !important;
}

.mobile-form :deep(.el-input-group__prepend) {
  padding: 0 8px;
}

/* 通用样式重置 - 消除所有可能的装饰符号 */
.user-edit-dialog {
  /* 移除所有表单元素的伪元素 */
  :deep(*::before),
  :deep(*::after) {
    content: none !important;
    display: none !important;
  }

  /* 重置所有输入框的默认样式 */
  :deep(input),
  :deep(textarea),
  :deep(select) {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
}

/* 暗色主题统一样式 */
html.dark .user-edit-dialog {
  /* 暗色主题下保存按钮特殊样式 */
  .save-button {
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%) !important;
    border-color: #337ecc !important;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.4) !important;
  }

  .save-button:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%) !important;
    border-color: #409eff !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5) !important;
  }

  .save-button:active {
    background: linear-gradient(135deg, #337ecc 0%, #2968b2 100%) !important;
  }
  /* 确保所有输入框在暗色主题下背景统一 */
  :deep(.el-input__wrapper) {
    background-color: #1a1b1c !important;
    border: 1px solid #555555 !important; /* 增强边框可见性 */
    outline: none !important;
    box-shadow: none !important;
    transition: border-color 0.3s ease !important;
    position: relative;
    overflow: hidden; /* 裁剪内部元素，防止溢出 */
  }

  /* 修复内层input背景覆盖边框的问题 */
  :deep(.el-input__inner) {
    background-color: transparent !important; /* 内层透明，只用外层背景 */
    border: none !important;
    padding: 0 11px !important; /* 稍微减少padding，避免触碰边界 */
  }

  :deep(.el-input__wrapper):hover {
    border-color: #737373 !important; /* 悬停时更明显 */
  }

  :deep(.el-input__wrapper):focus-within {
    border-color: var(--input-focus-border) !important;
    outline: none !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important; /* 添加聚焦光晕 */
  }

  :deep(.el-select .el-input__wrapper) {
    background-color: #1a1b1c !important;
    border: 1px solid #555555 !important;
    outline: none !important;
    box-shadow: none !important;
    transition: border-color 0.3s ease !important;
    position: relative;
    overflow: hidden;
  }

  /* 修复select内层背景问题 */
  :deep(.el-select .el-input__inner) {
    background-color: transparent !important;
    border: none !important;
    padding: 0 11px !important;
  }

  :deep(.el-select .el-input__wrapper):hover {
    border-color: #737373 !important;
  }

  :deep(.el-select .el-input__wrapper):focus-within {
    border-color: var(--input-focus-border) !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
  }

  :deep(.el-input-number .el-input__wrapper) {
    background-color: #1a1b1c !important;
    border: 1px solid #555555 !important;
    outline: none !important;
    box-shadow: none !important;
    transition: border-color 0.3s ease !important;
    position: relative;
    overflow: hidden;
  }

  /* 修复数字输入框内层背景问题 */
  :deep(.el-input-number .el-input__inner) {
    background-color: transparent !important;
    border: none !important;
    padding: 0 50px !important; /* 数字输入框需要给按钮留空间 */
  }

  :deep(.el-input-number .el-input__wrapper):hover {
    border-color: #737373 !important;
  }

  :deep(.el-input-number .el-input__wrapper):focus-within {
    border-color: var(--input-focus-border) !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
  }

  :deep(.el-textarea .el-textarea__inner) {
    background-color: #1a1b1c !important;
    border: 1px solid #555555 !important;
    color: var(--text-color-primary) !important;
    outline: none !important;
    box-shadow: none !important;
    transition: border-color 0.3s ease !important;
  }

  :deep(.el-textarea .el-textarea__inner):hover {
    border-color: #737373 !important;
  }

  :deep(.el-textarea .el-textarea__inner):focus {
    border-color: var(--input-focus-border) !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
  }

  /* 移除所有可能的伪元素和异常样式 */
  :deep(.el-input__wrapper::before),
  :deep(.el-input__wrapper::after),
  :deep(.el-input__inner::before),
  :deep(.el-input__inner::after),
  :deep(.el-select__wrapper::before),
  :deep(.el-select__wrapper::after),
  :deep(.el-input-number__wrapper::before),
  :deep(.el-input-number__wrapper::after) {
    display: none !important;
    content: none !important;
  }

  /* 确保所有wrapper使用border-box */
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-input-number__wrapper) {
    box-sizing: border-box !important;
  }

  /* 移除浏览器默认的输入框装饰 */
  :deep(.el-input__inner),
  :deep(.el-textarea__inner),
  :deep(.el-input-number__inner) {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    outline: none !important;
    box-shadow: none !important;
    border-radius: 6px !important;
  }

  /* 移除选择框的默认样式 */
  :deep(.el-select__wrapper) {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  /* 表单分组背景统一 */
  .form-group {
    background: #242526 !important; /* 稍亮的背景色，增加层次感 */
    border: 1px solid #444444 !important; /* 明显的边框线 */
  }

  .form-group:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    border-color: #555555 !important;
  }

  /* 分组标题样式优化 */
  .group-title {
    border-bottom: 2px solid #444444 !important; /* 加粗分割线 */
  }

  /* 日期选择器在暗色主题下的样式 */
  :deep(.el-date-editor .el-input__wrapper) {
    background-color: #1a1b1c !important;
    border: 1px solid #555555 !important;
    outline: none !important;
    box-shadow: none !important;
    transition: border-color 0.3s ease !important;
    position: relative;
    overflow: hidden;
  }

  :deep(.el-date-editor .el-input__inner) {
    background-color: transparent !important;
    border: none !important;
    color: var(--text-color-primary) !important;
  }

  :deep(.el-date-editor .el-input__wrapper):hover {
    border-color: #737373 !important;
  }

  :deep(.el-date-editor .el-input__wrapper):focus-within {
    border-color: var(--input-focus-border) !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
  }

  /* 输入框前缀 */
  :deep(.el-input-group__prepend) {
    background: #2a2b2c !important;
    border: 1px solid #555555 !important;
    color: var(--text-color-regular) !important;
  }

  /* 禁用状态输入框 - 特殊处理 */
  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: #151617 !important; /* 更暗的背景 */
    border: 1px solid #404040 !important; /* 边框稍微明显一点 */
    opacity: 1 !important; /* 不使用透明度，避免边框变淡 */
    position: relative;
    overflow: hidden;
  }

  /* 禁用状态的内层也要透明 */
  :deep(.el-input.is-disabled .el-input__inner) {
    background-color: transparent !important;
    border: none !important;
    color: #888888 !important; /* 文字颜色调整 */
    -webkit-text-fill-color: #888888 !important; /* 确保文字颜色生效 */
  }

  /* placeholder 文字颜色优化 */
  :deep(.el-input__inner::placeholder) {
    color: #6a6a6a !important;
  }

  :deep(.el-textarea__inner::placeholder) {
    color: #6a6a6a !important;
  }

  /* 对话框头部分割线加强 */
  .dialog-header {
    border-bottom: 2px solid #444444 !important;
  }

  /* 复制用户区域 - 暗色主题 */
  .copy-user-group {
    background: linear-gradient(135deg, #2a2b2c 0%, #242526 100%) !important;
    border: 2px dashed var(--el-color-primary-light-3) !important;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2) !important;
  }

  .copy-user-group:hover {
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3) !important;
  }

  .copy-hint {
    color: #b3b3b3 !important;
  }
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .form-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .user-edit-dialog :deep(.el-dialog) {
    min-width: auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>