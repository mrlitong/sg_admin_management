/**
 * AdminList组件的共享业务逻辑
 * 包含所有API调用、状态管理、表单处理等业务逻辑
 */

import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminList, createAdmin, changePassword, deleteAdmin, updateAdminStatus } from '../api/admin'
import { useAuthStore } from '../stores/auth'
import dayjs from 'dayjs'

export function useAdminList() {
  const authStore = useAuthStore()
  const currentUser = computed(() => authStore.user)

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

  // 防抖标志
  const isUpdatingStatus = ref(false)

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

  return {
    // 状态
    loading,
    adminList,
    addDialogVisible,
    passwordDialogVisible,
    currentEditAdmin,
    currentUser,
    isUpdatingStatus,

    // 表单
    addFormRef,
    addForm,
    passwordFormRef,
    passwordForm,
    addFormRules,
    passwordFormRules,

    // 方法
    fetchAdminList,
    handleAdd,
    handleSaveAdmin,
    handleChangePassword,
    handleUpdatePassword,
    handleStatusChange,
    handleDelete,
    formatDate
  }
}