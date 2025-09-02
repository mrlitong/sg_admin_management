<template>
  <div class="login-container" :class="{ 'mobile-view': isMobile }">
    <div class="login-wrapper">
      <!-- Logo区域 -->
      <div class="login-logo">
        <div class="logo-icon">⚔️</div>
        <h1 class="logo-text">三国小助手</h1>
      </div>
      
      <!-- 登录框 -->
      <div class="login-box">
        <h2 class="login-title">{{ isMobile ? '客服管理系统' : '三国小助手客服管理系统' }}</h2>
        <el-form 
          ref="loginFormRef" 
          :model="loginForm" 
          :rules="loginRules" 
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入账号"
              prefix-icon="User"
              size="large"
              clearable
              autofocus
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.rememberMe">记住我7天</el-checkbox>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="loading" 
              @click="handleLogin"
              class="login-btn"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 底部版权信息 -->
      <div class="login-footer">
        <p>© 2024 三国小助手 All Rights Reserved</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useResponsive } from '../utils/responsive'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式检测
const { isMobile, isTablet } = useResponsive()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate()
  if (!valid) return
  
  loading.value = true
  
  try {
    const result = await authStore.doLogin({
      username: loginForm.username,
      password: loginForm.password,
      remember_me: loginForm.rememberMe
    })
    
    if (result.success) {
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/'
      console.log('Login successful, redirecting to:', redirect)
      
      // 使用 await 确保跳转完成
      await router.push(redirect)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 如果已经登录，直接跳转
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* Logo样式 */
.login-logo {
  text-align: center;
  margin-bottom: 8px;
  animation: fadeInDown 0.8s ease;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.logo-text {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
}

/* 登录框样式 */
.login-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 32px;
  width: 100%;
  animation: fadeInUp 0.8s ease;
}

.login-title {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
  font-size: 20px;
  font-weight: 500;
}

.login-form {
  width: 100%;
}

.login-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-btn {
  width: 100%;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 底部版权 */
.login-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-top: 12px;
}

.login-footer p {
  margin: 0;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 6px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #409eff inset;
}

:deep(.el-input__inner) {
  font-size: 15px;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端样式 */
@media (max-width: 767px) {
  .login-container.mobile-view {
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .login-wrapper {
    height: 100vh;
    max-width: 100%;
    padding: 20px;
    justify-content: center;
  }
  
  .login-logo {
    margin-bottom: 20px;
  }
  
  .logo-icon {
    font-size: 40px;
  }
  
  .logo-text {
    font-size: 24px;
  }
  
  .login-box {
    padding: 24px 20px;
    border-radius: 16px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .login-title {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  /* 优化移动端输入框 - 防止iOS缩放 */
  :deep(.el-input__inner) {
    font-size: 16px !important;
    height: 48px;
    line-height: 48px;
  }
  
  :deep(.el-input__prefix) {
    font-size: 18px;
  }
  
  :deep(.el-button) {
    height: 48px;
    font-size: 16px;
    border-radius: 8px;
  }
  
  :deep(.el-checkbox) {
    font-size: 14px;
  }
  
  :deep(.el-checkbox__inner) {
    width: 18px;
    height: 18px;
  }
  
  :deep(.el-checkbox__inner::after) {
    height: 8px;
    left: 5px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
  
  .login-footer {
    margin-top: 20px;
    font-size: 11px;
  }
}

/* 平板端样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-container {
    padding: 40px;
  }
  
  .login-wrapper {
    max-width: 450px;
  }
  
  .login-box {
    padding: 40px 36px;
  }
  
  .login-title {
    font-size: 22px;
  }
  
  :deep(.el-input__inner) {
    height: 46px;
    line-height: 46px;
  }
  
  :deep(.el-button) {
    height: 46px;
  }
}

/* 小屏幕横屏优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .login-wrapper {
    gap: 16px;
  }
  
  .login-logo {
    margin-bottom: 0;
  }
  
  .logo-icon {
    font-size: 32px;
    margin-bottom: 4px;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .login-box {
    padding: 20px 24px;
  }
  
  .login-title {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
  
  :deep(.el-input__inner) {
    height: 40px;
    line-height: 40px;
  }
  
  :deep(.el-button) {
    height: 40px;
  }
  
  .login-footer {
    display: none;
  }
}

/* 深色模式支持（可选） */
@media (prefers-color-scheme: dark) {
  .login-box {
    background: #1f1f1f;
  }
  
  .login-title {
    color: #fff;
  }
  
  :deep(.el-input__wrapper) {
    background-color: #2b2b2b;
    box-shadow: 0 0 0 1px #444 inset;
  }
  
  :deep(.el-input__inner) {
    color: #fff;
  }
}
</style>