<template>
  <div class="layout-container" :class="{ 'is-mobile': isMobile, 'is-tablet': isTablet }">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header" :class="{ 'mobile-header': isMobile }">
        <div class="header-left">
          <!-- 移动端和平板端显示菜单按钮 -->
          <el-icon
            v-if="!isDesktop"
            class="menu-toggle"
            @click="toggleSidebar"
          >
            <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
          </el-icon>
          <h1 class="logo">{{ isMobile ? '三国小助手' : '三国小助手客服管理系统' }}</h1>
        </div>
        <div class="header-right">
          <span class="user-info" v-if="!isMobile">
            {{ userInfo?.is_admin ? '管理员' : '客服' }}: {{ userInfo?.nickname || userInfo?.username }}
          </span>
          <!-- 主题切换按钮 -->
          <el-button
            class="theme-toggle"
            :icon="themeStore.isDark ? Sunny : Moon"
            circle
            @click="themeStore.toggleTheme()"
            :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
          />
          <el-dropdown @command="handleCommand" :trigger="isMobile ? 'click' : 'hover'">
            <span class="el-dropdown-link">
              <el-icon><UserFilled /></el-icon>
              <el-icon class="el-icon--right" v-if="!isMobile"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="isMobile" disabled>
                  <span class="mobile-user-info">
                    {{ userInfo?.is_admin ? '管理员' : '客服' }}: {{ userInfo?.nickname || userInfo?.username }}
                  </span>
                </el-dropdown-item>
                <el-dropdown-item v-if="isMobile" divided></el-dropdown-item>
                <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-container class="main-container">
        <!-- 侧边栏 - 桌面端和平板端显示 -->
        <el-aside
          v-if="!isMobile"
          :width="sidebarWidth"
          class="aside"
          :class="{ 'collapsed': sidebarCollapsed }"
        >
          <el-menu
            :default-active="activeMenu"
            router
            :background-color="menuBgColor"
            :text-color="menuTextColor"
            :active-text-color="menuActiveTextColor"
            :collapse="sidebarCollapsed"
            :collapse-transition="false"
          >
            <el-menu-item index="/users">
              <el-icon><Document /></el-icon>
              <span>用户数据管理</span>
            </el-menu-item>
            <el-menu-item index="/analytics">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据分析中心</span>
            </el-menu-item>
            <el-menu-item index="/chat">
              <el-icon><ChatDotRound /></el-icon>
              <span>客服聊天</span>
            </el-menu-item>
            <el-menu-item index="/admins" v-if="userInfo?.is_super">
              <el-icon><User /></el-icon>
              <span>客服管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <!-- 主内容区 -->
        <el-main class="main" :class="{ 'with-tabbar': isMobile }">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 移动端底部TabBar -->
    <MobileTabBar v-if="isMobile" />
    
    <!-- 修改密码对话框 -->
    <el-dialog 
      v-model="passwordDialogVisible" 
      title="修改密码" 
      :width="dialogWidth"
      :fullscreen="isMobile"
      :close-on-click-modal="false"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changePassword } from '../api/admin'
import { UserFilled, ArrowDown, Document, User, ChatDotRound, DataAnalysis, Expand, Fold, Sunny, Moon } from '@element-plus/icons-vue'
import { useResponsive, useDialogResponsive } from '../utils/responsive'
import { useThemeStore } from '../stores/theme'
import MobileTabBar from './MobileTabBar.vue'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 响应式检测
const { isMobile, isTablet, isDesktop } = useResponsive()
const { dialogWidth } = useDialogResponsive()

// 菜单颜色配置
const menuBgColor = computed(() => themeStore.isDark ? '#1d1e1f' : '#304156')
const menuTextColor = computed(() => themeStore.isDark ? '#CFD3DC' : '#bfcbd9')
const menuActiveTextColor = computed(() => '#409EFF')

// 侧边栏状态
const sidebarCollapsed = ref(false)
const sidebarWidth = computed(() => {
  if (sidebarCollapsed.value) return '64px'
  return '200px'
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // 保存状态到localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

// 初始化侧边栏状态
onMounted(() => {
  // 从localStorage读取侧边栏状态
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState === 'true' && isTablet.value) {
    sidebarCollapsed.value = true
  }
})

// 监听屏幕变化，自动调整侧边栏
watch([isTablet, isDesktop], ([newIsTablet, newIsDesktop]) => {
  if (newIsDesktop) {
    sidebarCollapsed.value = false
  } else if (newIsTablet) {
    // 平板模式下，默认收起侧边栏
    sidebarCollapsed.value = true
  }
})

const activeMenu = computed(() => route.path)
const userInfo = computed(() => authStore.user)

const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'changePassword') {
    passwordDialogVisible.value = true
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.doLogout()
  }).catch(() => {
    // 取消操作
  })
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate()
  if (!valid) return
  
  try {
    await changePassword(userInfo.value.id, {
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

onMounted(() => {
  // 用户信息已在路由守卫中获取，无需重复获取
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-toggle {
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.menu-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 20px;
  margin: 0;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.theme-toggle {
  background: transparent;
  border: none;
  color: var(--sidebar-text-color);
  transition: all 0.3s;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  border: none;
}

.user-info {
  font-size: 14px;
}

.mobile-user-info {
  font-size: 14px;
  color: #606266;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--sidebar-text-color);
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.el-dropdown-link:hover {
  color: #409EFF;
  background-color: rgba(255, 255, 255, 0.1);
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.aside {
  background-color: var(--sidebar-bg);
  transition: width 0.3s;
  overflow: hidden;
  border-right: 1px solid var(--border-color-light);
}

.aside.collapsed {
  width: 64px !important;
}

.main {
  background-color: var(--bg-color-page);
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

/* 移动端样式 */
.layout-container.is-mobile .header {
  height: var(--mobile-header-height);
  padding: 0 12px;
}

.layout-container.is-mobile .logo {
  font-size: 16px;
}

.layout-container.is-mobile .main {
  padding: 12px;
  /* 为底部TabBar留出空间 */
  padding-bottom: calc(var(--tabbar-height) + var(--safe-area-inset-bottom) + 12px);
}

.layout-container.is-mobile .main.with-tabbar {
  height: calc(100vh - var(--mobile-header-height) - var(--tabbar-height) - var(--safe-area-inset-bottom));
}

/* 平板端样式 */
.layout-container.is-tablet .header {
  padding: 0 16px;
}

.layout-container.is-tablet .main {
  padding: 16px;
}

/* 侧边栏折叠样式 */
:deep(.el-menu--collapse) {
  width: 64px;
}

:deep(.el-menu--collapse .el-menu-item span) {
  display: none;
}

:deep(.el-menu--collapse .el-menu-item) {
  padding: 0 !important;
  display: flex;
  justify-content: center;
}

:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin: 0;
  width: 24px;
  text-align: center;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式断点样式 */
@media (max-width: 767px) {
  .header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-dialog__header) {
    padding: 12px 16px;
  }
  
  :deep(.el-dialog__body) {
    padding: 16px;
  }
  
  :deep(.el-form-item__label) {
    width: 80px !important;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .aside {
    position: relative;
    z-index: 100;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  }
}

/* 滚动条美化 */
.main::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.main::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.main::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>