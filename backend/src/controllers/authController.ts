import { Request, Response } from 'express';
import { AuthService, IRegisterRequest, ILoginRequest, IUpdateProfileRequest, IChangePasswordRequest } from '../services/authService';
import { JWTUtils } from '../utils/jwt';
import { UserRole } from '../models/User';

// 请求验证辅助函数
class ValidationHelper {
  static validateRegisterRequest(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { username, email, password, studentId } = body;

    if (!username || typeof username !== 'string') {
      errors.push('用户名是必需的');
    } else if (!AuthService.validateUsername(username)) {
      errors.push('用户名格式不正确（3-20位字母、数字、下划线）');
    }

    if (!email || typeof email !== 'string') {
      errors.push('邮箱是必需的');
    } else if (!AuthService.validateEmail(email)) {
      errors.push('邮箱格式不正确');
    }

    if (!password || typeof password !== 'string') {
      errors.push('密码是必需的');
    }

    if (studentId && !AuthService.validateStudentId(studentId)) {
      errors.push('学号格式不正确（6-20位字母数字组合）');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateLoginRequest(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string') {
      errors.push('用户名或邮箱是必需的');
    }

    if (!password || typeof password !== 'string') {
      errors.push('密码是必需的');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateChangePasswordRequest(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      errors.push('当前密码是必需的');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      errors.push('新密码是必需的');
    }

    return { isValid: errors.length === 0, errors };
  }
}

export class AuthController {
  /**
   * 用户注册
   */
  static async register(req: Request, res: Response) {
    try {
      // 验证请求数据
      const validation = ValidationHelper.validateRegisterRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const registerData: IRegisterRequest = {
        username: req.body.username.trim(),
        email: req.body.email.trim().toLowerCase(),
        password: req.body.password,
        realName: req.body.realName?.trim(),
        studentId: req.body.studentId?.trim(),
        school: req.body.school?.trim(),
        grade: req.body.grade?.trim(),
        class: req.body.class?.trim()
      };

      const result = await AuthService.register(registerData);

      // 设置HTTP-only cookie用于刷新令牌
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
      });

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '注册失败',
        code: 'REGISTER_ERROR'
      });
    }
  }

  /**
   * 用户登录
   */
  static async login(req: Request, res: Response) {
    try {
      // 验证请求数据
      const validation = ValidationHelper.validateLoginRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const loginData: ILoginRequest = {
        identifier: req.body.identifier.trim(),
        password: req.body.password
      };

      const result = await AuthService.login(loginData);

      // 设置HTTP-only cookie用于刷新令牌
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
      });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : '登录失败',
        code: 'LOGIN_ERROR'
      });
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: '未提供刷新令牌',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      // 更新HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
      });

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      console.error('令牌刷新错误:', error);
      
      // 清除无效的刷新令牌cookie
      res.clearCookie('refreshToken');
      
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : '令牌刷新失败',
        code: 'REFRESH_TOKEN_ERROR'
      });
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const user = await AuthService.getUserProfile(req.user.userId);

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: {
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
            studentId: user.studentId,
            stats: {
              solvedProblems: user.solvedProblemsCount,
              totalSubmissions: user.totalSubmissions,
              acceptedSubmissions: user.acceptedSubmissions,
              rating: user.rating
            },
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
          }
        }
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        code: 'GET_PROFILE_ERROR'
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const updateData: IUpdateProfileRequest = {
        realName: req.body.realName?.trim(),
        bio: req.body.bio?.trim(),
        school: req.body.school?.trim(),
        grade: req.body.grade?.trim(),
        class: req.body.class?.trim(),
        avatar: req.body.avatar?.trim()
      };

      // 移除undefined值
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof IUpdateProfileRequest] === undefined) {
          delete updateData[key as keyof IUpdateProfileRequest];
        }
      });

      const updatedUser = await AuthService.updateProfile(req.user.userId, updateData);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: {
          user: {
            id: updatedUser._id.toString(),
            username: updatedUser.username,
            email: updatedUser.email,
            realName: updatedUser.realName,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
            school: updatedUser.school,
            grade: updatedUser.grade,
            class: updatedUser.class
          }
        }
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '更新用户信息失败',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  /**
   * 更改密码
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 验证请求数据
      const validation = ValidationHelper.validateChangePasswordRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const passwordData: IChangePasswordRequest = {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword
      };

      await AuthService.changePassword(req.user.userId, passwordData);

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '密码修改失败',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }

  /**
   * 用户注销
   */
  static async logout(req: Request, res: Response) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.userId);
      }

      // 清除刷新令牌cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: '注销成功'
      });
    } catch (error) {
      console.error('注销错误:', error);
      res.status(500).json({
        success: false,
        message: '注销失败',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * 验证令牌有效性
   */
  static async verifyToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: '未提供令牌',
          code: 'NO_TOKEN'
        });
      }

      const payload = JWTUtils.verifyAccessToken(token);
      const remainingTime = JWTUtils.getTokenRemainingTime(token);
      const isExpiringSoon = JWTUtils.isTokenExpiringSoon(token);

      res.json({
        success: true,
        message: '令牌有效',
        data: {
          valid: true,
          payload: {
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role
          },
          remainingTime,
          isExpiringSoon
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : '令牌无效',
        data: {
          valid: false
        },
        code: 'INVALID_TOKEN'
      });
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const user = await AuthService.getUserProfile(req.user.userId);

      res.json({
        success: true,
        message: '获取用户统计信息成功',
        data: {
          stats: {
            solvedProblems: user.solvedProblemsCount,
            totalSubmissions: user.totalSubmissions,
            acceptedSubmissions: user.acceptedSubmissions,
            acceptanceRate: user.acceptanceRate,
            rating: user.rating,
            rank: 0 // TODO: 实现排名计算
          }
        }
      });
    } catch (error) {
      console.error('获取用户统计信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计信息失败',
        code: 'GET_STATS_ERROR'
      });
    }
  }
}

export default AuthController;