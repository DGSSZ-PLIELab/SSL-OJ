import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// 用户角色枚举
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

// 用户接口
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  realName: string;
  studentId?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  bio?: string;
  school: string;
  grade?: string;
  class?: string;
  
  // 统计信息
  solvedProblems: mongoose.Types.ObjectId[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  rating: number;
  
  // 时间戳
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

// 用户模式
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 默认查询时不返回密码
  },
  realName: {
    type: String,
    required: [true, '真实姓名不能为空'],
    trim: true,
    maxlength: [50, '真实姓名最多50个字符']
  },
  studentId: {
    type: String,
    trim: true,
    sparse: true, // 允许多个null值
    maxlength: [20, '学号最多20个字符']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, '个人简介最多500个字符'],
    default: ''
  },
  school: {
    type: String,
    required: [true, '学校不能为空'],
    default: '东莞中学松山湖学校（集团）东莞市第十三高级中学'
  },
  grade: {
    type: String,
    maxlength: [20, '年级最多20个字符']
  },
  class: {
    type: String,
    maxlength: [20, '班级最多20个字符']
  },
  
  // 统计信息
  solvedProblems: [{
    type: Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  totalSubmissions: {
    type: Number,
    default: 0,
    min: 0
  },
  acceptedSubmissions: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 1200,
    min: 0
  },
  
  // 时间戳
  lastLoginAt: {
    type: Date,
    default: null
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
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ studentId: 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ createdAt: -1 });

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 虚拟字段：通过率
UserSchema.virtual('acceptanceRate').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100);
});

// 虚拟字段：解题数量
UserSchema.virtual('solvedCount').get(function() {
  return this.solvedProblems.length;
});

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;