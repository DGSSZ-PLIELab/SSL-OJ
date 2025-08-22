import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, Mail, UserPlus, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { parseStudentId, validateStudentId, getStudentIdError } from '../utils/studentIdParser'

export function Register() {
  const { register, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    realName: '',
    studentId: '',
    class: '',
    password: '',
    confirmPassword: ''
  })
  const [autoCalculatedClass, setAutoCalculatedClass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 根据学号自动计算班级，不再需要手动选择班级列表
  useEffect(() => {
    if (formData.studentId) {
      const studentInfo = parseStudentId(formData.studentId)
      if (studentInfo.isValid) {
        setAutoCalculatedClass(studentInfo.class)
        setFormData(prev => ({
          ...prev,
          class: studentInfo.class
        }))
        // 清除学号相关错误
        if (errors.studentId) {
          setErrors(prev => ({
            ...prev,
            studentId: ''
          }))
        }
      } else {
        setAutoCalculatedClass('')
        setFormData(prev => ({
          ...prev,
          class: ''
        }))
      }
    } else {
      setAutoCalculatedClass('')
      setFormData(prev => ({
        ...prev,
        class: ''
      }))
    }
  }, [formData.studentId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    
    if (!formData.realName.trim()) {
      newErrors.realName = '请输入真实姓名'
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = '请输入学号'
    } else if (!validateStudentId(formData.studentId)) {
      const errorMsg = getStudentIdError(formData.studentId)
      newErrors.studentId = errorMsg || '学号格式不正确'
    }
    
    if (!formData.class) {
      newErrors.class = '班级信息无法自动获取，请检查学号'
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        realName: formData.realName,
        studentId: formData.studentId,
        class: formData.class,
        password: formData.password
      })
      // 注册成功后会自动跳转到个人页面（在AuthContext中处理）
    } catch (error: any) {
      setErrors({ 
        general: error.message || '注册失败，请稍后重试' 
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SSL</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          注册 SSL OJ 账户
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          已有账户？{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            立即登录
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 通用错误信息 */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">用户名支持字母、数字和下划线</p>
            </div>

            {/* 邮箱 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入邮箱地址"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 真实姓名 */}
            <div>
              <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
                真实姓名
              </label>
              <div className="mt-1">
                <input
                  id="realName"
                  name="realName"
                  type="text"
                  required
                  value={formData.realName}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.realName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入真实姓名"
                />
              </div>
              {errors.realName && (
                <p className="mt-1 text-sm text-red-600">{errors.realName}</p>
              )}
            </div>

            {/* 学号 */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                学号
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.studentId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入学号（如：1503241123）"
                />
              </div>
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
              )}
            </div>

            {/* 班级（自动计算） */}
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                班级
              </label>
              <div className="mt-1">
                <input
                  id="class"
                  name="class"
                  type="text"
                  readOnly
                  value={autoCalculatedClass || '请先输入正确的学号'}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm bg-gray-50 text-gray-700 sm:text-sm ${
                    errors.class ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="班级将根据学号自动计算"
                />
              </div>
              {autoCalculatedClass && (
                <p className="mt-1 text-xs text-green-600">✓ 班级已根据学号自动计算</p>
              )}
              {errors.class && (
                <p className="mt-1 text-sm text-red-600">{errors.class}</p>
              )}
              {formData.studentId && !autoCalculatedClass && (
                <p className="mt-1 text-xs text-orange-600">请输入正确格式的学号以自动获取班级信息</p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请再次输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 注册按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    注册
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-xs text-gray-500">
              注册即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}