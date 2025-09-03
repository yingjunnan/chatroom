<template>
  <div class="room-selection">
    <h2>选择聊天室</h2>
    
    <div class="user-info">
      <p>当前用户: <strong>{{ username }}</strong></p>
    </div>
    
    <div class="room-options">
      <div class="option-card">
        <h3>创建新房间</h3>
        <p>创建一个新的聊天室，其他用户可以通过房间ID加入。</p>
        <button @click="createRoom" class="btn-create">创建房间</button>
      </div>
      
      <div class="option-card">
        <h3>加入已有房间</h3>
        <p>输入房间ID加入已存在的聊天室。</p>
        <div class="input-group">
          <input 
            type="text" 
            v-model="roomIdToJoin" 
            placeholder="输入房间ID"
          />
          <button @click="joinRoom" class="btn-join" :disabled="!roomIdToJoin.trim()">加入房间</button>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button @click="logout" class="btn-logout">退出登录</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import socketService from '../services/socketService';

export default {
  name: 'RoomSelection',
  props: {
    username: {
      type: String,
      required: true
    }
  },
  emits: ['room-joined', 'logout'],
  setup(props, { emit }) {
    const roomIdToJoin = ref('');
    
    // 创建新房间
    const createRoom = () => {
      socketService
        .on('roomCreated', (data) => {
          console.log('Room created:', data);
          emit('room-joined', data.room_id);
        })
        .on('error', (error) => {
          console.error('Error creating room:', error);
          alert('创建房间失败，请重试');
        });
      
      socketService.createRoom();
    };
    
    // 加入已有房间
    const joinRoom = () => {
      if (!roomIdToJoin.value.trim()) {
        alert('请输入房间ID');
        return;
      }
      
      socketService
        .on('chatHistory', () => {
          console.log('Joined room:', roomIdToJoin.value);
          emit('room-joined', roomIdToJoin.value);
        })
        .on('error', (error) => {
          console.error('Error joining room:', error);
          alert('加入房间失败，请检查房间ID是否正确');
        });
      
      socketService.joinRoom(roomIdToJoin.value);
    };
    
    // 退出登录
    const logout = () => {
      socketService.disconnect();
      emit('logout');
    };
    
    return {
      roomIdToJoin,
      createRoom,
      joinRoom,
      logout
    };
  }
};
</script>

<style scoped>
.room-selection {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.user-info {
  text-align: center;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background-color: #e9ecef;
  border-radius: 4px;
}

.room-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.option-card {
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.option-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #444;
}

.option-card p {
  margin-bottom: 1.5rem;
  color: #666;
  flex-grow: 1;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-create, .btn-join {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-create {
  background-color: #4CAF50;
  color: white;
  width: 100%;
}

.btn-create:hover {
  background-color: #3e8e41;
}

.btn-join {
  background-color: #2196F3;
  color: white;
}

.btn-join:hover {
  background-color: #0b7dda;
}

.btn-join:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-logout {
  padding: 0.75rem 2rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: #d32f2f;
}

@media (max-width: 768px) {
  .room-options {
    grid-template-columns: 1fr;
  }
}
</style>