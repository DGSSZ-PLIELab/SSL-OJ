import { Submission, ISubmission, Problem } from '../models';
import { Types } from 'mongoose';

// 提交请求接口
export interface CreateSubmissionRequest {
  problemId: string;
  language: string;
  code: string;
}

export interface SubmissionQueryOptions {
  page?: number;
  limit?: number;
  userId?: string;
  problemId?: string;
  language?: string;
  status?: 'pending' | 'judging' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compile_error' | 'system_error';
  sortBy?: 'createdAt' | 'executionTime' | 'memoryUsage';
  sortOrder?: 'asc' | 'desc';
}

// 提交响应接口
export interface SubmissionListResponse {
  submissions: {
    id: string;
    problemId: string;
    problemTitle: string;
    userId: string;
    username: string;
    language: string;
    status: string;
    score: number;
    executionTime: number;
    memoryUsage: number;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmissionDetailResponse {
  id: string;
  problemId: string;
  problemTitle: string;
  userId: string;
  username: string;
  language: string;
  code: string;
  status: string;
  score: number;
  executionTime: number;
  memoryUsage: number;
  compileOutput?: string;
  runtimeOutput?: string;
  errorMessage?: string;
  testCaseResults?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    executionTime: number;
    memoryUsage: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JudgeResult {
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compile_error' | 'system_error';
  score: number;
  executionTime: number;
  memoryUsage: number;
  compileOutput?: string;
  runtimeOutput?: string;
  errorMessage?: string;
  testCaseResults?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    executionTime: number;
    memoryUsage: number;
  }[];
}

export class SubmissionService {
  /**
   * 创建新提交
   */
  static async createSubmission(data: CreateSubmissionRequest, userId: string): Promise<SubmissionDetailResponse> {
    try {
      // 验证题目是否存在
      const problem = await Problem.findById(data.problemId);
      if (!problem) {
        throw new Error('题目不存在');
      }

      // 验证编程语言
      const supportedLanguages = ['cpp', 'java', 'python', 'javascript', 'c', 'go', 'rust'];
      if (!supportedLanguages.includes(data.language)) {
        throw new Error('不支持的编程语言');
      }

      // 验证代码长度
      if (!data.code || data.code.trim().length === 0) {
        throw new Error('代码不能为空');
      }
      if (data.code.length > 50000) {
        throw new Error('代码长度不能超过50KB');
      }

      const submission = new Submission({
        problemId: new Types.ObjectId(data.problemId),
        userId: new Types.ObjectId(userId),
        language: data.language,
        code: data.code,
        status: 'pending',
        score: 0,
        executionTime: 0,
        memoryUsage: 0
      });

      const savedSubmission = await submission.save();
      
      // 异步执行判题
      this.judgeSubmission(savedSubmission._id.toString()).catch(error => {
        console.error('判题失败:', error);
      });

      return this.formatSubmissionDetail(savedSubmission, problem.title, 'unknown');
    } catch (error: any) {
      throw new Error(`创建提交失败: ${error.message}`);
    }
  }

  /**
   * 获取提交列表
   */
  static async getSubmissions(options: SubmissionQueryOptions = {}): Promise<SubmissionListResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        problemId,
        language,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // 构建查询条件
      const query: any = {};
      
      if (userId) {
        query.userId = new Types.ObjectId(userId);
      }
      
      if (problemId) {
        query.problemId = new Types.ObjectId(problemId);
      }
      
      if (language) {
        query.language = language;
      }
      
      if (status) {
        query.status = status;
      }

      // 构建排序条件
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // 计算分页
      const skip = (page - 1) * limit;

      // 执行查询
      const [submissions, total] = await Promise.all([
        Submission.find(query)
          .populate('problemId', 'title')
          .populate('userId', 'username')
          .select('-code -compileOutput -runtimeOutput -errorMessage -testCaseResults')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Submission.countDocuments(query)
      ]);

      const formattedSubmissions = submissions.map(submission => ({
        id: submission._id.toString(),
        problemId: submission.problemId._id.toString(),
        problemTitle: submission.problemId.title,
        userId: submission.userId._id.toString(),
        username: submission.userId.username,
        language: submission.language,
        status: submission.status,
        score: submission.score,
        executionTime: submission.executionTime,
        memoryUsage: submission.memoryUsage,
        createdAt: submission.createdAt
      }));

      return {
        submissions: formattedSubmissions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取提交列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取提交详情
   */
  static async getSubmissionById(id: string, requestUserId?: string): Promise<SubmissionDetailResponse | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const submission = await Submission.findById(id)
        .populate('problemId', 'title')
        .populate('userId', 'username')
        .lean();
      
      if (!submission) {
        return null;
      }

      // 检查权限：只有提交者本人或管理员/教师可以查看代码
      const canViewCode = !requestUserId || 
        submission.userId._id.toString() === requestUserId;

      return this.formatSubmissionDetail(
        submission, 
        submission.problemId.title, 
        submission.userId.username,
        canViewCode
      );
    } catch (error: any) {
      throw new Error(`获取提交详情失败: ${error.message}`);
    }
  }

  /**
   * 重新判题
   */
  static async rejudgeSubmission(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        return false;
      }

      // 重置状态
      await Submission.findByIdAndUpdate(id, {
        status: 'pending',
        score: 0,
        executionTime: 0,
        memoryUsage: 0,
        compileOutput: undefined,
        runtimeOutput: undefined,
        errorMessage: undefined,
        testCaseResults: undefined,
        updatedAt: new Date()
      });

      // 异步执行判题
      this.judgeSubmission(id).catch(error => {
        console.error('重新判题失败:', error);
      });

      return true;
    } catch (error: any) {
      throw new Error(`重新判题失败: ${error.message}`);
    }
  }

  /**
   * 获取提交统计信息
   */
  static async getSubmissionStats(userId?: string) {
    try {
      const matchCondition = userId ? { userId: new Types.ObjectId(userId) } : {};

      const [totalCount, statusStats, languageStats, recentStats] = await Promise.all([
        Submission.countDocuments(matchCondition),
        Submission.aggregate([
          { $match: matchCondition },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Submission.aggregate([
          { $match: matchCondition },
          { $group: { _id: '$language', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Submission.aggregate([
          { $match: { ...matchCondition, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      return {
        totalCount,
        statusStats: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        languageStats: languageStats.map(item => ({
          language: item._id,
          count: item.count
        })),
        recentActivity: recentStats.map(item => ({
          date: item._id,
          count: item.count
        }))
      };
    } catch (error: any) {
      throw new Error(`获取提交统计失败: ${error.message}`);
    }
  }

  /**
   * 执行判题（模拟实现）
   */
  private static async judgeSubmission(submissionId: string): Promise<void> {
    try {
      // 更新状态为判题中
      await Submission.findByIdAndUpdate(submissionId, {
        status: 'judging',
        updatedAt: new Date()
      });

      // 模拟判题延迟
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // 模拟判题结果
      const results = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error'];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      
      const judgeResult: JudgeResult = {
        status: randomResult as any,
        score: randomResult === 'accepted' ? 100 : 0,
        executionTime: Math.floor(Math.random() * 1000) + 100,
        memoryUsage: Math.floor(Math.random() * 50) + 10,
        testCaseResults: [
          {
            input: '1 2',
            expectedOutput: '3',
            actualOutput: randomResult === 'accepted' ? '3' : '4',
            status: randomResult === 'accepted' ? 'accepted' : 'wrong_answer',
            executionTime: Math.floor(Math.random() * 100) + 10,
            memoryUsage: Math.floor(Math.random() * 10) + 5
          }
        ]
      };

      // 更新判题结果
      await Submission.findByIdAndUpdate(submissionId, {
        status: judgeResult.status,
        score: judgeResult.score,
        executionTime: judgeResult.executionTime,
        memoryUsage: judgeResult.memoryUsage,
        compileOutput: judgeResult.compileOutput,
        runtimeOutput: judgeResult.runtimeOutput,
        errorMessage: judgeResult.errorMessage,
        testCaseResults: judgeResult.testCaseResults,
        updatedAt: new Date()
      });

      // 如果通过，更新题目统计
      if (judgeResult.status === 'accepted') {
        const submission = await Submission.findById(submissionId);
        if (submission) {
          await Problem.findByIdAndUpdate(submission.problemId, {
            $inc: { acceptedCount: 1, submissionCount: 1 }
          });
        }
      } else {
        const submission = await Submission.findById(submissionId);
        if (submission) {
          await Problem.findByIdAndUpdate(submission.problemId, {
            $inc: { submissionCount: 1 }
          });
        }
      }
    } catch (error: any) {
      console.error('判题过程出错:', error);
      // 更新为系统错误
      await Submission.findByIdAndUpdate(submissionId, {
        status: 'system_error',
        errorMessage: '系统错误，请联系管理员',
        updatedAt: new Date()
      });
    }
  }

  /**
   * 格式化提交详情
   */
  private static formatSubmissionDetail(
    submission: any, 
    problemTitle: string, 
    username: string,
    includeCode: boolean = true
  ): SubmissionDetailResponse {
    return {
      id: submission._id.toString(),
      problemId: submission.problemId.toString(),
      problemTitle,
      userId: submission.userId.toString(),
      username,
      language: submission.language,
      code: includeCode ? submission.code : '[代码已隐藏]',
      status: submission.status,
      score: submission.score,
      executionTime: submission.executionTime,
      memoryUsage: submission.memoryUsage,
      compileOutput: submission.compileOutput,
      runtimeOutput: submission.runtimeOutput,
      errorMessage: submission.errorMessage,
      testCaseResults: submission.testCaseResults,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    };
  }
}

export default SubmissionService;