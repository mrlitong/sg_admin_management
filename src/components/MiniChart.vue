<template>
  <div ref="chartRef" class="mini-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  type: {
    type: String,
    default: 'line' // line, bar
  },
  color: {
    type: String,
    default: '#409EFF'
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    grid: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    xAxis: {
      type: 'category',
      show: false,
      data: props.data.map((_, index) => index)
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [{
      type: props.type,
      data: props.data,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: props.color
      },
      areaStyle: props.type === 'line' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: props.color + '40' },
          { offset: 1, color: props.color + '10' }
        ])
      } : null,
      itemStyle: {
        color: props.color
      }
    }]
  }
  
  chartInstance.setOption(option)
}

const updateChart = () => {
  if (!chartInstance) return
  
  chartInstance.setOption({
    series: [{
      data: props.data
    }]
  })
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(() => props.data, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.mini-chart {
  width: 100%;
  height: 100%;
  min-height: 40px;
}
</style>