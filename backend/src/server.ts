import { app } from './app'
import { config } from './config'
import { connectDatabase } from './database'
import { createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { judgeQueue } from './utils/judgeQueue'
import { authenticateSocket } from './middleware/auth'

// 创建HTTP服务器
const server = createServer(app)

// 创建Socket.IO服务器（用于实时功能）
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      config.frontend.url,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Socket.IO连接处理
const connectedUsers = new Map<string, string>() // socketId -> userId
const userSockets = new Map<string, Set<string>>() // userId -> Set<socketId>
const roomUsers = new Map<string, Set<string>>() // roomId -> Set<userId>

io.use(authenticateSocket)

io.on('connection', (socket: Socket) => {
  const userId = socket.data.userId
  const username = socket.data.username
  
  console.log(`用户连接: ${username} (${userId})`, socket.id)
  
  // 记录用户连接
  connectedUsers.set(socket.id, userId)
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set())
  }
  userSockets.get(userId)!.add(socket.id)
  
  // 发送连接成功消息
  socket.emit('connected', {
    message: '连接成功',
    userId,
    username,
    timestamp: new Date().toISOString()
  })
  
  // 加入用户个人房间
  socket.join(`user:${userId}`)
  
  // 处理加入房间
  socket.on('join:room', (data: { roomId: string }) => {
    const { roomId } = data
    
    socket.join(roomId)
    
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set())
    }
    roomUsers.get(roomId)!.add(userId)
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user:joined', {
      userId,
      username,
      timestamp: new Date().toISOString()
    })
    
    console.log(`用户 ${username} 加入房间: ${roomId}`)
  })
  
  // 处理离开房间
  socket.on('leave:room', (data: { roomId: string }) => {
    const { roomId } = data
    
    socket.leave(roomId)
    
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(userId)
      if (roomUsers.get(roomId)!.size === 0) {
        roomUsers.delete(roomId)
      }
    }
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user:left', {
      userId,
      username,
      timestamp: new Date().toISOString()
    })
    
    console.log(`用户 ${username} 离开房间: ${roomId}`)
  })
  
  // 处理提交状态订阅
  socket.on('submission:subscribe', (data: { submissionId: string }) => {
    const roomId = `submission:${data.submissionId}`
    socket.join(roomId)
    console.log(`用户 ${username} 订阅提交: ${data.submissionId}`)
  })
  
  socket.on('submission:unsubscribe', (data: { submissionId: string }) => {
    const roomId = `submission:${data.submissionId}`
    socket.leave(roomId)
    console.log(`用户 ${username} 取消订阅提交: ${data.submissionId}`)
  })
  
  // 处理比赛实时更新
  socket.on('contest:subscribe', (data: { contestId: string }) => {
    const roomId = `contest:${data.contestId}`
    socket.join(roomId)
    console.log(`用户 ${username} 订阅比赛: ${data.contestId}`)
  })
  
  socket.on('contest:unsubscribe', (data: { contestId: string }) => {
    const roomId = `contest:${data.contestId}`
    socket.leave(roomId)
    console.log(`用户 ${username} 取消订阅比赛: ${data.contestId}`)
  })
  
  // 处理管理员广播
  socket.on('admin:broadcast', (data: { message: string, type: string }) => {
    if (socket.data.role === 'Admin') {
      io.emit('system:announcement', {
        message: data.message,
        type: data.type,
        timestamp: new Date().toISOString(),
        from: username
      })
      console.log(`管理员 ${username} 发送广播: ${data.message}`)
    }
  })
  
  // 处理心跳
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })
  
  // 处理断开连接
  socket.on('disconnect', (reason: string) => {
    console.log(`用户断开连接: ${username} (${userId})`, reason)
    
    // 清理连接记录
    connectedUsers.delete(socket.id)
    if (userSockets.has(userId)) {
      userSockets.get(userId)!.delete(socket.id)
      if (userSockets.get(userId)!.size === 0) {
        userSockets.delete(userId)
      }
    }
    
    // 清理房间记录
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId)
        socket.to(roomId).emit('user:left', {
          userId,
          username,
          timestamp: new Date().toISOString()
        })
        
        if (users.size === 0) {
          roomUsers.delete(roomId)
        }
      }
    }
  })
  
  // 错误处理
  socket.on('error', (error: Error) => {
    console.error(`Socket错误 ${socket.id}:`, error)
  })
})

