import { useState } from 'react'
import { Trophy, Medal, Award, User } from 'lucide-react'

export function Ranking() {
  const [selectedTab, setSelectedTab] = useState('overall')

  // 模拟排名数据
  const overallRanking = [
    {
      rank: 1,
      username: 'algorithm_master',
      realName: '张三',
      class: '高二(1)班',
      solvedProblems: 245,
      totalSubmissions: 380,
      acceptanceRate: 64.5,
      rating: 2150
    },
    {
      rank: 2,
      username: 'code_ninja',
      realName: '李四',
      class: '高三(2)班',
      solvedProblems: 198,
      totalSubmissions: 295,
      acceptanceRate: 67.1,
      rating: 1980
    },
    {
      rank: 3,
      username: 'data_structure_pro',
      realName: '王五',
      class: '高二(3)班',
      solvedProblems: 187,
      totalSubmissions: 312,
      acceptanceRate: 59.9,
      rating: 1850
    },
    {
      rank: 4,
      username: 'python_lover',
      realName: '赵六',
      class: '高一(4)班',
      solvedProblems: 156,
      totalSubmissions: 245,
      acceptanceRate: 63.7,
      rating: 1720
    },
    {
      rank: 5,
      username: 'cpp_expert',
      realName: '钱七',
      class: '高三(1)班',
      solvedProblems: 142,
      totalSubmissions: 198,
      acceptanceRate: 71.7,
      rating: 1650
    }
  ]

  const monthlyRanking = [
    {
      rank: 1,
      username: 'rising_star',
      realName: '孙八',
      class: '高一(2)班',
      solvedProblems: 45,
      totalSubmissions: 67,
      acceptanceRate: 67.2,
      rating: 1420
    },
    {
      rank: 2,
      username: 'algorithm_master',
      realName: '张三',
      class: '高二(1)班',
      solvedProblems: 38,
      totalSubmissions: 52,
      acceptanceRate: 73.1,
      rating: 2150
    }
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-semibold">{rank}</span>
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return 'text-red-600'
    if (rating >= 1800) return 'text-orange-600'
    if (rating >= 1600) return 'text-purple-600'
    if (rating >= 1400) return 'text-blue-600'
    return 'text-green-600'
  }

  const currentRanking = selectedTab === 'overall' ? overallRanking : monthlyRanking

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">排行榜</h1>
        <p className="text-gray-600">查看学校编程高手排名</p>
      </div>

      {/* 排行榜切换 */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('overall')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overall'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              总排行榜
            </button>
            <button
              onClick={() => setSelectedTab('monthly')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'monthly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              本月排行榜
            </button>
          </nav>
        </div>
      </div>

      {/* 前三名展示 */}
      {selectedTab === 'overall' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {overallRanking.slice(0, 3).map((user, index) => (
            <div key={user.rank} className={`bg-white rounded-lg shadow-md p-6 text-center ${
              index === 0 ? 'ring-2 ring-yellow-400' : ''
            }`}>
              <div className="flex justify-center mb-4">
                {getRankIcon(user.rank)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.realName}</h3>
              <p className="text-sm text-gray-600 mb-2">{user.class}</p>
              <p className="text-sm text-gray-600 mb-4">@{user.username}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">解题数:</span>
                  <span className="font-medium">{user.solvedProblems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">通过率:</span>
                  <span className="font-medium">{user.acceptanceRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rating:</span>
                  <span className={`font-medium ${getRatingColor(user.rating)}`}>
                    {user.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 完整排行榜 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  班级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  解题数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  通过率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRanking.map((user) => (
                <tr key={user.rank} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(user.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.realName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.class}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.solvedProblems}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.totalSubmissions}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{user.acceptanceRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${user.acceptanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getRatingColor(user.rating)}`}>
                      {user.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 <span className="font-medium">1</span> 到 <span className="font-medium">{currentRanking.length}</span> 条，
              共 <span className="font-medium">{currentRanking.length}</span> 条记录
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                上一页
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}