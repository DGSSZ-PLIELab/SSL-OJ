import api from './api'

// 题目接口定义
export interface Problem {
  id: string
  problemId: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  acceptedCount: number
  submissionCount: number
  acceptanceRate: number
  status: 'draft' | 'published' | 'archived'
  timeLimit: number
  memoryLimit: number
  description?: string
  inputFormat?: string
  outputFormat?: string
  constraints?: string
  sampleCases?: Array<{
    input: string
    output: string
    explanation?: string
  }>
  source?: string
  hint?: string
  createdAt: string
  updatedAt: string
}

// 题目列表响应接口
export interface ProblemsResponse {
  problems: Problem[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// 题目详情响应接口
export interface ProblemDetailResponse {
  problem: Problem & {
    userSubmissions?: Array<{
      submissionId: string
      status: string
      result: {
        score: number
        timeUsed: number
      }
      language: string
      submittedAt: string
    }>
  }
}

// 题目统计接口
export interface ProblemStatistics {
  basicStats: {
    totalSubmissions: number
    acceptedSubmissions: number
    uniqueSolvers: number
    acceptanceRate: number
  }
  statusStats: Array<{
    _id: string
    count: number
  }>
  languageStats: Array<{
    _id: string
    count: number
    accepted: number
  }>
  submissionTrend: Array<{
    date: string
    submissions: number
    accepted: number
  }>
}

// 题目搜索参数
export interface ProblemSearchParams {
  page?: number
  limit?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  tags?: string
  sortBy?: 'problemId' | 'title' | 'difficulty' | 'acceptedCount' | 'submissionCount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// 题目服务
export const problemService = {
  // 获取题目列表
  async getProblems(params: ProblemSearchParams = {}): Promise<ProblemsResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/problems?${searchParams.toString()}`)
    return response.data.data
  },

  // 获取题目详情
  async getProblemById(problemId: string): Promise<ProblemDetailResponse> {
    const response = await api.get(`/problems/${problemId}`)
    return response.data.data
  },

  // 搜索题目
  async searchProblems(params: {
    q: string
    type?: 'title' | 'description' | 'tag' | 'all'
    limit?: number
  }): Promise<{ problems: Problem[] }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/problems/search?${searchParams.toString()}`)
    return response.data.data
  },

  // 获取题目统计信息
  async getProblemStatistics(problemId: string): Promise<ProblemStatistics> {
    const response = await api.get(`/problems/${problemId}/statistics`)
    return response.data.data
  },

  // 获取所有题目标签
  async getProblemTags(): Promise<{ tags: Array<{ name: string; count: number }> }> {
    const response = await api.get('/problems/tags')
    return response.data.data
  },

  // 获取题目提交记录（需要权限）
  async getProblemSubmissions(problemId: string, params: {
    page?: number
    limit?: number
    status?: string
    language?: string
    userId?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/problems/${problemId}/submissions?${searchParams.toString()}`)
    return response.data.data
  }
}

export default problemService