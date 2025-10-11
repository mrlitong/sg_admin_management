import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUserList,
  getDefaultUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  rechargeUser,
  transferMembership
} from '../api/users'
import { useAuthStore } from '../stores/auth'

/**
 * 用户数据管理的共享业务逻辑
 * 所有UI无关的逻辑都在这里
 */
export function useUserData() {
  // 获取路由对象
  const route = useRoute()

  // 获取当前用户信息
  const authStore = useAuthStore()
  const currentUser = computed(() => authStore.user)
  const isSuper = computed(() => currentUser.value?.is_super || false)

  // 数据状态
  const loading = ref(false)
  const tableData = ref([])
  const selectedRows = ref([])
  const searchKeyword = ref('')
  const showAdvancedFilter = ref(false)
  const editDialogVisible = ref(false)
  const currentEditUser = ref(null)
  const rechargeDialogVisible = ref(false)
  const currentRechargeUser = ref(null)
  const transferDialogVisible = ref(false)

  // 列展开/折叠状态
  const expandColumns = ref(localStorage.getItem('userDataExpandColumns') === 'true')

  // 是否处于默认显示模式
  const isDefaultMode = ref(true)

  // 是否已经执行过查询
  const hasSearched = ref(false)

  // 排序状态（默认按注册时间降序）
  const sortProp = ref('register_date')
  const sortOrder = ref('descending')

  // 筛选表单
  const filterForm = reactive({
    account: '',
    real_account: '',
    main_account: '',
    contact: '',
    server_name: '',
    server_info: '',
    membership_level_list: [],
    membership_pay_money_min: null,
    membership_pay_money_max: null,
    membership_expire_date_range: null,
    game_platform_list: [],
    auxiliary_online: '',
    is_open: '',
    register_date_range: null,
    remarks: ''
  })

  // 分页
  const pagination = reactive({
    page: 1,
    size: 20,
    total: 0
  })

  // 获取数据
  const fetchData = async () => {
    // 普通管理员必须输入账号才能查询
    if (!isSuper.value && !searchKeyword.value) {
      tableData.value = []
      pagination.total = 0
      return
    }

    loading.value = true
    hasSearched.value = true
    try {
      const params = {
        page: pagination.page,
        size: pagination.size
      }

      if (isSuper.value) {
        // 超级管理员可以使用所有查询参数
        params.keyword = searchKeyword.value

        // 复制筛选表单参数
        Object.assign(params, filterForm)

        // 处理日期范围
        if (filterForm.register_date_range) {
          params.register_date_start = filterForm.register_date_range[0]
          params.register_date_end = filterForm.register_date_range[1]
          delete params.register_date_range
        }

        if (filterForm.membership_expire_date_range) {
          params.membership_expire_date_start = filterForm.membership_expire_date_range[0]
          params.membership_expire_date_end = filterForm.membership_expire_date_range[1]
          delete params.membership_expire_date_range
        }

        // 处理数组参数（转换为逗号分隔的字符串）
        if (filterForm.membership_level_list && filterForm.membership_level_list.length > 0) {
          params.membership_level_list = filterForm.membership_level_list.join(',')
        } else {
          delete params.membership_level_list
        }

        if (filterForm.game_platform_list && filterForm.game_platform_list.length > 0) {
          params.game_platform_list = filterForm.game_platform_list.join(',')
        } else {
          delete params.game_platform_list
        }

        // 清理空值参数（排除排序参数）
        Object.keys(params).forEach(key => {
          if (key !== 'sort_by' && key !== 'sort_order' && (params[key] === '' || params[key] === null || params[key] === undefined)) {
            delete params[key]
          }
        })
      } else {
        // 普通管理员只能使用账号查询
        params.account = searchKeyword.value
      }

      // 添加排序参数（放在最后，避免被覆盖，对所有用户生效）
      if (sortProp.value) {
        params.sort_by = sortProp.value
        params.sort_order = sortOrder.value === 'ascending' ? 'asc' : 'desc'
      }

      const response = await getUserList(params)
      tableData.value = response.data
      pagination.total = response.total
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取默认数据（每个game_platform 3条）
  const fetchDefaultData = async () => {
    loading.value = true
    hasSearched.value = true
    try {
      // 传递排序参数给默认数据接口
      const params = {
        sort_by: sortProp.value || 'register_date',
        sort_order: sortOrder.value === 'ascending' ? 'asc' : 'desc'
      }
      const response = await getDefaultUserList(params)
      tableData.value = response.data
      pagination.total = response.total
    } catch (error) {
      console.error('获取默认数据失败:', error)
      // 如果获取默认数据失败，降级到普通查询
      fetchData()
    } finally {
      loading.value = false
    }
  }

  // 排序处理
  const handleSortChange = ({ column, prop, order }) => {
    sortProp.value = prop || 'register_date'  // 默认按注册时间排序
    sortOrder.value = order || 'descending'    // 默认降序
    pagination.page = 1

    // 根据当前模式调用不同的获取数据函数
    if (isDefaultMode.value) {
      fetchDefaultData()
    } else {
      fetchData()
    }
  }

  // 搜索处理
  const handleSearch = () => {
    pagination.page = 1
    isDefaultMode.value = false  // 退出默认模式
    fetchData()
  }

  // 筛选
  const handleFilter = () => {
    pagination.page = 1
    isDefaultMode.value = false  // 退出默认模式
    fetchData()
  }

  // 重置筛选
  const handleResetFilter = () => {
    Object.assign(filterForm, {
      account: '',
      real_account: '',
      main_account: '',
      contact: '',
      server_name: '',
      server_info: '',
      membership_level_list: [],
      membership_pay_money_min: null,
      membership_pay_money_max: null,
      membership_expire_date_range: null,
      game_platform_list: [],
      auxiliary_online: '',
      is_open: '',
      register_date_range: null,
      remarks: ''
    })
    // 如果重置筛选条件，且没有搜索关键词，则回到默认模式
    if (!searchKeyword.value && isSuper.value) {
      isDefaultMode.value = true
      fetchDefaultData()
    } else {
      handleFilter()
    }
  }

  // 分页处理
  const handlePageChange = () => {
    isDefaultMode.value = false  // 退出默认模式
    fetchData()
  }

  const handleSizeChange = () => {
    pagination.page = 1
    isDefaultMode.value = false  // 退出默认模式
    fetchData()
  }

  // 选择处理
  const handleSelectionChange = (rows) => {
    selectedRows.value = rows
  }

  // 新增用户
  const handleAdd = () => {
    currentEditUser.value = null
    editDialogVisible.value = true
  }

  // 会员转移
  const handleTransfer = () => {
    transferDialogVisible.value = true
  }

  // 编辑用户
  const handleEdit = async (row) => {
    try {
      // 先获取完整的用户详情
      const response = await getUserDetail(row.account)
      // 从响应中提取data字段，这才是实际的用户数据
      currentEditUser.value = response.data
      editDialogVisible.value = true
    } catch (error) {
      ElMessage.error('获取用户详情失败')
      console.error('获取用户详情失败:', error)
    }
  }

  // 保存用户
  const handleSaveUser = async (userData) => {
    try {
      if (currentEditUser.value) {
        // 更新
        await updateUser(currentEditUser.value.account, userData)
        ElMessage.success('更新成功')
      } else {
        // 新增
        await createUser(userData)
        ElMessage.success('创建成功')
      }
      editDialogVisible.value = false
      // 重置到第一页，保持筛选条件
      pagination.page = 1
      // 根据当前模式刷新数据
      if (isDefaultMode.value) {
        fetchDefaultData()
      } else {
        fetchData()
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // 删除用户
  const handleDelete = (row) => {
    ElMessageBox.confirm(`确定要删除用户 ${row.account} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteUser(row.account)
        ElMessage.success('删除成功')
        // 删除后保持当前页，如果当前页没有数据了会自动调整
        if (isDefaultMode.value) {
          fetchDefaultData()
        } else {
          fetchData()
        }
      } catch (error) {
        console.error('删除失败:', error)
      }
    })
  }

  // 批量删除
  const handleBatchDelete = () => {
    const accounts = selectedRows.value.map(row => row.account)
    ElMessageBox.confirm(`确定要删除选中的 ${accounts.length} 个用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await batchDeleteUsers(accounts)
        ElMessage.success('批量删除成功')
        // 批量删除后重置到第一页
        pagination.page = 1
        if (isDefaultMode.value) {
          fetchDefaultData()
        } else {
          fetchData()
        }
      } catch (error) {
        console.error('批量删除失败:', error)
      }
    })
  }

  // 切换开启状态
  const handleToggleOpen = async (row) => {
    try {
      await updateUser(row.account, { is_open: row.is_open })
      ElMessage.success('状态更新成功')
    } catch (error) {
      row.is_open = row.is_open ? 0 : 1
      console.error('状态更新失败:', error)
    }
  }

  // 处理移动端卡片的辅助在线状态切换
  const handleToggleAuxiliary = async (userData, value) => {
    try {
      await updateUser(userData.account, { auxiliary_online: value ? 1 : 0 })
      // 更新本地数据
      const index = tableData.value.findIndex(item => item.account === userData.account)
      if (index !== -1) {
        tableData.value[index].auxiliary_online = value ? 1 : 0
      }
    } catch (error) {
      throw error
    }
  }

  // 切换列展开/折叠
  const toggleExpandColumns = () => {
    expandColumns.value = !expandColumns.value
    localStorage.setItem('userDataExpandColumns', expandColumns.value)
  }

  // 处理充值
  const handleRecharge = (row) => {
    currentRechargeUser.value = { ...row }
    rechargeDialogVisible.value = true
  }

  // 处理充值确认
  const handleRechargeConfirm = async (rechargeData) => {
    try {
      // 获取当前管理员的用户名作为service_agent
      const currentUser = authStore.user || { username: 'admin' }

      // 准备充值数据
      const requestData = {
        account: rechargeData.account,  // 后端需要account字段
        amount: rechargeData.amount,
        duration: rechargeData.days,     // 后端期望duration而不是days
        service_agent: currentUser.username || 'admin',  // 充值客服
        remark: rechargeData.remark || ''
      }

      // 如果是赠送（金额为0），添加标记
      if (rechargeData.isGift) {
        requestData.is_gift = true
      }

      // 如果修改了会员级别
      if (rechargeData.membershipLevel !== null && rechargeData.membershipLevel !== undefined) {
        requestData.membership_level = rechargeData.membershipLevel
      }

      await rechargeUser(rechargeData.account, requestData)

      // 构建成功消息
      const messages = []
      if (rechargeData.amount === 0) {
        messages.push(`成功赠送${rechargeData.days}天会员时长`)
      } else {
        messages.push('充值成功')
      }

      if (rechargeData.membershipLevel !== null && rechargeData.membershipLevel !== undefined) {
        messages.push('会员级别已更新')
      }

      ElMessage.success(messages.join('，'))

      rechargeDialogVisible.value = false
      // 重置到第一页，保持筛选条件
      pagination.page = 1
      // 刷新当前页面数据
      if (isDefaultMode.value) {
        fetchDefaultData()
      } else {
        fetchData()
      }
    } catch (error) {
      console.error('充值失败:', error)
    }
  }

  // 会员转移确认
  const handleTransferConfirm = async (transferData) => {
    try {
      loading.value = true
      const res = await transferMembership(transferData)
      if (res.code === 0) {
        ElMessage.success(`会员转移成功！已将 ${transferData.source_account} 的会员权益转移到 ${transferData.target_account}`)
        transferDialogVisible.value = false
        // 重置到第一页，保持筛选条件
        pagination.page = 1
        // 刷新当前页面数据
        if (isDefaultMode.value) {
          fetchDefaultData()
        } else {
          fetchData()
        }
      } else {
        ElMessage.error(res.msg || '会员转移失败')
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.detail || error.message || '会员转移失败')
    } finally {
      loading.value = false
    }
  }

  // 处理来自数据分析看板的导航
  const handleAnalyticsNavigation = (dataType, date) => {
    // 清空现有筛选条件
    handleResetFilter()

    // 展开高级筛选，让用户看到筛选条件
    showAdvancedFilter.value = true

    // 根据数据类型设置筛选条件
    if (dataType === 'new') {
      // 新增用户：设置注册日期
      filterForm.register_date_range = [date, date]
      ElMessage.success(`正在查询 ${date} 新增的用户`)
    } else if (dataType === 'expired') {
      // 到期用户：设置会员到期日期
      filterForm.membership_expire_date_range = [date, date]
      ElMessage.success(`正在查询 ${date} 到期的用户`)
    }

    // 执行查询
    fetchData()
  }

  return {
    // 状态
    loading,
    tableData,
    selectedRows,
    searchKeyword,
    showAdvancedFilter,
    editDialogVisible,
    currentEditUser,
    rechargeDialogVisible,
    currentRechargeUser,
    transferDialogVisible,
    expandColumns,
    isDefaultMode,
    hasSearched,
    sortProp,
    sortOrder,
    filterForm,
    pagination,

    // 计算属性
    currentUser,
    isSuper,

    // 方法
    fetchData,
    fetchDefaultData,
    handleSortChange,
    handleSearch,
    handleFilter,
    handleResetFilter,
    handlePageChange,
    handleSizeChange,
    handleSelectionChange,
    handleAdd,
    handleTransfer,
    handleEdit,
    handleSaveUser,
    handleDelete,
    handleBatchDelete,
    handleToggleOpen,
    handleToggleAuxiliary,
    toggleExpandColumns,
    handleRecharge,
    handleRechargeConfirm,
    handleTransferConfirm,
    handleAnalyticsNavigation,

    // 路由对象
    route
  }
}