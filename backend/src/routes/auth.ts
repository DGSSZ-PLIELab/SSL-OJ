import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, userRateLimit } from '../middleware/auth';

const router = Router();

// 注册路由 - 限制频率（每小时最多5次注册尝试）
router.post('/register', 
  userRateLimit(5, 60 * 60 * 1000), // 每小时5次
  AuthController.register
);

// 登录路由 - 限制频率（每15分钟最多10次登录尝试）
router.post('/login', 
  userRateLimit(10, 15 * 60 * 1000), // 每15分钟10次
  AuthController.login
);

// 刷新令牌路由 - 限制频率（每分钟最多5次）
router.post('/refresh', 
  userRateLimit(5, 60 * 1000), // 每分钟5次
  AuthController.refreshToken
);

// 注销路由
router.post('/logout', AuthController.logout);

// 验证令牌路由
router.post('/verify', AuthController.verifyToken);

// 以下路由需要认证

// 获取当前用户信息
router.get('/profile', authenticate, AuthController.getProfile);

// 更新用户信息 - 限制频率（每分钟最多3次）
router.put('/profile', 
  authenticate, 
  userRateLimit(3, 60 * 1000), // 每分钟3次
  AuthController.updateProfile
);

// 修改密码 - 限制频率（每小时最多3次）
router.put('/password', 
  authenticate, 
  userRateLimit(3, 60 * 60 * 1000), // 每小时3次
  AuthController.changePassword
);

// 获取用户统计信息
router.get('/stats', authenticate, AuthController.getUserStats);

export default router;