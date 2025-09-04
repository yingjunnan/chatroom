<script setup>
import { ref } from 'vue';
import LoginForm from './components/LoginForm.vue';
import RoomSelection from './components/RoomSelection.vue';
import ChatRoom from './components/ChatRoom.vue';
import socketService from './services/socketService';

// 应用状态
const currentView = ref('login'); // 'login', 'room-selection', 'chat-room'
const username = ref('');
const roomId = ref('');

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
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f0f2f5;
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
