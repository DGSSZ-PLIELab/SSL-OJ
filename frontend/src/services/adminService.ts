import api from './api'

// 管理员统计数据接口
export interface AdminStats {
  totalUsers: number
  totalProblems: number
  totalSubmissions: number
  activeContests: number
  pendingReviews: number
}

// 用户管理接口
export interface AdminUser {
  id: string
  userId: string
  username: string
  realName: string
  email: string
  class: string
  role: 'student' | 'teacher' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  joinDate: string
  lastLogin: string
}

// 题目管理接口
export interface AdminProblem {
  id: string
  problemId: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  status: 'active' | 'inactive' | 'draft'
  submissions: number
  accepted: number
  createDate: string
  author: string
}

// 比赛管理接口
export interface AdminContest {
  id: string
  contestId: string
  title: string
  description: string
  startTime: string
  endTime: string
  duration: number
  participants: number
  status: 'upcoming' | 'running' | 'ended'
  type: 'public' | 'private'
  creator: string
}

// 系统配置接口
export interface SystemConfig {
  siteName: string
  siteDescription: string
  allowRegistration: boolean
  defaultUserRole: 'student' | 'teacher'
  maxSubmissionSize: number
  judgeTimeout: number
  enableContest: boolean
  enableRanking: boolean
  maintenanceMode: boolean
  announcementText: string
}

// 管理员服务
export const adminService = {
  // 获取统计数据
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/admin/stats')
    return response.data
  },

  // 用户管理
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<{
    users: AdminUser[]
    total: number
    totalPages: number
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    const response = await api.get(`/admin/users?${params}`)
    return response.data
  },

  async createUser(userData: Omit<AdminUser, 'id' | 'joinDate' | 'lastLogin'>): Promise<AdminUser> {
    const response = await api.post('/admin/users', userData)
    return response.data
  },

  async updateUser(userId: string, userData: Partial<AdminUser>): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${userId}`, userData)
    return response.data
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`)
  },

  async banUser(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/ban`)
  },

  async unbanUser(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/unban`)
  },

  // 题目管理
  async getProblems(page: number = 1, limit: number = 10, search?: string): Promise<{
    problems: AdminProblem[]
    total: number
    totalPages: number
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    const response = await api.get(`/admin/problems?${params}`)
    return response.data
  },

  async createProblem(problemData: Omit<AdminProblem, 'id' | 'createDate' | 'submissions' | 'accepted'>): Promise<AdminProblem> {
    const response = await api.post('/admin/problems', problemData)
    return response.data
  },

  async updateProblem(problemId: string, problemData: Partial<AdminProblem>): Promise<AdminProblem> {
    const response = await api.put(`/admin/problems/${problemId}`, problemData)
    return response.data
  },

  async deleteProblem(problemId: string): Promise<void> {
    await api.delete(`/admin/problems/${problemId}`)
  },

  async toggleProblemStatus(problemId: string): Promise<AdminProblem> {
    const response = await api.post(`/admin/problems/${problemId}/toggle-status`)
    return response.data
  },

  // 比赛管理
  async getContests(page: number = 1, limit: number = 10, search?: string): Promise<{
    contests: AdminContest[]
    total: number
    totalPages: number
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    const response = await api.get(`/admin/contests?${params}`)
    return response.data
  },

  async deleteContest(contestId: string): Promise<void> {
    await api.delete(`/admin/contests/${contestId}`)
  },

  async toggleContestStatus(contestId: string): Promise<AdminContest> {
    const response = await api.post(`/admin/contests/${contestId}/toggle-status`)
    return response.data
  },

  // 系统配置
  async getSystemConfig(): Promise<SystemConfig> {
    const response = await api.get('/admin/config')
    return response.data
  },

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const response = await api.put('/admin/config', config)
    return response.data
  },

  // 系统维护
  async enableMaintenanceMode(): Promise<void> {
    await api.post('/admin/maintenance/enable')
  },

  async disableMaintenanceMode(): Promise<void> {
    await api.post('/admin/maintenance/disable')
  },

  // 数据导出
  async exportUsers(): Promise<Blob> {
    const response = await api.get('/admin/export/users', {
      responseType: 'blob'
    })
    return response.data
  },

  async exportProblems(): Promise<Blob> {
    const response = await api.get('/admin/export/problems', {
      responseType: 'blob'
    })
    return response.data
  },

  async exportSubmissions(startDate?: string, endDate?: string): Promise<Blob> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/admin/export/submissions?${params}`, {
      responseType: 'blob'
    })
    return response.data
  }
}