import express from 'express'
import { body, param, query } from 'express-validator'
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemSubmissions,
  getProblemStatistics,
  searchProblems,
  getProblemTags,
  updateProblemStatus,
  cloneProblem
} from '../controllers/problemsMySQL'
import { auth, teacherOrAdmin, adminOnly, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = express.Router()

// 验证规则
const getProblemsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('难度必须是easy、medium或hard'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态必须是draft、published或archived'),
  
  query('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('标签必须是字符串'),
  
  query('sortBy')
    .optional()
    .isIn(['problemId', 'title', 'difficulty', 'acceptedCount', 'createdAt'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是asc或desc'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('搜索关键词最多100个字符')
]

const problemIdValidation = [
  param('problemId')
    .isInt({ min: 1 })
    .withMessage('题目ID必须是正整数')
]

const createProblemValidation = [
  body('title')
    .notEmpty()
    .withMessage('题目标题是必需的')
    .isLength({ max: 200 })
    .withMessage('题目标题最多200个字符'),
  
  body('description')
    .notEmpty()
    .withMessage('题目描述是必需的'),
  
  body('inputFormat')
    .notEmpty()
    .withMessage('输入格式是必需的'),
  
  body('outputFormat')
    .notEmpty()
    .withMessage('输出格式是必需的'),
  
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('难度必须是easy、medium或hard'),
  
  body('timeLimit')
    .isInt({ min: 100, max: 10000 })
    .withMessage('时间限制必须是100-10000毫秒'),
  
  body('memoryLimit')
    .isInt({ min: 16, max: 512 })
    .withMessage('内存限制必须是16-512MB'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  
  body('tags.*')
    .optional()
    .isLength({ max: 20 })
    .withMessage('每个标签最多20个字符'),
  
  body('testCases')
    .isArray({ min: 1 })
    .withMessage('至少需要一个测试用例'),
  
  body('testCases.*.input')
    .notEmpty()
    .withMessage('测试用例输入不能为空'),
  
  body('testCases.*.output')
    .notEmpty()
    .withMessage('测试用例输出不能为空'),
  
  body('testCases.*.isPublic')
    .optional()
    .isBoolean()
    .withMessage('测试用例公开状态必须是布尔值'),
  
  body('sampleInput')
    .optional()
    .isString()
    .withMessage('样例输入必须是字符串'),
  
  body('sampleOutput')
    .optional()
    .isString()
    .withMessage('样例输出必须是字符串'),
  
  body('hint')
    .optional()
    .isString()
    .withMessage('提示必须是字符串'),
  
  body('source')
    .optional()
    .isLength({ max: 100 })
    .withMessage('题目来源最多100个字符'),
  
  body('allowedLanguages')
    .optional()
    .isArray()
    .withMessage('允许的编程语言必须是数组'),
  
  body('allowedLanguages.*')
    .optional()
    .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
    .withMessage('不支持的编程语言')
]

const updateProblemValidation = [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('题目标题最多200个字符'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('题目描述必须是字符串'),
  
  body('inputFormat')
    .optional()
    .isString()
    .withMessage('输入格式必须是字符串'),
  
  body('outputFormat')
    .optional()
    .isString()
    .withMessage('输出格式必须是字符串'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('难度必须是easy、medium或hard'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 100, max: 10000 })
    .withMessage('时间限制必须是100-10000毫秒'),
  
  body('memoryLimit')
    .optional()
    .isInt({ min: 16, max: 512 })
    .withMessage('内存限制必须是16-512MB'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  
  body('tags.*')
    .optional()
    .isLength({ max: 20 })
    .withMessage('每个标签最多20个字符'),
  
  body('testCases')
    .optional()
    .isArray()
    .withMessage('测试用例必须是数组'),
  
  body('testCases.*.input')
    .optional()
    .notEmpty()
    .withMessage('测试用例输入不能为空'),
  
  body('testCases.*.output')
    .optional()
    .notEmpty()
    .withMessage('测试用例输出不能为空'),
  
  body('testCases.*.isPublic')
    .optional()
    .isBoolean()
    .withMessage('测试用例公开状态必须是布尔值'),
  
  body('sampleInput')
    .optional()
    .isString()
    .withMessage('样例输入必须是字符串'),
  
  body('sampleOutput')
    .optional()
    .isString()
    .withMessage('样例输出必须是字符串'),
  
  body('hint')
    .optional()
    .isString()
    .withMessage('提示必须是字符串'),
  
  body('source')
    .optional()
    .isLength({ max: 100 })
    .withMessage('题目来源最多100个字符'),
  
  body('allowedLanguages')
    .optional()
    .isArray()
    .withMessage('允许的编程语言必须是数组'),
  
  body('allowedLanguages.*')
    .optional()
    .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
    .withMessage('不支持的编程语言')
]

// 路由定义

// 获取题目列表
router.get('/', optionalAuth, getProblemsValidation, validate, getProblems)

// 搜索题目
router.get('/search', optionalAuth, [
  query('q')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ max: 100 })
    .withMessage('搜索关键词最多100个字符'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
], validate, searchProblems)

// 获取题目标签
router.get('/tags', getProblemTags)

// 获取单个题目
router.get('/:problemId', optionalAuth, problemIdValidation, validate, getProblemById)

// 获取题目提交记录
router.get('/:problemId/submissions', optionalAuth, [
  ...problemIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('status')
    .optional()
    .isIn(['pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error', 'system_error'])
    .withMessage('提交状态无效'),
  query('language')
    .optional()
    .isIn(['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'])
    .withMessage('编程语言无效')
], validate, getProblemSubmissions)

// 获取题目统计信息
router.get('/:problemId/statistics', optionalAuth, problemIdValidation, validate, getProblemStatistics)

// 创建题目（需要教师或管理员权限）
router.post('/', teacherOrAdmin, createProblemValidation, validate, createProblem)

// 更新题目（需要教师或管理员权限）
router.put('/:problemId', teacherOrAdmin, [...problemIdValidation, ...updateProblemValidation], validate, updateProblem)

// 克隆题目（需要教师或管理员权限）
router.post('/:problemId/clone', teacherOrAdmin, problemIdValidation, validate, cloneProblem)

// 更新题目状态（需要管理员权限）
router.patch('/:problemId/status', adminOnly, [
  ...problemIdValidation,
  body('status')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态必须是draft、published或archived')
], validate, updateProblemStatus)

// 删除题目（需要管理员权限）
router.delete('/:problemId', adminOnly, problemIdValidation, validate, deleteProblem)

export default router