import { Router } from 'express';
import authRoutes from './auth';
import problemRoutes from './problem';
import submissionRoutes from './submission';

const router = Router();

// API版本前缀
const API_VERSION = '/api/v1';

// 认证相关路由
router.use(`${API_VERSION}/auth`, authRoutes);

// 题目相关路由
router.use(`${API_VERSION}/problems`, problemRoutes);

// 提交相关路由
router.use(`${API_VERSION}/submissions`, submissionRoutes);

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SSL-OJ API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API信息路由
router.get(`${API_VERSION}/info`, (req, res) => {
  res.json({
    success: true,
    message: 'SSL-OJ API信息',
    data: {
      name: 'SSL-OJ API',
      version: '1.0.0',
      description: '东莞中学松山湖学校（集团）东莞市第十三高级中学在线判题系统',
      author: 'SSL-OJ Team',
      endpoints: {
        auth: `${API_VERSION}/auth`,
        problems: `${API_VERSION}/problems`,
        submissions: `${API_VERSION}/submissions`,
        contests: `${API_VERSION}/contests`,
        admin: `${API_VERSION}/admin`
      },
      features: [
        '用户认证与授权',
        '题目管理',
        '代码提交与判题',
        '比赛系统',
        '管理员后台',
        '实时排行榜'
      ]
    }
  });
});

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的API端点不存在',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;