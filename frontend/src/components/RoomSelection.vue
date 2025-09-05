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
        <div class="input-group">
          <input 
            type="password" 
            v-model="newRoomPassword" 
            placeholder="设置房间密码（可选）"
          />
          <button @click="createRoom" class="btn-create">创建房间</button>
        </div>
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
          <input 
            type="password" 
            v-model="joinRoomPassword" 
            placeholder="房间密码（如需要）"
          />
          <button @click="joinRoom" class="btn-join" :disabled="!roomIdToJoin.trim()">加入房间</button>
        </div>
      </div>
    </div>
    
    <!-- 房间列表 -->
    <div class="room-list-section" v-if="roomList.length > 0">
      <h3>现有房间列表</h3>
      <div class="room-list">
        <div 
          v-for="room in roomList" 
          :key="room.room_id" 
          class="room-item"
        >
          <div class="room-info">
            <span class="room-id">{{ room.room_id }}</span>
            <span class="room-users">{{ room.user_count }} 人</span>
            <span v-if="room.has_password" class="room-password">🔒</span>
          </div>
          <div class="room-actions">
            <input 
              v-if="room.has_password" 
              type="password" 
              v-model="roomPasswords[room.room_id]" 
              placeholder="密码"
              class="room-password-input"
            />
            <button 
              @click="joinRoomFromList(room.room_id, room.has_password)" 
              class="btn-join-small"
            >
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button @click="refreshRoomList" class="btn-refresh">刷新房间列表</button>
      <ThemeSelector />
      <button @click="logout" class="btn-logout">退出登录</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import socketService from '../services/socketService';
import ThemeSelector from './ThemeSelector.vue';

export default {
  name: 'RoomSelection',
  components: {
    ThemeSelector
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  emits: ['room-joined', 'logout'],
  setup(props, { emit }) {
    const roomIdToJoin = ref('');
    const newRoomPassword = ref('');
    const joinRoomPassword = ref('');
    const roomList = ref([]);
    const roomPasswords = ref({});
    
    // 获取房间列表
    const refreshRoomList = async () => {
      try {
        const rooms = await socketService.getRoomList();
        roomList.value = rooms;
      } catch (error) {
        console.error('Failed to get room list:', error);
      }
    };
    
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
      
      const password = newRoomPassword.value.trim() || null;
      socketService.createRoom(password);
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
          alert('加入房间失败，请检查房间ID和密码是否正确');
        });
      
      const password = joinRoomPassword.value.trim() || null;
      socketService.joinRoom(roomIdToJoin.value, password);
    };
    
    // 从房间列表加入房间
    const joinRoomFromList = (roomId, hasPassword) => {
      const password = hasPassword ? roomPasswords.value[roomId] : null;
      
      if (hasPassword && !password) {
        alert('请输入房间密码');
        return;
      }
      
      socketService
        .on('chatHistory', () => {
          console.log('Joined room from list:', roomId);
          emit('room-joined', roomId);
        })
        .on('error', (error) => {
          console.error('Error joining room from list:', error);
          alert('加入房间失败，请检查密码是否正确');
        });
      
      socketService.joinRoom(roomId, password);
    };
    
    // 退出登录
    const logout = () => {
      socketService.disconnect();
      emit('logout');
    };
    
    // 组件挂载时获取房间列表
    onMounted(() => {
      refreshRoomList();
    });
    
    return {
      roomIdToJoin,
      newRoomPassword,
      joinRoomPassword,
      roomList,
      roomPasswords,
      createRoom,
      joinRoom,
      joinRoomFromList,
      refreshRoomList,
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
  background-color: var(--theme-cardBackground);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--theme-textPrimary);
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
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--theme-cardBackground);
  color: var(--theme-textPrimary);
  transition: border-color 0.2s ease, background-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: var(--theme-primary);
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
  background-color: var(--theme-secondary);
  color: white;
}

.btn-create:hover {
  background-color: var(--theme-secondaryHover);
}

.btn-join {
  background-color: var(--theme-primary);
  color: white;
}

.btn-join:hover {
  background-color: var(--theme-primaryHover);
}

.btn-join:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-join-small {
  padding: 0.5rem 1rem;
  background-color: var(--theme-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-join-small:hover {
  background-color: var(--theme-primaryHover);
}

.room-list-section {
  margin-top: 2rem;
}

.room-list-section h3 {
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.room-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.room-item:hover {
  background-color: #f8f9fa;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.room-id {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.room-users {
  font-size: 0.9rem;
  color: #666;
  background-color: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.room-password {
  font-size: 1.2rem;
  color: #ffc107;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-password-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 120px;
}

.btn-refresh {
  background-color: #28a745;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 1rem;
}

.btn-refresh:hover {
  background-color: #218838;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
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
  
  .room-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .room-info {
    justify-content: center;
  }
  
  .room-actions {
    justify-content: center;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>