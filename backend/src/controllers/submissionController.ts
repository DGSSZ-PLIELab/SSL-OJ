import { Request, Response } from 'express';
import { SubmissionService, CreateSubmissionRequest, SubmissionQueryOptions } from '../services/submissionService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * 提交控制器
 */
export class SubmissionController {
  /**
   * 创建提交
   */
  static async createSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { problemId, language, code } = req.body;

      // 验证必填字段
      if (!problemId || !language || !code) {
        res.status(400).json({
          success: false,
          message: '题目ID、编程语言和代码都是必填的'
        });
        return;
      }

      const submissionData: CreateSubmissionRequest = {
        problemId,
        language,
        code
      };

      const submission = await SubmissionService.createSubmission(submissionData, userId);

      res.status(201).json({
        success: true,
        message: '代码提交成功，正在判题中',
        data: submission
      });
    } catch (error: any) {
      console.error('创建提交错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '提交失败'
      });
    }
  }

  /**
   * 获取提交列表
   */
  static async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const options: SubmissionQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        userId: req.query.userId as string,
        problemId: req.query.problemId as string,
        language: req.query.language as string,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await SubmissionService.getSubmissions(options);

      res.json({
        success: true,
        message: '获取提交列表成功',
        data: result
      });
    } catch (error: any) {
      console.error('获取提交列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取提交列表失败'
      });
    }
  }

  /**
   * 获取提交详情
   */
  static async getSubmissionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const submission = await SubmissionService.getSubmissionById(id, userId);

      if (!submission) {
        res.status(404).json({
          success: false,
          message: '提交记录不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '获取提交详情成功',
        data: submission
      });
    } catch (error: any) {
      console.error('获取提交详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取提交详情失败'
      });
    }
  }

  /**
   * 获取用户提交列表
   */
  static async getUserSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const options: SubmissionQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        userId: userId,
        problemId: req.query.problemId as string,
        language: req.query.language as string,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await SubmissionService.getSubmissions(options);

      res.json({
        success: true,
        message: '获取用户提交列表成功',
        data: result
      });
    } catch (error: any) {
      console.error('获取用户提交列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取用户提交列表失败'
      });
    }
  }

  /**
   * 重新判题
   */
  static async rejudgeSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;
      
      if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
        res.status(403).json({
          success: false,
          message: '权限不足，只有管理员和教师可以重新判题'
        });
        return;
      }

      const success = await SubmissionService.rejudgeSubmission(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: '提交记录不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '重新判题请求已提交'
      });
    } catch (error: any) {
      console.error('重新判题错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '重新判题失败'
      });
    }
  }

  /**
   * 获取提交统计信息
   */
  static async getSubmissionStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const stats = await SubmissionService.getSubmissionStats(userId);

      res.json({
        success: true,
        message: '获取提交统计成功',
        data: stats
      });
    } catch (error: any) {
      console.error('获取提交统计错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取提交统计失败'
      });
    }
  }

  /**
   * 获取用户提交统计
   */
  static async getUserSubmissionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const stats = await SubmissionService.getSubmissionStats(userId);

      res.json({
        success: true,
        message: '获取用户提交统计成功',
        data: stats
      });
    } catch (error: any) {
      console.error('获取用户提交统计错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取用户提交统计失败'
      });
    }
  }

  /**
   * 获取支持的编程语言列表
   */
  static async getSupportedLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = [
        {
          id: 'cpp',
          name: 'C++',
          version: 'g++ 9.4.0',
          extension: '.cpp',
          template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}'
        },
        {
          id: 'java',
          name: 'Java',
          version: 'OpenJDK 11',
          extension: '.java',
          template: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}'
        },
        {
          id: 'python',
          name: 'Python',
          version: 'Python 3.9',
          extension: '.py',
          template: '# Your code here\n'
        },
        {
          id: 'javascript',
          name: 'JavaScript',
          version: 'Node.js 16',
          extension: '.js',
          template: '// Your code here\n'
        },
        {
          id: 'c',
          name: 'C',
          version: 'gcc 9.4.0',
          extension: '.c',
          template: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}'
        },
        {
          id: 'go',
          name: 'Go',
          version: 'Go 1.19',
          extension: '.go',
          template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n}'
        },
        {
          id: 'rust',
          name: 'Rust',
          version: 'Rust 1.65',
          extension: '.rs',
          template: 'fn main() {\n    // Your code here\n}'
        }
      ];

      res.json({
        success: true,
        message: '获取支持的编程语言成功',
        data: {
          languages
        }
      });
    } catch (error: any) {
      console.error('获取支持的编程语言错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取支持的编程语言失败'
      });
    }
  }
}

export default SubmissionController;