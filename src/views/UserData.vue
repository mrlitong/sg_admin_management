<template>
  <div class="user-data-container">
    <!-- 搜索和操作栏 -->
    <div class="toolbar" :class="{ 'mobile-toolbar': isMobile }">
      <div class="toolbar-left">
        <el-button v-if="isSuper && !isMobile" type="primary" @click="handleAdd" icon="Plus">新增用户</el-button>
        <el-button v-if="isSuper && isMobile" type="primary" @click="handleAdd" :icon="Plus" circle />
        <el-button v-if="isSuper && !isMobile" type="warning" @click="handleTransfer" icon="Switch">会员转移</el-button>
        <el-button v-if="isSuper && isMobile" type="warning" @click="handleTransfer" :icon="Switch" circle />
            <el-button v-if="isSuper && !isMobile" type="danger" @click="handleBatchDelete" :disabled="!selectedRows.length" icon="Delete">
          批量删除
        </el-button>
        <el-button 
          v-if="!isMobile"
          @click="toggleExpandColumns" 
          :icon="expandColumns ? Fold : Expand"
          :title="expandColumns ? '收起详细列' : '展开更多列（真实账号、主账号、联系方式等）'"
        >
          {{ expandColumns ? '收起详细' : '展开更多' }}
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-tooltip 
          content="全局搜索支持在账号、真实账号、主账号、联系方式、区名、区服、备注中模糊查询（大小写不敏感），支持实时搜索和回车搜索。支持多账号同时搜索，用空格分隔，例如：account1 account2 account3" 
          placement="bottom"
          :disabled="!isSuper || isMobile"
        >
          <el-input 
            v-model="searchKeyword" 
            :placeholder="isMobile ? '搜索' : (isSuper ? '全局搜索：账号/真实账号/主账号/联系方式/区名/区服/备注（支持多账号，空格分隔）' : '请输入账号进行模糊查询（支持多账号，空格分隔）')" 
            @input="handleSearch"
            @keyup.enter="handleSearch"
            clearable
            :style="{ width: isMobile ? '100%' : '400px' }"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-tooltip>
        <el-button v-if="isSuper && !isMobile" @click="showAdvancedFilter = !showAdvancedFilter" icon="Filter">
          高级筛选
        </el-button>
        <el-button v-if="isSuper && isMobile" @click="showAdvancedFilter = !showAdvancedFilter" :icon="Filter" circle />
      </div>
    </div>

    <!-- 高级筛选 -->
    <el-collapse-transition>
      <div v-show="showAdvancedFilter" class="advanced-filter" :class="{ 'mobile-filter': isMobile }">
        <el-form :model="filterForm" :label-width="isMobile ? '80px' : '100px'" :label-position="isMobile ? 'top' : 'left'">
          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="账号">
                <el-input v-model="filterForm.account" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="真实账号">
                <el-input v-model="filterForm.real_account" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="主账号">
                <el-input v-model="filterForm.main_account" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="联系方式">
                <el-input v-model="filterForm.contact" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="区名">
                <el-input v-model="filterForm.server_name" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="区服">
                <el-input v-model="filterForm.server_info" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="会员等级">
                <el-select v-model="filterForm.membership_level_list" multiple placeholder="支持多选" clearable style="width: 100%" :size="isMobile ? 'large' : 'default'">
                  <el-option 
                    v-for="(info, value) in MEMBERSHIP_LEVELS" 
                    :key="value" 
                    :label="info.label" 
                    :value="parseInt(value)" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="付费金额">
                <el-row :gutter="10">
                  <el-col :span="11">
                    <el-input-number v-model="filterForm.membership_pay_money_min" :min="0" placeholder="最小" style="width: 100%" controls-position="right" :size="isMobile ? 'large' : 'default'" />
                  </el-col>
                  <el-col :span="2" style="text-align: center">-</el-col>
                  <el-col :span="11">
                    <el-input-number v-model="filterForm.membership_pay_money_max" :min="0" placeholder="最大" style="width: 100%" controls-position="right" :size="isMobile ? 'large' : 'default'" />
                  </el-col>
                </el-row>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="游戏版本">
                <el-select v-model="filterForm.game_platform_list" multiple placeholder="支持多选" clearable style="width: 100%" :size="isMobile ? 'large' : 'default'">
                  <el-option 
                    v-for="(name, value) in GAME_PLATFORMS" 
                    :key="value" 
                    :label="name" 
                    :value="parseInt(value)" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="注册时间">
                <el-date-picker
                  v-model="filterForm.register_date_range"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :size="isMobile ? 'large' : 'default'"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="到期时间">
                <el-date-picker
                  v-model="filterForm.membership_expire_date_range"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :size="isMobile ? 'large' : 'default'"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="备注信息">
                <el-input v-model="filterForm.remarks" placeholder="支持模糊查询" clearable :size="isMobile ? 'large' : 'default'" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="在线状态">
                <el-select v-model="filterForm.auxiliary_online" placeholder="请选择" clearable :size="isMobile ? 'large' : 'default'" style="width: 100%">
                  <el-option label="全部" value="" />
                  <el-option label="在线" :value="1" />
                  <el-option label="离线" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="开启状态">
                <el-select v-model="filterForm.is_open" placeholder="请选择" clearable :size="isMobile ? 'large' : 'default'" style="width: 100%">
                  <el-option label="全部" value="" />
                  <el-option label="开启" :value="1" />
                  <el-option label="关闭" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24" style="text-align: right">
              <el-button type="primary" @click="handleFilter" icon="Search">筛选</el-button>
              <el-button @click="handleResetFilter" icon="RefreshLeft">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </el-collapse-transition>
    
    <!-- 普通管理员提示 -->
    <el-alert 
      v-if="!isSuper && !searchKeyword" 
      title="请输入账号进行查询"
      type="info"
      description="您需要输入具体的账号信息才能查询用户数据"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />
    
    <!-- 查询结果统计 -->
    <div v-if="!loading && hasSearched" class="result-summary">
      <el-text :type="pagination.total > 0 ? 'primary' : 'info'">
        <el-icon><InfoFilled /></el-icon>
        <template v-if="pagination.total > 0">
          共查询到 <strong>{{ pagination.total }}</strong> 条数据
        </template>
        <template v-else>
          未查询到符合条件的数据
        </template>
      </el-text>
    </div>

    <!-- 移动端卡片视图 -->
    <div v-if="isMobile && !loading && hasSearched" class="mobile-cards-container">
      <MobileDataCard
        v-for="item in tableData"
        :key="item.id"
        :user-data="item"
        :show-actions="isSuper"
        :show-toggle="isSuper"
        :show-footer-actions="true"
        @recharge="handleRecharge"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle="handleToggleAuxiliary"
      />
      
      <!-- 移动端分页 -->
      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="mobile-pagination"
      />
    </div>
    
    <!-- 桌面端数据表格 -->
    <el-table 
      v-if="!isMobile"
      v-loading="loading"
      :data="tableData" 
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      border
      stripe
      style="width: 100%"
      :fit="true"
      :default-sort="{ prop: 'register_date', order: 'descending' }"
    >
      <el-table-column v-if="isSuper" type="selection" width="55" />
      <el-table-column prop="account" label="账户" min-width="200" fixed show-overflow-tooltip sortable="custom" />
      <el-table-column prop="register_date" label="注册时间" min-width="160" show-overflow-tooltip sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.register_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="server_name" label="区名" min-width="100" show-overflow-tooltip />
      <el-table-column prop="server_info" label="区服" min-width="100" show-overflow-tooltip />
      <el-table-column prop="server_zone" label="区号" width="80" show-overflow-tooltip />
      <el-table-column prop="membership_pay_money" label="充值金额" width="100" show-overflow-tooltip sortable="custom">
        <template #default="{ row }">
          ¥{{ row.membership_pay_money || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="membership_level" label="会员级别" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag :type="getMembershipTagType(row.membership_level)">
            {{ getMembershipLabel(row.membership_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="membership_expire_date" label="到期时间" min-width="160" show-overflow-tooltip sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.membership_expire_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="game_platform" label="游戏版本" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ getGamePlatformName(row.game_platform) }}
        </template>
      </el-table-column>
      <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column prop="auxiliary_online" label="在线状态" width="85" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag :type="row.auxiliary_online ? 'success' : 'info'">
            {{ row.auxiliary_online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="expandColumns" prop="real_account" label="真实账号" min-width="200" show-overflow-tooltip />
      <el-table-column v-if="expandColumns" prop="main_account" label="主账号" min-width="200" show-overflow-tooltip />
      <el-table-column v-if="expandColumns" prop="contact" label="联系方式" min-width="200" show-overflow-tooltip />
      <el-table-column v-if="expandColumns" prop="last_online_time" label="最后在线时间" min-width="160" show-overflow-tooltip sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.last_online_time) }}
        </template>
      </el-table-column>
      <el-table-column v-if="expandColumns" prop="last_login_time" label="最后登录时间" min-width="160" show-overflow-tooltip sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.last_login_time) }}
        </template>
      </el-table-column>
      <el-table-column v-if="expandColumns" prop="is_open" label="开启状态" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          <el-switch 
            v-model="row.is_open" 
            :active-value="1" 
            :inactive-value="0" 
            :disabled="!isSuper"
            @change="handleToggleOpen(row)" 
          />
        </template>
      </el-table-column>
      <el-table-column v-if="isSuper" label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="handleRecharge(row)">充值</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 桌面端分页 -->
    <div class="pagination" v-if="!isDefaultMode && !isMobile">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
    
    <!-- 默认模式下显示总数 -->
    <div class="pagination" v-else>
      <span class="data-count-text">共 {{ pagination.total }} 条数据</span>
    </div>

    <!-- 编辑对话框 -->
    <UserEditDialog 
      v-model="editDialogVisible" 
      :user-data="currentEditUser"
      @save="handleSaveUser"
    />
    
    <!-- 充值对话框 -->
    <RechargeDialog
      v-model="rechargeDialogVisible"
      :user-data="currentRechargeUser"
      @recharge="handleRechargeConfirm"
    />
    
    <!-- 会员转移对话框 -->
    <MembershipTransferDialog
      v-model="transferDialogVisible"
      @confirm="handleTransferConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
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
import UserEditDialog from '../components/UserEditDialog.vue'
import RechargeDialog from '../components/RechargeDialog.vue'
import MobileDataCard from '../components/MobileDataCard.vue'
import MembershipTransferDialog from '../components/MembershipTransferDialog.vue'
import dayjs from 'dayjs'
import { Search, Plus, Delete, Filter, Expand, Fold, InfoFilled, RefreshLeft, Switch } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { getMembershipLabel, getMembershipTagType, getGamePlatformName, MEMBERSHIP_LEVELS, GAME_PLATFORMS } from '../utils/constants'
import { useResponsive, useTableResponsive } from '../utils/responsive'

