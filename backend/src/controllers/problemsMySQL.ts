import { Request, Response } from 'express'
import { Problem, ProblemDifficulty, ProblemStatus } from '../models/ProblemMySQL'
import { Submission } from '../models/SubmissionMySQL'
import { User, UserRole } from '../models/UserSQLite'
import { AppError, catchAsync } from '../middleware/errorHandler'
import { Op } from 'sequelize'

// 获取题目列表
export const getProblems = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    difficulty,
    status,
    category,
    tags,
    sortBy = 'problemId',
    sortOrder = 'asc',
    search
  } = req.query

  // 构建查询条件
  const whereClause: any = {}
  
  // 非管理员只能看到已发布的题目
  if (!req.user || req.user.role === UserRole.STUDENT) {
    whereClause.status = ProblemStatus.PUBLISHED
  } else if (status) {
    whereClause.status = status
  }
  
  if (difficulty) {
    whereClause.difficulty = difficulty
  }
  
  if (category) {
    whereClause.category = { [Op.like]: `%${category}%` }
  }
  
  if (tags) {
    const tagArray = (tags as string).split(',')
    // MySQL JSON字段查询
    whereClause.tags = {
      [Op.or]: tagArray.map(tag => ({
        [Op.like]: `%"${tag}"%`
      }))
    }
  }
  
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { problemId: { [Op.like]: `%${search}%` } }
    ]
  }

  // 构建排序
  const orderClause: any = [[sortBy as string, sortOrder === 'desc' ? 'DESC' : 'ASC']]

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询题目
  const { rows: problems, count: total } = await Problem.findAndCountAll({
    where: whereClause,
    order: orderClause,
    limit: Number(limit),
    offset,
    attributes: [
      'id', 'problemId', 'title', 'difficulty', 'status', 'category', 'tags',
      'timeLimit', 'memoryLimit', 'stats', 'authorId', 'createdAt', 'updatedAt'
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

// 根据ID获取题目详情
export const getProblemById = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params

  const problem = await Problem.findOne({
    where: { problemId }
  })

  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 检查访问权限
  if (!problem.isVisibleTo(req.user?.id || 0, req.user?.role || 'student')) {
    throw new AppError('无权访问此题目', 403)
  }

  // 获取用户对该题目的提交统计
  let userStats = null
  if (req.user) {
    const userSubmissions = await Submission.findAll({
      where: {
        userId: req.user.id,
        problemId: problem.problemId
      },
      order: [['submittedAt', 'DESC']]
    })

    const totalSubmissions = userSubmissions.length
    const acceptedSubmission = userSubmissions.find(s => s.isAccepted)
    const bestSubmission = userSubmissions.reduce((best, current) => {
      if (!best) return current
      if (current.score! > best.score!) return current
      if (current.score === best.score && current.timeUsed! < best.timeUsed!) return current
      return best
    }, null as any)

    userStats = {
      totalSubmissions,
      isAccepted: !!acceptedSubmission,
      bestScore: bestSubmission?.score || 0,
      bestTime: bestSubmission?.timeUsed || 0,
      lastSubmission: userSubmissions[0] || null
    }
  }

  res.json({
    success: true,
    data: {
      problem,
      userStats
    }
  })
})

// 创建题目
export const createProblem = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    description,
    inputFormat,
    outputFormat,
    constraints,
    difficulty,
    category,
    tags,
    timeLimit,
    memoryLimit,
    testCases,
    sampleCases,
    source,
    sourceUrl,
    hints,
    solution
  } = req.body

  // 生成题目ID
  const problemId = await Problem.getNextProblemId()

  // 创建题目
  const problem = await Problem.create({
    problemId,
    title,
    description,
    inputFormat,
    outputFormat,
    constraints,
    difficulty,
    status: ProblemStatus.DRAFT,
    category,
    tags: tags || [],
    timeLimit,
    memoryLimit,
    testCases: testCases || [],
    sampleCases: sampleCases || [],
    stats: {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      acceptanceRate: 0,
      difficulty: 0
    },
    authorId: req.user!.id,
    maintainerIds: [],
    source,
    sourceUrl,
    hints: hints || [],
    solution
  })

  res.status(201).json({
    success: true,
    message: '题目创建成功',
    data: { problem }
  })
})

// 更新题目
export const updateProblem = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  const updateData = req.body

  const problem = await Problem.findOne({ where: { problemId } })

  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 检查权限：只有作者、维护者或管理员可以修改
  const canEdit = req.user && (
    problem.authorId === req.user.id ||
    problem.maintainerIds.includes(req.user.id) ||
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.TEACHER
  )

  if (!canEdit) {
    throw new AppError('无权修改此题目', 403)
  }

  // 更新题目
  await problem.update(updateData)

  res.json({
    success: true,
    message: '题目更新成功',
    data: { problem }
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
    throw new AppError('该题目已有提交记录，无法删除', 400)
  }

  await problem.destroy()

  res.json({
    success: true,
    message: '题目删除成功'
  })
})

