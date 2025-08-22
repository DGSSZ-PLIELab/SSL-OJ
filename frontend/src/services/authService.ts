import api from './api'

export interface User {
  id: string
  username: string
  email: string
  realName: string
  studentId?: string
  class?: string
  role: 'student' | 'teacher' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  avatar?: string
  rating?: number
  rank?: number
  totalSubmissions?: number
  acceptedSubmissions?: number
  solvedProblems?: number
  lastLoginAt?: string
  createdAt: string
}

export interface LoginRequest {
  identifier: string // 用户名或邮箱
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  realName: string
  studentId?: string
  class?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

class AuthService {
  private readonly TOKEN_KEY = 'token'
  private readonly REFRESH_TOKEN_KEY = 'refreshToken'
  private readonly USER_KEY = 'user'

  // 登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.success) {
        this.setTokens(response.data.data.accessToken, response.data.data.refreshToken)
        this.setUser(response.data.data.user)
      }
      
      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // 注册
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData)
    
    if (response.success) {
      this.setTokens(response.data.accessToken, response.data.refreshToken)
      this.setUser(response.data.user)
    }
    
    return response
  }

  // 登出
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // 即使API调用失败，也要清除本地存储
      console.error('Logout API call failed:', error)
    } finally {
      this.clearAuth()
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/profile')
      if (response.success) {
        this.setUser(response.data.user)
        return response.data.user
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
      this.clearAuth()
    }
    return null
  }

  // 刷新token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) return false
      
      const response = await api.post('/auth/refresh', { refreshToken })
      if (response.data.success) {
        this.setTokens(response.data.data.accessToken, response.data.data.refreshToken)
        return true
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
      this.clearAuth()
    }
    return false
  }

  // 更新用户资料
  async updateProfile(profileData: Partial<User>): Promise<User | null> {
    try {
      const response = await api.put('/auth/profile', profileData)
      if (response.data.success) {
        this.setUser(response.data.data.user)
        return response.data.data.user
      }
      return null
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  // 修改密码
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', {
      currentPassword,
      newPassword
    })
  }

  // Token管理
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }

  // 用户信息管理
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY)
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error('Failed to parse user data:', error)
        localStorage.removeItem(this.USER_KEY)
      }
    }
    return null
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  // 清除认证信息
  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser()
  }

  // 检查用户角色
  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role === role
  }

  // 检查是否为管理员
  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  // 检查是否为教师或管理员
  isTeacherOrAdmin(): boolean {
    return this.hasRole('teacher') || this.hasRole('admin')
  }
}

export const authService = new AuthService()
export default authService