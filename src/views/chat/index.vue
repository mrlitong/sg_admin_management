<!-- 客服工作台 - 响应式组件工厂版本 -->
<template>
  <component :is="ChatComponent" :key="$route.path" />
</template>

<script setup>
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