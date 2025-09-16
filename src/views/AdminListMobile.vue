<template>
  <div class="admin-list-mobile">
    <!-- 操作栏 -->
    <div class="mobile-toolbar">
      <el-button
        type="primary"
        @click="handleAdd"
        :icon="Plus"
      >
        新增
      </el-button>
    </div>

    <!-- 移动端卡片视图 -->
    <div v-if="!loading" class="mobile-cards-container">
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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton v-for="i in 5" :key="i" animated>
        <template #template>
          <div class="skeleton-card">
            <div class="skeleton-header">
              <el-skeleton-item variant="text" style="width: 40%" />
              <el-skeleton-item variant="text" style="width: 20%" />
            </div>
            <div class="skeleton-body">
              <el-skeleton-item variant="text" style="width: 80%" />
              <el-skeleton-item variant="text" style="width: 60%" />
              <el-skeleton-item variant="text" style="width: 30%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 新增客服对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增客服"
      fullscreen
      :close-on-click-modal="false"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules">
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
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveAdmin">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      fullscreen
      :close-on-click-modal="false"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordFormRules">
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
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdatePassword">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useAdminList } from '../composables/useAdminList'

// 使用共享的业务逻辑
const {
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
} = useAdminList()

onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped>
.admin-list-mobile {
  padding: 12px;
  background: var(--bg-color-secondary);
  min-height: 100vh;
}

.mobile-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-toolbar .el-button {
  font-size: 15px;
  padding: 10px 20px;
  min-height: 44px;
}

/* 移动端卡片容器 */
.mobile-cards-container {
  min-height: calc(100vh - 100px);
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
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 4px 0;
}

.admin-username {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 15px;
  padding: 2px 0;
}

.info-row .label {
  color: var(--text-color-secondary);
  min-width: 85px;
  flex-shrink: 0;
  font-weight: 500;
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

/* 加载状态 */
.loading-container {
  padding: 0;
}

.skeleton-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color-lighter);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.dialog-footer {
  display: flex;
  gap: 12px;
}

.dialog-footer .el-button {
  min-height: 44px;
  font-size: 15px;
  flex: 1;
}
</style>