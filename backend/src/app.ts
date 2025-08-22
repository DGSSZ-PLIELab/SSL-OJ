import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { config } from './config'
import { connectDatabase } from './database'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import problemRoutes from './routes/problemsMySQL'
import submissionRoutes from './routes/submissionsMySQL'
import adminRoutes from './routes/adminMySQL'

const app = express()

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}))

// 压缩响应
app.use(compression())

// 请求日志
app.use(morgan('combined'))

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
})
app.use('/api', limiter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/admin', adminRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase()
    console.log('✅ Database connected successfully')
    
    // 启动服务器
    const port = config.port
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
      console.log(`📝 Environment: ${config.env}`)
      console.log(`🌐 API URL: http://localhost:${port}/api`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

if (require.main === module) {
  startServer()
}

export { app }