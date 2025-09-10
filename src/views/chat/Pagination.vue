<template>
  <div class="pagination" v-if="totalPages > 1">
    <button 
      class="pagination-btn"
      :disabled="currentPage <= 1"
      @click="changePage(currentPage - 1)"
    >
      <el-icon><ArrowLeft /></el-icon>
    </button>
    
    <span class="pagination-info">
      {{ currentPage }} / {{ totalPages }}
    </span>
    
    <button 
      class="pagination-btn"
      :disabled="currentPage >= totalPages"
      @click="changePage(currentPage + 1)"
    >
      <el-icon><ArrowRight /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 20
  },
  total: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:currentPage', 'change'])

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  emit('update:currentPage', page)
  emit('change', page)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  gap: 10px;
  border-top: 1px solid var(--border-color-light);
  background-color: var(--card-bg);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color-base);
  background-color: var(--card-bg);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-info {
  font-size: 14px;
  color: var(--text-color-regular);
  user-select: none;
}
</style>