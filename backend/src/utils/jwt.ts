import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// JWT载荷接口
export interface IJWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// JWT刷新令牌载荷接口
export interface IRefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// JWT工具类
export class JWTUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
  private static readonly ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || '7d';
  private static readonly REFRESH_TOKEN_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

  /**
   * 生成访问令牌
   */
  static generateAccessToken(payload: Omit<IJWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRE,
      issuer: 'ssl-oj',
      audience: 'ssl-oj-users'
    });
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(payload: Omit<IRefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRE,
      issuer: 'ssl-oj',
      audience: 'ssl-oj-users'
    });
  }

  /**
   * 验证访问令牌
   */
  static verifyAccessToken(token: string): IJWTPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'ssl-oj',
        audience: 'ssl-oj-users'
      }) as IJWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('访问令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('无效的访问令牌');
      } else {
        throw new Error('令牌验证失败');
      }
    }
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token: string): IRefreshTokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'ssl-oj',
        audience: 'ssl-oj-users'
      }) as IRefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('刷新令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('无效的刷新令牌');
      } else {
        throw new Error('令牌验证失败');
      }
    }
  }

  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * 检查令牌是否即将过期（30分钟内）
   */
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const expirationTime = decoded.exp * 1000; // 转换为毫秒
      const currentTime = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30分钟
      
      return (expirationTime - currentTime) < thirtyMinutes;
    } catch {
      return true;
    }
  }

  /**
   * 从请求头中提取令牌
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * 生成令牌对（访问令牌 + 刷新令牌）
   */
  static generateTokenPair(user: {
    _id: Types.ObjectId;
    username: string;
    email: string;
    role: string;
  }, tokenVersion: number = 0) {
    const accessTokenPayload: Omit<IJWTPayload, 'iat' | 'exp'> = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };

    const refreshTokenPayload: Omit<IRefreshTokenPayload, 'iat' | 'exp'> = {
      userId: user._id.toString(),
      tokenVersion
    };

    return {
      accessToken: this.generateAccessToken(accessTokenPayload),
      refreshToken: this.generateRefreshToken(refreshTokenPayload)
    };
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return 0;
      
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      
      return Math.max(0, Math.floor((expirationTime - currentTime) / 1000));
    } catch {
      return 0;
    }
  }
}

export default JWTUtils;