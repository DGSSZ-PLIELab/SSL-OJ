import { Router } from 'express'
import {
  getDashboardStats,
  getSystemInfo,
  getSystemSettings,
  updateSystemSettings,
  getProblemManagement,
  updateProblemStatus,
  deleteProblem,
  getSubmissionManagement,
  rejudgeSubmissions,
  getSystemStatistics,
  clearCache,
  backupDatabase,
  restoreDatabase
} from '../controllers/adminMySQL'
import { adminOnly, teacherOrAdmin } from '../middleware/auth'
import { validate, customValidators } from '../middleware/validate'
import { body, query, param } from 'express-validator'
import multer from 'multer'

const router = Router()

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

// 获取仪表板统计信息
router.get('/dashboard', adminOnly, getDashboardStats)

// 获取系统信息
router.get('/system/info', adminOnly, getSystemInfo)

// 获取系统设置
router.get('/system/settings', adminOnly, getSystemSettings)

// 更新系统设置
router.put(
  '/system/settings',
  adminOnly,
  [
    body('siteName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('站点名称长度必须在1-100字符之间'),
    body('siteDescription')
      .optional()
      .isLength({ max: 500 })
      .withMessage('站点描述不能超过500字符'),
    body('allowRegistration')
      .optional()
      .isBoolean()
      .withMessage('允许注册必须是布尔值'),
    body('defaultUserRole')
      .optional()
      .isIn(['student', 'teacher'])
      .withMessage('默认用户角色不正确'),
    body('maxSubmissionSize')
      .optional()
      .isInt({ min: 1024, max: 1048576 })
      .withMessage('最大提交大小必须在1KB-1MB之间'),
    body('judgeServerUrl')
      .optional()
      .isURL()
      .withMessage('判题服务器URL格式不正确'),
    body('emailSettings')
      .optional()
      .isObject()
      .withMessage('邮件设置必须是对象'),
    body('maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('维护模式必须是布尔值'),
    body('maintenanceMessage')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('维护消息不能超过1000字符')
  ],
  validate,
  updateSystemSettings
)

// 题目管理
router.get(
  '/problems',
  teacherOrAdmin,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('题目状态不正确'),
    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('题目难度不正确'),
    query('sortBy')
      .optional()
      .isIn(['problemId', 'title', 'difficulty', 'status', 'createdAt', 'updatedAt'])
      .withMessage('排序字段不正确'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向必须是asc或desc'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100字符之间')
  ],
  validate,
  getProblemManagement
)

// 更新题目状态
router.patch(
  '/problems/:problemId/status',
  adminOnly,
  [
    param('problemId')
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    body('status')
      .isIn(['draft', 'published', 'archived'])
      .withMessage('题目状态不正确')
  ],
  validate,
  updateProblemStatus
)

// 删除题目
router.delete(
  '/problems/:problemId',
  adminOnly,
  [
    param('problemId')
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数')
  ],
  validate,
  deleteProblem
)

// 提交管理
router.get(
  '/submissions',
  teacherOrAdmin,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('status')
      .optional()
      .isIn(['pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error', 'system_error'])
      .withMessage('提交状态不正确'),
    query('language')
      .optional()
      .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
      .withMessage('编程语言不正确'),
    query('problemId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('题目ID必须是正整数'),
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('用户ID必须是正整数'),
    query('sortBy')
      .optional()
      .isIn(['submissionId', 'problemId', 'userId', 'status', 'language', 'submittedAt', 'judgedAt'])
      .withMessage('排序字段不正确'),
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
  getSubmissionManagement
)

// 重新判题
router.post(
  '/submissions/rejudge',
  adminOnly,
  [
    body('submissionIds')
      .isArray({ min: 1 })
      .withMessage('提交ID列表不能为空'),
    body('submissionIds.*')
      .isInt({ min: 1 })
      .withMessage('提交ID必须是正整数')
  ],
  validate,
  rejudgeSubmissions
)

// 获取系统统计信息
router.get(
  '/statistics',
  adminOnly,
  [
    query('timeRange')
      .optional()
      .isIn(['day', 'week', 'month', 'year', 'all'])
      .withMessage('时间范围无效'),
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
  getSystemStatistics
)

// 清除缓存
router.post('/cache/clear', adminOnly, clearCache)

// 数据库备份
router.post('/database/backup', adminOnly, backupDatabase)

// 数据库恢复
router.post(
  '/database/restore',
  adminOnly,
  upload.single('backup'),
  restoreDatabase
)

export default router