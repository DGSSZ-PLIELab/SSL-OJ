import { Link } from 'react-router-dom'
import { Trophy, BookOpen, Award } from 'lucide-react'

export function Home() {


  const recentContests = [
    {
      id: 1,
      title: '2024年春季编程竞赛',
      startTime: '2024-03-15 14:00',
      status: 'upcoming'
    },
    {
      id: 2,
      title: '算法基础练习赛',
      startTime: '2024-03-10 16:00',
      status: 'running'
    }
  ]

  const announcements = [
    {
      id: 1,
      title: '系统维护通知',
      content: '系统将于本周六凌晨2:00-4:00进行维护升级...',
      date: '2024-03-08',
      important: true
    },
    {
      id: 2,
      title: '新增Python 3.11支持',
      content: '现在支持使用Python 3.11进行代码提交...',
      date: '2024-03-05',
      important: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            SSL Online Judge
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            Dongguan Middle School-SongshanLake School(Group)
            <br />
            Dongguan No.13 High School Online Judge
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link
                to="/problems"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                开始刷题
              </Link>
              <Link
                to="/contests"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                参加比赛
              </Link>
            </div>
          </div>
        </div>
      </div>



      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 最新公告 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  最新公告
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          announcement.important ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {announcement.important && '【重要】'}{announcement.title}
                        </h3>
                        <span className="text-sm text-gray-500">{announcement.date}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/announcements"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    查看更多公告 →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 近期比赛 */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  近期比赛
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentContests.map((contest) => (
                    <div key={contest.id} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{contest.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{contest.startTime}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        contest.status === 'upcoming' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {contest.status === 'upcoming' ? '即将开始' : '进行中'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/contests"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    查看所有比赛 →
                  </Link>
                </div>
              </div>
            </div>

            {/* 快速链接 */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">快速导航</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/problems"
                    className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm font-medium">题目练习</div>
                  </Link>
                  <Link
                    to="/ranking"
                    className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                    <div className="text-sm font-medium">排行榜</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}