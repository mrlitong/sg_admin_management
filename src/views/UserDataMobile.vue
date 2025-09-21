<template>
  <div class="user-data-container">
    <!-- 搜索和操作栏 -->
    <div class="mobile-toolbar">
      <div class="toolbar-left">
        <el-button v-if="isSuper" type="primary" @click="handleAdd" :icon="Plus" circle />
        <el-button v-if="isSuper" type="warning" @click="handleTransfer" :icon="Switch" circle />
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索"
          @input="handleSearch"
          @keyup.enter="handleSearch"
          clearable
          style="width: 100%"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button v-if="isSuper" @click="showAdvancedFilter = !showAdvancedFilter" :icon="Filter" circle />
      </div>
    </div>

    <!-- 高级筛选 -->
    <el-collapse-transition>
      <div v-show="showAdvancedFilter" class="mobile-filter">
        <el-form :model="filterForm" label-width="80px" label-position="top">
          <el-form-item label="账号">
            <el-input v-model="filterForm.account" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="真实账号">
            <el-input v-model="filterForm.real_account" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="主账号">
            <el-input v-model="filterForm.main_account" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="联系方式">
            <el-input v-model="filterForm.contact" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="区名">
            <el-input v-model="filterForm.server_name" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="区服">
            <el-input v-model="filterForm.server_info" placeholder="支持模糊查询" clearable size="large" />
          </el-form-item>
          <el-form-item label="会员等级">
            <el-select v-model="filterForm.membership_level_list" multiple placeholder="支持多选" clearable style="width: 100%" size="large">
              <el-option
                v-for="(info, value) in MEMBERSHIP_LEVELS"
                :key="value"
                :label="info.label"
                :value="parseInt(value)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="付费金额">
            <el-row :gutter="10">
              <el-col :span="11">
                <el-input-number v-model="filterForm.membership_pay_money_min" :min="0" placeholder="最小" style="width: 100%" controls-position="right" size="large" />
              </el-col>
              <el-col :span="2" style="text-align: center">-</el-col>
              <el-col :span="11">
                <el-input-number v-model="filterForm.membership_pay_money_max" :min="0" placeholder="最大" style="width: 100%" controls-position="right" size="large" />
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="游戏版本">
            <el-select v-model="filterForm.game_platform_list" multiple placeholder="支持多选" clearable style="width: 100%" size="large">
              <el-option
                v-for="(name, value) in GAME_PLATFORMS"
                :key="value"
                :label="name"
                :value="parseInt(value)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="注册时间">
            <el-date-picker
              v-model="filterForm.register_date_range"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              size="large"
              :shortcuts="dateShortcuts"
            />
          </el-form-item>
          <el-form-item label="到期时间">
            <el-date-picker
              v-model="filterForm.membership_expire_date_range"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              size="large"
              :shortcuts="dateShortcuts"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="filterForm.remarks" placeholder="支持模糊查询" clearable size="default" />
          </el-form-item>
          <el-form-item label="在线状态">
            <el-select v-model="filterForm.auxiliary_online" placeholder="请选择" clearable size="large" style="width: 100%">
              <el-option label="全部" value="" />
              <el-option label="在线" :value="1" />
              <el-option label="离线" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="开启状态">
            <el-select v-model="filterForm.is_open" placeholder="请选择" clearable size="large" style="width: 100%">
              <el-option label="全部" value="" />
              <el-option label="开启" :value="1" />
              <el-option label="关闭" :value="0" />
            </el-select>
          </el-form-item>
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
      style="margin-bottom: 10px"
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
    <div v-if="!loading && hasSearched" class="mobile-cards-container">
      <MobileDataCard
        v-for="item in tableData"
        :key="item.id"
        :user-data="item"
        :show-actions="isSuper"
        @recharge="handleRecharge"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 移动端分页 -->
      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="mobile-pagination"
      />
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
import { Search, Plus, Delete, Filter, InfoFilled, RefreshLeft, Switch } from '@element-plus/icons-vue'
import { useUserData } from '../composables/useUserData'
import UserEditDialog from '../components/UserEditDialog.vue'
import RechargeDialog from '../components/RechargeDialog.vue'
import MobileDataCard from '../components/MobileDataCard.vue'
import MembershipTransferDialog from '../components/MembershipTransferDialog.vue'
import { MEMBERSHIP_LEVELS, GAME_PLATFORMS } from '../utils/constants'

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
  searchKeyword,
  showAdvancedFilter,
  editDialogVisible,
  currentEditUser,
  rechargeDialogVisible,
  currentRechargeUser,
  transferDialogVisible,
  hasSearched,
  filterForm,
  pagination,
  isSuper,
  route,
  fetchDefaultData,
  handleSearch,
  handleFilter,
  handleResetFilter,
  handlePageChange,
  handleSizeChange,
  handleAdd,
  handleTransfer,
  handleEdit,
  handleSaveUser,
  handleDelete,
  handleRecharge,
  handleRechargeConfirm,
  handleTransferConfirm,
  handleAnalyticsNavigation
} = useUserData()

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
  padding: 8px;
  background: transparent;
}

