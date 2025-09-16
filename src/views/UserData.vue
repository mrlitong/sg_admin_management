<template>
  <Suspense :key="$route.path">
    <template #default>
      <component :is="ResponsiveUserDataComponent" />
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

// 使用响应式组件工厂创建自适应组件
const ResponsiveUserDataComponent = createAsyncResponsiveComponent({
  desktop: () => import('./UserDataDesktop.vue'),
  mobile: () => import('./UserDataMobile.vue')
})
</script>