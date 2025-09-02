<template>
  <span>{{ displayValue }}</span>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    default: 'number' // number, currency, percent
  },
  duration: {
    type: Number,
    default: 1000
  }
})

const displayValue = ref(0)
let startTime = null
let startValue = 0
let animationFrame = null

const animate = (timestamp) => {
  if (!startTime) startTime = timestamp
  const progress = Math.min((timestamp - startTime) / props.duration, 1)
  
  const currentValue = startValue + (props.value - startValue) * easeOutQuart(progress)
  displayValue.value = formatValue(currentValue)
  
  if (progress < 1) {
    animationFrame = requestAnimationFrame(animate)
  }
}

const easeOutQuart = (t) => {
  return 1 - Math.pow(1 - t, 4)
}

const formatValue = (value) => {
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0
      }).format(value)
    case 'percent':
      return value.toFixed(1)
    case 'number':
    default:
      return Math.round(value).toLocaleString('zh-CN')
  }
}

const startAnimation = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  startTime = null
  startValue = typeof displayValue.value === 'string' 
    ? parseFloat(displayValue.value.replace(/[^0-9.-]/g, '')) || 0
    : displayValue.value
  animationFrame = requestAnimationFrame(animate)
}

watch(() => props.value, () => {
  startAnimation()
})

onMounted(() => {
  startAnimation()
})
</script>