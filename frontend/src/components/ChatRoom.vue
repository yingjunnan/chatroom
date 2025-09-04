<template>
  <div class="chat-room">
    <div class="chat-header">
      <h2>聊天室: {{ roomId }}</h2>
      <div class="user-info">
        <span style="text-align: left;">{{ username }}</span>
        <button @click="leaveRoom" class="btn-leave">退出房间</button>
      </div>
    </div>
    
    <div class="room-users">
      <h3>当前在线用户 ({{ roomUsers.length }})</h3>
      <ul class="user-list">
        <li v-for="(user, index) in roomUsers" :key="index" :class="{'current-user': user === username}">
          {{ user }} {{ user === username ? '(你)' : '' }}
        </li>
      </ul>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message', {
          'message-system': message.type === 'system',
          'message-self': message.type === 'user' && message.username === username,
          'message-other': message.type === 'user' && message.username !== username
        }]"
      >
        <div class="message-header" v-if="message.type === 'user'">
          <span class="message-username">{{ message.username }}</span>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input 
        type="text" 
        v-model="newMessage" 
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
      />
      <button @click="sendMessage" class="btn-send" :disabled="!newMessage.trim()">发送</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import socketService from '../services/socketService';

export default {
  name: 'ChatRoom',
  props: {
    username: {
      type: String,
      required: true
    },
    roomId: {
      type: String,
      required: true
    }
  },
  emits: ['leave-room'],
  setup(props, { emit }) {
    const messages = ref([]);
    const newMessage = ref('');
    const messagesContainer = ref(null);
    const roomUsers = ref([]);
    const messageSound = ref(null);
    
    // 初始化提示音
    onMounted(() => {
      messageSound.value = new Audio('/sounds/new-notification.mp3');
    });
    
    // 滚动到最新消息
    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // 监听消息变化，自动滚动
    watch(messages, () => {
      scrollToBottom();
    }, { deep: true });
    
    // 发送消息
    const sendMessage = () => {
      if (!newMessage.value.trim()) return;
      
      socketService.sendMessage(newMessage.value);
      newMessage.value = '';
    };
    
    // 离开房间
    const leaveRoom = () => {
      socketService.disconnect();
      emit('leave-room');
    };
    
    // 更新房间用户列表
    const updateRoomUsers = () => {
      socketService.getRoomUsers((users) => {
        roomUsers.value = users;
      });
    };
    
    // 组件挂载时设置Socket监听器
    onMounted(() => {
      // 初始化房间用户列表
      updateRoomUsers();
      
      // 监听聊天历史
      socketService.on('chatHistory', (chatMessages) => {
        messages.value = chatMessages || [];
        scrollToBottom();
        updateRoomUsers(); // 获取初始用户列表
      });
      
      // 监听新消息
      socketService.on('newMessage', (message) => {
        messages.value.push(message);
        // 如果不是自己发送的消息，播放提示音
        if (message.username !== props.username && messageSound.value) {
          messageSound.value.play().catch(err => console.error('播放提示音失败:', err));
        }
      });
      
      // 监听用户加入
      socketService.on('userJoined', (data) => {
        if (data.message) {
          messages.value.push(data.message);
        }
        // 更新用户列表
        updateRoomUsers();
      });
      
      // 监听用户离开
      socketService.on('userLeft', (data) => {
        if (data.message) {
          messages.value.push(data.message);
        }
        // 更新用户列表
        updateRoomUsers();
      });
      
      // 监听房间用户列表更新
      socketService.on('roomUsers', (users) => {
        roomUsers.value = users;
      });
    });
    
    // 组件卸载时清理
    onUnmounted(() => {
      // 清理不需要的事件监听器
    });
    
    return {
      messages,
      newMessage,
      messagesContainer,
      roomUsers,
      messageSound,
      sendMessage,
      leaveRoom
    };
  }
};
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 80vh;
  max-height: 90vh;
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #4CAF50;
  color: white;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-start;
}

.btn-leave {
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-leave:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  word-break: break-word;
}

.message-system {
  align-self: center;
  background-color: #e9ecef;
  color: #666;
  font-style: italic;
  padding: 0.5rem 1rem;
  border-radius: 16px;
  font-size: 0.9rem;
  max-width: 90%;
}

.message-self {
  align-self: flex-end;
  background-color: #4CAF50;
  color: white;
}

.message-other {
  align-self: flex-start;
  background-color: #e9ecef;
  color: #333;
}

.message-header {
  text-align: left;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  opacity: 0.8;
}

.chat-input {
  display: flex;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-right: 0.5rem;
}

.btn-send {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-send:hover {
  background-color: #3e8e41;
}

.btn-send:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.room-users {
  padding: 0.75rem 1rem;
  background-color: #f0f2f5;
  border-bottom: 1px solid #ddd;
}

.room-users h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: #555;
}

.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  background-color: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.9rem;
  color: #333;
}

.user-list li.current-user {
  background-color: #4CAF50;
  color: white;
}
</style>