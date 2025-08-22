import mongoose, { Document, Schema } from 'mongoose';

// 提交状态枚举
export enum SubmissionStatus {
  PENDING = 'Pending',
  JUDGING = 'Judging',
  ACCEPTED = 'Accepted',
  WRONG_ANSWER = 'Wrong Answer',
  TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED = 'Memory Limit Exceeded',
  OUTPUT_LIMIT_EXCEEDED = 'Output Limit Exceeded',
  RUNTIME_ERROR = 'Runtime Error',
  COMPILE_ERROR = 'Compile Error',
  SYSTEM_ERROR = 'System Error',
  PRESENTATION_ERROR = 'Presentation Error'
}

// 编程语言枚举
export enum ProgrammingLanguage {
  CPP = 'cpp',
  C = 'c',
  JAVA = 'java',
  PYTHON = 'python',
  JAVASCRIPT = 'javascript'
}

// 测试点结果接口
export interface ITestResult {
  testCase: number;
  status: SubmissionStatus;
  timeUsed: number; // 毫秒
  memoryUsed: number; // KB
  score?: number; // OI模式下的得分
  errorMessage?: string;
}

// 编译信息接口
export interface ICompileInfo {
  success: boolean;
  message?: string;
  timeUsed?: number;
}

// 提交记录接口
export interface ISubmission extends Document {
  user: mongoose.Types.ObjectId;
  problem: mongoose.Types.ObjectId;
  contest?: mongoose.Types.ObjectId;
  
  code: string;
  language: ProgrammingLanguage;
  
  status: SubmissionStatus;
  score: number; // 总分（OI模式）或0/100（ACM模式）
  
  // 资源使用情况
  timeUsed: number; // 最大时间（毫秒）
  memoryUsed: number; // 最大内存（KB）
  
  // 详细结果
  testResults: ITestResult[];
  compileInfo: ICompileInfo;
  
  // 判题信息
  judgeServer?: string;
  judgeTime?: Date;
  
  // IP地址
  ipAddress?: string;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

// 测试点结果模式
const TestResultSchema = new Schema<ITestResult>({
  testCase: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: Object.values(SubmissionStatus),
    required: true
  },
  timeUsed: {
    type: Number,
    required: true,
    min: 0
  },
  memoryUsed: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  errorMessage: {
    type: String,
    maxlength: [1000, '错误信息最多1000个字符']
  }
}, { _id: false });

// 编译信息模式
const CompileInfoSchema = new Schema<ICompileInfo>({
  success: {
    type: Boolean,
    required: true,
    default: false
  },
  message: {
    type: String,
    maxlength: [2000, '编译信息最多2000个字符']
  },
  timeUsed: {
    type: Number,
    min: 0,
    default: 0
  }
}, { _id: false });

// 提交记录模式
const SubmissionSchema = new Schema<ISubmission>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  problem: {
    type: Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, '题目ID不能为空']
  },
  contest: {
    type: Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  
  code: {
    type: String,
    required: [true, '代码不能为空'],
    maxlength: [100000, '代码最多100000个字符']
  },
  language: {
    type: String,
    enum: Object.values(ProgrammingLanguage),
    required: [true, '编程语言不能为空']
  },
  
  status: {
    type: String,
    enum: Object.values(SubmissionStatus),
    default: SubmissionStatus.PENDING
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // 资源使用情况
  timeUsed: {
    type: Number,
    min: 0,
    default: 0
  },
  memoryUsed: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // 详细结果
  testResults: {
    type: [TestResultSchema],
    default: []
  },
  compileInfo: {
    type: CompileInfoSchema,
    default: () => ({ success: false })
  },
  
  // 判题信息
  judgeServer: {
    type: String,
    maxlength: [100, '判题服务器名称最多100个字符']
  },
  judgeTime: {
    type: Date,
    default: null
  },
  
  // IP地址
  ipAddress: {
    type: String,
    maxlength: [45, 'IP地址最多45个字符'] // IPv6最长
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
SubmissionSchema.index({ user: 1 });
SubmissionSchema.index({ problem: 1 });
SubmissionSchema.index({ contest: 1 });
SubmissionSchema.index({ status: 1 });
SubmissionSchema.index({ language: 1 });
SubmissionSchema.index({ createdAt: -1 });
SubmissionSchema.index({ judgeTime: -1 });

// 复合索引
SubmissionSchema.index({ user: 1, problem: 1 });
SubmissionSchema.index({ user: 1, createdAt: -1 });
SubmissionSchema.index({ problem: 1, status: 1 });
SubmissionSchema.index({ contest: 1, user: 1 });
SubmissionSchema.index({ contest: 1, createdAt: -1 });

// 虚拟字段：是否通过
SubmissionSchema.virtual('isAccepted').get(function() {
  return this.status === SubmissionStatus.ACCEPTED;
});

// 虚拟字段：通过的测试点数量
SubmissionSchema.virtual('passedTests').get(function() {
  return this.testResults.filter(result => result.status === SubmissionStatus.ACCEPTED).length;
});

// 虚拟字段：总测试点数量
SubmissionSchema.virtual('totalTests').get(function() {
  return this.testResults.length;
});

// 中间件：提交后更新用户和题目统计
SubmissionSchema.post('save', async function(doc) {
  try {
    // 更新用户统计
    const User = mongoose.model('User');
    const user = await User.findById(doc.user);
    if (user) {
      // 更新总提交数
      user.totalSubmissions = await mongoose.model('Submission').countDocuments({ user: doc.user });
      
      // 更新通过提交数
      user.acceptedSubmissions = await mongoose.model('Submission').countDocuments({
        user: doc.user,
        status: SubmissionStatus.ACCEPTED
      });
      
      // 更新解决的题目列表
      if (doc.status === SubmissionStatus.ACCEPTED && !user.solvedProblems.includes(doc.problem)) {
        user.solvedProblems.push(doc.problem);
      }
      
      await user.save();
    }
    
    // 更新题目统计
    const Problem = mongoose.model('Problem');
    const problem = await Problem.findById(doc.problem);
    if (problem && typeof problem.updateStats === 'function') {
      await problem.updateStats();
    }
  } catch (error) {
    console.error('更新统计信息失败:', error);
  }
});

// 静态方法：获取用户在某题目上的最佳提交
SubmissionSchema.statics.getBestSubmission = function(userId: mongoose.Types.ObjectId, problemId: mongoose.Types.ObjectId) {
  return this.findOne({
    user: userId,
    problem: problemId,
    status: SubmissionStatus.ACCEPTED
  }).sort({ score: -1, timeUsed: 1, memoryUsed: 1, createdAt: 1 });
};

// 静态方法：获取题目的通过率
SubmissionSchema.statics.getAcceptanceRate = async function(problemId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { problem: problemId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: {
          $sum: {
            $cond: [{ $eq: ['$status', SubmissionStatus.ACCEPTED] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) return 0;
  return Math.round((stats[0].accepted / stats[0].total) * 100);
};

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;