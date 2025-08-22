import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 404图标 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-16 h-16 text-blue-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
        </div>

        {/* 404标题 */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">页面未找到</h2>
          <p className="text-gray-600 mb-8">
            抱歉，您访问的页面不存在。可能是链接错误，或者页面已被移动或删除。
            请检查URL是否正确，或者返回主页继续浏览。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回上页
          </button>
        </div>

        {/* 帮助信息 */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">您可能在寻找：</h3>
          <div className="space-y-2">
            <Link
              to="/problems"
              className="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              题目列表
            </Link>
            <Link
              to="/contests"
              className="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              比赛列表
            </Link>
            <Link
              to="/ranking"
              className="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              排行榜
            </Link>
            <Link
              to="/login"
              className="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              用户登录
            </Link>
          </div>
        </div>

        {/* 联系信息 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            如果您认为这是一个错误，请联系系统管理员。
          </p>
        </div>
      </div>
    </div>
  )
}