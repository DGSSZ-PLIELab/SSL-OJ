import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { User, LoginRequest, RegisterRequest } from '../services/authService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // 初始化时检查用户状态
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // 检查本地存储中的用户信息
      const storedUser = authService.getUser()
      const token = authService.getToken()
      
      if (storedUser && token) {
        // 验证token是否有效，获取最新用户信息
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        } else {
          // token无效，清除本地存储
          authService.clearAuth()
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      authService.clearAuth()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials)
      
      if (response.success) {
        setUser(response.data.user)
        
        // 登录成功后跳转到个人页面
        navigate('/profile')
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true)
      const response = await authService.register(userData)
      
      if (response.success) {
        setUser(response.data.user)
        
        // 注册成功后跳转到个人页面
        navigate('/profile')
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authService.logout()
      setUser(null)
      
      // 登出后跳转到首页
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // 即使API调用失败，也要清除本地状态
      authService.clearAuth()
      setUser(null)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)
      if (updatedUser) {
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Update user failed:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Refresh user failed:', error)
      // 如果刷新失败，可能是token过期，清除认证状态
      authService.clearAuth()
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext