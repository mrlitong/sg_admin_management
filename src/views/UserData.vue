<template>
  <component :is="ResponsiveUserDataComponent" :key="$route.path" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import { createAsyncResponsiveComponent } from '../utils/responsiveComponent'

const $route = useRoute()

// 使用响应式组件工厂创建自适应组件
const ResponsiveUserDataComponent = createAsyncResponsiveComponent({
  desktop: () => import('./UserDataDesktop.vue'),
  mobile: () => import('./UserDataMobile.vue')
})
</script>