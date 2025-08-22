import { EventEmitter } from 'events'
import { judgeSubmission, JudgeStatus, JudgeConfig } from './judge'
import { Submission, SubmissionStatus } from '../models/SubmissionMySQL'
import { Problem } from '../models/ProblemMySQL'
// import { User } from '../models/User' // TODO: 创建MySQL User模型后取消注释
import { emitToUser, emitToRoom } from '../server'
import { sendSubmissionResultNotification } from './email'

// 判题任务接口
interface JudgeTask {
  id: string
  submissionId: string
  userId: string
  problemId: string
  priority: number
  createdAt: Date
  retryCount: number
  maxRetries: number
}

// 判题队列类
class JudgeQueue extends EventEmitter {
  private queue: JudgeTask[] = []
  private processing: Map<string, JudgeTask> = new Map()
  private maxConcurrent: number
  private currentProcessing: number = 0
  private isRunning: boolean = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor(maxConcurrent: number = 3) {
    super()
    this.maxConcurrent = maxConcurrent
  }

  // 添加判题任务
  addTask(submissionId: string, userId: string, problemId: string, priority: number = 0): string {
    const taskId = `${submissionId}_${Date.now()}`
    
    const task: JudgeTask = {
      id: taskId,
      submissionId,
      userId,
      problemId,
      priority,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    // 按优先级插入队列
    const insertIndex = this.queue.findIndex(t => t.priority < priority)
    if (insertIndex === -1) {
      this.queue.push(task)
    } else {
      this.queue.splice(insertIndex, 0, task)
    }

    this.emit('taskAdded', task)
    
    // 如果队列没有运行，启动处理
    if (!this.isRunning) {
      this.start()
    }

    return taskId
  }

  // 移除任务
  removeTask(taskId: string): boolean {
    const queueIndex = this.queue.findIndex(t => t.id === taskId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
      this.emit('taskRemoved', taskId)
      return true
    }

    if (this.processing.has(taskId)) {
      // 如果任务正在处理中，标记为取消
      const task = this.processing.get(taskId)!
      this.emit('taskCancelled', task)
      return true
    }

    return false
  }

  // 获取任务状态
  getTaskStatus(taskId: string): 'queued' | 'processing' | 'completed' | 'not_found' {
    if (this.queue.some(t => t.id === taskId)) {
      return 'queued'
    }
    if (this.processing.has(taskId)) {
      return 'processing'
    }
    return 'not_found'
  }

  // 获取队列信息
  getQueueInfo() {
    return {
      queueLength: this.queue.length,
      processing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent,
      isRunning: this.isRunning,
      tasks: this.queue.map(t => ({
        id: t.id,
        submissionId: t.submissionId,
        priority: t.priority,
        createdAt: t.createdAt,
        retryCount: t.retryCount
      }))
    }
  }

  // 启动队列处理
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 1000)
    
