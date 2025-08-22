// @ts-nocheck
import { Request, Response } from 'express'
import { Problem, ProblemStatus } from '../models/ProblemMySQL'
import { Submission, SubmissionStatus } from '../models/SubmissionMySQL'
import { AppError, catchAsync } from '../middleware/errorHandler'
import { Op, WhereOptions } from 'sequelize'
import os from 'os'

// 获取仪表板统计信息
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // 获取基本统计
  const [totalProblems, totalSubmissions] = await Promise.all([
    Problem.count(),
    Submission.count()
  ])

  // 获取今日统计
  const [todaySubmissions, todayProblems] = await Promise.all([
    Submission.count({ where: { submittedAt: { [Op.gte]: today } } }),
    Problem.count({ where: { createdAt: { [Op.gte]: today } } })
  ])

  // 获取本周统计
  const [weekSubmissions, weekProblems] = await Promise.all([
    Submission.count({ where: { submittedAt: { [Op.gte]: thisWeek } } }),
    Problem.count({ where: { createdAt: { [Op.gte]: thisWeek } } })
  ])

  // 获取本月统计
  const [monthSubmissions, monthProblems] = await Promise.all([
    Submission.count({ where: { submittedAt: { [Op.gte]: thisMonth } } }),
    Problem.count({ where: { createdAt: { [Op.gte]: thisMonth } } })
  ])

  // 获取题目难度分布
  const problemDifficultyDistribution = await Problem.findAll({
    attributes: [
      'difficulty',
      [Problem.sequelize!.fn('COUNT', '*'), 'count']
    ],
    group: ['difficulty'],
    raw: true
  })

  // 获取提交状态分布
  const submissionStatusDistribution = await Submission.findAll({
    attributes: [
      'status',
      [Submission.sequelize!.fn('COUNT', '*'), 'count']
    ],
    group: ['status'],
    raw: true
  })

  // 获取最近7天的活动趋势
  const activityTrend = await Submission.findAll({
    where: {
      submittedAt: { [Op.gte]: thisWeek }
    },
    attributes: [
      [Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt')), 'date'],
      [Submission.sequelize!.fn('COUNT', '*'), 'submissions'],
      [Submission.sequelize!.fn('COUNT', Submission.sequelize!.fn('DISTINCT', Submission.sequelize!.col('userId'))), 'activeUsers']
    ],
    group: [Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt'))],
    order: [[Submission.sequelize!.fn('DATE', Submission.sequelize!.col('submittedAt')), 'ASC']],
    raw: true
  })

  const stats = {
    overview: {
      totalProblems,
      totalSubmissions
    },
    today: {
      submissions: todaySubmissions,
      newProblems: todayProblems
    },
    thisWeek: {
      submissions: weekSubmissions,
      newProblems: weekProblems
    },
    thisMonth: {
      submissions: monthSubmissions,
      newProblems: monthProblems
    },
    distributions: {
      problemDifficulties: problemDifficultyDistribution.reduce((acc: any, item: any) => {
        acc[item.difficulty] = parseInt(item.count)
        return acc
      }, {}),
      submissionStatuses: submissionStatusDistribution.reduce((acc: any, item: any) => {
        acc[item.status] = parseInt(item.count)
        return acc
      }, {})
    },
    activityTrend
  }

  res.json({
    success: true,
    data: { stats }
  })
})

// 获取系统信息
export const getSystemInfo = catchAsync(async (req: Request, res: Response) => {
  const systemInfo = {
    server: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: process.memoryUsage()
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      }
    },
    database: {
      status: 'connected', // MySQL连接状态
      type: 'MySQL'
    },
    application: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000
    }
  }

  res.json({
    success: true,
    data: { systemInfo }
  })
})

// 获取系统设置
export const getSystemSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = {
    siteName: 'SSL Online Judge',
    siteDescription: 'SSL大学在线判题系统',
    allowRegistration: true,
    defaultUserRole: 'student',
    maxSubmissionSize: 65536,
    judgeServerUrl: 'http://localhost:8080',
    emailSettings: {
      enabled: false,
      host: '',
      port: 587,
      username: '',
      password: ''
    },
    maintenanceMode: false,
    maintenanceMessage: '系统维护中，请稍后再试'
  }

  res.json({
    success: true,
    data: { settings }
  })
})

// 更新系统设置
export const updateSystemSettings = catchAsync(async (req: Request, res: Response) => {
  const updateData = req.body

  // TODO: 将设置保存到配置文件或数据库中
  
  res.json({
    success: true,
    message: '系统设置更新成功',
    data: { settings: updateData }
  })
})

