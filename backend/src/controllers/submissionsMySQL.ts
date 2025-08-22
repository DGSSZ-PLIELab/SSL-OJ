import { Request, Response } from 'express'
import { Submission, SubmissionStatus, Language } from '../models/SubmissionMySQL'
import { Problem, ProblemStatus } from '../models/ProblemMySQL'
import { AppError, catchAsync } from '../middleware/errorHandler'
import { Op, WhereOptions } from 'sequelize'

// 创建提交
export const createSubmission = catchAsync(async (req: Request, res: Response) => {
  const { problemId, language, code, contestId, isPublic = true } = req.body
  const userId = req.user!.id

  // 检查题目是否存在且可访问
  const problem = await Problem.findOne({ where: { problemId } })
  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  if (!problem.isVisibleTo(userId, req.user?.role || 'guest')) {
    throw new AppError('无权访问此题目', 403)
  }

  // TODO: 如果是比赛提交，检查比赛状态
  // let contest = null
  // if (contestId) {
  //   contest = await Contest.findOne({ where: { contestId } })
  //   if (!contest) {
  //     throw new AppError('比赛不存在', 404)
  //   }
  //   // 其他比赛相关检查...
  // }

  // 生成提交ID
  const submissionId = await Submission.generateSubmissionId()

  // 创建提交记录
  const submission = await Submission.create({
    submissionId,
    userId,
    problemId,
    contestId,
    language,
    code,
    status: SubmissionStatus.PENDING,
    isPublic,
    ip: req.ip || '127.0.0.1',
    userAgent: req.get('User-Agent')
  })

  // 更新题目提交统计
  const problemToUpdate = await Problem.findByPk(problemId)
  if (problemToUpdate) {
    const stats = problemToUpdate.stats
    stats.totalSubmissions += 1
    await problemToUpdate.update({ stats })
  }

  // TODO: 更新用户提交统计
  // await User.increment('totalSubmissions', { where: { id: userId } })

  // TODO: 将提交加入判题队列
  // await judgeQueue.add('judge', { submissionId })

  res.status(201).json({
    success: true,
    message: '提交成功',
    data: {
      submission: {
        submissionId: submission.submissionId,
        status: submission.status,
        submittedAt: submission.submittedAt
      }
    }
  })
})

// 获取提交列表
export const getSubmissions = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    problemId,
    userId,
    contestId,
    status,
    language,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
    onlyMine = false
  } = req.query

  // 构建查询条件
  const where: any = {}
  
  if (problemId) {
    where.problemId = problemId
  }
  
  if (userId) {
    where.userId = userId
  }
  
  if (contestId) {
    where.contestId = contestId
  }
  
  if (status) {
    where.status = status
  }
  
  if (language) {
    where.language = language
  }

  // 如果用户选择只看自己的提交
  if (onlyMine && req.user) {
    where.userId = req.user.id
  }

  // 非管理员只能看到公开的提交或自己的提交
  if (!req.user || req.user.role === 'student') {
    where[Op.or] = [
      { isPublic: true },
      { userId: req.user?.id }
    ]
  }

  // 构建排序
  const order: any = [[sortBy as string, sortOrder === 'asc' ? 'ASC' : 'DESC']]

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询提交记录
  const { rows: submissions, count: total } = await Submission.findAndCountAll({
    where,
    order,
    offset,
    limit: Number(limit),
    include: [
      {
        association: 'user',
        attributes: ['username', 'realName']
      },
      {
        association: 'problem',
        attributes: ['title']
      }
    ],
    attributes: [
      'submissionId', 'userId', 'problemId', 'contestId', 'language', 
      'status', 'result', 'submittedAt'
    ]
  })

  // 计算分页信息
  const totalPages = Math.ceil(total / Number(limit))
  const hasNextPage = Number(page) < totalPages
  const hasPrevPage = Number(page) > 1

  res.json({
    success: true,
    data: {
      submissions,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    }
  })
})

// 获取指定提交详情
export const getSubmissionById = catchAsync(async (req: Request, res: Response) => {
  const { submissionId } = req.params

  const submission = await Submission.findOne({
    where: { submissionId },
    include: [
      {
        association: 'user',
        attributes: ['username', 'realName']
      },
      {
        association: 'problem',
        attributes: ['title', 'timeLimit', 'memoryLimit']
      }
    ]
  })

  if (!submission) {
    throw new AppError('提交记录不存在', 404)
  }

  // 检查访问权限
  const canView = 
    submission.isPublic ||
    (req.user && (
      submission.userId === req.user.id ||
      req.user.role === 'admin' ||
      req.user.role === 'teacher'
    ))

  if (!canView) {
    throw new AppError('无权查看此提交记录', 403)
  }

  // 构建响应数据
  const submissionData = submission.toJSON()
  
  // 如果不是提交者本人或管理员/教师，隐藏代码
  if (!req.user || (
    submission.userId !== req.user.id &&
    req.user.role === 'student'
  )) {
    delete (submissionData as any).code
  }

  res.json({
    success: true,
    data: { submission: submissionData }
  })
})

// 获取提交代码
export const getSubmissionCode = catchAsync(async (req: Request, res: Response) => {
  const { submissionId } = req.params

  const submission = await Submission.findOne({
    where: { submissionId },
    include: [
      {
        association: 'user',
        attributes: ['username']
      }
    ]
  })

  if (!submission) {
    throw new AppError('提交记录不存在', 404)
  }

  // 检查访问权限：只有提交者本人或管理员/教师可以查看代码
  const canViewCode = 
    req.user && (
      submission.userId === req.user.id ||
      req.user.role === 'admin' ||
      req.user.role === 'teacher'
    )

  if (!canViewCode) {
    throw new AppError('无权查看此提交的代码', 403)
  }

  res.json({
    success: true,
    data: {
      submissionId: submission.submissionId,
      language: submission.language,
      code: submission.code,
      submittedAt: submission.submittedAt
    }
  })
})