    this.emit('queueStarted')
    console.log('判题队列已启动')
  }

  // 停止队列处理
  stop(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    
    this.emit('queueStopped')
    console.log('判题队列已停止')
  }

  // 处理队列
  private async processQueue(): Promise<void> {
    // 检查是否可以处理更多任务
    if (this.currentProcessing >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    // 获取下一个任务
    const task = this.queue.shift()
    if (!task) return

    // 开始处理任务
    this.currentProcessing++
    this.processing.set(task.id, task)
    
    this.emit('taskStarted', task)
    
    try {
      await this.processTask(task)
    } catch (error) {
      console.error(`处理判题任务失败: ${task.id}`, error)
      await this.handleTaskError(task, error)
    } finally {
      // 任务完成，清理
      this.currentProcessing--
      this.processing.delete(task.id)
      this.emit('taskCompleted', task)
    }
  }

  // 处理单个任务
  private async processTask(task: JudgeTask): Promise<void> {
    try {
      // 获取提交记录
      const submission = await Submission.findById(task.submissionId)
        .populate('problemId')
      
      if (!submission) {
        throw new Error(`提交记录不存在: ${task.submissionId}`)
      }

      const problem = submission.problemId as any
      if (!problem) {
        throw new Error(`题目不存在: ${submission.problemId}`)
      }

      // 更新提交状态为判题中
      submission.status = SubmissionStatus.JUDGING
      submission.judgeStartTime = new Date()
      await submission.save()

      // 通知用户判题开始
      emitToUser(task.userId, 'submission:judging', {
        submissionId: task.submissionId,
        status: SubmissionStatus.JUDGING
      })

      // 准备判题配置
      const judgeConfig: JudgeConfig = {
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        testCases: problem.testCases.map((tc: any, index: number) => ({
          id: index + 1,
          input: tc.input,
          output: tc.output,
          score: tc.score || 10
        })),
        language: submission.language,
        code: submission.code,
        problemId: problem.problemId,
        submissionId: task.submissionId
      }

      // 执行判题
      const judgeResult = await judgeSubmission(judgeConfig)

      // 转换JudgeStatus到SubmissionStatus
      const statusMapping: Record<string, SubmissionStatus> = {
        'Pending': SubmissionStatus.PENDING,
        'Judging': SubmissionStatus.JUDGING,
        'Accepted': SubmissionStatus.ACCEPTED,
        'Wrong Answer': SubmissionStatus.WRONG_ANSWER,
        'Time Limit Exceeded': SubmissionStatus.TIME_LIMIT_EXCEEDED,
        'Memory Limit Exceeded': SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
        'Runtime Error': SubmissionStatus.RUNTIME_ERROR,
        'Compile Error': SubmissionStatus.COMPILE_ERROR,
        'System Error': SubmissionStatus.SYSTEM_ERROR,
        'Presentation Error': SubmissionStatus.PRESENTATION_ERROR
      }

      // 转换测试用例结果格式
      const convertedTestCases = judgeResult.testCases.map(tc => ({
        testCase: tc.id,
        status: statusMapping[tc.status] || SubmissionStatus.SYSTEM_ERROR,
        timeUsed: tc.timeUsed,
        memoryUsed: tc.memoryUsed,
        score: tc.score,
        input: tc.input,
        output: tc.actualOutput,
        expectedOutput: tc.expectedOutput,
        errorMessage: ''
      }))

      // 更新提交结果
      submission.status = statusMapping[judgeResult.status] || SubmissionStatus.SYSTEM_ERROR
      submission.score = judgeResult.score
      submission.timeUsed = judgeResult.timeUsed
      submission.memoryUsed = judgeResult.memoryUsed
      submission.testCaseResults = convertedTestCases
      submission.compileOutput = judgeResult.compileOutput
      submission.errorMessage = judgeResult.errorMessage
      submission.judgeEndTime = new Date()

      await submission.save()

      // 更新题目统计
      await this.updateProblemStatistics(problem._id, statusMapping[judgeResult.status] || SubmissionStatus.SYSTEM_ERROR)

      // 更新用户统计
      if (statusMapping[judgeResult.status] === SubmissionStatus.ACCEPTED) {
        await this.updateUserStatistics(task.userId, problem._id, judgeResult.score)
      }

      // 通知判题结果
      emitToUser(task.userId, 'submission:result', {
        submissionId: task.submissionId,
        status: submission.status,
        score: submission.score,
        timeUsed: submission.timeUsed,
        memoryUsed: submission.memoryUsed
      })

      // 如果是比赛提交，更新比赛排名
      if (submission.contestId) {
        emitToRoom(`contest:${submission.contestId}`, 'ranking:update', {
          contestId: submission.contestId,
          userId: task.userId
        })
      }

      // 发送邮件通知（如果用户开启了邮件通知）
      await this.sendEmailNotification(task.userId, submission, problem)

    } catch (error) {
      throw error
    }
  }

  // 处理任务错误
  private async handleTaskError(task: JudgeTask, error: any): Promise<void> {
    task.retryCount++
    
    if (task.retryCount <= task.maxRetries) {
      // 重试任务
      console.log(`判题任务重试 ${task.retryCount}/${task.maxRetries}: ${task.id}`)
      
      // 延迟重试
      setTimeout(() => {
        this.queue.unshift(task) // 插入到队列前面
      }, 5000 * task.retryCount) // 递增延迟
      
    } else {
      // 超过最大重试次数，标记为系统错误
      console.error(`判题任务最终失败: ${task.id}`, error)
      
      try {
        const submission = await Submission.findById(task.submissionId)
        if (submission) {
          submission.status = SubmissionStatus.SYSTEM_ERROR
          submission.errorMessage = '系统判题错误，请联系管理员'
          submission.judgeEndTime = new Date()
          await submission.save()

          // 通知用户系统错误
          emitToUser(task.userId, 'submission:error', {
            submissionId: task.submissionId,
            message: '系统判题错误，请联系管理员'
          })
        }
      } catch (updateError) {
        console.error('更新提交状态失败:', updateError)
      }
    }
  }

  // 更新题目统计
  private async updateProblemStatistics(problemId: string, status: SubmissionStatus): Promise<void> {
    try {
      const problem = await Problem.findByPk(problemId)
      if (problem) {
        const stats = problem.stats
        stats.totalSubmissions += 1
        
        if (status === SubmissionStatus.ACCEPTED) {
          stats.acceptedSubmissions += 1
        }
        
        await problem.update({ stats })
      }
    } catch (error) {
      console.error('更新题目统计失败:', error)
    }
  }

  // 更新用户统计
  private async updateUserStatistics(userId: string, problemId: string, score: number): Promise<void> {
    try {
      // TODO: 实现MySQL用户统计更新
      console.log(`TODO: 更新用户 ${userId} 的统计信息，题目 ${problemId}，得分 ${score}`)
      /*
      // 检查是否是用户首次通过此题
      const previousAccepted = await Submission.findOne({
        where: {
          userId,
          problemId,
          status: SubmissionStatus.ACCEPTED
        }
      })

      if (!previousAccepted) {
        // 更新用户统计
        // await User.increment(['solvedProblems', 'totalScore'], {
        //   by: [1, score],
        //   where: { id: userId }
        // })
      }
      */
    } catch (error) {
      console.error('更新用户统计失败:', error)
    }
  }

  // 发送邮件通知
  private async sendEmailNotification(userId: string, submission: any, problem: any): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (user && user.emailNotifications) {
        await sendSubmissionResultNotification(
          user.email,
          user.username,
          problem.title,
          submission._id,
          submission.status,
          submission.score
        )
      }
    } catch (error) {
      console.error('发送邮件通知失败:', error)
    }
  }

  // 清理过期任务
  cleanupExpiredTasks(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = new Date()
    const initialLength = this.queue.length
    
    this.queue = this.queue.filter(task => {
      const age = now.getTime() - task.createdAt.getTime()
      return age < maxAge
    })
    
    const removedCount = initialLength - this.queue.length
    if (removedCount > 0) {
      console.log(`清理了 ${removedCount} 个过期判题任务`)
      this.emit('tasksCleanedUp', removedCount)
    }
    
    return removedCount
  }

  // 获取队列统计信息
  getStatistics() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentTasks = this.queue.filter(task => task.createdAt > oneHourAgo)
    const priorityDistribution = this.queue.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    return {
      total: this.queue.length,
      processing: this.currentProcessing,
      recent: recentTasks.length,
      priorityDistribution,
      averageWaitTime: this.calculateAverageWaitTime(),
      isRunning: this.isRunning
    }
  }

  // 计算平均等待时间
  private calculateAverageWaitTime(): number {
    if (this.queue.length === 0) return 0
    
    const now = new Date()
    const totalWaitTime = this.queue.reduce((sum, task) => {
      return sum + (now.getTime() - task.createdAt.getTime())
    }, 0)
    
    return Math.round(totalWaitTime / this.queue.length)
  }
}

// 创建全局判题队列实例
export const judgeQueue = new JudgeQueue(parseInt(process.env.JUDGE_CONCURRENT_LIMIT || '3'))

// 启动时自动开始处理队列
judgeQueue.start()

// 定期清理过期任务
setInterval(() => {
  judgeQueue.cleanupExpiredTasks()
}, 60 * 60 * 1000) // 每小时清理一次

// 导出队列管理函数
export const addJudgeTask = (submissionId: string, userId: string, problemId: string, priority: number = 0): string => {
  return judgeQueue.addTask(submissionId, userId, problemId, priority)
}

export const removeJudgeTask = (taskId: string): boolean => {
  return judgeQueue.removeTask(taskId)
}

export const getJudgeQueueInfo = () => {
  return judgeQueue.getQueueInfo()
}

export const getJudgeQueueStatistics = () => {
  return judgeQueue.getStatistics()
}

export const getTaskStatus = (taskId: string) => {
  return judgeQueue.getTaskStatus(taskId)
}

export default judgeQueue