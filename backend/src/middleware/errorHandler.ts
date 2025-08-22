import { Request, Response, NextFunction } from 'express'

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = { ...error }
  err.message = error.message

  // 记录错误日志
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Sequelize 验证错误
  if (error.name === 'SequelizeValidationError') {
    const message = (error as any).errors
      .map((err: any) => err.message)
      .join(', ')
    err = new AppError(message, 400)
  }

  // Sequelize 唯一约束错误
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = (error as any).errors[0]?.path || 'field'
    const message = `${field} 已存在`
    err = new AppError(message, 400)
  }

  // Mongoose 无效ObjectId错误
  if (error.name === 'CastError') {
    const message = '无效的资源ID'
    err = new AppError(message, 400)
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    const message = '无效的token'
    err = new AppError(message, 401)
  }

  // JWT过期错误
  if (error.name === 'TokenExpiredError') {
    const message = 'Token已过期'
    err = new AppError(message, 401)
  }

  // 发送错误响应
  const statusCode = (err as AppError).statusCode || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  })
}

// 异步错误捕获包装器
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// 404错误处理
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`路径 ${req.originalUrl} 未找到`, 404)
  next(error)
}