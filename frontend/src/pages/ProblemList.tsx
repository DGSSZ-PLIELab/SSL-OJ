import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { problemService, Problem, ProblemSearchParams } from '../services/problemService'

// 难度映射
const difficultyMap = {
  'easy': 'Easy',
  'medium': 'Medium',
  'hard': 'Hard'
} as const

export function ProblemList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  // const [showFilters, setShowFilters] = useState(false) // 暂时注释，未来可能使用
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  const itemsPerPage = 10
  
  // 获取题目列表
  const fetchProblems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: ProblemSearchParams = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'problemId',
        sortOrder: 'asc'
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      if (difficultyFilter !== 'all') {
        params.difficulty = difficultyFilter as 'easy' | 'medium' | 'hard'
      }
      
      const response = await problemService.getProblems(params)
      setProblems(response.problems)
      setTotalPages(response.pagination.totalPages)
      setTotalItems(response.pagination.totalItems)
    } catch (err) {
      console.error('获取题目列表失败:', err)
      setError('获取题目列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 页面加载时获取数据
  useEffect(() => {
    fetchProblems()
  }, [currentPage, difficultyFilter])
  
  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1)
    fetchProblems()
  }
  
  // 回车搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
      case 'easy':
        return 'text-green-600 bg-green-50'
      case 'Medium':
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'Hard':
      case 'hard':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }
  
  // 页面变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  // 难度过滤变化处理
  const handleDifficultyChange = (difficulty: string) => {
    setDifficultyFilter(difficulty)
    setCurrentPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">题目列表</h1>
        <p className="text-gray-600">选择题目开始你的编程练习</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索框 */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索题目编号或标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 难度筛选 */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          {/* 搜索按钮 */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  题目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  难度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  通过率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标签
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    暂无题目数据
                  </td>
                </tr>
              ) : (
                problems.map((problem) => (
                  <tr key={problem.problemId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/problem/${problem.problemId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {problem.problemId}. {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getDifficultyColor(problem.difficulty)
                      }`}>
                        {difficultyMap[problem.difficulty as keyof typeof difficultyMap] || problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {problem.acceptanceRate ? `${problem.acceptanceRate}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {tag}
                          </span>
                        )) || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 <span className="font-medium">{currentPage}</span> 页，
                共 <span className="font-medium">{totalItems}</span> 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </button>
                
                {/* 页码 */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}