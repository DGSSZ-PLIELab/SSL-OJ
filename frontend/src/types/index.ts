// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  studentId?: string;
  role: 'student' | 'teacher' | 'admin';
  profile?: {
    realName?: string;
    avatar?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  studentId?: string;
  role?: 'student' | 'teacher';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

// Problem types
export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  testCases: TestCase[];
  sampleInput?: string;
  sampleOutput?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
  acceptedCount: number;
}

export interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

export interface CreateProblemRequest {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  testCases: TestCase[];
  sampleInput?: string;
  sampleOutput?: string;
}

// Submission types
export interface Submission {
  _id: string;
  problemId: string;
  userId: string;
  code: string;
  language: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compile Error';
  score?: number;
  executionTime?: number;
  memoryUsage?: number;
  judgeResult?: JudgeResult;
  createdAt: string;
  updatedAt: string;
}

export interface JudgeResult {
  status: string;
  score: number;
  executionTime: number;
  memoryUsage: number;
  testResults: TestResult[];
  compileOutput?: string;
  error?: string;
}

export interface TestResult {
  testCase: number;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error';
  executionTime: number;
  memoryUsage: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface CreateSubmissionRequest {
  problemId: string;
  code: string;
  language: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Statistics types
export interface ProblemStats {
  totalProblems: number;
  easyProblems: number;
  mediumProblems: number;
  hardProblems: number;
  totalSubmissions: number;
  totalAccepted: number;
}

export interface UserStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  solvedProblems: number;
  acceptanceRate: number;
}

// Language types
export interface Language {
  id: string;
  name: string;
  extension: string;
  template?: string;
}