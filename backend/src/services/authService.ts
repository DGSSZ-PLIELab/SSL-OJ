import bcrypt from 'bcryptjs';
import { User, IUser, UserRole, UserStatus } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { Types } from 'mongoose';

// 注册请求接口
export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  realName?: string;
  studentId?: string;
  school?: string;
  grade?: string;
  class?: string;
}

// 登录请求接口
export interface ILoginRequest {
  identifier: string; // 用户名或邮箱
  password: string;
}

// 认证响应接口
export interface IAuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    realName?: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    bio?: string;
    school?: string;
    grade?: string;
    class?: string;
    stats: {
      solvedProblems: number;
      totalSubmissions: number;
      acceptedSubmissions: number;
      rating: number;
    };
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// 用户信息更新接口
export interface IUpdateProfileRequest {
  realName?: string;
  bio?: string;
  school?: string;
  grade?: string;
  class?: string;
  avatar?: string;
}

// 密码更改接口
export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  /**
   * 用户注册
   */
  static async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
    const { username, email, password, realName, studentId, school, grade, class: className } = registerData;

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    // 检查学号是否已存在（如果提供）
    if (studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        throw new Error('学号已被注册');
      }
    }

    // 验证密码强度
    this.validatePassword(password);

    // 创建新用户
    const user = new User({
      username,
      email,
      password, // 密码会在模型的pre('save')中间件中自动加密
      realName,
      studentId,
      school: school || '东莞中学松山湖学校（集团）东莞市第十三高级中学',
      grade,
      class: className,
      role: UserRole.STUDENT, // 默认为学生角色
      status: UserStatus.ACTIVE
    });

    await user.save();

    // 生成令牌
    const tokens = JWTUtils.generateTokenPair(user);

    return this.formatAuthResponse(user, tokens);
  }

  /**
   * 用户登录
   */
  static async login(loginData: ILoginRequest): Promise<IAuthResponse> {
    const { identifier, password } = loginData;

    // 查找用户（通过用户名或邮箱）
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    }).select('+password +status');

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('账户已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    // 生成令牌
    const tokens = JWTUtils.generateTokenPair(user);

    return this.formatAuthResponse(user, tokens);
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // 验证刷新令牌
      const payload = JWTUtils.verifyRefreshToken(refreshToken);
      
      // 查找用户
      const user = await User.findById(payload.userId).select('+status');
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查用户状态
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error('账户已被禁用');
      }

      // 生成新的令牌对
      const tokens = JWTUtils.generateTokenPair(user, payload.tokenVersion);
      
      return tokens;
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(userId: string, updateData: IUpdateProfileRequest): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新允许的字段
    const allowedFields: (keyof IUpdateProfileRequest)[] = ['realName', 'bio', 'school', 'grade', 'class', 'avatar'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        (user as any)[field] = updateData[field];
      }
    });

    await user.save();
    return user;
  }

  /**
   * 更改密码
   */
  static async changePassword(userId: string, passwordData: IChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = passwordData;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('当前密码错误');
    }

    // 验证新密码强度
    this.validatePassword(newPassword);

    // 检查新密码是否与当前密码相同
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('新密码不能与当前密码相同');
    }

    // 更新密码
    user.password = newPassword;
    await user.save();
  }

  /**
   * 注销（可选：实现令牌黑名单）
   */
  static async logout(userId: string): Promise<void> {
    // 这里可以实现令牌黑名单逻辑
    // 目前只是简单的成功响应
    console.log(`用户 ${userId} 已注销`);
  }

  /**
   * 验证密码强度
   */
  private static validatePassword(password: string): void {
    if (password.length < 6) {
      throw new Error('密码长度至少为6位');
    }
    
    if (password.length > 128) {
      throw new Error('密码长度不能超过128位');
    }

    // 检查是否包含至少一个字母和一个数字
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      throw new Error('密码必须包含至少一个字母和一个数字');
    }
  }

  /**
   * 格式化认证响应
   */
  private static formatAuthResponse(user: IUser, tokens: { accessToken: string; refreshToken: string }): IAuthResponse {
    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        bio: user.bio,
        school: user.school,
        grade: user.grade,
        class: user.class,
        stats: {
          solvedProblems: user.solvedProblemsCount,
          totalSubmissions: user.totalSubmissions,
          acceptedSubmissions: user.acceptedSubmissions,
          rating: user.rating
        },
        createdAt: user.createdAt
      },
      tokens
    };
  }

  /**
   * 验证用户名格式
   */
  static validateUsername(username: string): boolean {
    // 用户名规则：3-20位，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 验证邮箱格式
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证学号格式（可选）
   */
  static validateStudentId(studentId: string): boolean {
    // 学号规则：6-20位数字或字母数字组合
    const studentIdRegex = /^[a-zA-Z0-9]{6,20}$/;
    return studentIdRegex.test(studentId);
  }

  /**
   * 检查用户是否有权限访问资源
   */
  static hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * 检查用户是否为管理员
   */
  static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  /**
   * 检查用户是否为教师或管理员
   */
  static isTeacherOrAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.TEACHER || userRole === UserRole.ADMIN;
  }
}

export default AuthService;