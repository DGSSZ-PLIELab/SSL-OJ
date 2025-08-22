import { Problem, IProblem } from '../models';
import { Types } from 'mongoose';

// 题目请求接口
export interface CreateProblemRequest {
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  timeLimit: number;
  memoryLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublic: boolean;
  testCases?: {
    input: string;
    output: string;
    isHidden: boolean;
  }[];
}

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: string;
}

export interface ProblemQueryOptions {
  page?: number;
  limit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'title' | 'difficulty' | 'submissionCount';
  sortOrder?: 'asc' | 'desc';
}

// 题目响应接口
export interface ProblemListResponse {
  problems: {
    id: string;
    title: string;
    difficulty: string;
    tags: string[];
    submissionCount: number;
    acceptedCount: number;
    acceptanceRate: number;
    isPublic: boolean;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProblemDetailResponse {
  id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  timeLimit: number;
  memoryLimit: number;
  difficulty: string;
  tags: string[];
  submissionCount: number;
  acceptedCount: number;
  acceptanceRate: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  testCases?: {
    input: string;
    output: string;
    isHidden: boolean;
  }[];
}

export class ProblemService {
  /**
   * 创建新题目
   */
  static async createProblem(data: CreateProblemRequest, creatorId: string): Promise<ProblemDetailResponse> {
    try {
      const problem = new Problem({
        ...data,
        creator: new Types.ObjectId(creatorId),
        submissionCount: 0,
        acceptedCount: 0
      });

      const savedProblem = await problem.save();
      return this.formatProblemDetail(savedProblem);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('题目标题已存在');
      }
      throw new Error(`创建题目失败: ${error.message}`);
    }
  }

  /**
   * 获取题目列表
   */
  static async getProblems(options: ProblemQueryOptions = {}): Promise<ProblemListResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        difficulty,
        tags,
        search,
        isPublic,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // 构建查询条件
      const query: any = {};
      
      if (difficulty) {
        query.difficulty = difficulty;
      }
      
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (typeof isPublic === 'boolean') {
        query.isPublic = isPublic;
      }

      // 构建排序条件
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // 计算分页
      const skip = (page - 1) * limit;

      // 执行查询
      const [problems, total] = await Promise.all([
        Problem.find(query)
          .select('-testCases -description -inputFormat -outputFormat -sampleInput -sampleOutput')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Problem.countDocuments(query)
      ]);

      const formattedProblems = problems.map(problem => ({
        id: problem._id.toString(),
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags,
        submissionCount: problem.submissionCount,
        acceptedCount: problem.acceptedCount,
        acceptanceRate: problem.submissionCount > 0 
          ? Math.round((problem.acceptedCount / problem.submissionCount) * 100) 
          : 0,
        isPublic: problem.isPublic,
        createdAt: problem.createdAt
      }));

      return {
        problems: formattedProblems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取题目列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取题目详情
   */
  static async getProblemById(id: string, includeTestCases: boolean = false): Promise<ProblemDetailResponse | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const selectFields = includeTestCases ? '' : '-testCases';
      const problem = await Problem.findById(id).select(selectFields).lean();
      
      if (!problem) {
        return null;
      }

      return this.formatProblemDetail(problem);
    } catch (error: any) {
      throw new Error(`获取题目详情失败: ${error.message}`);
    }
  }

  /**
   * 更新题目
   */
  static async updateProblem(data: UpdateProblemRequest): Promise<ProblemDetailResponse | null> {
    try {
      const { id, ...updateData } = data;
      
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const problem = await Problem.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();

      if (!problem) {
        return null;
      }

      return this.formatProblemDetail(problem);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('题目标题已存在');
      }
      throw new Error(`更新题目失败: ${error.message}`);
    }
  }

  /**
   * 删除题目
   */
  static async deleteProblem(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Problem.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`删除题目失败: ${error.message}`);
    }
  }

  /**
   * 获取题目统计信息
   */
  static async getProblemStats() {
    try {
      const [totalCount, difficultyStats, tagStats] = await Promise.all([
        Problem.countDocuments({ isPublic: true }),
        Problem.aggregate([
          { $match: { isPublic: true } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ]),
        Problem.aggregate([
          { $match: { isPublic: true } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ])
      ]);

      return {
        totalCount,
        difficultyStats: difficultyStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        popularTags: tagStats.map(item => ({
          tag: item._id,
          count: item.count
        }))
      };
    } catch (error: any) {
      throw new Error(`获取题目统计失败: ${error.message}`);
    }
  }

  /**
   * 格式化题目详情
   */
  private static formatProblemDetail(problem: any): ProblemDetailResponse {
    return {
      id: problem._id.toString(),
      title: problem.title,
      description: problem.description,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      sampleInput: problem.sampleInput,
      sampleOutput: problem.sampleOutput,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      difficulty: problem.difficulty,
      tags: problem.tags,
      submissionCount: problem.submissionCount,
      acceptedCount: problem.acceptedCount,
      acceptanceRate: problem.submissionCount > 0 
        ? Math.round((problem.acceptedCount / problem.submissionCount) * 100) 
        : 0,
      isPublic: problem.isPublic,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      testCases: problem.testCases
    };
  }

  /**
   * 验证题目数据
   */
  static validateProblemData(data: CreateProblemRequest | UpdateProblemRequest): string[] {
    const errors: string[] = [];

    if ('title' in data) {
      if (!data.title || data.title.trim().length < 3) {
        errors.push('题目标题至少需要3个字符');
      }
      if (data.title && data.title.length > 100) {
        errors.push('题目标题不能超过100个字符');
      }
    }

    if ('description' in data) {
      if (!data.description || data.description.trim().length < 10) {
        errors.push('题目描述至少需要10个字符');
      }
    }

    if ('timeLimit' in data) {
      if (data.timeLimit && (data.timeLimit < 100 || data.timeLimit > 10000)) {
        errors.push('时间限制必须在100ms到10000ms之间');
      }
    }

    if ('memoryLimit' in data) {
      if (data.memoryLimit && (data.memoryLimit < 16 || data.memoryLimit > 512)) {
        errors.push('内存限制必须在16MB到512MB之间');
      }
    }

    if ('tags' in data) {
      if (data.tags && data.tags.length > 10) {
        errors.push('标签数量不能超过10个');
      }
    }

    return errors;
  }
}

export default ProblemService;