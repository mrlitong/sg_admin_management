<template>
  <div class="admin-list-desktop">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button
        type="primary"
        @click="handleAdd"
        :icon="Plus"
      >
        新增客服
      </el-button>
    </div>

    <!-- 桌面端表格视图 -->
    <el-table
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
      width="50%"
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
      width="50%"
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
import { onMounted } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
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
.admin-list-desktop {
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

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .admin-list-desktop {
    padding: 16px;
  }

  :deep(.el-table) {
    font-size: 13px;
  }
}
</style>