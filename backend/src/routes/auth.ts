import express from 'express'
import { body } from 'express-validator'
import { register, login, refreshToken, logout, getProfile, updateProfile, changePassword } from '../controllers/auth'
import { auth } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = express.Router()

// 注册验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度应在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符'),
  
  body('realName')
    .notEmpty()
    .withMessage('真实姓名是必需的')
    .isLength({ max: 50 })
    .withMessage('真实姓名最多50个字符'),
  
  body('studentId')
    .optional()
    .isLength({ max: 20 })
    .withMessage('学号最多20个字符'),
  
  body('class')
    .optional()
    .isLength({ max: 50 })
    .withMessage('班级名称最多50个字符')
]

// 登录验证规则
const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('用户名或邮箱是必需的'),
  
  body('password')
    .notEmpty()
    .withMessage('密码是必需的')
]

// 更新资料验证规则
const updateProfileValidation = [
  body('realName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('真实姓名最多50个字符'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('个人简介最多500个字符'),
  
  body('school')
    .optional()
    .isLength({ max: 100 })
    .withMessage('学校名称最多100个字符'),
  
  body('grade')
    .optional()
    .isLength({ max: 20 })
    .withMessage('年级最多20个字符')
]

// 修改密码验证规则
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码是必需的'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少6个字符'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配')
      }
      return true
    })
]

// 刷新token验证规则
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新token是必需的')
]

// 路由定义

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', registerValidation, validate, register)

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', loginValidation, validate, login)

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, validate, refreshToken)

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', auth, logout)

/**
 * @route   GET /api/auth/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', auth, getProfile)

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put('/profile', auth, updateProfileValidation, validate, updateProfile)

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', auth, changePasswordValidation, validate, changePassword)

export { router as authRoutes }