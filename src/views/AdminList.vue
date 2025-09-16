<template>
  <Suspense :key="$route.path">
    <template #default>
      <component :is="ResponsiveAdminList" />
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
import { createAsyncResponsiveComponent } from '../utils/responsiveComponent'

const $route = useRoute()

// 使用响应式组件工厂创建动态组件
const ResponsiveAdminList = createAsyncResponsiveComponent({
  desktop: () => import('./AdminListDesktop.vue'),
  mobile: () => import('./AdminListMobile.vue')
})
</script>

<style scoped>
/* 无需额外样式，由子组件自己管理 */
</style>