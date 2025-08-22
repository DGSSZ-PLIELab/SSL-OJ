import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/mysql'

// 提交状态枚举
export enum SubmissionStatus {
  PENDING = 'pending',           // 等待判题
  JUDGING = 'judging',          // 正在判题
  ACCEPTED = 'accepted',         // 通过
  WRONG_ANSWER = 'wrong_answer', // 答案错误
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded', // 超时
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded', // 内存超限
  RUNTIME_ERROR = 'runtime_error', // 运行时错误
  COMPILE_ERROR = 'compile_error', // 编译错误
  PRESENTATION_ERROR = 'presentation_error', // 格式错误
  SYSTEM_ERROR = 'system_error'   // 系统错误
}

// 编程语言枚举
export enum Language {
  C = 'c',
  CPP = 'cpp',
  JAVA = 'java',
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  GO = 'go',
  RUST = 'rust'
}

// 测试点结果接口
export interface TestCaseResult {
  testCase: number           // 测试点编号
  status: SubmissionStatus   // 测试点状态
  timeUsed: number          // 运行时间（毫秒）
  memoryUsed: number        // 内存使用（KB）
  score: number             // 得分
  input?: string            // 输入数据（可选，用于调试）
  output?: string           // 程序输出（可选，用于调试）
  expectedOutput?: string   // 期望输出（可选，用于调试）
  errorMessage?: string     // 错误信息（如果有）
}

// 判题结果接口
export interface JudgeResult {
  status: SubmissionStatus   // 最终状态
  score: number             // 总分
  timeUsed: number          // 最大运行时间
  memoryUsed: number        // 最大内存使用
  testCases: TestCaseResult[] // 各测试点结果
  compileOutput?: string    // 编译输出
  judgeOutput?: string      // 判题系统输出
  errorMessage?: string     // 错误信息
}

// 提交属性接口
export interface SubmissionAttributes {
  id: number
  submissionId: string      // 提交ID（自动生成）
  userId: number            // 用户ID
  problemId: string         // 题目ID
  contestId?: number        // 比赛ID（可选）
  language: Language        // 编程语言
  code: string             // 源代码
  status: SubmissionStatus  // 提交状态
  result?: JudgeResult     // 判题结果
  isPublic: boolean        // 是否公开（其他用户可查看）
  ip: string               // 提交IP地址
  userAgent?: string       // 用户代理
  submittedAt: Date        // 提交时间
  judgedAt?: Date          // 判题完成时间
  judgeStartTime?: Date    // 判题开始时间
  judgeEndTime?: Date      // 判题结束时间
  score?: number           // 得分
  timeUsed?: number        // 运行时间
  memoryUsed?: number      // 内存使用
  testCaseResults?: TestCaseResult[] // 测试用例结果
  compileOutput?: string   // 编译输出
  errorMessage?: string    // 错误信息
  createdAt: Date
  updatedAt: Date
}

// 创建提交时的可选属性
export interface SubmissionCreationAttributes extends Optional<SubmissionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'judgedAt' | 'judgeStartTime' | 'judgeEndTime' | 'submittedAt'> {}

// Submission模型类
export class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes> implements SubmissionAttributes {
  public id!: number
  public submissionId!: string
  public userId!: number
  public problemId!: string
  public contestId?: number
  public language!: Language
  public code!: string
  public status!: SubmissionStatus
  public result?: JudgeResult
  public isPublic!: boolean
  public ip!: string
  public userAgent?: string
  public submittedAt!: Date
  public judgedAt?: Date
  public judgeStartTime?: Date
  public judgeEndTime?: Date
  public score?: number
  public timeUsed?: number
  public memoryUsed?: number
  public testCaseResults?: TestCaseResult[]
  public compileOutput?: string
  public errorMessage?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 虚拟属性：是否通过
  public get isAccepted(): boolean {
    return this.status === SubmissionStatus.ACCEPTED
  }

  // 虚拟属性：执行时间
  public get executionTime(): number {
    return this.result?.timeUsed || 0
  }

  // 更新判题结果
  public async updateResult(result: JudgeResult): Promise<Submission> {
    this.result = result
    this.status = result.status
    this.judgedAt = new Date()
    this.score = result.score
    this.timeUsed = result.timeUsed
    this.memoryUsed = result.memoryUsed
    this.testCaseResults = result.testCases
    this.compileOutput = result.compileOutput
    this.errorMessage = result.errorMessage
    return await this.save()
  }

