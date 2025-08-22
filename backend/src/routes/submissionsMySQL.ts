import { Router } from 'express'
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  rejudgeSubmission,
  getSubmissionCode,
  getUserSubmissions,
  getSubmissionStatistics
} from '../controllers/submissionsMySQL'
import { auth, optionalAuth, adminOnly, teacherOrAdmin } from '../middleware/auth'
import { validate, customValidators } from '../middleware/validate'
import { body, query, param } from 'express-validator'

const router = Router()

// 创建提交
router.post(
  '/',
  auth,
  [
    body('problemId')
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    body('language')
      .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
      .withMessage('编程语言不支持'),
    body('code')
      .isLength({ min: 1, max: 65536 })
      .withMessage('代码长度必须在1-65536字符之间'),
    body('contestId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('比赛ID必须是正整数'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('公开状态必须是布尔值')
  ],
  validate,
  createSubmission
)

// 获取提交列表
router.get(
  '/',
  optionalAuth,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('problemId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('用户ID必须是正整数'),
    query('contestId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('比赛ID必须是正整数'),
    query('status')
      .optional()
      .isIn(['pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error', 'system_error'])
      .withMessage('提交状态无效'),
    query('language')
      .optional()
      .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
      .withMessage('编程语言无效'),
    query('sortBy')
      .optional()
      .isIn(['submissionId', 'problemId', 'userId', 'status', 'language', 'submittedAt', 'judgedAt'])
      .withMessage('排序字段无效'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向必须是asc或desc'),
    query('startTime')
      .optional()
      .isISO8601()
      .withMessage('开始时间格式不正确'),
    query('endTime')
      .optional()
      .isISO8601()
      .withMessage('结束时间格式不正确')
  ],
  validate,
  getSubmissions
)

// 获取单个提交详情
router.get(
  '/:submissionId',
  optionalAuth,
  [
    param('submissionId')
      .isInt({ min: 1 })
      .withMessage('提交ID必须是正整数')
  ],
  validate,
  getSubmissionById
)

// 获取提交代码
router.get(
  '/:submissionId/code',
  auth,
  [
    param('submissionId')
      .isInt({ min: 1 })
      .withMessage('提交ID必须是正整数')
  ],
  validate,
  getSubmissionCode
)

// 重新判题（需要管理员或教师权限）
router.post(
  '/:submissionId/rejudge',
  teacherOrAdmin,
  [
    param('submissionId')
      .isInt({ min: 1 })
      .withMessage('提交ID必须是正整数')
  ],
  validate,
  rejudgeSubmission
)

// 获取用户提交记录
router.get(
  '/user/:userId',
  optionalAuth,
  [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('用户ID必须是正整数'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('problemId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    query('contestId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('比赛ID必须是正整数'),
    query('status')
      .optional()
      .isIn(['pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error', 'system_error'])
      .withMessage('提交状态无效'),
    query('language')
      .optional()
      .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
      .withMessage('编程语言无效'),
    query('sortBy')
      .optional()
      .isIn(['submissionId', 'problemId', 'status', 'language', 'submittedAt', 'judgedAt'])
      .withMessage('排序字段无效'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向必须是asc或desc'),
    query('startTime')
      .optional()
      .isISO8601()
      .withMessage('开始时间格式不正确'),
    query('endTime')
      .optional()
      .isISO8601()
      .withMessage('结束时间格式不正确')
  ],
  validate,
  getUserSubmissions
)

// 获取提交统计信息
router.get(
  '/statistics',
  optionalAuth,
  [
    query('timeRange')
      .optional()
      .isIn(['day', 'week', 'month', 'year', 'all'])
      .withMessage('时间范围无效'),
    query('problemId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    query('contestId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('比赛ID必须是正整数'),
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('用户ID必须是正整数'),
    query('startTime')
      .optional()
      .isISO8601()
      .withMessage('开始时间格式不正确'),
    query('endTime')
      .optional()
      .isISO8601()
      .withMessage('结束时间格式不正确')
  ],
  validate,
  getSubmissionStatistics
)

export default router