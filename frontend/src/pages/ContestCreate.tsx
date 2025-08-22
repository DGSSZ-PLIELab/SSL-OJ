import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, Calendar, Users } from 'lucide-react'
import { contestService } from '../services/contestService'

interface Problem {
  problemId: string
  title: string
  difficulty: string
}

interface ContestForm {
  title: string
  description: string
  type: 'public' | 'private'
  password: string
  startTime: string
  duration: number
  maxParticipants: number
  problems: string[]
  rules: string
}

export function ContestCreate() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([])
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([])
  const [showProblemSelector, setShowProblemSelector] = useState(false)
  
  const [form, setForm] = useState<ContestForm>({
    title: '',
    description: '',
    type: 'public',
    password: '',
    startTime: '',
    duration: 180, // 默认3小时
    maxParticipants: 0, // 0表示无限制
    problems: [],
    rules: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 获取当前用户信息
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUser(user)
      
      // 检查权限
      if (user.role !== 'teacher' && user.role !== 'admin') {
        alert('您没有权限创建比赛')
        navigate('/contest')
        return
      }
    } else {
      alert('请先登录')
      navigate('/login')
      return
    }
  }, [])

  // 获取可用题目列表
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        // 这里应该调用获取题目列表的API
        // const response = await problemService.getProblems()
        // setAvailableProblems(response.problems)
        
        // 临时使用模拟数据
        setAvailableProblems([
          { problemId: '1', title: 'A+B Problem', difficulty: 'Easy' },
          { problemId: '2', title: '排序算法', difficulty: 'Medium' },
          { problemId: '3', title: '最短路径', difficulty: 'Hard' },
          { problemId: '4', title: '动态规划', difficulty: 'Hard' },
          { problemId: '5', title: '字符串匹配', difficulty: 'Medium' }
        ])
      } catch (err) {
        console.error('获取题目列表失败:', err)
      }
    }
    
    fetchProblems()
  }, [])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}
    
    if (!form.title.trim()) {
      newErrors.title = '请输入比赛标题'
    }
    
    if (!form.description.trim()) {
      newErrors.description = '请输入比赛描述'
    }
    
    if (!form.startTime) {
      newErrors.startTime = '请选择开始时间'
    } else {
      const startTime = new Date(form.startTime)
      const now = new Date()
      if (startTime <= now) {
        newErrors.startTime = '开始时间必须晚于当前时间'
      }
    }
    
    if (form.duration <= 0) {
      newErrors.duration = '比赛时长必须大于0'
    }
    
    if (form.type === 'private' && !form.password.trim()) {
      newErrors.password = '私有比赛必须设置密码'
    }
    
    if (form.problems.length === 0) {
      newErrors.problems = '请至少选择一道题目'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setLoading(true)
      
      const contestData = {
        title: form.title,
        description: form.description,
        type: form.type,
        rule: form.rules as 'acm' | 'oi',
        startTime: form.startTime,
        duration: form.duration,
        maxParticipants: form.maxParticipants,
        password: form.password,
        isPublic: form.type === 'public',
        problems: form.problems,
        tags: []
      }
      
      await contestService.createContest(contestData)
      alert('比赛创建成功！')
      navigate('/contest')
    } catch (err: any) {
      alert(err.message || '创建比赛失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: keyof ContestForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 添加题目
  const handleAddProblem = (problem: Problem) => {
    if (!form.problems.includes(problem.problemId)) {
      setSelectedProblems(prev => [...prev, problem])
      handleInputChange('problems', [...form.problems, problem.problemId])
    }
  }

  // 移除题目
  const handleRemoveProblem = (problemId: string) => {
    setSelectedProblems(prev => prev.filter(p => p.problemId !== problemId))
    handleInputChange('problems', form.problems.filter(id => id !== problemId))
  }

  // 格式化时间为本地时间字符串
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // 设置默认开始时间为1小时后
  useEffect(() => {
    const defaultStartTime = new Date()
    defaultStartTime.setHours(defaultStartTime.getHours() + 1)
    defaultStartTime.setMinutes(0)
    defaultStartTime.setSeconds(0)
    
    setForm(prev => ({
      ...prev,
      startTime: formatDateTimeLocal(defaultStartTime)
    }))
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            to="/contest"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回比赛列表
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建新比赛</h1>
          <p className="text-gray-600 mt-2">设置比赛信息和规则</p>
        </div>

        {/* 创建表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  比赛标题 *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入比赛标题"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  比赛描述 *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入比赛描述"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  比赛类型
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'public' | 'private')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">公开比赛</option>
                  <option value="private">私有比赛</option>
                </select>
              </div>
              
              {form.type === 'private' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    比赛密码 *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="请输入比赛密码"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 时间设置 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              时间设置
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始时间 *
                </label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  比赛时长 (分钟) *
                </label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="180"
                />
                {errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  约 {Math.floor(form.duration / 60)}小时{form.duration % 60 > 0 ? `${form.duration % 60}分钟` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* 参与设置 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              参与设置
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大参与人数
              </label>
              <input
                type="number"
                value={form.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 (无限制)"
              />
              <p className="text-sm text-gray-500 mt-1">
                设置为 0 表示不限制参与人数
              </p>
            </div>
          </div>

          {/* 题目选择 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">题目选择</h2>
            
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowProblemSelector(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加题目
              </button>
            </div>
            
            {/* 已选题目列表 */}
            {selectedProblems.length > 0 ? (
              <div className="space-y-2">
                {selectedProblems.map((problem, index) => (
                  <div key={problem.problemId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">{problem.title}</h4>
                        <p className="text-sm text-gray-600">难度: {problem.difficulty}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProblem(problem.problemId)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600">尚未选择题目</p>
              </div>
            )}
            
            {errors.problems && (
              <p className="text-red-500 text-sm mt-2">{errors.problems}</p>
            )}
          </div>

          {/* 比赛规则 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">比赛规则</h2>
            
            <textarea
              value={form.rules}
              onChange={(e) => handleInputChange('rules', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入比赛规则和注意事项（可选）"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/contest"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建比赛'}
            </button>
          </div>
        </form>
      </div>

      {/* 题目选择弹窗 */}
      {showProblemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">选择题目</h3>
              <button
                onClick={() => setShowProblemSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {availableProblems.map((problem) => (
                  <div
                    key={problem.problemId}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.problems.includes(problem.problemId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAddProblem(problem)}
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{problem.title}</h4>
                      <p className="text-sm text-gray-600">难度: {problem.difficulty}</p>
                    </div>
                    {form.problems.includes(problem.problemId) && (
                      <span className="text-blue-600 font-medium">已选择</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowProblemSelector(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}