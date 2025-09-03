# 在线聊天室应用

一个基于Vue.js和FastAPI的实时在线聊天室应用，支持用户创建和加入聊天室，实时消息发送和接收。

## 功能特点

- 用户名自动生成或手动输入
- 创建新聊天室或加入已有聊天室
- 实时消息发送和接收
- 系统消息提示（用户加入/离开）
- 退出登录时自动清空消息

## 技术栈

### 前端
- Vue.js 3
- Socket.io-client（WebSocket客户端）
- Vite（构建工具）

### 后端
- FastAPI（Python Web框架）
- Python-SocketIO（WebSocket服务器）
- Uvicorn（ASGI服务器）

## 项目结构

```
chatroom/
├── frontend/             # 前端Vue项目
│   ├── src/
│   │   ├── assets/       # 静态资源
│   │   ├── components/   # Vue组件
│   │   │   ├── LoginForm.vue      # 登录表单组件
│   │   │   ├── RoomSelection.vue  # 房间选择组件
│   │   │   └── ChatRoom.vue       # 聊天室组件
│   │   ├── services/     # 服务
│   │   │   └── socketService.js   # Socket.io客户端服务
│   │   ├── App.vue       # 主应用组件
│   │   └── main.js       # 入口文件
│   └── package.json      # 前端依赖
└── backend/              # 后端FastAPI项目
    ├── main.py           # 主应用文件
    └── requirements.txt  # 后端依赖
```

## 安装和运行

### 前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端

```bash
# 进入后端目录
cd backend

# 激活虚拟环境（如果有）
# Windows
venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务器
python main.py
```

## 使用说明

1. 打开前端应用（默认为 http://localhost:5173）
2. 输入用户名或使用随机生成的用户名
3. 选择创建新房间或加入已有房间
4. 在聊天室中发送和接收消息
5. 点击"退出房间"返回房间选择页面
6. 点击"退出登录"返回登录页面并清空消息

## 开发说明

### WebSocket事件

- `connect`: 连接到服务器
- `register`: 注册用户名
- `create_room_event`: 创建新房间
- `join_room_event`: 加入已有房间
- `send_message`: 发送消息
- `new_message`: 接收新消息
- `user_joined`: 用户加入房间
- `user_left`: 用户离开房间
- `disconnect`: 断开连接

## 注意事项

- 后端服务默认运行在 http://localhost:8000
- 前端默认连接到后端的WebSocket服务
- 如需修改连接地址，请在 `socketService.js` 中更新 `serverUrl` 参数