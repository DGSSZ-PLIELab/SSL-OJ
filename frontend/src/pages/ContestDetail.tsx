import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, Users, Trophy, Play, Eye, Lock, ArrowLeft, Award } from 'lucide-react'
import { contestService, Contest, ContestProblem, ContestRanking } from '../services/contestService'

export function ContestDetail() {
  const { contestId } = useParams<{ contestId: string }>()
  // const navigate = useNavigate() // 暂时注释，未来可能使用
  const [contest, setContest] = useState<Contest | null>(null)
  const [problems, setProblems] = useState<ContestProblem[]>([])
  const [ranking, setRanking] = useState<ContestRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'ranking'>('overview')
  const [user, setUser] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(false)

  // 获取当前用户信息
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // 获取比赛详情
  const fetchContestDetail = async () => {
    if (!contestId) return
    
    try {
      setLoading(true)
      const contestData = await contestService.getContestById(contestId)
      setContest(contestData)
      setError(null)
    } catch (err: any) {
      setError(err.message || '获取比赛详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取比赛题目
  const fetchProblems = async () => {
    if (!contestId) return
    
    try {
      const problemsData = await contestService.getContestProblems(contestId)
      setProblems(problemsData)
    } catch (err: any) {
      console.error('获取题目列表失败:', err)
    }
  }

  // 获取排行榜
  const fetchRanking = async () => {
    if (!contestId) return
    
    try {
      const rankingData = await contestService.getContestRanking(contestId, { page: 1, limit: 50 })
      setRanking(rankingData.ranking)
    } catch (err: any) {
      console.error('获取排行榜失败:', err)
    }
  }

  useEffect(() => {
    fetchContestDetail()
  }, [contestId])

  useEffect(() => {
    if (contest && activeTab === 'problems') {
      fetchProblems()
    } else if (contest && activeTab === 'ranking') {
      fetchRanking()
    }
  }, [contest, activeTab])

  // 参加比赛
  const handleJoinContest = async () => {
    if (!contest || !contestId) return
    
    try {
      setIsJoining(true)
      let password = ''
      
      if (contest.password) {
        password = prompt('请输入比赛密码:') || ''
        if (!password) {
          setIsJoining(false)
          return
        }
      }
      
      await contestService.joinContest(contestId, password)
      alert('报名成功！')
      
      // 重新获取比赛详情以更新参与状态
      await fetchContestDetail()
    } catch (err: any) {
      alert(err.message || '报名失败')
    } finally {
      setIsJoining(false)
    }
  }

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'running': return 'bg-green-100 text-green-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始'
      case 'running': return '进行中'
      case 'ended': return '已结束'
      default: return '未知状态'
    }
  }

  // 获取操作按钮
  const getActionButton = () => {
    if (!contest || !user) return null

    const isParticipant = contest.participants.some(p => p.userId === user.id)

    if (contest.status === 'upcoming') {
      if (isParticipant) {
        return (
          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            <Trophy className="w-4 h-4 mr-2" />
            已报名
          </span>
        )
      } else {
        return (
          <button
            onClick={handleJoinContest}
            disabled={isJoining}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isJoining ? '报名中...' : '报名参加'}
          </button>
        )
      }
    } else if (contest.status === 'running') {
      if (isParticipant) {
        return (
          <Link
            to={`/contest/${contestId}/problems`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            进入比赛
          </Link>
        )
      } else {
        return (
          <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
            未参加
          </span>
        )
      }
    } else {
      return (
        <Link
          to={`/contest/${contestId}/ranking`}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          <Eye className="w-4 h-4 mr-2" />
          查看排名
        </Link>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">加载失败</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">比赛不存在</div>
          <Link
            to="/contest"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回比赛列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
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

        {/* 比赛头部信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">
                  {contest.title}
                </h1>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  getStatusColor(contest.status)
                }`}>
                  {getStatusText(contest.status)}
                </span>
                {contest.type === 'private' && (
                  <span className="ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    <Lock className="w-4 h-4 mr-1" />
                    私有
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-6 text-lg">{contest.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">开始时间</div>
                    <div className="font-medium">{formatDateTime(contest.startTime)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">比赛时长</div>
                    <div className="font-medium">
                      {Math.floor(contest.duration / 60)}小时{contest.duration % 60 > 0 ? `${contest.duration % 60}分钟` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">参与人数</div>
                    <div className="font-medium">{contest.participantCount}人</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">题目数量</div>
                    <div className="font-medium">{contest.problems.length}道</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 lg:ml-6">
              {getActionButton()}
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                比赛概览
              </button>
              <button
                onClick={() => setActiveTab('problems')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'problems'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                题目列表
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ranking'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                排行榜
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">比赛说明</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {contest.description || '暂无详细说明'}
                    </p>
                  </div>
                </div>
                
                {contest.rule && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">比赛规则</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-600 whitespace-pre-wrap">{contest.rule}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'problems' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">题目列表</h3>
                {problems.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">暂无题目</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {problems.map((problem, index) => (
                      <div key={problem.problemId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium mr-4">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900">{problem.title}</h4>
                            <p className="text-sm text-gray-600">时间限制: {problem.timeLimit}ms</p>
                          </div>
                        </div>
                        
                        {contest.status === 'running' && contest.participants.some(p => p.userId === user?.id) && (
                          <Link
                            to={`/contest/${contestId}/problem/${problem.problemId}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            查看题目
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ranking' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">排行榜</h3>
                {ranking.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">暂无排名数据</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            排名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            用户
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            得分
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            通过题数
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总用时
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ranking.map((item, index) => (
                          <tr key={item.userId} className={index < 3 ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index < 3 && (
                                  <Award className={`w-5 h-5 mr-2 ${
                                    index === 0 ? 'text-yellow-500' : 
                                    index === 1 ? 'text-gray-400' : 'text-orange-400'
                                  }`} />
                                )}
                                <span className="font-medium">{item.rank}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.totalScore}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.solvedCount}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{Math.floor(item.totalTime / 60)}分钟</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}