  // 获取公开信息
  public getPublicInfo(): object {
    return {
      submissionId: this.submissionId,
      userId: this.userId,
      problemId: this.problemId,
      contestId: this.contestId,
      language: this.language,
      status: this.status,
      score: this.result?.score || 0,
      timeUsed: this.result?.timeUsed || 0,
      memoryUsed: this.result?.memoryUsed || 0,
      submittedAt: this.submittedAt,
      judgedAt: this.judgedAt,
      isAccepted: this.isAccepted
    }
  }

  // 静态方法：生成提交ID
  public static async generateSubmissionId(): Promise<string> {
    const count = await Submission.count()
    return `S${(count + 1).toString().padStart(6, '0')}`
  }

  // 静态方法：根据用户和题目查找提交
  public static async findByUserAndProblem(userId: number, problemId: string, options: any = {}) {
    return await Submission.findAll({
      where: { userId, problemId },
      order: [['submittedAt', 'DESC']],
      limit: options.limit || 50
    })
  }

  // 静态方法：获取用户统计信息
  public static async getUserStats(userId: number) {
    const totalSubmissions = await Submission.count({ where: { userId } })
    const acceptedSubmissions = await Submission.count({ 
      where: { 
        userId, 
        status: SubmissionStatus.ACCEPTED 
      } 
    })
    
    // 获取解决的题目数量（去重）
    const solvedProblems = await Submission.findAll({
      where: { 
        userId, 
        status: SubmissionStatus.ACCEPTED 
      },
      attributes: ['problemId'],
      group: ['problemId']
    })
    
    return {
      totalSubmissions,
      acceptedSubmissions,
      solvedProblemsCount: solvedProblems.length
    }
  }

  // 静态方法：获取题目统计信息
  public static async getProblemStats(problemId: string) {
    const totalSubmissions = await Submission.count({ where: { problemId } })
    const acceptedSubmissions = await Submission.count({ 
      where: { 
        problemId, 
        status: SubmissionStatus.ACCEPTED 
      } 
    })
    
    // 获取解决该题目的用户数量（去重）
    const uniqueSolvers = await Submission.findAll({
      where: { 
        problemId, 
        status: SubmissionStatus.ACCEPTED 
      },
      attributes: ['userId'],
      group: ['userId']
    })
    
    return {
      totalSubmissions,
      acceptedSubmissions,
      uniqueSolversCount: uniqueSolvers.length
    }
  }

  // 静态方法：获取最近提交
  public static async getRecentSubmissions(limit: number = 20) {
    return await Submission.findAll({
      where: { isPublic: true },
      order: [['submittedAt', 'DESC']],
      limit,
      attributes: ['submissionId', 'problemId', 'language', 'status', 'score', 'timeUsed', 'submittedAt', 'userId']
    })
  }
}

// 定义表结构
Submission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    submissionId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    problemId: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    contestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'contests',
        key: 'id'
      }
    },
    language: {
      type: DataTypes.ENUM(...Object.values(Language)),
      allowNull: false
    },
    code: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        len: [1, 100000] // 最大100KB代码
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubmissionStatus)),
      allowNull: false,
      defaultValue: SubmissionStatus.PENDING
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ip: {
      type: DataTypes.STRING(45), // 支持IPv6
      allowNull: false
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    judgedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    judgeStartTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    judgeEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    timeUsed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    memoryUsed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    testCaseResults: {
      type: DataTypes.JSON,
      allowNull: true
    },
    compileOutput: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Submission',
    tableName: 'submissions',
    timestamps: true,
    indexes: [
      { fields: ['submissionId'], unique: true },
      { fields: ['userId'] },
      { fields: ['problemId'] },
      { fields: ['contestId'] },
      { fields: ['status'] },
      { fields: ['submittedAt'] },
      { fields: ['userId', 'submittedAt'] },
      { fields: ['problemId', 'status'] },
      { fields: ['contestId', 'submittedAt'] },
      { fields: ['status', 'submittedAt'] }
    ],
    hooks: {
      beforeCreate: async (submission: Submission) => {
        if (!submission.submissionId) {
          submission.submissionId = await Submission.generateSubmissionId()
        }
      }
    }
  }
)

export default Submission