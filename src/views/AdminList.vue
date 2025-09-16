<template>
  <component :is="ResponsiveAdminList" :key="$route.path" />
</template>

<script setup>
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