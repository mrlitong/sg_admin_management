<template>
  <component :is="ResponsiveFeedbackManagement" :key="$route.path" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import { createAsyncResponsiveComponent } from '../utils/responsiveComponent'

const $route = useRoute()

const ResponsiveFeedbackManagement = createAsyncResponsiveComponent({
  desktop: () => import('./FeedbackManagementDesktop.vue'),
  mobile: () => import('./FeedbackManagementMobile.vue')
})
</script>

<style scoped>
/* 逻辑交由具体布局组件处理 */
</style>