.mobile-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 6px;
  width: 100%;
}

.toolbar-left {
  justify-content: flex-start;
}

.toolbar-left :deep(.el-button.is-circle) {
  width: 32px;
  height: 32px;
}

.toolbar-right {
  flex-direction: row;
  gap: 6px;
}

.toolbar-right :deep(.el-button.is-circle) {
  width: 32px;
  height: 32px;
}

.toolbar-right :deep(.el-input) {
  font-size: 14px;
}

.toolbar-right :deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
  font-size: 14px;
}

/* 高级筛选移动端优化 */
.mobile-filter {
  background: var(--bg-color-secondary);
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.mobile-filter :deep(.el-form-item__label) {
  width: 70px !important;
  font-size: 12px;
  padding: 0;
  line-height: 1.2;
}

.mobile-filter :deep(.el-form-item) {
  margin-bottom: 8px;
}

.mobile-filter :deep(.el-button) {
  font-size: 13px;
  padding: 6px 12px;
  height: auto;
}

/* 移动端卡片容器 */
.mobile-cards-container {
  padding: 0;
}

/* 移动端分页 */
.mobile-pagination {
  margin-top: 10px;
  padding: 8px 0;
  display: flex;
  justify-content: center;
}

.mobile-pagination :deep(.el-pager li) {
  width: 28px;
  height: 28px;
  line-height: 28px;
  font-size: 12px;
}

.mobile-pagination :deep(.btn-prev),
.mobile-pagination :deep(.btn-next) {
  width: 28px;
  height: 28px;
  line-height: 28px;
}

/* 结果统计移动端 */
.result-summary {
  margin-bottom: 8px;
  padding: 6px 10px;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 12px;
}

.result-summary .el-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-color-regular);
}

.result-summary strong {
  color: var(--primary-color);
  font-size: 14px;
  margin: 0 2px;
  font-weight: 600;
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-cards-container {
    max-height: calc(100vh - 180px);
    overflow-y: auto;
  }
}

/* Alert 组件紧凑样式 */
:deep(.el-alert) {
  padding: 8px 12px;
}

:deep(.el-alert__title) {
  font-size: 13px;
  line-height: 1.4;
}

:deep(.el-alert__description) {
  font-size: 12px;
  line-height: 1.4;
  margin: 4px 0 0;
}

:deep(.el-alert__icon) {
  font-size: 14px;
}

/* 输入框组件优化 */
:deep(.el-input--default .el-input__inner) {
  height: 32px;
  line-height: 32px;
  font-size: 14px;
}

:deep(.el-select--default) {
  font-size: 14px;
}

:deep(.el-input-number--default) {
  line-height: 30px;
}

:deep(.el-input-number--default .el-input__inner) {
  height: 30px;
  line-height: 30px;
}
</style>