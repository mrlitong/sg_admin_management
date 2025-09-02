<!-- 充值弹窗组件 -->
<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>用户充值</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="recharge-form">
        <div class="form-group">
          <label for="amount">充值金额（元）</label>
          <input 
            id="amount"
            v-model.number="formData.amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="请输入充值金额"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="duration">充值时长（天）</label>
          <input 
            id="duration"
            v-model.number="formData.duration"
            type="number"
            min="1"
            step="1"
            placeholder="请输入充值天数（整数）"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="serviceAgent">充值客服</label>
          <select 
            id="serviceAgent"
            v-model="formData.serviceAgent"
            required
          >
            <option value="" disabled>请选择充值客服</option>
            <option value="孙权">孙权</option>
            <option value="貂蝉">貂蝉</option>
            <option value="辰七">辰七</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>用户账号</label>
          <div class="readonly-field">{{ userAccount }}</div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="close" class="cancel-btn">取消</button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? '提交中...' : '确认充值' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userAccount: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'submit']);

const isSubmitting = ref(false);

const formData = reactive({
  amount: '',
  duration: '',
  serviceAgent: ''
});

// 监听弹窗状态，重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 重置表单
    formData.amount = '';
    formData.duration = '';
    formData.serviceAgent = '';
    isSubmitting.value = false;
  }
});

const handleOverlayClick = () => {
  if (!isSubmitting.value) {
    close();
  }
};

const close = () => {
  emit('close');
};

const handleSubmit = async () => {
  // 验证表单
  if (!formData.amount || formData.amount <= 0) {
    alert('请输入有效的充值金额');
    return;
  }
  
  if (!formData.duration || formData.duration <= 0 || !Number.isInteger(formData.duration)) {
    alert('请输入有效的充值天数（必须为正整数）');
    return;
  }
  
  if (!formData.serviceAgent) {
    alert('请选择充值客服');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // 提交数据
    await emit('submit', {
      amount: formData.amount,
      duration: formData.duration,
      serviceAgent: formData.serviceAgent,
      account: props.userAccount
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: dialogIn 0.2s ease;
}

@keyframes dialogIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.recharge-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
}

.form-group input[type="number"] {
  -moz-appearance: textfield;
}

.form-group input[type="number"]::-webkit-outer-spin-button,
.form-group input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.readonly-field {
  padding: 10px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  color: #495057;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.submit-btn {
  background: #28a745;
  color: white;
}

.submit-btn:hover {
  background: #218838;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .dialog {
    width: 95%;
    margin: 10px;
  }
  
  .dialog-header {
    padding: 16px;
  }
  
  .recharge-form {
    padding: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-actions {
    margin-top: 20px;
    padding-top: 16px;
  }
}
</style>