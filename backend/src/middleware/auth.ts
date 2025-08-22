import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { User, UserRole } from '../models/UserSQLite'
import { AppError } from './errorHandler'
import { config } from '../config'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        role: UserRole
      }
    }
  }
}

// JWT载荷接口
interface JWTPayload {
  id: number
  username: string
  role: UserRole
  iat: number
  exp: number
}

// 认证中间件
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('访问被拒绝，请提供有效的token', 401))
    }
    
    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    
    if (!token) {
      return next(new AppError('访问被拒绝，请提供有效的token', 401))
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload
    
    // 检查用户是否存在且状态正常
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return next(new AppError('用户不存在', 401))
    }
    
    if (user.status !== 'active') {
      return next(new AppError('账户已被禁用', 401))
    }
    
    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('无效的token', 401))
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token已过期', 401))
    }
    
    next(error)
  }
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // 没有token，继续执行
    }
    
    const token = authHeader.substring(7)
    
    if (!token) {
      return next() // 没有token，继续执行
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload
    
    // 检查用户是否存在且状态正常
    const user = await User.findById(decoded.id)
    
    if (user && user.status === 'active') {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    }
    
    next()
  } catch (error) {
    // 忽略token错误，继续执行
    next()
  }
}

// 角色权限检查中间件
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('访问被拒绝，请先登录', 401))
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403))
    }
    
    next()
  }
}

// 管理员权限检查
export const adminOnly = authorize(UserRole.ADMIN)

// 教师及以上权限检查
export const teacherOrAdmin = authorize(UserRole.TEACHER, UserRole.ADMIN)

// 检查是否为资源所有者或管理员
export const ownerOrAdmin = (getOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('访问被拒绝，请先登录', 401))
    }
    
    const ownerId = getOwnerId(req)
    
    // 管理员或资源所有者可以访问
    if (req.user.role === UserRole.ADMIN || req.user.id.toString() === ownerId) {
      return next()
    }
    
    return next(new AppError('权限不足', 403))
  }
}

// 检查是否为自己或管理员（用于用户资料访问）
export const selfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('访问被拒绝，请先登录', 401))
  }
  
  const targetUserId = req.params.userId || req.params.id
  
  // 管理员或访问自己的资料
  if (req.user.role === UserRole.ADMIN || req.user.id.toString() === targetUserId) {
    return next()
  }
  
  return next(new AppError('权限不足', 403))
}

// 速率限制中间件（基于用户）
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next() // 未登录用户不受此限制
    }
    
    const userId = req.user.id.toString()
    const now = Date.now()
    const userRequests = requests.get(userId)
    
    if (!userRequests || now > userRequests.resetTime) {
      // 重置或初始化计数
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }
    
    if (userRequests.count >= maxRequests) {
      return next(new AppError('请求过于频繁，请稍后再试', 429))
    }
    
    userRequests.count++
    next()
  }
}

// Socket.IO 认证中间件
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      return next(new Error('认证令牌缺失'))
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload
    
    // 获取用户信息
    const user = await User.findById(decoded.id)
    if (!user) {
      return next(new Error('用户不存在'))
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return next(new Error('账户已被禁用'))
    }

    // 将用户信息添加到socket数据
    socket.data.userId = user.id!.toString()
    socket.data.username = user.username
    socket.data.role = user.role
    socket.data.status = user.status

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('无效的认证令牌'))
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('认证令牌已过期'))
    }

    console.error('Socket认证错误:', error)
    return next(new Error('认证失败'))
  }
}

// Socket.IO 可选认证中间件
export const optionalSocketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      // 匿名用户
      socket.data.userId = null
      socket.data.username = 'Anonymous'
      socket.data.role = 'Guest'
      return next()
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload
    const user = await User.findById(decoded.id)
    
    if (user && user.status === 'active') {
      socket.data.userId = user.id!.toString()
      socket.data.username = user.username
      socket.data.role = user.role
      socket.data.status = user.status
    } else {
      // 无效用户，作为匿名用户处理
      socket.data.userId = null
      socket.data.username = 'Anonymous'
      socket.data.role = 'Guest'
    }

    next()
  } catch (error) {
    // 认证失败时作为匿名用户处理
    socket.data.userId = null
    socket.data.username = 'Anonymous'
    socket.data.role = 'Guest'
    next()
  }
}

// Socket.IO 角色权限检查
export const requireSocketRole = (...roles: UserRole[]) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.userId) {
      return next(new Error('需要登录'))
    }

    if (!roles.includes(socket.data.role)) {
      return next(new Error('权限不足'))
    }

    next()
  }
}

// 生成JWT令牌
export const generateToken = (user: { id: number; username: string; role: UserRole }): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  ) as string
}

// 生成刷新令牌
export const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn: '7d' } as jwt.SignOptions
  ) as string
}