// 获取题目的提交记录
export const getProblemSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  const {
    page = 1,
    limit = 20,
    status,
    language,
    userId
  } = req.query

  const problem = await Problem.findOne({ where: { problemId } })

  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 构建查询条件
  const whereClause: any = { problemId }
  
  if (status) {
    whereClause.status = status
  }
  
  if (language) {
    whereClause.language = language
  }
  
  if (userId) {
    whereClause.userId = userId
  }

  // 非管理员只能看到公开的提交或自己的提交
  if (!req.user || req.user.role === UserRole.STUDENT) {
    whereClause[Op.or] = [
      { isPublic: true },
      { userId: req.user?.id }
    ]
  }

  // 分页参数
  const offset = (Number(page) - 1) * Number(limit)

  // 查询提交记录
  const { rows: submissions, count: total } = await Submission.findAndCountAll({
    where: whereClause,
    order: [['submittedAt', 'DESC']],
    limit: Number(limit),
    offset,
    attributes: [
      'submissionId', 'userId', 'language', 'status', 'score', 
      'timeUsed', 'memoryUsed', 'submittedAt'
    ]
  })

  res.json({
    success: true,
    data: {
      submissions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    }
  })
})

// 获取题目统计信息
export const getProblemStatistics = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  
  if (!problemId) {
    throw new AppError('题目ID不能为空', 400)
  }

  const problem = await Problem.findOne({ where: { problemId } })

  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 获取基础统计信息
  const stats = await Submission.getProblemStats(problemId)

  // 获取各状态分布
  const statusDistribution = await Submission.findAll({
    where: { problemId },
    attributes: [
      'status',
      [Submission.sequelize!.fn('COUNT', Submission.sequelize!.col('status')), 'count']
    ],
    group: ['status'],
    raw: true
  })

  // 获取各语言使用统计
  const languageDistribution = await Submission.findAll({
    where: { problemId },
    attributes: [
      'language',
      [Submission.sequelize!.fn('COUNT', Submission.sequelize!.col('language')), 'count'],
      [Submission.sequelize!.fn('SUM', Submission.sequelize!.literal('CASE WHEN status = "accepted" THEN 1 ELSE 0 END')), 'accepted']
    ],
    group: ['language'],
    raw: true
  })

  res.json({
    success: true,
    data: {
      basicStats: stats,
      statusDistribution,
      languageDistribution,
      problemInfo: {
        difficulty: problem.difficulty,
        category: problem.category,
        tags: problem.tags,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit
      }
    }
  })
})

// 搜索题目
export const searchProblems = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { query, limit = 10 } = req.query

  if (!query) {
    res.json({
      success: true,
      data: { problems: [] }
    })
    return
  }

  const problems = await Problem.search(query as string, {
    limit: Number(limit),
    status: req.user?.role === UserRole.STUDENT ? ProblemStatus.PUBLISHED : undefined
  })

  res.json({
    success: true,
    data: { 
      problems: problems.rows,
      total: problems.count
    }
  })
})

// 获取题目标签
export const getProblemTags = catchAsync(async (req: Request, res: Response) => {
  // 获取所有已发布题目的标签
  const problems = await Problem.findAll({
    where: { status: ProblemStatus.PUBLISHED },
    attributes: ['tags']
  })

  // 提取所有标签并去重
  const allTags = new Set<string>()
  problems.forEach(problem => {
    problem.tags.forEach(tag => allTags.add(tag))
  })

  const tags = Array.from(allTags).sort()

  res.json({
    success: true,
    data: { tags }
  })
})

// 更新题目状态
export const updateProblemStatus = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  const { status } = req.body

  const problem = await Problem.findOne({ where: { problemId } })

  if (!problem) {
    throw new AppError('题目不存在', 404)
  }

  // 检查权限
  const canEdit = req.user && (
    problem.authorId === req.user.id ||
    problem.maintainerIds.includes(req.user.id) ||
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.TEACHER
  )

  if (!canEdit) {
    throw new AppError('无权修改此题目状态', 403)
  }

  // 更新状态
  problem.status = status
  if (status === ProblemStatus.PUBLISHED && !problem.publishedAt) {
    problem.publishedAt = new Date()
  }
  await problem.save()

  res.json({
    success: true,
    message: '题目状态更新成功',
    data: { problem }
  })
})

// 克隆题目
export const cloneProblem = catchAsync(async (req: Request, res: Response) => {
  const { problemId } = req.params
  const { title } = req.body

  const originalProblem = await Problem.findOne({ where: { problemId } })

  if (!originalProblem) {
    throw new AppError('原题目不存在', 404)
  }

  // 生成新的题目ID
  const newProblemId = await Problem.getNextProblemId()

  // 克隆题目
  const clonedProblem = await Problem.create({
    problemId: newProblemId,
    title: title || `${originalProblem.title} (副本)`,
    description: originalProblem.description,
    inputFormat: originalProblem.inputFormat,
    outputFormat: originalProblem.outputFormat,
    constraints: originalProblem.constraints,
    difficulty: originalProblem.difficulty,
    status: ProblemStatus.DRAFT,
    category: originalProblem.category,
    tags: originalProblem.tags,
    timeLimit: originalProblem.timeLimit,
    memoryLimit: originalProblem.memoryLimit,
    testCases: originalProblem.testCases,
    sampleCases: originalProblem.sampleCases,
    stats: {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      acceptanceRate: 0,
      difficulty: 0
    },
    authorId: req.user!.id,
    maintainerIds: [],
    source: originalProblem.source,
    sourceUrl: originalProblem.sourceUrl,
    hints: originalProblem.hints,
    solution: originalProblem.solution
  })

  res.status(201).json({
    success: true,
    message: '题目克隆成功',
    data: { problem: clonedProblem }
  })
})