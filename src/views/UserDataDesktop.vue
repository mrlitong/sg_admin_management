<template>
  <div class="user-data-container">
    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button v-if="isSuper" type="primary" @click="handleAdd" icon="Plus">新增用户</el-button>
        <el-button v-if="isSuper" type="warning" @click="handleTransfer" icon="Switch">会员转移</el-button>
        <el-button v-if="isSuper" type="danger" @click="handleBatchDelete" :disabled="!selectedRows.length" icon="Delete">
          批量删除
        </el-button>
        <el-button
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
          :disabled="!isSuper"
        >
          <el-input
            v-model="searchKeyword"
            :placeholder="isSuper ? '全局搜索：账号/真实账号/主账号/联系方式/区名/区服/备注（支持多账号，空格分隔）' : '请输入账号进行模糊查询（支持多账号，空格分隔）'"
            @input="handleSearch"
            @keyup.enter="handleSearch"
            clearable
            style="width: 400px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-tooltip>
        <el-button v-if="isSuper" @click="showAdvancedFilter = !showAdvancedFilter" icon="Filter">
          高级筛选
        </el-button>
      </div>
    </div>

    <!-- 高级筛选 -->
    <el-collapse-transition>
      <div v-show="showAdvancedFilter" class="advanced-filter">
        <el-form :model="filterForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :md="8">
              <el-form-item label="账号">
                <el-input v-model="filterForm.account" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="真实账号">
                <el-input v-model="filterForm.real_account" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="主账号">
                <el-input v-model="filterForm.main_account" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="联系方式">
                <el-input v-model="filterForm.contact" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="区名">
                <el-input v-model="filterForm.server_name" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="区服">
                <el-input v-model="filterForm.server_info" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="会员等级">
                <el-select v-model="filterForm.membership_level_list" multiple placeholder="支持多选" clearable style="width: 100%">
                  <el-option
                    v-for="(info, value) in MEMBERSHIP_LEVELS"
                    :key="value"
                    :label="info.label"
                    :value="parseInt(value)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="付费金额">
                <el-row :gutter="10">
                  <el-col :span="11">
                    <el-input-number v-model="filterForm.membership_pay_money_min" :min="0" placeholder="最小" style="width: 100%" controls-position="right" />
                  </el-col>
                  <el-col :span="2" style="text-align: center">-</el-col>
                  <el-col :span="11">
                    <el-input-number v-model="filterForm.membership_pay_money_max" :min="0" placeholder="最大" style="width: 100%" controls-position="right" />
                  </el-col>
                </el-row>
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="游戏版本">
                <el-select v-model="filterForm.game_platform_list" multiple placeholder="支持多选" clearable style="width: 100%">
                  <el-option
                    v-for="(name, value) in GAME_PLATFORMS"
                    :key="value"
                    :label="name"
                    :value="parseInt(value)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="注册时间">
                <el-date-picker
                  v-model="filterForm.register_date_range"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="到期时间">
                <el-date-picker
                  v-model="filterForm.membership_expire_date_range"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="备注信息">
                <el-input v-model="filterForm.remarks" placeholder="支持模糊查询" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="在线状态">
                <el-select v-model="filterForm.auxiliary_online" placeholder="请选择" clearable style="width: 100%">
                  <el-option label="全部" value="" />
                  <el-option label="在线" :value="1" />
                  <el-option label="离线" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8">
              <el-form-item label="开启状态">
                <el-select v-model="filterForm.is_open" placeholder="请选择" clearable style="width: 100%">
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

    <!-- 数据表格 -->
    <el-table
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

    <!-- 分页 -->
    <div class="pagination" v-if="!isDefaultMode">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
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
import { onMounted } from 'vue'
import dayjs from 'dayjs'
import { Search, Plus, Delete, Filter, Expand, Fold, InfoFilled, RefreshLeft, Switch } from '@element-plus/icons-vue'
import { useUserData } from '../composables/useUserData'
import UserEditDialog from '../components/UserEditDialog.vue'
import RechargeDialog from '../components/RechargeDialog.vue'
import MembershipTransferDialog from '../components/MembershipTransferDialog.vue'
import { getMembershipLabel, getMembershipTagType, getGamePlatformName, MEMBERSHIP_LEVELS, GAME_PLATFORMS } from '../utils/constants'

// 日期快速选项配置
const dateShortcuts = [
  { text: '过去1天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 1); return [start, end] } },
  { text: '过去3天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 3); return [start, end] } },
  { text: '过去7天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 7); return [start, end] } },
  { text: '过去10天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 10); return [start, end] } },
  { text: '过去15天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 15); return [start, end] } },
  { text: '过去30天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 30); return [start, end] } }
]

// 使用共享的业务逻辑
const {
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
  filterForm,
  pagination,
  isSuper,
  route,
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
  toggleExpandColumns,
  handleRecharge,
  handleRechargeConfirm,
  handleTransferConfirm,
  handleAnalyticsNavigation
} = useUserData()

// 格式化日期
const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  // 检查是否有来自数据分析看板的参数
  if (route.query.dataType && route.query.date) {
    handleAnalyticsNavigation(route.query.dataType, route.query.date)
  } else if (isSuper.value) {
    // 只有超级管理员才自动加载数据
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
  height: 48px;
  vertical-align: middle;
}

:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 32px;
  display: flex;
  align-items: center;
}

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

:deep(.el-table tbody tr) {
  height: 48px;
}

:deep(.el-table tbody tr td) {
  height: 48px !important;
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

  :deep(.el-table) {
    font-size: 13px;
  }

  .advanced-filter :deep(.el-col-8) {
    width: 50%;
  }
}
</style>