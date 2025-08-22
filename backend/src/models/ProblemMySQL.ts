import { DataTypes, Model, Optional, Op } from 'sequelize'
import sequelize from '../database/mysql'

// 题目难度枚举
export enum ProblemDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

// 题目状态枚举
export enum ProblemStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 测试用例接口
export interface ITestCase {
  input: string
  output: string
  isHidden: boolean
  timeLimit?: number
  memoryLimit?: number
}

// 题目统计信息接口
export interface IProblemStats {
  totalSubmissions: number
  acceptedSubmissions: number
  acceptanceRate: number
  difficulty: number
}

// 题目属性接口
export interface ProblemAttributes {
  id: number
  problemId: string
  title: string
  description: string
  inputFormat: string
  outputFormat: string
  constraints?: string
  difficulty: ProblemDifficulty
  status: ProblemStatus
  category: string
  tags: string[] // 存储为JSON
  timeLimit: number
  memoryLimit: number
  testCases: ITestCase[] // 存储为JSON
  sampleCases: ITestCase[] // 存储为JSON
  stats: IProblemStats // 存储为JSON
  authorId: number
  maintainerIds: number[] // 存储为JSON
  source?: string
  sourceUrl?: string
  hints: string[] // 存储为JSON
  solution?: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 创建题目时的可选属性
export interface ProblemCreationAttributes extends Optional<ProblemAttributes, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> {}

// Problem模型类
export class Problem extends Model<ProblemAttributes, ProblemCreationAttributes> implements ProblemAttributes {
  public id!: number
  public problemId!: string
  public title!: string
  public description!: string
  public inputFormat!: string
  public outputFormat!: string
  public constraints?: string
  public difficulty!: ProblemDifficulty
  public status!: ProblemStatus
  public category!: string
  public tags!: string[]
  public timeLimit!: number
  public memoryLimit!: number
  public testCases!: ITestCase[]
  public sampleCases!: ITestCase[]
  public stats!: IProblemStats
  public authorId!: number
  public maintainerIds!: number[]
  public source?: string
  public sourceUrl?: string
  public hints!: string[]
  public solution?: string
  public publishedAt?: Date
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 虚拟属性：是否已发布
  public get isPublished(): boolean {
    return this.status === ProblemStatus.PUBLISHED && this.publishedAt != null
  }

  // 虚拟属性：难度分数
  public get difficultyScore(): number {
    const baseScore = {
      [ProblemDifficulty.EASY]: 1,
      [ProblemDifficulty.MEDIUM]: 2,
      [ProblemDifficulty.HARD]: 3
    }[this.difficulty]
    
    // 根据通过率调整难度分数
    const acceptanceRate = this.stats.acceptanceRate
    let adjustment = 0
    if (acceptanceRate < 20) adjustment = 1
    else if (acceptanceRate < 50) adjustment = 0.5
    else if (acceptanceRate > 80) adjustment = -0.5
    
    return Math.max(1, Math.min(5, baseScore + adjustment))
  }

  // 更新统计信息
  public async updateStats(): Promise<void> {
    // 这里需要查询提交表来计算统计信息
    // 暂时保留原有逻辑，后续实现提交表后再完善
    const totalSubmissions = this.stats.totalSubmissions
    const acceptedSubmissions = this.stats.acceptedSubmissions
    const acceptanceRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0
    
    this.stats = {
      ...this.stats,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100
    }
    
    await this.save()
  }

  // 检查用户是否可见
  public isVisibleTo(userId: number, userRole: string): boolean {
    // 管理员可以看到所有题目
    if (userRole === 'admin') {
      return true
    }
    
    // 作者和维护者可以看到自己的题目
    if (this.authorId === userId || this.maintainerIds.includes(userId)) {
      return true
    }
    
    // 普通用户只能看到已发布的题目
    return this.status === ProblemStatus.PUBLISHED
  }

  // 静态方法：获取下一个题目ID
  public static async getNextProblemId(): Promise<string> {
    const lastProblem = await Problem.findOne({
      order: [['problemId', 'DESC']]
    })
    
    if (!lastProblem) {
      return 'P1001'
    }
    
    const lastId = parseInt(lastProblem.problemId.substring(1))
    const nextId = lastId + 1
    return `P${nextId.toString().padStart(4, '0')}`
  }

  // 静态方法：搜索题目
  public static async search(query: string, options: any = {}) {
    const { limit = 20, offset = 0, difficulty, category, status } = options
    
    const whereClause: any = {}
    
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { problemId: { [Op.like]: `%${query}%` } }
      ]
    }
    
    if (difficulty) {
      whereClause.difficulty = difficulty
    }
    
    if (category) {
      whereClause.category = category
    }
    
    if (status) {
      whereClause.status = status
    }
    
    return await Problem.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    })
  }
}

// 定义表结构
Problem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    problemId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: /^P\d{4,}$/,
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 10000]
      }
    },
    inputFormat: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000]
      }
    },
    outputFormat: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000]
      }
    },
    constraints: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    difficulty: {
      type: DataTypes.ENUM(...Object.values(ProblemDifficulty)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProblemStatus)),
      allowNull: false,
      defaultValue: ProblemStatus.DRAFT
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 100,
        max: 10000
      }
    },
    memoryLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 16,
        max: 512
      }
    },
    testCases: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    sampleCases: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    stats: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        difficulty: 0
      }
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    maintainerIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    source: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: [0, 200]
      }
    },
    sourceUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    hints: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    solution: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 10000]
      }
    },
    publishedAt: {
      type: DataTypes.DATE,
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
    modelName: 'Problem',
    tableName: 'problems',
    timestamps: true,
    indexes: [
      { fields: ['problemId'], unique: true },
      { fields: ['status', 'difficulty'] },
      { fields: ['category'] },
      { fields: ['authorId'] },
      { fields: ['createdAt'] },
      { fields: ['publishedAt'] }
    ]
  }
)

export default Problem