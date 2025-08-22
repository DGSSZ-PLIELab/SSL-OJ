import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  Problem,
  CreateProblemRequest,
  Submission,
  CreateSubmissionRequest,
  ApiResponse,
  PaginatedResponse,
  ProblemStats,
  UserStats,
  Language
} from '../types';

const API_BASE_URL = '/api/v1';

// 简单的内存缓存
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class ApiService {
  private cache = new Map<string, CacheItem>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5分钟

  private getCacheKey(endpoint: string, options?: RequestInit): string {
    return `${endpoint}_${JSON.stringify(options?.body || '')}`;
  }

  private getFromCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  private setCache(key: string, data: any, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = false,
    cacheTtl?: number
  ): Promise<T> {
    // 只对GET请求使用缓存
    if (useCache && (!options.method || options.method === 'GET')) {
      const cacheKey = this.getCacheKey(endpoint, options);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Network error occurred'
      }));
      throw new Error(errorData.message || 'Request failed');
    }

    const data = await response.json();
    
    // 缓存GET请求的成功响应
    if (useCache && (!options.method || options.method === 'GET')) {
      const cacheKey = this.getCacheKey(endpoint, options);
      this.setCache(cacheKey, data, cacheTtl);
    }
    
    return data;
  }

  // Auth APIs
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
  }

  // Problem APIs
  async getProblems(params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    tags?: string[];
    search?: string;
  }): Promise<PaginatedResponse<Problem>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.tags?.length) searchParams.append('tags', params.tags.join(','));
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/problems${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Problem>>(endpoint);
  }

  async getProblem(id: string): Promise<ApiResponse<Problem>> {
    return this.request<ApiResponse<Problem>>(`/problems/${id}`, {}, true, 5 * 60 * 1000); // 缓存5分钟
  }

  async createProblem(data: CreateProblemRequest): Promise<ApiResponse<Problem>> {
    return this.request<ApiResponse<Problem>>('/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProblem(id: string, data: Partial<CreateProblemRequest>): Promise<ApiResponse<Problem>> {
    return this.request<ApiResponse<Problem>>(`/problems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProblem(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/problems/${id}`, {
      method: 'DELETE',
    });
  }

  async getProblemStats(): Promise<ApiResponse<ProblemStats>> {
    return this.request<ApiResponse<ProblemStats>>('/problems/stats', {}, true, 2 * 60 * 1000); // 缓存2分钟
  }

  async getProblemTags(): Promise<ApiResponse<string[]>> {
    return this.request<ApiResponse<string[]>>('/problems/tags', {}, true, 10 * 60 * 1000); // 缓存10分钟
  }

  // Submission APIs
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    problemId?: string;
    userId?: string;
    status?: string;
    language?: string;
  }): Promise<PaginatedResponse<Submission>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.problemId) searchParams.append('problemId', params.problemId);
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.language) searchParams.append('language', params.language);

    const queryString = searchParams.toString();
    const endpoint = `/submissions${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Submission>>(endpoint);
  }

  async getSubmission(id: string): Promise<ApiResponse<Submission>> {
    return this.request<ApiResponse<Submission>>(`/submissions/${id}`);
  }

  async createSubmission(data: CreateSubmissionRequest): Promise<ApiResponse<Submission>> {
    return this.request<ApiResponse<Submission>>('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserSubmissions(params?: {
    page?: number;
    limit?: number;
    problemId?: string;
    status?: string;
    language?: string;
  }): Promise<PaginatedResponse<Submission>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.problemId) searchParams.append('problemId', params.problemId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.language) searchParams.append('language', params.language);

    const queryString = searchParams.toString();
    const endpoint = `/submissions/user${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Submission>>(endpoint);
  }

  async getSubmissionStats(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/submissions/stats');
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<ApiResponse<UserStats>>('/submissions/user/stats');
  }

  async getSupportedLanguages(): Promise<ApiResponse<Language[]>> {
    return this.request<ApiResponse<Language[]>>('/judge/languages', {}, true, 30 * 60 * 1000); // 缓存30分钟
  }

  async rejudgeSubmission(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/submissions/${id}/rejudge`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
export default apiService;