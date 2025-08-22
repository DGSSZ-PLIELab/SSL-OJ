import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, UserModel, UserRole, UserStatus, IUser } from '../models/UserSQLite'
import { AppError, catchAsync } from '../middleware/errorHandler'
import { config } from '../config'

// JWT载荷接口
interface JWTPayload {
  id: number
  username: string
  role: UserRole
}

// 生成JWT token
const generateTokens = (payload: JWTPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    payload, 
    config.jwt.secret, 
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  ) as string
  
  const refreshToken = jwt.sign(
    payload, 
    config.jwt.refreshSecret, 
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  ) as string
  
  return { 
    accessToken, 
    refreshToken 
  }
}

// 用户注册
export const register = catchAsync(async (req: Request, res: Response) => {
  const { username, email, password, realName, studentId, class: userClass } = req.body
  
  // 检查用户名是否已存在
  const existingUserByUsername = User.findByUsername(username)
  if (existingUserByUsername) {
    throw new AppError('用户名已存在', 400)
  }
  
  // 检查邮箱是否已存在
  const existingUserByEmail = User.findByEmail(email)
  if (existingUserByEmail) {
    throw new AppError('邮箱已被注册', 400)
  }
  
  // 创建新用户
  const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
    username,
    email,
    password,
    realName,
    studentId,
    class: userClass,
    role: UserRole.STUDENT, // 默认为学生角色
    status: UserStatus.ACTIVE
  }
  
  const user = await User.create(userData)
  
  // 生成token
  const tokens = generateTokens({
    id: user.id!,
    username: user.username,
    role: user.role
  })
  
  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    realName: user.realName,
    studentId: user.studentId,
    class: user.class,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    createdAt: user.createdAt
  }
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: userResponse,
      ...tokens
    }
  })
})

// 用户登录
export const login = catchAsync(async (req: Request, res: Response) => {
  const { identifier, password, rememberMe } = req.body
  
  // 查找用户（通过用户名或邮箱）
  const user = User.findByUsernameOrEmail(identifier)
  
  if (!user) {
    throw new AppError('用户名或密码错误', 401)
  }
  
  // 检查账户状态
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError('账户已被禁用，请联系管理员', 401)
  }
  
  // 验证密码
  const isPasswordValid = await UserModel.comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new AppError('用户名或密码错误', 401)
  }
  
  // 更新最后登录时间
  const updatedUser = User.update(user.id!, { lastLoginAt: new Date().toISOString() })
  
  // 生成token（如果选择记住我，延长过期时间）
  const payload = {
    id: user.id!,
    username: user.username,
    role: user.role
  }
  
  let tokens
  if (rememberMe) {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '7d' // 记住我时延长到7天
    } as jwt.SignOptions) as string
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: '30d' // 刷新token延长到30天
    } as jwt.SignOptions) as string
    tokens = { accessToken, refreshToken }
  } else {
    tokens = generateTokens(payload)
  }
  
  // 返回用户信息（不包含密码）
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    realName: user.realName,
    studentId: user.studentId,
    class: user.class,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    rating: user.rating || 1000,
    rank: user.rank || 0,
    totalSubmissions: user.totalSubmissions || 0,
    acceptedSubmissions: user.acceptedSubmissions || 0,
    solvedProblems: user.solvedProblems || 0,
    lastLoginAt: updatedUser?.lastLoginAt || user.lastLoginAt
  }
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: userResponse,
      ...tokens
    }
  })
})

// 刷新token
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  
  if (!refreshToken) {
    throw new AppError('刷新token是必需的', 400)
  }
  
  try {
    // 验证刷新token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload
    
    // 检查用户是否存在且状态正常
    const user = User.findById(Number(decoded.id))
    
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError('用户不存在或已被禁用', 401)
    }
    
    // 生成新的token
    const tokens = generateTokens({
      id: user.id!,
      username: user.username,
      role: user.role
    })
    
    res.json({
      success: true,
      message: 'Token刷新成功',
      data: tokens
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('无效的刷新token', 401)
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('刷新token已过期，请重新登录', 401)
    }
    throw error
  }
})

// 用户登出
export const logout = catchAsync(async (req: Request, res: Response) => {
  // 在实际应用中，可以将token加入黑名单
  // 这里简单返回成功消息
  res.json({
    success: true,
    message: '登出成功'
  })
})

// 获取当前用户信息
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = User.findById(Number(req.user!.id))
  
  if (!user) {
    throw new AppError('用户不存在', 404)
  }
  
  // 计算统计信息
  const acceptanceRate = (user.totalSubmissions || 0) > 0
    ? Math.round(((user.acceptedSubmissions || 0) / (user.totalSubmissions || 1)) * 100)
    : 0
  
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    realName: user.realName,
    studentId: user.studentId,
    class: user.class,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    bio: user.bio,
    school: user.school,
    grade: user.grade,
    rating: user.rating,
    rank: user.rank,
    totalSubmissions: user.totalSubmissions,
    acceptedSubmissions: user.acceptedSubmissions,
    acceptanceRate,
    solvedProblems: user.solvedProblems,
    contestsParticipated: user.contestsParticipated,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }
  
  res.json({
    success: true,
    data: { user: userResponse }
  })
})

// 更新用户资料
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { realName, email, bio, school, grade, avatar } = req.body
  
  const user = User.findById(Number(req.user!.id))
  
  if (!user) {
    throw new AppError('用户不存在', 404)
  }
  
  // 检查邮箱是否被其他用户使用
  if (email && email !== user.email) {
    const existingUser = User.findByEmail(email)
    if (existingUser) {
      throw new AppError('邮箱已被其他用户使用', 400)
    }
  }
  
  // 构建更新数据
  const updateData: Partial<IUser> = {}
  if (realName !== undefined) updateData.realName = realName
  if (email !== undefined) updateData.email = email
  if (bio !== undefined) updateData.bio = bio
  if (school !== undefined) updateData.school = school
  if (grade !== undefined) updateData.grade = grade
  if (avatar !== undefined) updateData.avatar = avatar
  
  // 更新用户信息
  const updatedUser = User.update(Number(req.user!.id), updateData)
  
  if (!updatedUser) {
    throw new AppError('更新失败', 500)
  }
  
  // 返回更新后的用户信息
  const userResponse = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    realName: updatedUser.realName,
    studentId: updatedUser.studentId,
    class: updatedUser.class,
    role: updatedUser.role,
    status: updatedUser.status,
    avatar: updatedUser.avatar,
    bio: updatedUser.bio,
    school: updatedUser.school,
    grade: updatedUser.grade,
    rating: updatedUser.rating,
    rank: updatedUser.rank
  }
  
  res.json({
    success: true,
    message: '资料更新成功',
    data: { user: userResponse }
  })
})

// 修改密码
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  
  const user = User.findById(Number(req.user!.id))
  
  if (!user) {
    throw new AppError('用户不存在', 404)
  }
  
  // 验证当前密码
  const isCurrentPasswordValid = await UserModel.comparePassword(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    throw new AppError('当前密码错误', 400)
  }

  // 检查新密码是否与当前密码相同
  const isSamePassword = await UserModel.comparePassword(newPassword, user.password)
  if (isSamePassword) {
    throw new AppError('新密码不能与当前密码相同', 400)
  }

  // 哈希新密码
  const hashedPassword = UserModel.hashPassword(newPassword)
  User.update(Number(req.user!.id), { password: hashedPassword })
  
  res.json({
    success: true,
    message: '密码修改成功'
  })
})