import mongoose, { Document, Schema } from 'mongoose';

// 题目难度枚举
export enum ProblemDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// 题目状态枚举
export enum ProblemStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden'
}

// 判题模式枚举
export enum JudgeMode {
  ACM = 'acm', // ACM模式：错误即停止
  OI = 'oi'    // OI模式：所有测试点都测试
}

// 测试用例接口
export interface ITestCase {
  input: string;
  output: string;
  score?: number; // OI模式下的分数
  isSample?: boolean; // 是否为样例
}

// 资源限制接口
export interface IResourceLimit {
  timeLimit: number; // 时间限制（毫秒）
  memoryLimit: number; // 内存限制（MB）
  outputLimit: number; // 输出限制（MB）
}

// 题目接口
export interface IProblem extends Document {
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  hint?: string;
  
  difficulty: ProblemDifficulty;
  status: ProblemStatus;
  judgeMode: JudgeMode;
  
  tags: string[];
  source?: string;
  author: mongoose.Types.ObjectId;
  
  // 资源限制
  resourceLimit: IResourceLimit;
  
  // 测试用例
  testCases: ITestCase[];
  
  // 统计信息
  totalSubmissions: number;
  acceptedSubmissions: number;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

// 测试用例模式
const TestCaseSchema = new Schema<ITestCase>({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isSample: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// 资源限制模式
const ResourceLimitSchema = new Schema<IResourceLimit>({
  timeLimit: {
    type: Number,
    required: true,
    min: 100,
    max: 10000,
    default: 1000
  },
  memoryLimit: {
    type: Number,
    required: true,
    min: 16,
    max: 512,
    default: 128
  },
  outputLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 64,
    default: 16
  }
}, { _id: false });

// 题目模式
const ProblemSchema = new Schema<IProblem>({
  title: {
    type: String,
    required: [true, '题目标题不能为空'],
    trim: true,
    maxlength: [200, '题目标题最多200个字符']
  },
  description: {
    type: String,
    required: [true, '题目描述不能为空'],
    maxlength: [10000, '题目描述最多10000个字符']
  },
  inputFormat: {
    type: String,
    required: [true, '输入格式不能为空'],
    maxlength: [2000, '输入格式最多2000个字符']
  },
  outputFormat: {
    type: String,
    required: [true, '输出格式不能为空'],
    maxlength: [2000, '输出格式最多2000个字符']
  },
  sampleInput: {
    type: String,
    required: [true, '样例输入不能为空'],
    maxlength: [1000, '样例输入最多1000个字符']
  },
  sampleOutput: {
    type: String,
    required: [true, '样例输出不能为空'],
    maxlength: [1000, '样例输出最多1000个字符']
  },
  hint: {
    type: String,
    maxlength: [2000, '提示最多2000个字符'],
    default: ''
  },
  
  difficulty: {
    type: String,
    enum: Object.values(ProblemDifficulty),
    required: true,
    default: ProblemDifficulty.EASY
  },
  status: {
    type: String,
    enum: Object.values(ProblemStatus),
    default: ProblemStatus.DRAFT
  },
  judgeMode: {
    type: String,
    enum: Object.values(JudgeMode),
    default: JudgeMode.ACM
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '标签最多50个字符']
  }],
  source: {
    type: String,
    trim: true,
    maxlength: [200, '题目来源最多200个字符']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 资源限制
  resourceLimit: {
    type: ResourceLimitSchema,
    required: true,
    default: () => ({})
  },
  
  // 测试用例
  testCases: {
    type: [TestCaseSchema],
    validate: {
      validator: function(testCases: ITestCase[]) {
        return testCases.length > 0;
      },
      message: '至少需要一个测试用例'
    }
  },
  
  // 统计信息
  totalSubmissions: {
    type: Number,
    default: 0,
    min: 0
  },
  acceptedSubmissions: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
ProblemSchema.index({ title: 1 });
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ status: 1 });
ProblemSchema.index({ tags: 1 });
ProblemSchema.index({ author: 1 });
ProblemSchema.index({ createdAt: -1 });
ProblemSchema.index({ totalSubmissions: -1 });
ProblemSchema.index({ acceptedSubmissions: -1 });

// 复合索引
ProblemSchema.index({ status: 1, difficulty: 1 });
ProblemSchema.index({ status: 1, createdAt: -1 });

// 虚拟字段：通过率
ProblemSchema.virtual('acceptanceRate').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100);
});

// 虚拟字段：题目编号（基于创建时间）
ProblemSchema.virtual('problemId').get(function() {
  return this._id.toString().slice(-6).toUpperCase();
});

// 中间件：更新统计信息
ProblemSchema.methods.updateStats = async function() {
  const Submission = mongoose.model('Submission');
  
  const stats = await Submission.aggregate([
    { $match: { problem: this._id } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.totalSubmissions = stats[0].totalSubmissions;
    this.acceptedSubmissions = stats[0].acceptedSubmissions;
  } else {
    this.totalSubmissions = 0;
    this.acceptedSubmissions = 0;
  }
  
  await this.save();
};

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
export default Problem;