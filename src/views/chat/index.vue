<!-- 客服工作台 - 响应式组件工厂版本 -->
<template>
  <Suspense :key="$route.path">
    <template #default>
      <component :is="ChatComponent" />
    </template>
    <template #fallback>
      <div style="padding: 20px; text-align: center;">
        加载中...
      </div>
    </template>
  </Suspense>
</template>

<script setup>
import { Suspense } from 'vue'
import { useRoute } from 'vue-router'
import { createAsyncResponsiveComponent } from '@/utils/responsiveComponent'

const $route = useRoute()

// 创建响应式聊天组件
const ChatComponent = createAsyncResponsiveComponent({
  desktop: () => import('./ChatDesktop.vue'),
  mobile: () => import('./ChatMobile.vue')
})
</script>

<style scoped>
/* 响应式聊天组件容器 */
</style>