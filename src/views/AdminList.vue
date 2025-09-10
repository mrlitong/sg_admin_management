<template>
  <div class="admin-list-container">
    <!-- 操作栏 -->
    <div class="toolbar" :class="{ 'mobile-toolbar': isMobile }">
      <el-button 
        type="primary" 
        @click="handleAdd" 
        :icon="Plus"
        :size="isMobile ? 'default' : 'default'"
      >
        {{ isMobile ? '新增' : '新增客服' }}
      </el-button>
    </div>

    <!-- 移动端卡片视图 -->
    <div v-if="isMobile && !loading" class="mobile-cards-container">
      <div
        v-for="admin in adminList"
        :key="admin.id"
        class="admin-card"
      >
        <div class="card-header">
          <div class="card-info">
            <h4 class="admin-name">{{ admin.nickname || admin.username }}</h4>
            <span class="admin-username">@{{ admin.username }}</span>
          </div>
          <el-tag :type="admin.is_admin ? 'warning' : 'info'" size="small">
            {{ admin.is_admin ? '超级管理' : '普通客服' }}
          </el-tag>
        </div>
        
        <div class="card-body">
          <div class="info-row">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(admin.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="label">最后登录：</span>
            <span class="value">{{ formatDate(admin.last_login_at) || '从未登录' }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态：</span>
            <el-switch
              v-model="admin.is_active"
              :disabled="currentUser?.id === admin.id || admin.is_super"
              @change="(value) => handleStatusChange(admin, value)"
              size="small"
              inline-prompt
              active-text="启用"
              inactive-text="禁用"
            />
          </div>
        </div>
        
        <div class="card-footer">
          <el-button 
            v-if="currentUser?.id === admin.id" 
            type="primary"
            size="small"
            @click="handleChangePassword(admin)"
          >
            修改密码
          </el-button>
          <el-button 
            v-else
            type="danger"
            size="small"
            @click="handleDelete(admin)"
            :disabled="admin.is_super"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <el-table 
      v-if="!isMobile"
      v-loading="loading"
      :data="adminList" 
      border
      stripe
      style="width: 100%"
      :fit="true"
    >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" min-width="100" />
      <el-table-column prop="nickname" label="昵称" min-width="100" />
      <el-table-column prop="created_at" label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="last_login_at" label="最后登录时间" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.last_login_at) || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="is_admin" label="类型" width="110">
        <template #default="{ row }">
          <el-tag :type="row.is_admin ? 'warning' : 'info'">
            {{ row.is_admin ? '超级管理' : '普通客服' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_active" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.is_active"
            :disabled="currentUser?.id === row.id || row.is_super"
            @change="(value) => handleStatusChange(row, value)"
            inline-prompt
            active-text="启用"
            inactive-text="禁用"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button 
            v-if="currentUser?.id === row.id" 
            link 
            type="primary" 
            @click="handleChangePassword(row)"
          >
            修改密码
          </el-button>
          <template v-else>
            <el-button 
              link 
              type="danger" 
              @click="handleDelete(row)"
              :disabled="row.is_super"
            >
              删除
            </el-button>
            <el-tooltip v-if="row.is_super" content="超级管理不能删除" placement="top">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增客服对话框 -->
    <el-dialog 
      v-model="addDialogVisible" 
      title="新增客服" 
      :width="dialogWidth"
      :fullscreen="isMobile"
      :close-on-click-modal="false"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="addForm.password" 
            type="password" 
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="addForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="addForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="客服类型" prop="is_admin">
          <el-radio-group v-model="addForm.is_admin">
            <el-radio :label="false">普通客服</el-radio>
            <el-radio :label="true">超级管理</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAdmin">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog 
      v-model="passwordDialogVisible" 
      title="修改密码" 
      :width="dialogWidth"
      :fullscreen="isMobile"
      :close-on-click-modal="false"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordFormRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminList, createAdmin, changePassword, deleteAdmin, updateAdminStatus } from '../api/admin'
import { useAuthStore } from '../stores/auth'
import dayjs from 'dayjs'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import { useResponsive, useDialogResponsive } from '../utils/responsive'
import MobileDataCard from '../components/MobileDataCard.vue'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

// 响应式检测
const { isMobile, isTablet, isDesktop } = useResponsive()
const { dialogWidth } = useDialogResponsive()

// 数据状态
const loading = ref(false)
const adminList = ref([])
const addDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const currentEditAdmin = ref(null)

// 新增表单
const addFormRef = ref()
const addForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  is_admin: false
})

// 密码表单
const passwordFormRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== addForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePasswordConfirm = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const addFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ]
}

const passwordFormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validatePasswordConfirm, trigger: 'blur' }
  ]
}