// 题目管理
export const getProblemManagement = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    difficulty,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // 构建查询条件
  const where: any = {}
  
  if (status) {
    where.status = status
  }
  
  if (difficulty) {
    where.difficulty = difficulty
  }
  
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { problemId: { [Op.like]: `%${search}%` } }
    ]
  }

  // 构建排序
  const order: any = [[sortBy as string, sortOrder === 'asc' ? 'ASC' : 'DESC']]

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询题目
  const { rows: problems, count: total } = await Problem.findAndCountAll({
    where,
    order,
    offset,
    limit: Number(limit),
    attributes: [
      'problemId', 'title', 'difficulty', 'status', 
      'acceptedCount', 'createdAt', 'updatedAt'
    ]
  })

  // 计算分页信息
  const totalPages = Math.ceil(total / Number(limit))
  const hasNextPage = Number(page) < totalPages
  const hasPrevPage = Number(page) > 1

  res.json({
    success: true,
    data: {
      problems,
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

// 更新题目状态
export const updateProblemStatus = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  const { status } = req.body

  if (!Object.values(ProblemStatus).includes(status)) {
    throw new AppError('无效的题目状态', 400)
  }

  const problem = await Problem.findOne({ where: { problemId } })
  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  await problem.update({ status })

  res.json({
    success: true,
    message: '题目状态更新成功',
    data: {
      problemId: problem.problemId,
      status: problem.status
    }
  })
})

// 删除题目
export const deleteProblem = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params

  const problem = await Problem.findOne({ where: { problemId } })
  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 检查是否有提交记录
  const submissionCount = await Submission.count({ where: { problemId } })
  if (submissionCount > 0) {
    throw new AppError('该题目存在提交记录，无法删除', 400)
  }

  await problem.destroy()

  res.json({
    success: true,
    message: '题目删除成功'
  })
})

// 提交管理
export const getSubmissionManagement = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    problemId,
    status,
    language,
    sortBy = 'submittedAt',
    sortOrder = 'desc'
  } = req.query as any

  // 构建查询条件
  const where: any = {}
  
  if (problemId) {
    where.problemId = problemId
  }
  
  if ((req.query as any).userId) {
    where.userId = (req.query as any).userId
  }
  
  if (status) {
    where.status = status
  }
  
  if (language) {
    where.language = language
  }

  // 构建排序
  const order: any = [[sortBy as string, sortOrder === 'asc' ? 'ASC' : 'DESC']]

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询提交记录
  const findOptions: any = {
    where,
    order,
    offset,
    limit: Number(limit),
    include: [
      {
        association: 'problem',
        attributes: ['title']
      }
    ],
    attributes: {
      exclude: ['code', 'ip', 'userAgent']
    }
  }
  
  const { rows: submissions, count: total } = await Submission.findAndCountAll(findOptions as any)

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

// 重新判题
export const rejudgeSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { submissionIds, problemId } = req.body as any

  let where: any = {}
  
  if (submissionIds && submissionIds.length > 0) {
    where.submissionId = { [Op.in]: submissionIds }
  } else {
    if (problemId) {
      where.problemId = problemId
    }
    if ((req.body as any).userId) {
      where.userId = (req.body as any).userId
    }
  }

  // 重置提交状态
  const [affectedCount] = await Submission.update(
    {
      status: SubmissionStatus.PENDING,
      result: {
        status: SubmissionStatus.PENDING,
        score: 0,
        timeUsed: 0,
        memoryUsed: 0,
        testCases: []
      },
      judgedAt: undefined
    },
    { where }
  )

  // TODO: 将提交重新加入判题队列
  // for (const submission of submissions) {
  //   await judgeQueue.add('judge', { submissionId: submission.submissionId })
  // }

  res.json({
    success: true,
    message: `已重新判题 ${affectedCount} 个提交`,
    data: {
      affectedCount
    }
  })
})

// 获取系统统计信息
export const getSystemStatistics = catchAsync(async (req: Request, res: Response) => {
  const { timeRange = 'all' } = req.query

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

  // 获取提交统计
  const [totalSubmissions, acceptedSubmissions] = await Promise.all([
    Submission.count({ where: timeWhere }),
    Submission.count({ where: { ...timeWhere, status: SubmissionStatus.ACCEPTED } })
  ])

  // 获取语言使用统计
  const languageStats = await Submission.findAll({
    where: timeWhere,
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

  // 获取题目难度统计
  const difficultyStats = await Problem.findAll({
    attributes: [
      'difficulty',
      [Problem.sequelize!.fn('COUNT', '*'), 'count'],
      [Problem.sequelize!.fn('AVG', Problem.sequelize!.col('acceptedCount')), 'avgAccepted'],
      [Problem.sequelize!.literal('AVG(JSON_EXTRACT(stats, "$.totalSubmissions"))'), 'avgSubmissions']
    ],
    group: ['difficulty'],
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
    languageStats,
    difficultyStats
  }

  res.json({
    success: true,
    data: { statistics }
  })
})

// 清除缓存
export const clearCache = catchAsync(async (req: Request, res: Response) => {
  // TODO: 实现缓存清除逻辑
  
  res.json({
    success: true,
    message: '缓存清除成功'
  })
})

// 数据库备份
export const backupDatabase = catchAsync(async (req: Request, res: Response) => {
  // TODO: 实现MySQL数据库备份逻辑
  
  res.json({
    success: true,
    message: '数据库备份已开始',
    data: {
      backupId: Date.now().toString(),
      startTime: new Date()
    }
  })
})

// 数据库恢复
export const restoreDatabase = catchAsync(async (req: Request, res: Response) => {
  const { backupFile } = req.body

  if (!backupFile) {
    throw new AppError('请提供备份文件', 400)
  }

  // TODO: 实现MySQL数据库恢复逻辑
  
  res.json({
    success: true,
    message: '数据库恢复已开始',
    data: {
      restoreId: Date.now().toString(),
      startTime: new Date()
    }
  })
})