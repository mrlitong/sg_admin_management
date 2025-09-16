<template>
  <Suspense :key="$route.path">
    <template #default>
      <component :is="ResponsiveAnalyticsDashboard" />
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

// 创建响应式异步组件
const ResponsiveAnalyticsDashboard = createAsyncResponsiveComponent({
  desktop: () => import('./AnalyticsDashboardDesktop.vue'),
  mobile: () => import('./AnalyticsDashboardMobile.vue')
})
</script>

<style scoped>
/* 主组件现在只是一个容器，具体样式在各个子组件中 */
</style>