import { useState, useEffect } from 'react'
import { User, Mail, GraduationCap, Calendar, Trophy, Code, Target, Edit3, Save, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState({
    username: user?.username || '',
    realName: user?.realName || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    class: user?.class || '',
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
    lastLogin: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : ''
  })
  const [editForm, setEditForm] = useState(userInfo)

  // 当用户数据更新时，同步更新本地状态
  useEffect(() => {
    if (user) {
      const updatedUserInfo = {
        username: user.username || '',
        realName: user.realName || '',
        email: user.email || '',
        studentId: user.studentId || '',
        class: user.class || '',
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : ''
      }
      setUserInfo(updatedUserInfo)
      setEditForm(updatedUserInfo)
    }
  }, [user])

  // 用户统计数据
  const userStats = {
    totalSubmissions: user?.totalSubmissions || 0,
    acceptedSubmissions: user?.acceptedSubmissions || 0,
    acceptanceRate: user?.totalSubmissions ? ((user.acceptedSubmissions || 0) / user.totalSubmissions * 100).toFixed(1) : 0,
    solvedProblems: user?.solvedProblems || 0,
    rating: user?.rating || 1000,
    rank: user?.rank || 0,
    contestsParticipated: 0 // 这个字段暂时没有在用户模型中
  }

  // 模拟最近提交记录
  const recentSubmissions = [
    {
      id: 1,
      problemId: 'P1001',
      problemTitle: '两数之和',
      status: 'Accepted',
      language: 'C++',
      submitTime: '2024-01-20 14:25:30',
      runTime: '15ms',
      memory: '2.1MB'
    },
    {
      id: 2,
      problemId: 'P1002',
      problemTitle: '最大公约数',
      status: 'Wrong Answer',
      language: 'Python',
      submitTime: '2024-01-20 13:45:12',
      runTime: '25ms',
      memory: '3.2MB'
    },
    {
      id: 3,
      problemId: 'P1003',
      problemTitle: '排序算法',
      status: 'Time Limit Exceeded',
      language: 'Java',
      submitTime: '2024-01-20 11:20:45',
      runTime: '>1000ms',
      memory: '5.1MB'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
      case '通过':
        return 'text-green-600 bg-green-100'
      case 'Wrong Answer':
      case '答案错误':
        return 'text-red-600 bg-red-100'
      case 'Time Limit Exceeded':
      case '超时':
        return 'text-yellow-600 bg-yellow-100'
      case 'Runtime Error':
      case '运行错误':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '通过'
      case 'Wrong Answer':
        return '答案错误'
      case 'Time Limit Exceeded':
        return '超时'
      case 'Runtime Error':
        return '运行错误'
      default:
        return status
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 1500) return 'text-red-600'
    if (rating >= 1200) return 'text-orange-600'
    if (rating >= 900) return 'text-blue-600'
    return 'text-green-600'
  }

  const handleEdit = () => {
    setEditForm(userInfo)
    setIsEditing(true)
  }

  const handleSave = () => {
    setUserInfo(editForm)
    setIsEditing(false)
    // 这里会调用API保存用户信息
  }

  const handleCancel = () => {
    setEditForm(userInfo)
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
          <p className="mt-2 text-gray-600">查看和编辑您的个人信息</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：用户信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    编辑
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      保存
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 头像 */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {userInfo.realName.charAt(0)}
                  </span>
                </div>
              </div>

              {/* 用户信息表单 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户名
                  </label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{userInfo.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    真实姓名
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="realName"
                      value={editForm.realName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{userInfo.realName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{userInfo.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学号
                  </label>
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{userInfo.studentId}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    班级
                  </label>
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{userInfo.class}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    注册时间
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{userInfo.joinDate}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最后登录
                  </label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{userInfo.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：统计信息和提交记录 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 统计信息 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">统计信息</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalSubmissions}</div>
                  <div className="text-sm text-gray-600">总提交数</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.acceptedSubmissions}</div>
                  <div className="text-sm text-gray-600">通过数</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <Target className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.acceptanceRate}%</div>
                  <div className="text-sm text-gray-600">通过率</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.solvedProblems}</div>
                  <div className="text-sm text-gray-600">解决题目</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRatingColor(userStats.rating)}`}>
                      {userStats.rating}
                    </div>
                    <div className="text-sm text-gray-600">当前积分</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">#{userStats.rank}</div>
                    <div className="text-sm text-gray-600">排名</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{userStats.contestsParticipated}</div>
                    <div className="text-sm text-gray-600">参与比赛</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 最近提交记录 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">最近提交</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        题目
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        语言
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间/内存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        提交时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.problemId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.problemTitle}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(submission.status)
                          }`}>
                            {getStatusText(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{submission.runTime}</div>
                          <div className="text-gray-500">{submission.memory}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.submitTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  查看更多提交记录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}