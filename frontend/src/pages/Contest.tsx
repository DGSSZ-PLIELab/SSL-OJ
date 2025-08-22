import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Users, Trophy, Play, Eye, Plus, Search, Filter } from 'lucide-react'
import { contestService, Contest as ContestType } from '../services/contestService'

export function Contest() {
  const [contests, setContests] = useState<ContestType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  })
  const [user, setUser] = useState<any>(null)

  // 获取当前用户信息
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // 获取比赛列表
  const fetchContests = async () => {
    try {
      setLoading(true)
      const response = await contestService.getContests({
        page: currentPage,
        limit: 10,
        ...filters
      })
      setContests(response.contests)
      setTotalPages(response.pagination.totalPages)
      setError(null)
    } catch (err: any) {
      setError(err.message || '获取比赛列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContests()
  }, [currentPage, filters])

  // 参加比赛
  const handleJoinContest = async (contestId: string, hasPassword: boolean) => {
    try {
      let password = ''
      if (hasPassword) {
        password = prompt('请输入比赛密码：') || ''
        if (!password) return
      }
      
      await contestService.joinContest(contestId, password)
      alert('成功参加比赛！')
      fetchContests() // 刷新列表
    } catch (err: any) {
      alert(err.message || '参加比赛失败')
    }
  }

  // 搜索和筛选
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchContests()
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'running': return 'bg-green-100 text-green-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始'
      case 'running': return '进行中'
      case 'ended': return '已结束'
      default: return '未知'
    }
  }

  const getActionButton = (contest: ContestType) => {
    const isParticipant = contest.participants.some(p => p.userId === user?.id)
    
    switch (contest.status) {
      case 'upcoming':
        if (isParticipant) {
          return (
            <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              已报名
            </span>
          )
        }
        return (
          <button 
            onClick={() => handleJoinContest(contest.contestId, !!contest.password)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            报名参加
          </button>
        )
      case 'running':
        if (!isParticipant) {
          return (
            <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center">
              <Play className="w-4 h-4 mr-2" />
              未参加
            </span>
          )
        }
        return (
          <Link
            to={`/contest/${contest.contestId}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            进入比赛
          </Link>
        )
      case 'ended':
        return (
          <Link
            to={`/contest/${contest.contestId}/ranking`}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            查看结果
          </Link>
        )
      default:
        return null
    }
  }

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchContests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const totalContests = contests.length
  const runningContests = contests.filter(c => c.status === 'running').length
  const upcomingContests = contests.filter(c => c.status === 'upcoming').length
  const totalParticipants = contests.reduce((sum, c) => sum + c.participantCount, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">比赛中心</h1>
        <p className="text-gray-600">参加编程比赛，提升算法能力</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索比赛..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有状态</option>
              <option value="upcoming">即将开始</option>
              <option value="running">进行中</option>
              <option value="ended">已结束</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有类型</option>
              <option value="public">公开比赛</option>
              <option value="private">私有比赛</option>
              <option value="official">官方比赛</option>
              <option value="practice">练习赛</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </button>
          </div>
        </form>
      </div>

      {/* 比赛统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalContests}</div>
          <div className="text-gray-600">总比赛数</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Play className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{runningContests}</div>
          <div className="text-gray-600">进行中</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{upcomingContests}</div>
          <div className="text-gray-600">即将开始</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalParticipants}</div>
          <div className="text-gray-600">总参与人数</div>
        </div>
      </div>

      {/* 比赛列表 */}
      <div className="space-y-6">
        {contests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无比赛</h3>
            <p className="text-gray-600">当前没有符合条件的比赛</p>
          </div>
        ) : (
          contests.map((contest) => (
            <div key={contest.contestId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 mr-3">
                      {contest.title}
                    </h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(contest.status)
                    }`}>
                      {getStatusText(contest.status)}
                    </span>
                    {contest.type === 'private' && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        私有
                      </span>
                    )}
                    {contest.password && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        需要密码
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{contest.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      开始: {formatDateTime(contest.startTime)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      时长: {Math.floor(contest.duration / 60)}小时{contest.duration % 60 > 0 ? `${contest.duration % 60}分钟` : ''}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      参与: {contest.participantCount}人
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      题目: {contest.problems.length}道
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-6">
                  {getActionButton(contest)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
              if (page > totalPages) return null
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 创建比赛按钮 (教师和管理员可见) */}
      {user && (user.role === 'teacher' || user.role === 'admin') && (
        <div className="mt-8 text-center">
          <Link
            to="/contest/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            创建新比赛
          </Link>
        </div>
      )}
    </div>
  )
}