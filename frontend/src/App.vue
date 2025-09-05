<script setup>
import { ref, onMounted } from 'vue';
import LoginForm from './components/LoginForm.vue';
import RoomSelection from './components/RoomSelection.vue';
import ChatRoom from './components/ChatRoom.vue';
import socketService from './services/socketService';
import { useTheme } from './composables/useTheme';

// 应用状态
const currentView = ref('login'); // 'login', 'room-selection', 'chat-room'
const username = ref('');
const roomId = ref('');

// 主题管理
const { loadTheme } = useTheme();

// 初始化
onMounted(() => {
  loadTheme();
});

// 登录成功处理
const handleLoginSuccess = (loggedInUsername) => {
  username.value = loggedInUsername;
  currentView.value = 'room-selection';
};

// 加入房间处理
const handleRoomJoined = (joinedRoomId) => {
  roomId.value = joinedRoomId;
  currentView.value = 'chat-room';
};

// 离开房间处理
const handleLeaveRoom = () => {
  roomId.value = '';
  currentView.value = 'room-selection';
  
  // 重新连接并注册用户，但不清除用户名
  socketService.init()
    .on('connect', () => {
      socketService.register(username.value);
    });
};

// 退出登录处理
const handleLogout = () => {
  username.value = '';
  roomId.value = '';
  currentView.value = 'login';
  socketService.disconnect(); // 断开连接，清空消息
  socketService.clearUserData(); // 清除用户数据
};
</script>

<template>
  <div class="app-container">
    <!-- 登录页面 -->
    <LoginForm 
      v-if="currentView === 'login'"
      @login-success="handleLoginSuccess"
    />
    
    <!-- 房间选择页面 -->
    <RoomSelection 
      v-else-if="currentView === 'room-selection'"
      :username="username"
      @room-joined="handleRoomJoined"
      @logout="handleLogout"
    />
    
    <!-- 聊天室页面 -->
    <ChatRoom 
      v-else-if="currentView === 'chat-room'"
      :username="username"
      :roomId="roomId"
      @leave-room="handleLeaveRoom"
    />
  </div>
</template>

<style>
/* CSS变量定义 */
:root {
  --theme-primary: #2196F3;
  --theme-primaryHover: #0b7dda;
  --theme-secondary: #4CAF50;
  --theme-secondaryHover: #3e8e41;
  --theme-background: #f0f2f5;
  --theme-cardBackground: #ffffff;
  --theme-textPrimary: #333333;
  --theme-textSecondary: #666666;
  --theme-border: #e9ecef;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--theme-textPrimary);
  background-color: var(--theme-background);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app-container {
  min-height: 100vh;
  padding: 2rem;
  max-width: 100vh;
  width: 100vh;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }
}
</style>