// 获取客服列表
const fetchAdminList = async () => {
  loading.value = true
  try {
    const response = await getAdminList()
    // 转换数据类型，确保 is_active 和 is_super 是布尔值
    adminList.value = (response.admins || []).map(admin => ({
      ...admin,
      is_active: Boolean(admin.is_active),
      is_super: Boolean(admin.is_super)
    }))
  } catch (error) {
    console.error('获取客服列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增客服
const handleAdd = () => {
  addForm.username = ''
  addForm.password = ''
  addForm.confirmPassword = ''
  addForm.nickname = ''
  addForm.is_admin = false
  addDialogVisible.value = true
}

// 保存客服
const handleSaveAdmin = async () => {
  const valid = await addFormRef.value.validate()
  if (!valid) return

  try {
    await createAdmin({
      username: addForm.username,
      password: addForm.password,
      nickname: addForm.nickname,
      is_admin: addForm.is_admin
    })
    ElMessage.success('创建成功')
    addDialogVisible.value = false
    fetchAdminList()
  } catch (error) {
    console.error('创建客服失败:', error)
  }
}

// 修改密码
const handleChangePassword = (row) => {
  currentEditAdmin.value = row
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

// 更新密码
const handleUpdatePassword = async () => {
  const valid = await passwordFormRef.value.validate()
  if (!valid) return

  try {
    await changePassword(currentEditAdmin.value.id, {
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error) {
    console.error('修改密码失败:', error)
  }
}

// 防抖标志
const isUpdatingStatus = ref(false)

// 状态修改
const handleStatusChange = async (row, newValue) => {
  // 检查是否是修改自己的状态或超级管理员
  if (currentUser.value?.id === row.id || row.is_super) {
    // 不应该触发，因为已经禁用了
    return
  }
  
  // 防止重复请求
  if (isUpdatingStatus.value) {
    return
  }
  
  isUpdatingStatus.value = true
  
  try {
    await updateAdminStatus(row.id, { is_active: newValue })
    ElMessage.success('状态更新成功')
    // 不需要刷新整个列表，状态已经通过 v-model 更新了
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.is_active = !newValue
  } finally {
    isUpdatingStatus.value = false
  }
}

// 删除客服
const handleDelete = (row) => {
  if (row.is_super) {
    ElMessage.warning('超级管理不能删除')
    return
  }
  
  ElMessageBox.confirm(`确定要删除客服 ${row.username} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteAdmin(row.id)
      ElMessage.success('删除成功')
      fetchAdminList()
    } catch (error) {
      console.error('删除客服失败:', error)
    }
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss') : ''
}

onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped>
.admin-list-container {
  padding: 20px;
  background: var(--card-bg);
  border-radius: 4px;
}

.toolbar {
  margin-bottom: 20px;
}

/* 优化表格列宽和响应式显示 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  font-weight: 600;
  white-space: nowrap;
}

:deep(.el-table td) {
  padding: 8px 0;
}

/* 优化小屏幕下的显示 */
@media screen and (max-width: 1366px) {
  :deep(.el-table) {
    font-size: 13px;
  }
  
  :deep(.el-table td),
  :deep(.el-table th) {
    padding: 6px 0;
  }
}

/* 移动端卡片容器 */
.mobile-cards-container {
  padding: 0;
}

/* 管理员卡片样式 */
.admin-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--box-shadow-base);
  transition: all 0.3s;
  border: 1px solid var(--border-color-lighter);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.admin-card:active {
  transform: scale(0.98);
  box-shadow: var(--box-shadow-base);
  background: var(--bg-color-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.card-info {
  flex: 1;
}

.admin-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 4px 0;
}

.admin-username {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  color: var(--text-color-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: var(--text-color-regular);
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-lighter);
}

.card-footer .el-button {
  min-height: 36px;
  font-size: 14px;
}

/* 移动端样式 */
@media (max-width: 767px) {
  .admin-list-container {
    padding: 12px;
    background: var(--bg-color-secondary);
    min-height: 100vh;
  }
  
  .toolbar {
    margin-bottom: 16px;
  }
  
  .mobile-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  /* 移动端对话框优化 */
  :deep(.el-dialog) {
    .el-dialog__header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color-lighter);
      font-size: 16px;
    }
    
    .el-dialog__body {
      padding: 20px 16px;
    }
    
    .el-dialog__footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color-lighter);
    }
    
    .el-form-item {
      margin-bottom: 20px;
    }
    
    .el-form-item__label {
      width: auto !important;
      font-size: 14px;
      margin-bottom: 8px;
      display: block;
      text-align: left !important;
      line-height: 1.5;
    }
    
    .el-form-item__content {
      margin-left: 0 !important;
    }
    
    .el-input__inner {
      font-size: 16px !important;
      height: 44px;
      line-height: 44px;
    }
    
    .el-radio {
      margin-right: 20px;
      height: 44px;
      display: inline-flex;
      align-items: center;
    }
    
    .el-button {
      min-height: 44px;
      font-size: 15px;
      width: 100%;
    }
  }
  
  /* 移动端开关优化 */
  .info-row :deep(.el-switch) {
    height: 24px;
    
    .el-switch__core {
      height: 24px;
      min-width: 44px;
      border-radius: 12px;
    }
    
    .el-switch__inner {
      font-size: 12px;
    }
  }
  
  /* 移动端卡片优化 */
  .admin-card {
    margin: 0 0 12px 0;
    border-radius: 12px;
  }
  
  .admin-name {
    font-size: 17px;
    font-weight: 600;
  }
  
  .admin-username {
    font-size: 14px;
  }
  
  .info-row {
    font-size: 15px;
    padding: 2px 0;
  }
  
  .info-row .label {
    min-width: 85px;
    font-weight: 500;
  }
  
  /* 移动端工具栏 */
  .mobile-toolbar .el-button {
    font-size: 15px;
    padding: 10px 20px;
    min-height: 44px;
  }
  
  /* 加载状态优化 */
  .mobile-cards-container {
    min-height: calc(100vh - 100px);
  }
}

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .admin-list-container {
    padding: 16px;
  }
  
  :deep(.el-table) {
    font-size: 13px;
  }
}
</style>