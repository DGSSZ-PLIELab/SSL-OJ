import { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, Trophy, Settings, Plus, Search, Edit, Trash2, Eye, UserPlus, Download, AlertTriangle } from 'lucide-react'
import { adminService, AdminStats, AdminUser, AdminProblem, AdminContest, SystemConfig } from '../services/adminService'

export function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 状态数据
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [problems, setProblems] = useState<AdminProblem[]>([])
  const [contests, setContests] = useState<AdminContest[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  
  // 分页和搜索
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  // const [showUserModal, setShowUserModal] = useState(false)
  // const [showConfigModal, setShowConfigModal] = useState(false)
  // const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // 数据获取
  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchTerm])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      switch (activeTab) {
        case 'dashboard':
          const statsData = await adminService.getStats()
          setStats(statsData)
          break
        case 'users':
          const usersData = await adminService.getUsers(currentPage, 10, searchTerm)
          setUsers(usersData.users)
          setTotalPages(usersData.totalPages)
          break
        case 'problems':
          const problemsData = await adminService.getProblems(currentPage, 10, searchTerm)
          setProblems(problemsData.problems)
          setTotalPages(problemsData.totalPages)
          break
        case 'contests':
          const contestsData = await adminService.getContests(currentPage, 10, searchTerm)
          setContests(contestsData.contests)
          setTotalPages(contestsData.totalPages)
          break
        case 'settings':
          const configData = await adminService.getSystemConfig()
          setSystemConfig(configData)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // 处理用户操作
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        await adminService.deleteUser(userId)
        fetchData()
      } catch (err) {
        setError('删除用户失败')
      }
    }
  }

  const handleBanUser = async (userId: string) => {
    try {
      await adminService.banUser(userId)
      fetchData()
    } catch (err) {
      setError('封禁用户失败')
    }
  }

  // Mock数据（作为fallback）
  const mockUsers = [
    {
      id: 1,
      username: 'student001',
      realName: '张三',
      email: 'zhangsan@example.com',
      class: '高二(1)班',
      role: 'student',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-01-20 14:30'
    },
    {
      id: 2,
      username: 'teacher001',
      realName: '李老师',
      email: 'teacher@example.com',
      class: '教师',
      role: 'teacher',
      status: 'active',
      joinDate: '2024-01-10',
      lastLogin: '2024-01-20 15:45'
    },
    {
      id: 3,
      username: 'student002',
      realName: '王五',
      email: 'wangwu@example.com',
      class: '高一(3)班',
      role: 'student',
      status: 'inactive',
      joinDate: '2024-01-12',
      lastLogin: '2024-01-18 09:20'
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'Hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'inactive':
      case 'draft':
        return 'text-gray-600 bg-gray-100'
      case 'upcoming':
        return 'text-blue-600 bg-blue-100'
      case 'ended':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )
    }

    if (!stats) return null

    return (
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总题目数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProblems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总提交数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">活跃比赛</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeContests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待审核</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            添加题目
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            创建比赛
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="w-5 h-5 mr-2" />
            用户管理
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
            <Settings className="w-5 h-5 mr-2" />
            系统设置
          </button>
        </div>
      </div>
    </div>
  )
  }

  const renderUsers = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* 搜索和操作栏 */}
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                // setShowUserModal(true)
                console.log('添加用户')
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              添加用户
            </button>
            <button 
              onClick={async () => {
                try {
                  const blob = await adminService.exportUsers()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'users.csv'
                  a.click()
                  window.URL.revokeObjectURL(url)
                } catch (err) {
                  setError('导出用户数据失败')
                }
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </button>
          </div>
        </div>

      {/* 用户表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                班级/角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最后登录
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(users.length > 0 ? users : mockUsers).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.realName}</div>
                    <div className="text-sm text-gray-500">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.class}</div>
                  <div className="text-sm text-gray-500">{user.role === 'teacher' ? '教师' : '学生'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(user.status)
                  }`}>
                    {user.status === 'active' ? '活跃' : user.status === 'banned' ? '已封禁' : '非活跃'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        // setSelectedUser(user)
                        // setShowUserModal(true)
                        console.log('查看用户详情:', user)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        // setSelectedUser(user)
                        // setShowUserModal(true)
                        console.log('View user:', user)
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="编辑用户"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleBanUser(user.id.toString())}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="封禁用户"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id.toString())}
                      className="text-red-600 hover:text-red-900"
                      title="删除用户"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )

  const renderProblems = () => (
    <div className="space-y-6">
      {/* 搜索和操作栏 */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索题目..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          添加题目
        </button>
      </div>

      {/* 题目表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                题目信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                难度
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                统计
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {problems.map((problem) => (
              <tr key={problem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{problem.problemId}</div>
                    <div className="text-sm text-gray-500">{problem.title}</div>
                    <div className="text-sm text-gray-500">{problem.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getDifficultyColor(problem.difficulty)
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(problem.status)
                  }`}>
                    {problem.status === 'active' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>提交: {problem.submissions}</div>
                  <div>通过: {problem.accepted}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderContests = () => (
    <div className="space-y-6">
      {/* 搜索和操作栏 */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索比赛..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          创建比赛
        </button>
      </div>

      {/* 比赛表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                比赛信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                参与情况
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contests.map((contest) => (
              <tr key={contest.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contest.title}</div>
                    <div className="text-sm text-gray-500">{contest.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{contest.startTime}</div>
                  <div>{contest.duration}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(contest.status)
                  }`}>
                    {contest.status === 'upcoming' ? '即将开始' : 
                     contest.status === 'running' ? '进行中' : '已结束'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>参与者: {contest.participants}</div>
                  <div>题目数: 0</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // 渲染系统设置
  const renderSettings = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )
    }

    if (!systemConfig) return null

    const handleConfigUpdate = async (updates: Partial<SystemConfig>) => {
      try {
        const updatedConfig = await adminService.updateSystemConfig(updates)
        setSystemConfig(updatedConfig)
      } catch (err) {
        setError('更新系统配置失败')
      }
    }

    return (
      <div className="space-y-6">
        {/* 基本设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站名称
              </label>
              <input
                type="text"
                value={systemConfig.siteName}
                onChange={(e) => handleConfigUpdate({ siteName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站描述
              </label>
              <textarea
                value={systemConfig.siteDescription}
                onChange={(e) => handleConfigUpdate({ siteDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 用户设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户设置</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">允许用户注册</h4>
                <p className="text-sm text-gray-500">是否允许新用户自主注册账号</p>
              </div>
              <button
                onClick={() => handleConfigUpdate({ allowRegistration: !systemConfig.allowRegistration })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig.allowRegistration ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                默认用户角色
              </label>
              <select
                value={systemConfig.defaultUserRole}
                onChange={(e) => handleConfigUpdate({ defaultUserRole: e.target.value as 'student' | 'teacher' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">学生</option>
                <option value="teacher">教师</option>
              </select>
            </div>
          </div>
        </div>

        {/* 判题设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">判题设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大提交文件大小 (KB)
              </label>
              <input
                type="number"
                value={systemConfig.maxSubmissionSize}
                onChange={(e) => handleConfigUpdate({ maxSubmissionSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                判题超时时间 (秒)
              </label>
              <input
                type="number"
                value={systemConfig.judgeTimeout}
                onChange={(e) => handleConfigUpdate({ judgeTimeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 功能开关 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">功能开关</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">启用比赛功能</h4>
                <p className="text-sm text-gray-500">是否开启比赛相关功能</p>
              </div>
              <button
                onClick={() => handleConfigUpdate({ enableContest: !systemConfig.enableContest })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig.enableContest ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig.enableContest ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">启用排行榜</h4>
                <p className="text-sm text-gray-500">是否显示用户排行榜</p>
              </div>
              <button
                onClick={() => handleConfigUpdate({ enableRanking: !systemConfig.enableRanking })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig.enableRanking ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig.enableRanking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">维护模式</h4>
                <p className="text-sm text-gray-500">开启后只有管理员可以访问系统</p>
              </div>
              <button
                onClick={() => {
                  if (systemConfig.maintenanceMode) {
                    adminService.disableMaintenanceMode()
                  } else {
                    adminService.enableMaintenanceMode()
                  }
                  handleConfigUpdate({ maintenanceMode: !systemConfig.maintenanceMode })
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  systemConfig.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    systemConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 公告设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">公告设置</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              系统公告
            </label>
            <textarea
              value={systemConfig.announcementText}
              onChange={(e) => handleConfigUpdate({ announcementText: e.target.value })}
              rows={4}
              placeholder="输入系统公告内容..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', name: '仪表板', icon: BarChart3 },
    { id: 'users', name: '用户管理', icon: Users },
    { id: 'problems', name: '题目管理', icon: FileText },
    { id: 'contests', name: '比赛管理', icon: Trophy },
    { id: 'settings', name: '系统设置', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="mt-2 text-gray-600">SSL OJ 系统管理</p>
        </div>

        {/* 标签页导航 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'problems' && renderProblems()}
          {activeTab === 'contests' && renderContests()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  )
}
}