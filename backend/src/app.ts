import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './models';
import routes from './routes';

// 创建Express应用
const app: Application = express();

// 信任代理（用于部署在反向代理后）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 允许的源
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // 在开发环境中允许所有源
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 生产环境中检查源
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不被CORS策略允许的源'));
    }
  },
  credentials: true, // 允许发送cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// 压缩响应
app.use(compression());

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 解析cookies
app.use(cookieParser());

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP每15分钟最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查请求的速率限制
    return req.path === '/health';
  }
});

app.use(globalLimiter);

// 请求ID中间件（用于日志追踪）
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// API路由
app.use('/', routes);

// 全局错误处理中间件
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${req.id}] 错误:`, error);
  
  // CORS错误
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: '跨域请求被拒绝',
      code: 'CORS_ERROR'
    });
  }
  
  // JSON解析错误
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误',
      code: 'INVALID_JSON'
    });
  }
  
  // 请求体过大错误
  if (error.message.includes('request entity too large')) {
    return res.status(413).json({
      success: false,
      message: '请求体过大',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404处理（应该在路由之后）
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// 启动服务器函数
export const startServer = async (port: number = 3001): Promise<void> => {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功');
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`🚀 SSL-OJ API服务器运行在端口 ${port}`);
      console.log(`📍 健康检查: http://localhost:${port}/health`);
      console.log(`📍 API信息: http://localhost:${port}/api/v1/info`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('\n🔄 收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🔄 收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

export default app;