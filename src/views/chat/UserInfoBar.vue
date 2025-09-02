<!-- 用户信息栏组件 -->
<template>
  <div class="user-info-bar">
    <!-- 移动端顶部栏 -->
    <div v-if="isMobile" class="mobile-top-bar">
      <!-- 返回按钮 -->
      <button @click="backToSessionList" class="mobile-back-btn">
        ← 返回
      </button>
      
      <!-- 用户头像 -->
      <div class="user-avatar-standalone">
        <div class="avatar-circle" v-if="!currentSession?.avatar_url || imageLoadError[currentSession?.session_id]">
          {{ getUserAvatar(currentSession) }}
        </div>
        <img 
          v-else
          :src="currentSession.avatar_url" 
          :alt="getUserName(currentSession)"
          class="avatar-image"
          @error="handleImageError(currentSession.session_id)"
          @load="handleImageLoad(currentSession.session_id)"
        />
      </div>
      
      <!-- 用户账号 -->
      <div class="mobile-user-name" @click="toggleMobileUserInfo">
        <span>{{ getUserName(currentSession) }}</span>
        <span class="expand-icon">{{ mobileUserInfoExpanded ? '▲' : '▼' }}</span>
      </div>
      
      <!-- 操作按钮 -->
      <div class="mobile-actions">
        <button 
          @click="toggleImportant" 
          :class="{ active: currentSession?.is_important }"
          class="action-btn important-btn"
          title="标记重要"
        >
          ⭐
        </button>
        <button @click="endCurrentSession" class="action-btn end-btn">
          结束会话
        </button>
      </div>
    </div>
    
    <!-- 移动端展开的用户详细信息 -->
    <div v-if="isMobile && mobileUserInfoExpanded" class="mobile-user-details">
      <div class="mobile-details-content">
        <!-- 会员级别 -->
        <div class="info-tag membership-tag" v-if="userMembershipInfo.membership_level > -1">
          <span class="tag-text">{{ getMembershipLevelText(userMembershipInfo.membership_level) }}</span>
        </div>
        
        <!-- 会员到期时间 -->
        <div class="info-tag expire-tag" v-if="userMembershipInfo.membership_expire_date" 
             :class="{ 'expired': isExpired(userMembershipInfo.membership_expire_date) }">
          <span class="tag-text">到期: {{ formatExpireDate(userMembershipInfo.membership_expire_date) }}</span>
        </div>
        
        <!-- 会员充值金额 -->
        <div class="info-tag pay-money-tag" v-if="userMembershipInfo.membership_pay_money > 0">
          <span class="tag-text">充值: ¥{{ userMembershipInfo.membership_pay_money }}</span>
        </div>
        
        <!-- 游戏版本 -->
        <div class="info-tag platform-tag" v-if="userMembershipInfo.game_platform > -1">
          <span class="tag-text">{{ getGamePlatformName(userMembershipInfo.game_platform) }}</span>
        </div>
        
        <!-- 最后在线时间 -->
        <div class="info-tag last-online-tag" v-if="userMembershipInfo.last_online_time">
          <span class="tag-text">最后在线: {{ formatLastOnlineTime(userMembershipInfo.last_online_time) }}</span>
        </div>
        
        <!-- 在线状态 -->
        <div class="info-tag online-status-tag" 
             v-if="userMembershipInfo.auxiliary_online !== undefined && userMembershipInfo.auxiliary_online !== null"
             :class="{ 'online': userMembershipInfo.auxiliary_online === 1, 'offline': userMembershipInfo.auxiliary_online === 0 }">
          <span class="tag-text">{{ userMembershipInfo.auxiliary_online === 1 ? '在线' : '离线' }}</span>
        </div>
        
        <!-- 备注 -->
        <div class="info-tag remarks-tag" v-if="userMembershipInfo.remarks && userMembershipInfo.remarks.trim()">
          <span class="tag-text">备注: {{ userMembershipInfo.remarks }}</span>
        </div>
      </div>
    </div>
    
    <!-- PC端用户信息展示区 -->
    <div v-if="!isMobile" class="user-info-container">
      <!-- 独立头像 -->
      <div class="user-avatar-standalone">
        <div class="avatar-circle" v-if="!currentSession?.avatar_url || imageLoadError[currentSession?.session_id]">
          {{ getUserAvatar(currentSession) }}
        </div>
        <img 
          v-else
          :src="currentSession.avatar_url" 
          :alt="getUserName(currentSession)"
          class="avatar-image"
          @error="handleImageError(currentSession.session_id)"
          @load="handleImageLoad(currentSession.session_id)"
        />
      </div>
      
      <!-- 用户信息标签 -->
      <div class="user-info-tags">
        <!-- 详细信息 -->
        <div class="detailed-info">
          <!-- 用户账号 -->
          <div class="info-tag account-tag">
            <span class="tag-text">{{ getUserName(currentSession) }}</span>
          </div>
          
          <!-- 会员级别 -->
          <div class="info-tag membership-tag" v-if="userMembershipInfo.membership_level > -1">
            <span class="tag-text">{{ getMembershipLevelText(userMembershipInfo.membership_level) }}</span>
          </div>
          
          <!-- 会员到期时间 -->
          <div class="info-tag expire-tag" v-if="userMembershipInfo.membership_expire_date" 
               :class="{ 'expired': isExpired(userMembershipInfo.membership_expire_date) }">
            <span class="tag-text">到期: {{ formatExpireDate(userMembershipInfo.membership_expire_date) }}</span>
          </div>
          
          <!-- 会员充值金额 -->
          <div class="info-tag pay-money-tag" v-if="userMembershipInfo.membership_pay_money > 0">
            <span class="tag-text">充值: ¥{{ userMembershipInfo.membership_pay_money }}</span>
          </div>
          
          <!-- 游戏版本 -->
          <div class="info-tag platform-tag" v-if="userMembershipInfo.game_platform > -1">
            <span class="tag-text">{{ getGamePlatformName(userMembershipInfo.game_platform) }}</span>
          </div>
          
          <!-- 最后在线时间 -->
          <div class="info-tag last-online-tag" v-if="userMembershipInfo.last_online_time">
            <span class="tag-text">最后在线: {{ formatLastOnlineTime(userMembershipInfo.last_online_time) }}</span>
          </div>
          
          <!-- 在线状态 -->
          <div class="info-tag online-status-tag" 
               v-if="userMembershipInfo.auxiliary_online !== undefined && userMembershipInfo.auxiliary_online !== null"
               :class="{ 'online': userMembershipInfo.auxiliary_online === 1, 'offline': userMembershipInfo.auxiliary_online === 0 }">
            <span class="tag-text">{{ userMembershipInfo.auxiliary_online === 1 ? '在线' : '离线' }}</span>
          </div>
          
          <!-- 备注 -->
          <div class="info-tag remarks-tag" v-if="userMembershipInfo.remarks && userMembershipInfo.remarks.trim()">
            <span class="tag-text">备注: {{ userMembershipInfo.remarks }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- PC端操作按钮 -->
    <div v-if="!isMobile" class="session-actions">
      <button 
        @click="toggleImportant" 
        :class="{ active: currentSession?.is_important }"
        class="action-btn important-btn"
        title="标记重要"
      >
        ⭐
      </button>
      <button @click="endCurrentSession" class="action-btn end-btn">
        结束会话
      </button>
    </div>
  </div>

  <!-- 重要性标记弹窗 -->
  <div v-if="showImportantDialog" class="dialog-overlay" @click="closeImportantDialog">
    <div class="dialog" @click.stop>
      <h3>{{ currentSession?.is_important ? '取消重要标记' : '标记为重要会话' }}</h3>
      <div v-if="!currentSession?.is_important" class="form-group">
        <label>重要性原因（可选）:</label>
        <textarea 
          v-model="importantReason" 
          placeholder="请输入标记原因..."
          rows="3"
        ></textarea>
      </div>
      <div class="dialog-actions">
        <button @click="closeImportantDialog" class="cancel-btn">取消</button>
        <button @click="confirmToggleImportant" class="confirm-btn">
          {{ currentSession?.is_important ? '取消标记' : '确认标记' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat';

const props = defineProps({
  currentSession: {
    type: Object,
    default: null
  },
  userMembershipInfo: {
    type: Object,
    default: () => ({
      membership_level: -1,
      membership_expire_date: null,
      game_platform: -1,
      remarks: null,
      last_online_time: null,
      auxiliary_online: 0,
      membership_pay_money: 0
    })
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  mobileUserInfoExpanded: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['back-to-session-list', 'toggle-mobile-user-info', 'end-session', 'mark-important']);

const chatStore = useChatStore();

// 图片加载错误状态管理
const imageLoadError = ref({});

// 重要性标记弹窗
const showImportantDialog = ref(false);
const importantReason = ref('');

// 返回到会话列表（移动端）
const backToSessionList = () => {
  emit('back-to-session-list');
};

// 切换移动端用户信息展开状态
const toggleMobileUserInfo = () => {
  if (props.isMobile) {
    emit('toggle-mobile-user-info');
  }
};

// 切换重要标记
const toggleImportant = () => {
  showImportantDialog.value = true;
};

const closeImportantDialog = () => {
  showImportantDialog.value = false;
  importantReason.value = '';
};

const confirmToggleImportant = async () => {
  if (!props.currentSession) return;
  
  try {
    const isImportant = !props.currentSession.is_important;
    const reason = isImportant ? importantReason.value : null;
    
    emit('mark-important', {
      sessionId: props.currentSession.session_id,
      isImportant,
      reason
    });
    
    closeImportantDialog();
  } catch (error) {
    console.error('标记重要性失败:', error);
  }
};

// 结束会话
const endCurrentSession = async () => {
  if (!props.currentSession) return;
  
  if (confirm('确定要结束此会话吗？')) {
    emit('end-session', props.currentSession.session_id);
  }
};

// 获取游戏平台名称
const getGamePlatformName = (platform) => {
  const platformMap = {
    '-1': '未知',
    '0': 'App',
    '1': '37游戏',
    '2': '今鸿',
    '3': '63游戏',
    '4': '皇者',
    '5': '如玩',
    '6': 'G妹',
    '7': '小程序'
  };
  return platformMap[platform?.toString()] || '未知';
};

// 获取会员等级文本
const getMembershipLevelText = (level) => {
  const levelMap = {
    '-1': '游客',
    '0': '体验会员',
    '1': '基础会员',
    '2': '高级会员',
    '3': '钻石会员',
    '4': '至尊会员'
  };
  return levelMap[level?.toString()] || '未知等级';
};

// 格式化会员到期时间
const formatExpireDate = (dateStr) => {
  if (!dateStr) return '无会员或已过期';
  
  if (typeof dateStr === 'number' || /^\d+$/.test(dateStr)) {
    const date = new Date(parseInt(dateStr) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
  
  return dateStr;
};

// 检查会员是否已过期
const isExpired = (expireDate) => {
  if (!expireDate) return false;
  
  let date;
  if (typeof expireDate === 'number' || /^\d+$/.test(expireDate)) {
    date = new Date(parseInt(expireDate) * 1000);
  } else {
    date = new Date(expireDate);
  }
  
  return date < new Date();
};

// 格式化最后在线时间
const formatLastOnlineTime = (timestamp) => {
  if (!timestamp) return '从未在线';
  
  let date;
  if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
    date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } else {
    return timestamp;
  }
};

const getUserName = (session) => {
  return session?.account || `游客${session?.guest_id}`;
};

const getUserAvatar = (session) => {
  const name = getUserName(session);
  return name.charAt(0).toUpperCase();
};

// 图片加载相关函数
const handleImageError = (sessionId) => {
  imageLoadError.value[sessionId] = true;
  console.log(`用户头像加载失败，会话ID: ${sessionId}`);
};

const handleImageLoad = (sessionId) => {
  imageLoadError.value[sessionId] = false;
  console.log(`用户头像加载成功，会话ID: ${sessionId}`);
};
</script>

<style scoped>
.user-info-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  min-height: 60px;
  position: relative;
  z-index: 10;
}

.user-info-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.user-avatar-standalone {
  flex-shrink: 0;
}

.avatar-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.avatar-image {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #90caf9;
}

.user-info-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.info-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid transparent;
}

/* 移动端信息标签允许换行 */
@media (max-width: 768px) {
  .mobile-details-content .info-tag {
    white-space: normal;
    word-wrap: break-word;
    flex-wrap: wrap;
  }
}

.account-tag {
  background: #e3f2fd;
  border-color: #90caf9;
}

.membership-tag {
  background: #e8f5e8;
  color: #2e7d32;
  border-color: #a5d6a7;
}

.expire-tag {
  background: #fff3e0;
  color: #f57c00;
  border-color: #ffcc02;
  min-width: 140px;
}

.expire-tag.expired {
  background: #ffebee;
  color: #d32f2f;
  border-color: #ef5350;
}

.pay-money-tag {
  background: #fff8e1;
  color: #e65100;
  border-color: #ffb74d;
  font-weight: 600;
}

.platform-tag {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #ce93d8;
}

.last-online-tag {
  background: #e0f2f1;
  color: #00695c;
  border-color: #80cbc4;
  min-width: 140px;
}

.online-status-tag.online {
  background: #e8f5e8;
  color: #2e7d32;
  border-color: #81c784;
}

.online-status-tag.offline {
  background: #fafafa;
  color: #757575;
  border-color: #bdbdbd;
}

.remarks-tag {
  background: #f0f4ff;
  color: #3f51b5;
  border-color: #9fa8da;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* PC端样式 */

.detailed-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.session-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.important-btn.active {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.end-btn {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.mobile-top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-back-btn {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.mobile-back-btn:hover {
  background: #0056b3;
}

.mobile-user-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mobile-user-name:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.mobile-user-name .expand-icon {
  font-size: 10px;
  color: #007bff;
  margin-left: 6px;
  transition: transform 0.2s;
}

.mobile-user-details {
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  animation: slideDown 0.3s ease;
  position: relative;
  z-index: 99;
}

.mobile-details-content {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 40vh;
  overflow-y: auto;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 200px;
  }
}

.mobile-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

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
  padding: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .user-info-bar {
    padding: 0;
    min-height: auto;
    flex-direction: column;
    align-items: stretch;
    position: relative;
  }
  
  /* 处理移动端视窗高度变化（键盘弹出等情况） */
  @supports (height: 100dvh) {
    .user-info-bar {
      position: sticky;
      top: 0;
    }
  }
  
  .mobile-top-bar .avatar-circle {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .mobile-top-bar .avatar-image {
    width: 28px;
    height: 28px;
  }
  
  .mobile-actions .action-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .mobile-details-content .info-tag {
    font-size: 12px;
    padding: 4px 8px;
    gap: 4px;
  }
  
  .mobile-details-content .expire-tag,
  .mobile-details-content .last-online-tag {
    min-width: auto;
    max-width: none;
    width: 100%;
    word-break: break-all;
    white-space: normal;
  }
  
  .mobile-details-content .remarks-tag {
    max-width: none;
    width: 100%;
    word-break: break-all;
    white-space: normal;
  }
  
  .dialog {
    margin: 10px;
    max-width: none;
    width: calc(100% - 20px);
  }
}
</style>