// 获取路由对象
const route = useRoute()

// 获取当前用户信息
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)
const isSuper = computed(() => currentUser.value?.is_super || false)

// 响应式检测
const { isMobile, isTablet, isDesktop } = useResponsive()
const { showTable, paginationLayout, pageSize: responsivePageSize } = useTableResponsive()

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

// 日期快速选项配置
const dateShortcuts = [
  {
    text: '过去1天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 1)
      return [start, end]
    }
  },
  {
    text: '过去3天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 3)
      return [start, end]
    }
  },
  {
    text: '过去7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    }
  },
  {
    text: '过去10天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 10)
      return [start, end]
    }
  },
  {
    text: '过去15天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 15)
      return [start, end]
    }
  },
  {
    text: '过去30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return [start, end]
    }
  }
]

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
    fetchData()
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
      fetchData()
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
      fetchData()
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


// 格式化日期
const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss') : '-'
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

onMounted(() => {
  // 检查是否有来自数据分析看板的参数
  if (route.query.dataType && route.query.date) {
    handleAnalyticsNavigation(route.query.dataType, route.query.date)
  } else if (isSuper.value) {
    // 只有超级管理员才自动加载数据
    // 默认加载特殊筛选的数据
    fetchDefaultData()
  }
})
</script>

<style scoped>
.user-data-container {
  padding: 20px;
  background: var(--card-bg);
  border-radius: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.advanced-filter {
  background: var(--bg-color-secondary);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.data-count-text {
  color: var(--text-color-regular);
  font-size: 14px;
}

.result-summary {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.result-summary .el-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color-regular);
}

.result-summary strong {
  color: var(--primary-color);
  font-size: 18px;
  margin: 0 4px;
  font-weight: 600;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 48px; /* 固定行高 */
  vertical-align: middle;
}

:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 32px; /* 固定内容行高 */
  display: flex;
  align-items: center;
}

