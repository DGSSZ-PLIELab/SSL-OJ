import api from './api'

// 比赛接口类型定义
export interface Contest {
  contestId: string
  title: string
  description: string
  type: 'public' | 'private' | 'official' | 'practice'
  rule: 'acm' | 'oi'
  status: 'upcoming' | 'running' | 'ended' | 'cancelled'
  startTime: string
  endTime: string
  duration: number
  maxParticipants?: number
  password?: string
  isPublic: boolean
  allowedLanguages?: string[]
  problems: ContestProblem[]
  participants: Participant[]
  participantCount: number
  isUpcoming: boolean
  isRunning: boolean
  isEnded: boolean
  createdBy: {
    id: string
    username: string
    realName: string
  }
  createdAt: string
  updatedAt: string
}

export interface ContestProblem {
  problemId: string
  label: string
  title: string
  score?: number
  solved: number
  attempts: number
  timeLimit: number
  memoryLimit: number
  userStatus?: 'unattempted' | 'attempted' | 'solved'
}

export interface Participant {
  userId: string
  username: string
  realName: string
  registeredAt: string
  isOfficial: boolean
}

export interface ContestRanking {
  userId: string
  username: string
  realName: string
  rank: number
  totalScore: number
  totalTime: number
  solvedCount: number
  problemResults: {
    [problemId: string]: {
      score: number
      attempts: number
      timeUsed: number
      firstSolvedAt?: string
    }
  }
}

export interface ContestStatistics {
  overview: {
    participantCount: number
    totalSubmissions: number
    acceptedSubmissions: number
    acceptanceRate: number
  }
  problemStatistics: {
    problemId: string
    label: string
    totalSubmissions: number
    acceptedSubmissions: number
    uniqueSolvers: number
    acceptanceRate: number
  }[]
  languageDistribution: {
    _id: string
    count: number
    accepted: number
  }[]
}

// 比赛API服务
export const contestService = {
  // 获取比赛列表
  async getContests(params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const response = await api.get('/contests', { params })
    return response.data
  },

  // 获取比赛详情
  async getContestById(contestId: string) {
    const response = await api.get(`/contests/${contestId}`)
    return response.data.contest as Contest
  },

  // 创建比赛
  async createContest(contestData: {
    title: string
    description: string
    type: string
    rule: string
    startTime: string
    duration: number
    maxParticipants?: number
    password?: string
    isPublic: boolean
    allowedLanguages?: string[]
    problems: string[]
    announcement?: string
    prizes?: string[]
    tags: string[]
  }) {
    const response = await api.post('/contests', contestData)
    return response.data
  },

  // 更新比赛
  async updateContest(contestId: string, contestData: Partial<Contest>) {
    const response = await api.put(`/contests/${contestId}`, contestData)
    return response.data
  },

  // 删除比赛
  async deleteContest(contestId: string) {
    const response = await api.delete(`/contests/${contestId}`)
    return response.data
  },

  // 参加比赛
  async joinContest(contestId: string, password?: string) {
    const response = await api.post(`/contests/${contestId}/join`, { password })
    return response.data
  },

  // 退出比赛
  async leaveContest(contestId: string) {
    const response = await api.post(`/contests/${contestId}/leave`)
    return response.data
  },

  // 获取比赛排行榜
  async getContestRanking(contestId: string, params?: {
    page?: number
    limit?: number
  }) {
    const response = await api.get(`/contests/${contestId}/ranking`, { params })
    return response.data
  },

  // 获取比赛题目列表
  async getContestProblems(contestId: string) {
    const response = await api.get(`/contests/${contestId}/problems`)
    return response.data
  },

  // 获取比赛提交记录
  async getContestSubmissions(contestId: string, params?: {
    page?: number
    limit?: number
    problemId?: string
    userId?: string
    status?: string
    language?: string
  }) {
    const response = await api.get(`/contests/${contestId}/submissions`, { params })
    return response.data
  },

  // 获取比赛统计信息
  async getContestStatistics(contestId: string) {
    const response = await api.get(`/contests/${contestId}/statistics`)
    return response.data.statistics as ContestStatistics
  },

  // 更新比赛状态（管理员）
  async updateContestStatus(contestId: string, status: string) {
    const response = await api.patch(`/contests/${contestId}/status`, { status })
    return response.data
  },

  // 冻结排行榜（管理员）
  async freezeRanking(contestId: string) {
    const response = await api.post(`/contests/${contestId}/freeze`)
    return response.data
  },

  // 解冻排行榜（管理员）
  async unfreezeRanking(contestId: string) {
    const response = await api.post(`/contests/${contestId}/unfreeze`)
    return response.data
  }
}

export default contestService