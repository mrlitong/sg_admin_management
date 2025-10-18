<template>
  <div class="feedback-management-desktop">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-title">总反馈</div>
            <div class="stat-value">{{ stats.total }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-title">已解决</div>
            <div class="stat-value success">{{ stats.solved }}</div>
            <div class="stat-desc">解决率 {{ stats.solveRate }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-title">处理中</div>
            <div class="stat-value info">{{ stats.processing }}</div>
            <div class="stat-desc">占比 {{ stats.processingRate }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-title">待处理</div>
            <div class="stat-value warning">{{ stats.pending }}</div>
            <div class="stat-desc">占比 {{ stats.pendingRate }}%</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="filters-card">
      <div class="filters">
        <div class="filter-group">
          <span class="filter-label">类型：</span>
          <el-radio-group v-model="typeFilter" size="small">
            <el-radio-button v-for="item in typeOptions" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-group">
          <span class="filter-label">状态：</span>
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button v-for="item in statusOptions" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-actions">
          <el-tooltip content="刷新" placement="top">
            <el-button type="primary" :loading="loading" circle @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <el-card class="list-card">
      <template #header>
        <div class="list-header">
          <span>反馈列表</span>
          <span v-if="myFeedbackCount">我的反馈：{{ myRepliedCount }}/{{ myFeedbackCount }}</span>
        </div>
      </template>

      <el-table
        :data="filteredFeedbackList"
        v-loading="loading"
        border
        stripe
        height="calc(100vh - 340px)"
        :empty-text="loading ? '加载中...' : '暂无反馈'"
      >
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ feedbackTypeMap[row.type] || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status] || 'info'">
              {{ feedbackStatusMap[row.status] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="function" label="功能标签" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.function" effect="light">{{ row.function }}</el-tag>
            <span v-else class="text-muted">未标记</span>
          </template>
        </el-table-column>
        <el-table-column prop="votes" label="票数" width="90" sortable>
          <template #default="{ row }">
            <span class="vote-value">{{ row.votes }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="account" label="反馈账号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click.prevent="copyAccount(row.account)">
              {{ row.account || '未知' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="反馈时间" width="160" show-overflow-tooltip />
        <el-table-column prop="content" label="反馈内容" min-width="220" show-overflow-tooltip />
        <el-table-column prop="result" label="客服回复" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openReplyDialog(row)">回复</el-button>
            <el-button type="danger" link @click="openDeleteDialog(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="replyDialogVisible"
      title="回复反馈"
      width="560px"
      :close-on-click-modal="false"
    >
      <template v-if="selectedFeedback">
        <el-descriptions :column="1" border size="small" class="feedback-info-block">
          <el-descriptions-item label="反馈内容">
            <div class="feedback-content">{{ selectedFeedback.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="反馈账号">
            <el-link type="primary" @click.prevent="copyAccount(selectedFeedback.account)">
              {{ selectedFeedback.account || '未知' }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="当前标签">
            {{ selectedFeedback.function || '未标记' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-width="100px" class="reply-form">
          <el-form-item label="反馈状态">
            <el-radio-group v-model="replyForm.status">
              <el-radio v-for="item in FEEDBACK_STATUSES" :key="item.value" :label="item.value">
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="功能分类">
            <el-select
              v-model="replyForm.functionCategory"
              placeholder="请选择功能类别"
              clearable
              @change="handleCategoryChange"
            >
              <el-option
                v-for="category in FUNCTION_CATEGORIES"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="功能标签">
            <el-select
              v-model="replyForm.functionName"
              placeholder="请选择具体功能"
              clearable
              :disabled="!replyForm.functionCategory"
            >
              <el-option
                v-for="func in availableFunctions"
                :key="func"
                :label="func"
                :value="func"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="回复内容">
            <el-input
              v-model="replyForm.result"
              type="textarea"
              :rows="6"
              placeholder="请输入回复内容"
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="closeReplyDialog">取消</el-button>
        <el-button type="primary" :loading="isSubmittingReply" @click="submitReply">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="420px"
      :close-on-click-modal="false"
    >
      <template v-if="feedbackToDelete">
        <p>删除后将无法恢复，确认继续吗？</p>
        <div class="delete-content">{{ feedbackToDelete.content }}</div>
      </template>
      <template #footer>
        <el-button @click="closeDeleteDialog">取消</el-button>
        <el-button type="danger" :loading="isDeleting" @click="confirmDelete">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import {
  useFeedbackManagement,
  FEEDBACK_STATUSES,
  FUNCTION_CATEGORIES,
  feedbackTypeMap,
  feedbackStatusMap
} from '../composables/useFeedbackManagement'

const {
  loading,
  filteredFeedbackList,
  typeFilter,
  statusFilter,
  typeOptions,
  statusOptions,
  stats,
  myFeedbackCount,
  myRepliedCount,
  handleRefresh,
  openReplyDialog,
  closeReplyDialog,
  submitReply,
  openDeleteDialog,
  closeDeleteDialog,
  confirmDelete,
  copyAccount,
  replyDialogVisible,
  deleteDialogVisible,
  selectedFeedback,
  feedbackToDelete,
  replyForm,
  isSubmittingReply,
  isDeleting,
  availableFunctions
} = useFeedbackManagement()

const statusTypeMap = computed(() => {
  const map = {}
  FEEDBACK_STATUSES.forEach(item => {
    map[item.value] = item.type || 'info'
  })
  return map
})

const handleCategoryChange = () => {
  if (!replyForm.functionCategory) {
    replyForm.functionName = ''
    return
  }
  if (!availableFunctions.value.includes(replyForm.functionName)) {
    replyForm.functionName = ''
  }
}
</script>

<style scoped>
.feedback-management-desktop {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card {
  border-radius: 12px;
}

.stat-item {
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.stat-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.info {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-desc {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.filters-card {
  border-radius: 12px;
}

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.filter-actions {
  display: flex;
  align-items: center;
}

.list-card {
  flex: 1;
  border-radius: 12px;
  min-height: 400px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.vote-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.feedback-info-block {
  margin-bottom: 16px;
}

.feedback-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.reply-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.delete-content {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-color-danger-light-9);
  border-radius: 8px;
  line-height: 1.5;
}
</style>
