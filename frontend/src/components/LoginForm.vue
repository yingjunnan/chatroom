<template>
  <div class="login-container">
    <h2>欢迎来到在线聊天室</h2>
    <div class="form-group">
      <label for="username">用户名</label>
      <div class="input-group">
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          placeholder="输入用户名或使用随机生成"
        />
        <button @click="generateRandomUsername" class="btn-generate">随机生成</button>
      </div>
    </div>
    <div class="actions">
      <button @click="login" class="btn-primary">进入聊天室</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import socketService from '../services/socketService';

export default {
  name: 'LoginForm',
  emits: ['login-success'],
  setup(props, { emit }) {
    const username = ref('');

    // 生成随机用户名
    const generateRandomUsername = async () => {
      try {
        // 从后端获取随机用户名
        const response = await fetch('http://localhost:8000/random-username');
        if (response.ok) {
          const data = await response.json();
          username.value = data.username;
        } else {
          console.error('获取随机用户名失败');
          // 如果后端请求失败，使用前端生成的随机名称作为备选
          const randomId = Math.random().toString(36).substring(2, 8);
          username.value = `用户${randomId}`;
        }
      } catch (error) {
        console.error('获取随机用户名出错:', error);
        // 如果出错，使用前端生成的随机名称作为备选
        const randomId = Math.random().toString(36).substring(2, 8);
        username.value = `用户${randomId}`;
      }
    };

    // 如果用户名为空，自动生成一个
    const ensureUsername = async () => {
      if (!username.value.trim()) {
        await generateRandomUsername();
      }
      return username.value;
    };

    // 登录处理
    const login = async () => {
      // 确保有用户名
      const finalUsername = await ensureUsername();
      
      // 初始化Socket连接
      socketService.init()
        .on('connect', () => {
          console.log('Connected to server, registering...');
          socketService.register(finalUsername);
        })
        .on('registered', (data) => {
          console.log('Registered successfully:', data);
          emit('login-success', data.username);
        })
        .on('error', (error) => {
          console.error('Login error:', error);
          alert('登录失败，请重试');
        });
    };

    return {
      username,
      generateRandomUsername,
      login
    };
  }
};
</script>

<style scoped>
.login-container {
  max-width: 600px;
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

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-generate {
  padding: 0.75rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-generate:hover {
  background-color: #5a6268;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #3e8e41;
}
</style>