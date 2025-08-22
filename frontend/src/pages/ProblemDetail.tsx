import { useParams } from 'react-router-dom'
import { Clock, Users, CheckCircle, Code, Send } from 'lucide-react'
import { useState } from 'react'

export function ProblemDetail() {
  const { id } = useParams()
  const [selectedLanguage, setSelectedLanguage] = useState('cpp')
  const [code, setCode] = useState('')

  // 模拟题目数据
  const problem = {
    id: parseInt(id || '1001'),
    title: 'A+B Problem',
    difficulty: 'Easy',
    timeLimit: '1000ms',
    memoryLimit: '256MB',
    acceptedCount: 1250,
    submissionCount: 1500,
    description: `给定两个整数 A 和 B，计算 A + B 的值。

这是一个经典的入门题目，用于熟悉在线判题系统的使用。`,
    input: `输入包含两个整数 A 和 B，用空格分隔。

数据范围：-10^9 ≤ A, B ≤ 10^9`,
    output: `输出一个整数，表示 A + B 的值。`,
    sampleInput: '1 2',
    sampleOutput: '3',
    tags: ['数学', '入门']
  }

  const languages = [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'c', label: 'C' }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleSubmit = () => {
    if (!code.trim()) {
      alert('请输入代码')
      return
    }
    // 这里会调用提交API
    alert('代码已提交，请等待判题结果')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 题目描述 */}
        <div className="space-y-6">
          {/* 题目标题和信息 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {problem.id}. {problem.title}
              </h1>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                getDifficultyColor(problem.difficulty)
              }`}>
                {problem.difficulty === 'Easy' ? '简单' : 
                 problem.difficulty === 'Medium' ? '中等' : '困难'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                时间限制: {problem.timeLimit}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                内存限制: {problem.memoryLimit}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                通过: {problem.acceptedCount}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Send className="w-4 h-4 mr-1" />
                提交: {problem.submissionCount}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 题目描述 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">题目描述</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {problem.description}
            </div>
          </div>

          {/* 输入格式 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">输入格式</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {problem.input}
            </div>
          </div>

          {/* 输出格式 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">输出格式</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {problem.output}
            </div>
          </div>

          {/* 样例 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">样例</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">输入</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {problem.sampleInput}
                </pre>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">输出</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {problem.sampleOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 代码编辑器 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                代码编辑器
              </h2>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="在这里输入你的代码..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                支持的语言: C++, Java, Python, C
              </div>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                提交代码
              </button>
            </div>
          </div>

          {/* 提交记录 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">我的提交记录</h2>
            <div className="text-center text-gray-500 py-8">
              <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无提交记录</p>
              <p className="text-sm">提交代码后将显示判题结果</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}