import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { getDatabase } from '../database'
import Database from 'better-sqlite3'

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
export interface IUser {
  id?: number
  username: string
  email: string
  password: string
  realName: string
  studentId?: string
  class?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  bio?: string
  school?: string
  grade?: string
  
  // 统计信息
  totalSubmissions?: number
  acceptedSubmissions?: number
  solvedProblems?: number
  rating?: number
  rank?: number
  contestsParticipated?: number
  
  // 设置
  emailNotifications?: boolean
  
  // 时间戳
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

// 用户数据库操作类
export class UserModel {
  private db: Database.Database
  
  constructor() {
    this.db = getDatabase()
  }
  
  // 创建用户
  async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    // 密码加密
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds)
    
    const stmt = this.db.prepare(`
      INSERT INTO users (
        username, email, password, real_name, student_id, class, role, status,
        avatar, bio, school, grade, total_submissions, accepted_submissions,
        solved_problems, rating, rank, contests_participated, email_notifications
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)
    
    const result = stmt.run(
      userData.username,
      userData.email,
      hashedPassword,
      userData.realName,
      userData.studentId || null,
      userData.class || null,
      userData.role || UserRole.STUDENT,
      userData.status || UserStatus.ACTIVE,
      userData.avatar || null,
      userData.bio || null,
      userData.school || null,
      userData.grade || null,
      userData.totalSubmissions || 0,
      userData.acceptedSubmissions || 0,
      userData.solvedProblems || 0,
      userData.rating || 1000,
      userData.rank || 0,
      userData.contestsParticipated || 0,
      userData.emailNotifications !== false ? 1 : 0
    )
    
    return this.findById(result.lastInsertRowid as number)!
  }
  
  // 根据ID查找用户
  findById(id: number): IUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?')
    const user = stmt.get(id) as any
    return user ? this.formatUser(user) : null
  }
  
  // 根据用户名查找用户
  findByUsername(username: string): IUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?')
    const user = stmt.get(username) as any
    return user ? this.formatUser(user) : null
  }
  
  // 根据邮箱查找用户
  findByEmail(email: string): IUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?')
    const user = stmt.get(email) as any
    return user ? this.formatUser(user) : null
  }
  
  // 根据用户名或邮箱查找用户
  findByUsernameOrEmail(identifier: string): IUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    const user = stmt.get(identifier, identifier) as any
    return user ? this.formatUser(user) : null
  }
  
  // 验证密码
  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword)
  }
 
  // 哈希密码
  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12)
  }
  
  // 生成认证令牌
  generateAuthToken(user: IUser): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    )
  }
  
  // 生成刷新令牌
  generateRefreshToken(user: IUser): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        type: 'refresh'
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    )
  }
  
  // 更新用户
  update(id: number, updateData: Partial<IUser>): IUser | null {
    const fields = []
    const values = []
    
    // 字段名映射
    const fieldMapping: { [key: string]: string } = {
      realName: 'real_name',
      studentId: 'student_id',
      totalSubmissions: 'total_submissions',
      acceptedSubmissions: 'accepted_submissions',
      solvedProblems: 'solved_problems',
      contestsParticipated: 'contests_participated',
      emailNotifications: 'email_notifications',
      lastLoginAt: 'last_login_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'createdAt') {
        const dbField = fieldMapping[key] || key
        fields.push(`${dbField} = ?`)
        
        // 处理布尔值转换
        if (key === 'emailNotifications') {
          values.push(value ? 1 : 0)
        } else {
          values.push(value)
        }
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)
    
    return this.findById(id)
  }
  
  // 删除用户
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
  
  // 获取所有用户
  findAll(limit?: number, offset?: number): IUser[] {
    let query = 'SELECT * FROM users ORDER BY createdAt DESC'
    const params: any[] = []
    
    if (limit) {
      query += ' LIMIT ?'
      params.push(limit)
      
      if (offset) {
        query += ' OFFSET ?'
        params.push(offset)
      }
    }
    
    const stmt = this.db.prepare(query)
    const users = stmt.all(...params) as any[]
    return users.map(user => this.formatUser(user))
  }
  
  // 格式化用户数据
  private formatUser(user: any): IUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      realName: user.real_name,
      studentId: user.student_id,
      class: user.class,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      bio: user.bio,
      school: user.school,
      grade: user.grade,
      totalSubmissions: user.total_submissions,
      acceptedSubmissions: user.accepted_submissions,
      solvedProblems: user.solved_problems,
      rating: user.rating,
      rank: user.rank,
      contestsParticipated: user.contests_participated,
      emailNotifications: user.email_notifications === 1,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  }
  
  // 获取用户数量
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users')
    const result = stmt.get() as { count: number }
    return result.count
  }
}

// 导出工厂函数
let userInstance: UserModel | null = null

export const getUser = (): UserModel => {
  if (!userInstance) {
    userInstance = new UserModel()
  }
  return userInstance
}

// 懒加载的User实例
export const User = {
  get instance() {
    return getUser()
  },
  create: (userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>) => getUser().create(userData),
  findById: (id: number) => getUser().findById(id),
  findByUsername: (username: string) => getUser().findByUsername(username),
  findByEmail: (email: string) => getUser().findByEmail(email),
  findByUsernameOrEmail: (identifier: string) => getUser().findByUsernameOrEmail(identifier),
  update: (id: number, updateData: Partial<IUser>) => getUser().update(id, updateData),
  delete: (id: number) => getUser().delete(id),
  findAll: (limit?: number, offset?: number) => getUser().findAll(limit, offset),
  count: () => getUser().count(),
  generateAuthToken: (user: IUser) => getUser().generateAuthToken(user),
  generateRefreshToken: (user: IUser) => getUser().generateRefreshToken(user)
}