import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.username = null;
    this.roomId = null;
    this.callbacks = {};
  }

  // 初始化Socket连接
  init(serverUrl = 'http://localhost:8000') {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    return this;
  }

  // 设置Socket事件监听器
  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      this.triggerCallback('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
      this.triggerCallback('disconnect');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.triggerCallback('error', error);
    });

    // 注册响应
    this.socket.on('register_response', (data) => {
      if (data.success) {
        this.username = data.username;
        this.triggerCallback('registered', data);
      }
    });

    // 房间创建响应
    this.socket.on('room_created', (data) => {
      this.roomId = data.room_id;
      this.triggerCallback('roomCreated', data);
    });

    // 聊天历史
    this.socket.on('chat_history', (data) => {
      // 确保roomId已设置（如果是通过加入房间获取的聊天历史）
      if (data.room_id) {
        this.roomId = data.room_id;
      }
      this.triggerCallback('chatHistory', data.messages);
    });

    // 新消息
    this.socket.on('new_message', (message) => {
      this.triggerCallback('newMessage', message);
    });

    // 用户加入
    this.socket.on('user_joined', (data) => {
      this.triggerCallback('userJoined', data);
    });

    // 用户离开
    this.socket.on('user_left', (data) => {
      this.triggerCallback('userLeft', data);
    });
    
    // 房间用户列表更新
    this.socket.on('room_users', (data) => {
      this.triggerCallback('roomUsers', data.users || []);
    });
  }

  // 注册用户
  register(username = null) {
    if (!this.connected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('register', { username });
  }

  // 创建房间
  createRoom(password = null) {
    if (!this.connected || !this.username) {
      console.error('Not connected or not registered');
      return;
    }

    const data = {};
    if (password) {
      data.password = password;
    }
    this.socket.emit('create_room_event', data);
  }

  // 加入房间
  joinRoom(roomId, password = null) {
    if (!this.connected || !this.username) {
      console.error('Not connected or not registered');
      return;
    }
    
    // 设置当前房间ID
    this.roomId = roomId;
    
    const data = { room_id: roomId };
    if (password) {
      data.password = password;
    }
    this.socket.emit('join_room_event', data);
  }

  // 发送消息
  sendMessage(content) {
    if (!this.connected || !this.roomId) {
      console.error('Not connected or not in a room');
      return;
    }

    this.socket.emit('send_message', { content });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.username = null;
      this.roomId = null;
      this.callbacks = {}; // 清除所有回调
    }
  }

  // 清除用户数据
  clearUserData() {
    this.username = null;
    this.roomId = null;
    this.callbacks = {}; // 清除所有回调
  }

  // 注册回调函数
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
  }

  // 触发回调函数
  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // 检查是否已连接
  isConnected() {
    return this.connected;
  }

  // 获取当前用户名
  getUsername() {
    return this.username;
  }

  // 获取当前房间ID
  getRoomId() {
    return this.roomId;
  }
  
  // 获取房间用户列表
  getRoomUsers(callback) {
    if (!this.connected || !this.roomId) {
      console.error('Not connected or not in a room');
      return;
    }
    
    // 注册一次性监听器
    this.socket.once('room_users', (data) => {
      if (callback && typeof callback === 'function') {
        callback(data.users || []);
      }
    });
    
    // 发送获取用户列表请求
    this.socket.emit('get_room_users');
  }
  
  // 获取房间列表
  async getRoomList() {
    try {
      const response = await fetch('http://localhost:8000/rooms');
      const data = await response.json();
      return data.rooms || [];
    } catch (error) {
      console.error('Failed to fetch room list:', error);
      return [];
    }
  }
}

// 创建单例实例
const socketService = new SocketService();
export default socketService;