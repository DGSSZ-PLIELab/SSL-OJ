import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';
import { authenticate, optionalAuthenticate, requireTeacherOrAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// 提交操作限流
const submissionCreateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 10, // 最多10次提交
  message: {
    success: false,
    message: '提交过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionQueryLimit = rateLimit({
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
 * @route GET /api/v1/submissions
 * @desc 获取提交列表
 * @access Public
 */
router.get('/', submissionQueryLimit, optionalAuthenticate, SubmissionController.getSubmissions);

/**
 * @route GET /api/v1/submissions/stats
 * @desc 获取提交统计信息
 * @access Public
 */
router.get('/stats', submissionQueryLimit, SubmissionController.getSubmissionStats);

/**
 * @route GET /api/v1/submissions/languages
 * @desc 获取支持的编程语言列表
 * @access Public
 */
router.get('/languages', submissionQueryLimit, SubmissionController.getSupportedLanguages);

/**
 * @route GET /api/v1/submissions/:id
 * @desc 获取提交详情
 * @access Public
 */
router.get('/:id', submissionQueryLimit, optionalAuthenticate, SubmissionController.getSubmissionById);

// 需要认证的路由
/**
 * @route POST /api/v1/submissions
 * @desc 创建新提交
 * @access Private
 */
router.post('/', submissionCreateLimit, authenticate, SubmissionController.createSubmission);

/**
 * @route GET /api/v1/submissions/user/me
 * @desc 获取当前用户的提交列表
 * @access Private
 */
router.get('/user/me', submissionQueryLimit, authenticate, SubmissionController.getUserSubmissions);

/**
 * @route GET /api/v1/submissions/user/me/stats
 * @desc 获取当前用户的提交统计
 * @access Private
 */
router.get('/user/me/stats', submissionQueryLimit, authenticate, SubmissionController.getUserSubmissionStats);

/**
 * @route POST /api/v1/submissions/:id/rejudge
 * @desc 重新判题
 * @access Private (Teacher/Admin)
 */
router.post('/:id/rejudge', authenticate, requireTeacherOrAdmin, SubmissionController.rejudgeSubmission);

export default router;