import { Request, Response } from 'express';
import { ProblemService, CreateProblemRequest, UpdateProblemRequest, ProblemQueryOptions } from '../services/problemService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * 题目控制器
 */
export class ProblemController {
  /**
   * 创建题目
   */
  static async createProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      // 验证请求数据
      const validationErrors = ProblemService.validateProblemData(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validationErrors
        });
        return;
      }

      const problemData: CreateProblemRequest = {
        title: req.body.title,
        description: req.body.description,
        inputFormat: req.body.inputFormat,
        outputFormat: req.body.outputFormat,
        sampleInput: req.body.sampleInput,
        sampleOutput: req.body.sampleOutput,
        timeLimit: req.body.timeLimit || 1000,
        memoryLimit: req.body.memoryLimit || 128,
        difficulty: req.body.difficulty || 'medium',
        tags: req.body.tags || [],
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
        testCases: req.body.testCases || []
      };

      const problem = await ProblemService.createProblem(problemData, userId);

      res.status(201).json({
        success: true,
        message: '题目创建成功',
        data: problem
      });
    } catch (error: any) {
      console.error('创建题目错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建题目失败'
      });
    }
  }

  /**
   * 获取题目列表
   */
  static async getProblems(req: Request, res: Response): Promise<void> {
    try {
      const options: ProblemQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        difficulty: req.query.difficulty as 'easy' | 'medium' | 'hard',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
        isPublic: req.query.isPublic !== undefined ? req.query.isPublic === 'true' : true,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await ProblemService.getProblems(options);

      res.json({
        success: true,
        message: '获取题目列表成功',
        data: result
      });
    } catch (error: any) {
      console.error('获取题目列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取题目列表失败'
      });
    }
  }

  /**
   * 获取题目详情
   */
  static async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeTestCases = req.query.includeTestCases === 'true';
      
      // 检查是否为管理员或教师（可以查看测试用例）
      const user = (req as AuthenticatedRequest).user;
      const canViewTestCases = user && (user.role === 'admin' || user.role === 'teacher') && includeTestCases;

      const problem = await ProblemService.getProblemById(id, canViewTestCases);

      if (!problem) {
        res.status(404).json({
          success: false,
          message: '题目不存在'
        });
        return;
      }

      // 如果题目未公开，只有管理员和教师可以查看
      if (!problem.isPublic && (!user || (user.role !== 'admin' && user.role !== 'teacher'))) {
        res.status(403).json({
          success: false,
          message: '无权访问此题目'
        });
        return;
      }

      res.json({
        success: true,
        message: '获取题目详情成功',
        data: problem
      });
    } catch (error: any) {
      console.error('获取题目详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取题目详情失败'
      });
    }
  }

  /**
   * 更新题目
   */
  static async updateProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      // 验证请求数据
      const updateData = { ...req.body, id };
      const validationErrors = ProblemService.validateProblemData(updateData);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validationErrors
        });
        return;
      }

      const problem = await ProblemService.updateProblem(updateData);

      if (!problem) {
        res.status(404).json({
          success: false,
          message: '题目不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '题目更新成功',
        data: problem
      });
    } catch (error: any) {
      console.error('更新题目错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新题目失败'
      });
    }
  }

  /**
   * 删除题目
   */
  static async deleteProblem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const success = await ProblemService.deleteProblem(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: '题目不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '题目删除成功'
      });
    } catch (error: any) {
      console.error('删除题目错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除题目失败'
      });
    }
  }

  /**
   * 获取题目统计信息
   */
  static async getProblemStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ProblemService.getProblemStats();

      res.json({
        success: true,
        message: '获取题目统计成功',
        data: stats
      });
    } catch (error: any) {
      console.error('获取题目统计错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取题目统计失败'
      });
    }
  }

  /**
   * 获取题目标签列表
   */
  static async getProblemTags(req: Request, res: Response): Promise<void> {
    try {
      // 这里可以从数据库获取所有使用过的标签
      // 暂时返回一些常用标签
      const commonTags = [
        '数组', '字符串', '链表', '栈', '队列',
        '树', '图', '动态规划', '贪心', '回溯',
        '分治', '排序', '搜索', '数学', '位运算',
        '模拟', '递归', '迭代', '哈希表', '双指针'
      ];

      res.json({
        success: true,
        message: '获取标签列表成功',
        data: {
          tags: commonTags
        }
      });
    } catch (error: any) {
      console.error('获取标签列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取标签列表失败'
      });
    }
  }
}

export default ProblemController;