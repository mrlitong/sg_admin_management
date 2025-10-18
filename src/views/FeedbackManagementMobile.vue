<template>
  <div class="feedback-management-mobile">
    <el-card class="stats-card">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-title">总反馈</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">已解决</div>
          <div class="stat-value success">{{ stats.solved }}</div>
          <div class="stat-desc">{{ stats.solveRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">处理中</div>
          <div class="stat-value info">{{ stats.processing }}</div>
          <div class="stat-desc">{{ stats.processingRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">待处理</div>
          <div class="stat-value warning">{{ stats.pending }}</div>
          <div class="stat-desc">{{ stats.pendingRate }}%</div>
        </div>
      </div>
    </el-card>

    <el-card class="filters-card">
      <div class="filters">
        <el-select v-model="typeFilter" size="small" class="filter-select">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="statusFilter" size="small" class="filter-select">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" :loading="loading" circle @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="my-feedback" v-if="myFeedbackCount">
        我的反馈：{{ myRepliedCount }}/{{ myFeedbackCount }}
      </div>
    </el-card>

    <div class="feedback-list" v-loading="loading">
      <el-empty v-if="!loading && !filteredFeedbackList.length" description="暂无反馈" />
      <el-card
        v-for="item in filteredFeedbackList"
        :key="item.id"
        class="feedback-card"
        shadow="hover"
      >
        <div class="card-header">
          <div class="tag-group">
            <el-tag type="primary" size="small">{{ feedbackTypeMap[item.type] || '未知' }}</el-tag>
            <el-tag :type="statusTypeMap[item.status] || 'info'" size="small">
              {{ feedbackStatusMap[item.status] || '未知' }}
            </el-tag>
            <el-tag v-if="item.function" size="small" effect="light">{{ item.function }}</el-tag>
          </div>
          <div class="vote">{{ item.votes }} 票</div>
        </div>
        <div class="card-content">{{ item.content }}</div>
        <div v-if="item.result" class="card-result">
          <div class="result-title">客服回复</div>
          <div class="result-content">{{ item.result }}</div>
        </div>
        <div class="card-meta">
          <div class="meta-account" @click="copyAccount(item.account)">
            {{ item.account || '未知账号' }}
          </div>
          <div class="meta-time">{{ item.time }}</div>
        </div>
        <div class="card-actions">
          <el-button size="small" type="primary" @click="openReplyDialog(item)">回复</el-button>
          <el-button size="small" type="danger" @click="openDeleteDialog(item)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="replyDialogVisible"
      title="回复反馈"
      :fullscreen="true"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <template v-if="selectedFeedback">
        <div class="dialog-content">
          <div class="dialog-section">
            <div class="dialog-title">反馈内容</div>
            <div class="dialog-text">{{ selectedFeedback.content }}</div>
          </div>
          <div class="dialog-section">
            <div class="dialog-label">反馈账号</div>
            <el-link type="primary" @click.prevent="copyAccount(selectedFeedback.account)">
              {{ selectedFeedback.account || '未知' }}
            </el-link>
          </div>
          <div class="dialog-section">
            <div class="dialog-label">当前标签</div>
            <div class="dialog-text">{{ selectedFeedback.function || '未标记' }}</div>
          </div>

          <el-form label-position="top" class="reply-form">
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
        </div>
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
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="feedbackToDelete">
        <p>删除后将无法恢复，确认继续吗？</p>
        <div class="delete-content">{{ feedbackToDelete.content }}</div>
      </template>
      <template #footer>
        <el-button @click="closeDeleteDialog">取消</el-button>
        <el-button type="danger" :loading="isDeleting" @click="confirmDelete">确认删除</el-button>
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
.feedback-management-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: calc(var(--tabbar-height) + var(--safe-area-inset-bottom));
}

.stats-card {
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.stat-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-value.success { color: #67c23a; }
.stat-value.info { color: #409eff; }
.stat-value.warning { color: #e6a23c; }

.stat-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.filters-card {
  border-radius: 12px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  flex: 1;
}

.my-feedback {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vote {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-content {
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.card-result {
  margin-top: 10px;
  padding: 10px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 8px;
}

.result-title {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.result-content {
  line-height: 1.6;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-account {
  color: #409eff;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 130px);
  overflow: auto;
}

.dialog-section {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 12px;
}

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.dialog-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.dialog-text {
  line-height: 1.6;
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
