import { Request, Response, NextFunction } from 'express';
import { JWTUtils, IJWTPayload } from '../utils/jwt';
import { User, UserRole, UserStatus } from '../models/User';
import { Types } from 'mongoose';

// 扩展Request接口，添加用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        role: UserRole;
        _id: Types.ObjectId;
      };
    }
  }
}

/**
 * 认证中间件 - 验证JWT令牌
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌',
        code: 'NO_TOKEN'
      });
    }

    // 验证令牌
    let payload: IJWTPayload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : '令牌验证失败',
        code: 'INVALID_TOKEN'
      });
    }

    // 查询用户信息
    const user = await User.findById(payload.userId).select('+status');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: '用户账户已被禁用',
        code: 'USER_DISABLED'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      _id: user._id
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * 可选认证中间件 - 如果有令牌则验证，没有则跳过
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return next(); // 没有令牌，直接跳过
    }

    // 有令牌则验证
    try {
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('+status');
      
      if (user && user.status === UserStatus.ACTIVE) {
        req.user = {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          _id: user._id
        };
      }
    } catch (error) {
      // 令牌无效，但不阻止请求继续
      console.warn('可选认证失败:', error);
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next(); // 出错也不阻止请求
  }
};

/**
 * 角色授权中间件工厂函数
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * 管理员权限中间件
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * 教师或管理员权限中间件
 */
export const requireTeacherOrAdmin = authorize(UserRole.TEACHER, UserRole.ADMIN);

/**
 * 检查资源所有权中间件工厂函数
 */
export const checkOwnership = (resourceIdParam: string = 'id', userIdField: string = 'user') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: '缺少资源ID',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // 这里需要根据具体的资源类型来查询
      // 暂时跳过具体实现，在具体的控制器中处理
      next();
    } catch (error) {
      console.error('所有权检查中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * 速率限制中间件（基于用户）
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    
    const userRequests = requests.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      // 重置计数器
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
};

/**
 * 验证用户是否为资源创建者或管理员
 */
export const requireOwnerOrAdmin = (getResourceUserId: (req: Request) => Promise<string | null>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // 检查是否为资源所有者
      const resourceUserId = await getResourceUserId(req);
      if (!resourceUserId) {
        return res.status(404).json({
          success: false,
          message: '资源不存在',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resourceUserId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: '只能访问自己的资源',
          code: 'ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('所有权验证错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireAdmin,
  requireTeacherOrAdmin,
  checkOwnership,
  userRateLimit,
  requireOwnerOrAdmin
};