// 将Socket.IO实例添加到app中，供其他模块使用
app.set('io', io)

// 启动服务器
const PORT = config.port || 5000

const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase()
    console.log('✅ 数据库连接成功')
    
    server.listen(PORT, () => {
  console.log(`\n🚀 SSL Online Judge 后端服务器启动成功!`)
  console.log(`📍 服务器地址: http://localhost:${PORT}`)
  console.log(`🌍 环境: ${config.env}`)
  console.log(`📊 数据库: ${config.database.path}`)
  console.log(`🔗 前端地址: ${config.frontend.url}`)
  console.log(`📡 Socket.IO: 已启用`)
  console.log(`⚖️ 判题队列: 已启动`)
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log(`\n📋 可用的API端点:`)
  console.log(`   - GET  /health                    健康检查`)
  console.log(`   - GET  /api                       API信息`)
  console.log(`   - POST /api/auth/register         用户注册`)
  console.log(`   - POST /api/auth/login            用户登录`)
  console.log(`   - GET  /api/problems              题目列表`)
  console.log(`   - GET  /api/submissions           提交列表`)
  console.log(`   - GET  /api/contests              比赛列表`)
  console.log(`   - GET  /api/users                 用户列表`)
  console.log(`   - GET  /api/admin/dashboard       管理员仪表板`)
  
  if (config.env === 'development') {
    console.log(`\n🔧 开发模式功能:`)
    console.log(`   - GET  /api/docs                  API文档`)
    console.log(`   - 详细错误信息`)
    console.log(`   - 热重载支持`)
  }
  
  console.log(`\n✅ 服务器就绪，等待连接...\n`)
  
  // 监听判题队列事件
  judgeQueue.on('taskStarted', (task) => {
    emitToUser(task.userId, 'submission:judging', {
      submissionId: task.submissionId,
      message: '开始判题'
    })
  })
  
  judgeQueue.on('taskCompleted', (task) => {
    console.log(`判题任务完成: ${task.submissionId}`)
  })
  
  judgeQueue.on('taskCancelled', (task) => {
    emitToUser(task.userId, 'submission:cancelled', {
      submissionId: task.submissionId,
      message: '判题已取消'
    })
  })
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()

// 导出Socket.IO实例供其他模块使用
export { io }
export default server

// 导出实时通信函数
export const emitToUser = (userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data)
}

export const emitToRoom = (roomId: string, event: string, data: any) => {
  io.to(roomId).emit(event, data)
}

export const emitToAll = (event: string, data: any) => {
  io.emit(event, data)
}

export const getConnectedUsers = () => {
  return {
    total: connectedUsers.size,
    users: Array.from(userSockets.keys()),
    rooms: Object.fromEntries(roomUsers)
  }
}

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId)
}

export const getUserSocketCount = (userId: string): number => {
  return userSockets.get(userId)?.size || 0
}

// 实用函数：更新提交状态
export const updateSubmissionStatus = (submissionId: string, status: any) => {
  io.to(`submission:${submissionId}`).emit('submission:status', {
    submissionId,
    status,
    timestamp: new Date().toISOString()
  })
}

// 实用函数：更新比赛排行榜
export const updateContestRanking = (contestId: string, ranking: any) => {
  io.to(`contest:${contestId}`).emit('ranking:update', {
    contestId,
    ranking,
    timestamp: new Date().toISOString()
  })
}

// 实用函数：发送系统公告
export const broadcastAnnouncement = (announcement: any) => {
  io.emit('system:announcement', {
    ...announcement,
    timestamp: new Date().toISOString()
  })
}

// 实用函数：发送比赛通知
export const broadcastContestNotification = (contestId: string, notification: any) => {
  io.to(`contest:${contestId}`).emit('contest:notification', {
    contestId,
    ...notification,
    timestamp: new Date().toISOString()
  })
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...')
  
  judgeQueue.stop()
  
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...')
  
  judgeQueue.stop()
  
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})