import mongoose, { Document, Schema } from 'mongoose';

// 比赛类型枚举
export enum ContestType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PROTECTED = 'protected' // 需要密码
}

// 比赛状态枚举
export enum ContestStatus {
  UPCOMING = 'upcoming',
  RUNNING = 'running',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

// 比赛模式枚举
export enum ContestMode {
  ACM = 'acm',
  OI = 'oi'
}

// 比赛题目接口
export interface IContestProblem {
  problem: mongoose.Types.ObjectId;
  label: string; // A, B, C, D...
  score?: number; // OI模式下的分值
}

// 比赛参与者接口
export interface IContestParticipant {
  user: mongoose.Types.ObjectId;
  joinTime: Date;
  isOfficial: boolean; // 是否正式参赛（非打星）
}

// 比赛排名接口
export interface IContestRanking {
  user: mongoose.Types.ObjectId;
  rank: number;
  score: number;
  penalty: number; // 罚时（分钟）
  solvedCount: number;
  problemResults: {
    problem: mongoose.Types.ObjectId;
    label: string;
    status: 'accepted' | 'wrong' | 'pending' | 'not_attempted';
    score: number;
    attempts: number;
    acceptTime?: number; // 通过时间（分钟）
    penalty: number;
  }[];
}

// 比赛接口
export interface IContest extends Document {
  title: string;
  description: string;
  type: ContestType;
  mode: ContestMode;
  password?: string;
  
  // 时间设置
  startTime: Date;
  endTime: Date;
  duration: number; // 持续时间（分钟）
  
  // 创建者和管理员
  creator: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  
  // 题目设置
  problems: IContestProblem[];
  
  // 参与者
  participants: IContestParticipant[];
  
  // 设置选项
  allowViewOthersCode: boolean; // 是否允许查看他人代码
  allowViewRanking: boolean; // 是否允许查看排行榜
  freezeTime?: number; // 封榜时间（比赛结束前多少分钟）
  
