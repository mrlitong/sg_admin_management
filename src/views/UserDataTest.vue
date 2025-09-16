<template>
  <div class="user-data-test">
    <h1>用户数据管理测试页面</h1>
    <p>当前设备: {{ deviceType }}</p>
    <p>组件版本: {{ componentVersion }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsive } from '../utils/responsive'

const { isMobile, isTablet, isDesktop } = useResponsive()

const deviceType = computed(() => {
  if (isMobile.value) return '移动设备'
  if (isTablet.value) return '平板设备'
  if (isDesktop.value) return '桌面设备'
  return '未知设备'
})

const componentVersion = computed(() => {
  return isMobile.value ? '移动端版本' : '桌面端版本'
})
</script>

<style scoped>
.user-data-test {
  padding: 20px;
}
</style>