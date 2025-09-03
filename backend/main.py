from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn
import uuid
from typing import Dict, List, Optional

# 创建FastAPI应用
app = FastAPI(title="聊天室后端服务")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API路由：获取随机用户名
@app.get("/random-username")
async def get_random_username():
    return {"username": generate_username()}

# 创建SocketIO服务器
sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins=["http://localhost:5173", "*"],
    logger=True,
    engineio_logger=True
)
socket_app = socketio.ASGIApp(sio, app)

# 存储用户和房间信息
users = {}
rooms = {}

# 生成随机用户名
def generate_username() -> str:
    # 从诗经和其他中国古典名著中选取的人名
    classic_names = [
        "子衿", "伯兮", "卫庄", "子车", "子仲", "子鱼", "子文", "子游", "子羽", "子产",
        "子路", "子贡", "子夏", "子张", "子禽", "子西", "子期", "子舆", "子桑", "子牵",
        "孔丘", "颜回", "曾参", "冉求", "宓不齐", "原宪", "仲由", "卜商", "澹台灭明", "宰予",
        "端木赐", "言偃", "卞庄子", "荀况", "孟轲", "庄周", "惠施", "韩非", "李斯", "吕不韦",
        "屈原", "宋玉", "贾谊", "司马迁", "扁鹊", "华佗", "张仲景", "孙思邈", "李时珍", "关羽",
        "张飞", "赵云", "马超", "黄忠", "魏延", "姜维", "庞统", "诸葛亮", "司马懿", "曹操",
        "孙权", "刘备", "周瑜", "鲁肃", "陆逊", "吕蒙", "甘宁", "太史慈", "黄盖", "韩当",
        "林冲", "鲁智深", "武松", "李逵", "宋江", "卢俊义", "吴用", "公孙胜", "燕青", "石秀",
        "贾宝玉", "林黛玉", "薛宝钗", "王熙凤", "史湘云", "妙玉", "贾元春", "贾探春", "贾惜春", "贾迎春",
        "秦少游", "李清照", "辛弃疾", "苏轼", "柳永", "欧阳修", "范仲淹", "岳飞", "文天祥", "陆游"
    ]
    import random
    return random.choice(classic_names)

# 创建房间
def create_room() -> str:
    room_id = uuid.uuid4().hex[:8]
    rooms[room_id] = {"users": [], "messages": []}
    return room_id

# SocketIO连接事件
@sio.event
async def connect(sid, environ):
    print(f"客户端连接: {sid}")

# 用户注册事件
@sio.event
async def register(sid, data):
    username = data.get("username", generate_username())
    users[sid] = {"username": username, "room": None}
    await sio.emit("register_response", {"success": True, "username": username}, to=sid)

# 创建房间事件
@sio.event
async def create_room_event(sid, data):
    if sid not in users:
        await sio.emit("error", {"message": "用户未注册"}, to=sid)
        return
    
    room_id = create_room()
    users[sid]["room"] = room_id
    rooms[room_id]["users"].append(sid)
    
    await sio.enter_room(sid, room_id)
    await sio.emit("room_created", {"room_id": room_id}, to=sid)

# 加入房间事件
@sio.event
async def join_room_event(sid, data):
    if sid not in users:
        await sio.emit("error", {"message": "用户未注册"}, to=sid)
        return
    
    room_id = data.get("room_id")
    if not room_id or room_id not in rooms:
        await sio.emit("error", {"message": "房间不存在"}, to=sid)
        return
    
    # 检查用户是否已经在房间中
    current_room = users[sid].get("room")
    if current_room == room_id and sid in rooms[room_id]["users"]:
        # 用户已经在该房间中，只发送历史消息和用户列表
        await sio.emit("chat_history", {"messages": rooms[room_id]["messages"], "room_id": room_id}, to=sid)
        room_users = [users[user_sid]["username"] for user_sid in rooms[room_id]["users"]]
        await sio.emit("room_users", {"users": room_users}, to=sid)
        return
    
    # 如果用户在其他房间，先离开那个房间
    if current_room and current_room in rooms and sid in rooms[current_room]["users"]:
        rooms[current_room]["users"].remove(sid)
        await sio.leave_room(sid, current_room)
    
    users[sid]["room"] = room_id
    
    # 确保用户不会被重复添加到房间
    if sid not in rooms[room_id]["users"]:
        rooms[room_id]["users"].append(sid)
    
    await sio.enter_room(sid, room_id)
    
    # 发送历史消息
    await sio.emit("chat_history", {"messages": rooms[room_id]["messages"], "room_id": room_id}, to=sid)
    
    # 通知房间其他人有新用户加入
    username = users[sid]["username"]
    join_message = {"type": "system", "content": f"{username} 加入了房间"}
    rooms[room_id]["messages"].append(join_message)
    
    # 发送房间用户列表
    room_users = [users[user_sid]["username"] for user_sid in rooms[room_id]["users"]]
    await sio.emit("room_users", {"users": room_users}, room=room_id)
    
    await sio.emit("user_joined", {"username": username, "message": join_message}, room=room_id)

# 获取房间用户列表事件
@sio.event
async def get_room_users(sid):
    if sid not in users or not users[sid]["room"]:
        await sio.emit("error", {"message": "用户未在房间中"}, to=sid)
        return
    
    room_id = users[sid]["room"]
    if room_id not in rooms:
        await sio.emit("error", {"message": "房间不存在"}, to=sid)
        return
    
    room_users = [users[user_sid]["username"] for user_sid in rooms[room_id]["users"]]
    await sio.emit("room_users", {"users": room_users}, to=sid)

# 发送消息事件
@sio.event
async def send_message(sid, data):
    if sid not in users or not users[sid]["room"]:
        await sio.emit("error", {"message": "用户未在房间中"}, to=sid)
        return
    
    room_id = users[sid]["room"]
    username = users[sid]["username"]
    content = data.get("content", "")
    
    if not content.strip():
        return
    
    message = {
        "type": "user",
        "username": username,
        "content": content,
        "timestamp": str(uuid.uuid1())  # 使用时间戳作为消息ID
    }
    
    rooms[room_id]["messages"].append(message)
    await sio.emit("new_message", message, room=room_id)

# 断开连接事件
@sio.event
async def disconnect(sid):
    if sid in users:
        room_id = users[sid].get("room")
        username = users[sid].get("username")
        
        if room_id and room_id in rooms:
            # 从房间中移除用户
            if sid in rooms[room_id]["users"]:
                rooms[room_id]["users"].remove(sid)
            
            # 如果房间没有用户了，删除房间
            if not rooms[room_id]["users"]:
                del rooms[room_id]
            else:
                # 通知房间其他人该用户离开
                leave_message = {"type": "system", "content": f"{username} 离开了房间"}
                rooms[room_id]["messages"].append(leave_message)
                
                # 更新房间用户列表
                room_users = [users[user_sid]["username"] for user_sid in rooms[room_id]["users"]]
                await sio.emit("room_users", {"users": room_users}, room=room_id)
                
                await sio.emit("user_left", {"username": username, "message": leave_message}, room=room_id)
        
        # 删除用户信息
        del users[sid]
    
    print(f"客户端断开连接: {sid}")

# 健康检查API
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# 获取所有房间API
@app.get("/rooms")
async def get_rooms():
    return {"rooms": list(rooms.keys())}

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)