  // 统计信息
  totalParticipants: number;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  getStatus(): ContestStatus;
  canJoin(userId: mongoose.Types.ObjectId): boolean;
  getRanking(): Promise<IContestRanking[]>;
}

// 比赛题目模式
const ContestProblemSchema = new Schema<IContestProblem>({
  problem: {
    type: Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  label: {
    type: String,
    required: true,
    match: /^[A-Z]$/
  },
  score: {
    type: Number,
    min: 0,
    max: 1000,
    default: 100
  }
}, { _id: false });

// 比赛参与者模式
const ContestParticipantSchema = new Schema<IContestParticipant>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinTime: {
    type: Date,
    default: Date.now
  },
  isOfficial: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// 比赛模式
const ContestSchema = new Schema<IContest>({
  title: {
    type: String,
    required: [true, '比赛标题不能为空'],
    trim: true,
    maxlength: [200, '比赛标题最多200个字符']
  },
  description: {
    type: String,
    required: [true, '比赛描述不能为空'],
    maxlength: [5000, '比赛描述最多5000个字符']
  },
  type: {
    type: String,
    enum: Object.values(ContestType),
    default: ContestType.PUBLIC
  },
  mode: {
    type: String,
    enum: Object.values(ContestMode),
    default: ContestMode.ACM
  },
  password: {
    type: String,
    maxlength: [50, '比赛密码最多50个字符'],
    select: false // 默认查询时不返回密码
  },
  
  // 时间设置
  startTime: {
    type: Date,
    required: [true, '开始时间不能为空']
  },
  endTime: {
    type: Date,
    required: [true, '结束时间不能为空']
  },
  duration: {
    type: Number,
    required: true,
    min: [30, '比赛时长至少30分钟'],
    max: [10080, '比赛时长最多7天'] // 7天 = 7 * 24 * 60分钟
  },
  
  // 创建者和管理员
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 题目设置
  problems: {
    type: [ContestProblemSchema],
    validate: {
      validator: function(problems: IContestProblem[]) {
        return problems.length > 0 && problems.length <= 26;
      },
      message: '比赛题目数量必须在1-26之间'
    }
  },
  
  // 参与者
  participants: {
    type: [ContestParticipantSchema],
    default: []
  },
  
  // 设置选项
  allowViewOthersCode: {
    type: Boolean,
    default: false
  },
  allowViewRanking: {
    type: Boolean,
    default: true
  },
  freezeTime: {
    type: Number,
    min: 0,
    max: 300, // 最多封榜5小时
    default: 0
  },
  
  // 统计信息
  totalParticipants: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
ContestSchema.index({ title: 1 });
ContestSchema.index({ type: 1 });
ContestSchema.index({ creator: 1 });
ContestSchema.index({ startTime: 1 });
ContestSchema.index({ endTime: 1 });
ContestSchema.index({ createdAt: -1 });
ContestSchema.index({ 'participants.user': 1 });

// 复合索引
ContestSchema.index({ type: 1, startTime: 1 });
ContestSchema.index({ startTime: 1, endTime: 1 });

// 验证：结束时间必须晚于开始时间
ContestSchema.pre('validate', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('结束时间必须晚于开始时间'));
  } else {
    // 自动计算持续时间
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    next();
  }
});

// 验证：题目标签不能重复
ContestSchema.pre('validate', function(next) {
  const labels = this.problems.map(p => p.label);
  const uniqueLabels = new Set(labels);
  if (labels.length !== uniqueLabels.size) {
    next(new Error('题目标签不能重复'));
  } else {
    next();
  }
});

// 方法：获取比赛状态
ContestSchema.methods.getStatus = function(): ContestStatus {
  const now = new Date();
  if (now < this.startTime) {
    return ContestStatus.UPCOMING;
  } else if (now >= this.startTime && now < this.endTime) {
    return ContestStatus.RUNNING;
  } else {
    return ContestStatus.ENDED;
  }
};

// 方法：检查用户是否可以参加比赛
ContestSchema.methods.canJoin = function(userId: mongoose.Types.ObjectId): boolean {
  const status = this.getStatus();
  if (status === ContestStatus.ENDED || status === ContestStatus.CANCELLED) {
    return false;
  }
  
  // 检查是否已经参加
  const isParticipant = this.participants.some((p: IContestParticipant) => 
    p.user.toString() === userId.toString()
  );
  
  return !isParticipant;
};

// 方法：获取排行榜
ContestSchema.methods.getRanking = async function(): Promise<IContestRanking[]> {
  const Submission = mongoose.model('Submission');
  
  // 获取比赛期间的所有提交
  const submissions = await Submission.find({
    contest: this._id,
    createdAt: {
      $gte: this.startTime,
      $lte: this.endTime
    }
  }).populate('user', 'username realName').sort({ createdAt: 1 });
  
  // 计算排名逻辑（这里简化处理）
  const userStats = new Map();
  
  // 初始化用户统计
  this.participants.forEach((participant: IContestParticipant) => {
    userStats.set(participant.user.toString(), {
      user: participant.user,
      rank: 0,
      score: 0,
      penalty: 0,
      solvedCount: 0,
      problemResults: this.problems.map(p => ({
        problem: p.problem,
        label: p.label,
        status: 'not_attempted' as const,
        score: 0,
        attempts: 0,
        penalty: 0
      }))
    });
  });
  
  // 处理提交记录
  submissions.forEach(submission => {
    const userId = submission.user._id.toString();
    const userStat = userStats.get(userId);
    if (!userStat) return;
    
    const problemIndex = this.problems.findIndex(p => 
      p.problem.toString() === submission.problem.toString()
    );
    if (problemIndex === -1) return;
    
    const problemResult = userStat.problemResults[problemIndex];
    problemResult.attempts++;
    
    if (submission.status === 'Accepted' && problemResult.status !== 'accepted') {
      problemResult.status = 'accepted';
      problemResult.score = this.mode === ContestMode.OI ? submission.score : 100;
      problemResult.acceptTime = Math.round(
        (submission.createdAt.getTime() - this.startTime.getTime()) / (1000 * 60)
      );
      
      userStat.solvedCount++;
      userStat.score += problemResult.score;
      
      if (this.mode === ContestMode.ACM) {
        // ACM模式：罚时 = 通过时间 + (错误次数 * 20分钟)
        problemResult.penalty = problemResult.acceptTime + (problemResult.attempts - 1) * 20;
        userStat.penalty += problemResult.penalty;
      }
    } else if (problemResult.status === 'not_attempted') {
      problemResult.status = 'wrong';
    }
  });
  
  // 排序并分配排名
  const rankings = Array.from(userStats.values()).sort((a, b) => {
    if (this.mode === ContestMode.ACM) {
      // ACM模式：按解题数降序，罚时升序
      if (a.solvedCount !== b.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      return a.penalty - b.penalty;
    } else {
      // OI模式：按总分降序
      return b.score - a.score;
    }
  });
  
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });
  
  return rankings;
};

// 中间件：更新参与者数量
ContestSchema.pre('save', function(next) {
  this.totalParticipants = this.participants.length;
  next();
});

export const Contest = mongoose.model<IContest>('Contest', ContestSchema);
export default Contest;