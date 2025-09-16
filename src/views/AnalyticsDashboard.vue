<template>
  <component :is="ResponsiveAnalyticsDashboard" :key="$route.path" />
</template>

<script setup>
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