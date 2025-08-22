import { Router } from 'express';
import { ProblemController } from '../controllers/problemController';
import { authenticate, optionalAuthenticate, requireTeacherOrAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// 题目操作限流
const problemCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次创建
  message: {
    success: false,
    message: '题目创建过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const problemQueryLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100次查询
  message: {
    success: false,
    message: '查询过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 公开路由（不需要认证）
/**
 * @route GET /api/v1/problems
 * @desc 获取题目列表
 * @access Public
 */
router.get('/', problemQueryLimit, optionalAuthenticate, ProblemController.getProblems);

/**
 * @route GET /api/v1/problems/stats
 * @desc 获取题目统计信息
 * @access Public
 */
router.get('/stats', problemQueryLimit, ProblemController.getProblemStats);

/**
 * @route GET /api/v1/problems/tags
 * @desc 获取题目标签列表
 * @access Public
 */
router.get('/tags', problemQueryLimit, ProblemController.getProblemTags);

/**
 * @route GET /api/v1/problems/:id
 * @desc 获取题目详情
 * @access Public
 */
router.get('/:id', problemQueryLimit, optionalAuthenticate, ProblemController.getProblemById);

// 需要认证的路由
/**
 * @route POST /api/v1/problems
 * @desc 创建新题目
 * @access Private (Teacher/Admin)
 */
router.post('/', problemCreateLimit, authenticate, requireTeacherOrAdmin, ProblemController.createProblem);

/**
 * @route PUT /api/v1/problems/:id
 * @desc 更新题目
 * @access Private (Teacher/Admin)
 */
router.put('/:id', authenticate, requireTeacherOrAdmin, ProblemController.updateProblem);

/**
 * @route DELETE /api/v1/problems/:id
 * @desc 删除题目
 * @access Private (Admin)
 */
router.delete('/:id', authenticate, requireTeacherOrAdmin, ProblemController.deleteProblem);

export default router;