/* 统一所有组件的高度 */
:deep(.el-tag) {
  height: 24px;
  line-height: 22px;
  display: inline-flex;
  align-items: center;
}

:deep(.el-switch) {
  height: 24px;
  line-height: 24px;
}

/* 确保所有表格行高度一致 */
:deep(.el-table tbody tr) {
  height: 48px;
}

:deep(.el-table tbody tr td) {
  height: 48px !important;
}

/* 列展开/折叠动画 */
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  transition: all 0.3s ease;
}

:deep(.el-table-column) {
  transition: width 0.3s ease, opacity 0.3s ease;
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

/* 移动端样式 */
@media (max-width: 767px) {
  .user-data-container {
    padding: 12px;
    background: transparent;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  
  .toolbar-left {
    justify-content: flex-start;
  }
  
  .toolbar-right {
    flex-direction: row;
    gap: 8px;
  }
  
  /* 高级筛选移动端优化 */
  .advanced-filter {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .advanced-filter :deep(.el-form-item__label) {
    width: 80px !important;
    font-size: 13px;
  }
  
  .advanced-filter :deep(.el-col) {
    margin-bottom: 8px;
  }
  
  /* 移动端卡片容器 */
  .mobile-cards-container {
    padding: 0;
  }
  
  /* 移动端分页 */
  .mobile-pagination {
    margin-top: 16px;
    padding: 12px 0;
    display: flex;
    justify-content: center;
  }
  
  /* 结果统计移动端 */
  .result-summary {
    margin-bottom: 12px;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .result-summary strong {
    font-size: 16px;
  }
}

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .user-data-container {
    padding: 16px;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .toolbar-right :deep(.el-input) {
    width: 300px !important;
  }
  
  /* 表格字体稍小 */
  :deep(.el-table) {
    font-size: 13px;
  }
  
  /* 高级筛选平板优化 */
  .advanced-filter :deep(.el-col-8) {
    width: 50%;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-cards-container {
    max-height: calc(100vh - 180px);
    overflow-y: auto;
  }
}
</style>