// 重新判题
export const rejudgeSubmission = catchAsync(async (req: Request, res: Response) => {
  const { submissionId } = req.params

  const submission = await Submission.findOne({ where: { submissionId } })

  if (!submission) {
    throw new AppError('提交记录不存在', 404)
  }

  // 重置提交状态
  await submission.update({
    status: SubmissionStatus.PENDING,
    result: {
      status: SubmissionStatus.PENDING,
      score: 0,
      timeUsed: 0,
      memoryUsed: 0,
      testCases: []
    },
    judgedAt: undefined
  })

  // TODO: 将提交重新加入判题队列
  // await judgeQueue.add('judge', { submissionId })

  res.json({
    success: true,
    message: '重新判题请求已提交',
    data: {
      submissionId: submission.submissionId,
      status: submission.status
    }
  })
})

// 获取用户提交记录
export const getUserSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  
  if (!userId) {
    throw new AppError('用户ID不能为空', 400)
  }
  const {
    page = 1,
    limit = 20,
    problemId,
    status,
    language,
    contestId
  } = req.query

  // TODO: 检查用户是否存在
  // const user = await User.findByPk(userId)
  // if (!user) {
  //   throw new AppError('用户不存在', 404)
  // }

  // 构建查询条件
  const where: WhereOptions = { userId: parseInt(userId) }
  
  if (problemId) {
    where.problemId = problemId
  }
  
  if (status) {
    where.status = status
  }
  
  if (language) {
    where.language = language
  }
  
  if (contestId) {
    where.contestId = contestId
  }

  // 非管理员只能看到公开的提交或自己的提交
  if (!req.user || (
    req.user.role === 'student' && 
    req.user.id !== parseInt(userId)
  )) {
    where.isPublic = true
  }

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询提交记录
  const { rows: submissions, count: total } = await Submission.findAndCountAll({
    where,
    order: [['submittedAt', 'DESC']],
    offset,
    limit: Number(limit),
    include: [
      {
        association: 'problem',
        attributes: ['title']
      }
    ],
    attributes: [
      'submissionId', 'problemId', 'contestId', 'language', 
      'status', 'result', 'submittedAt'
    ]
  })

  // 计算分页信息
  const totalPages = Math.ceil(total / Number(limit))
  const hasNextPage = Number(page) < totalPages
  const hasPrevPage = Number(page) > 1

  res.json({
    success: true,
    data: {
      user: {
        id: userId,
        // username: user.username,
        // realName: user.realName
      },
      submissions,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    }
  })
})

// 获取提交统计信息
export const getSubmissionStatistics = catchAsync(async (req: Request, res: Response) => {
  const { timeRange = 'all', problemId, contestId } = req.query

  // 构建时间范围查询
  let timeWhere: any = {}
  const now = new Date()
  
  switch (timeRange) {
    case 'day':
      timeWhere.submittedAt = {
        [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
      break
    case 'week':
      timeWhere.submittedAt = {
        [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
      break
    case 'month':
      timeWhere.submittedAt = {
        [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      break
    case 'year':
      timeWhere.submittedAt = {
        [Op.gte]: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      }
      break
  }

  // 构建基础查询条件
  const baseWhere: any = { ...timeWhere }
  
  if (problemId) {
    baseWhere.problemId = problemId
  }
  
  if (contestId) {
    baseWhere.contestId = contestId
  }

  // 获取总体统计
  const [totalSubmissions, acceptedSubmissions] = await Promise.all([
    Submission.count({ where: baseWhere }),
    Submission.count({ where: { ...baseWhere, status: SubmissionStatus.ACCEPTED } })
  ])

  // 获取各状态分布
  const statusDistribution = await Submission.findAll({
    where: baseWhere,
    attributes: [
      'status',
      [Submission.sequelize!.fn('COUNT', '*'), 'count']
    ],
    group: ['status'],
    raw: true
  })

  // 获取各语言使用统计
  const languageDistribution = await Submission.findAll({
    where: baseWhere,
    attributes: [
      'language',
      [Submission.sequelize!.fn('COUNT', '*'), 'count'],
      [Submission.sequelize!.fn('SUM', 
        Submission.sequelize!.literal(`CASE WHEN status = '${SubmissionStatus.ACCEPTED}' THEN 1 ELSE 0 END`)
      ), 'accepted']
    ],
    group: ['language'],
    order: [[Submission.sequelize!.literal('count'), 'DESC']],
    raw: true
  })

  // 获取提交趋势（最近30天）
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const submissionTrend = await Submission.findAll({
    where: {
      ...baseWhere,
      submittedAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt')), 'date'],
      [Submission.sequelize!.fn('COUNT', '*'), 'count'],
      [Submission.sequelize!.fn('SUM', 
        Submission.sequelize!.literal(`CASE WHEN status = '${SubmissionStatus.ACCEPTED}' THEN 1 ELSE 0 END`)
      ), 'accepted']
    ],
    group: [Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt'))],
    order: [[Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt')), 'ASC']],
    raw: true
  })

  // 计算通过率
  const acceptanceRate = totalSubmissions > 0 
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0

  const statistics = {
    overview: {
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      timeRange
    },
    statusDistribution: statusDistribution.reduce((acc: any, item: any) => {
      acc[item.status] = parseInt(item.count)
      return acc
    }, {}),
    languageDistribution,
    submissionTrend
  }

  res.json({
    success: true,
    data: { statistics }
  })
})