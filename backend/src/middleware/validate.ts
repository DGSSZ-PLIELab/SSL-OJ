import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'
import { AppError } from './errorHandler'

// 验证中间件
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // 格式化错误信息
    const formattedErrors = errors.array().map((error: ValidationError) => {
      return {
        field: 'path' in error ? error.path : 'unknown',
        message: error.msg,
        value: 'value' in error ? error.value : undefined
      }
    })
    
    // 创建错误消息
    const errorMessage = formattedErrors
      .map(error => `${error.field}: ${error.message}`)
      .join('; ')
    
    return next(new AppError(`验证失败: ${errorMessage}`, 400))
  }
  
  next()
}

// 自定义验证器
export const customValidators = {
  // 验证用户名格式
  isValidUsername: (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(value)
  },
  
  // 验证密码强度
  isStrongPassword: (value: string) => {
    // 至少6个字符，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/
    return passwordRegex.test(value)
  },
  
  // 验证学号格式
  isValidStudentId: (value: string) => {
    // 可以为空或符合学号格式（数字和字母组合，长度4-20）
    if (!value) return true
    const studentIdRegex = /^[A-Za-z0-9]{4,20}$/
    return studentIdRegex.test(value)
  },
  
  // 验证题目ID格式
  isValidProblemId: (value: string) => {
    const problemIdRegex = /^[A-Z]\d{4}$/
    return problemIdRegex.test(value)
  },
  
  // 验证编程语言
  isValidLanguage: (value: string) => {
    const validLanguages = ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust']
    return validLanguages.includes(value.toLowerCase())
  },
  
  // 验证难度级别
  isValidDifficulty: (value: string) => {
    const validDifficulties = ['easy', 'medium', 'hard']
    return validDifficulties.includes(value.toLowerCase())
  },
  
  // 验证时间限制（毫秒）
  isValidTimeLimit: (value: number) => {
    return value >= 100 && value <= 10000 // 100ms到10s
  },
  
  // 验证内存限制（MB）
  isValidMemoryLimit: (value: number) => {
    return value >= 16 && value <= 512 // 16MB到512MB
  },
  
  // 验证分页参数
  isValidPage: (value: string) => {
    const page = parseInt(value)
    return !isNaN(page) && page >= 1
  },
  
  isValidLimit: (value: string) => {
    const limit = parseInt(value)
    return !isNaN(limit) && limit >= 1 && limit <= 100
  },
  
  // 验证排序字段
  isValidSortField: (validFields: string[]) => {
    return (value: string) => {
      return validFields.includes(value)
    }
  },
  
  // 验证排序方向
  isValidSortOrder: (value: string) => {
    return ['asc', 'desc', '1', '-1'].includes(value.toLowerCase())
  },
  
  // 验证ObjectId格式
  isValidObjectId: (value: string) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    return objectIdRegex.test(value)
  },
  
  // 验证日期格式
  isValidDate: (value: string) => {
    const date = new Date(value)
    return !isNaN(date.getTime())
  },
  
  // 验证未来日期
  isFutureDate: (value: string) => {
    const date = new Date(value)
    return date.getTime() > Date.now()
  },
  
  // 验证比赛持续时间（分钟）
  isValidDuration: (value: number) => {
    return value >= 30 && value <= 10080 // 30分钟到7天
  },
  
  // 验证文件大小（字节）
  isValidFileSize: (maxSize: number) => {
    return (value: number) => {
      return value > 0 && value <= maxSize
    }
  },
  
  // 验证文件类型
  isValidFileType: (allowedTypes: string[]) => {
    return (value: string) => {
      return allowedTypes.includes(value.toLowerCase())
    }
  },
  
  // 验证URL格式
  isValidUrl: (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  
  // 验证IP地址
  isValidIP: (value: string) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(value) || ipv6Regex.test(value)
  },
  
  // 验证端口号
  isValidPort: (value: number) => {
    return value >= 1 && value <= 65535
  },
  
  // 验证标签格式
  isValidTag: (value: string) => {
    // 标签只能包含字母、数字、中文和连字符，长度1-20
    const tagRegex = /^[\u4e00-\u9fa5a-zA-Z0-9-]{1,20}$/
    return tagRegex.test(value)
  },
  
  // 验证评分范围
  isValidRating: (value: number) => {
    return value >= 0 && value <= 3000
  },
  
  // 验证百分比
  isValidPercentage: (value: number) => {
    return value >= 0 && value <= 100
  },

  // 验证比赛ID格式
  contestId: (value: string) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    return objectIdRegex.test(value)
  },

  // 验证题目ID格式
  problemId: (value: string) => {
    const problemIdRegex = /^[A-Z]\d{4}$/
    return problemIdRegex.test(value)
  },

  // 验证提交ID格式
  submissionId: (value: string) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    return objectIdRegex.test(value)
  },

  // 验证编程语言
  language: (value: string) => {
    const validLanguages = ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust']
    return validLanguages.includes(value.toLowerCase())
  },

  // 验证标签格式
  tag: (value: string) => {
    const tagRegex = /^[\u4e00-\u9fa5a-zA-Z0-9-]{1,20}$/
    return tagRegex.test(value)
  },

  // 验证ObjectId格式
  objectId: (value: string) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    return objectIdRegex.test(value)
  },

  // 分页验证器
  pagination: {
    page: (value: string) => {
      const page = parseInt(value)
      return !isNaN(page) && page >= 1
    },
    limit: (value: string) => {
      const limit = parseInt(value)
      return !isNaN(limit) && limit >= 1 && limit <= 100
    }
  },

  // 排序验证器
  sorting: {
    order: (value: string) => {
      return ['asc', 'desc', '1', '-1'].includes(value.toLowerCase())
    }
  },

  // 日期验证器
  date: (value: string) => {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
}

// 通用验证规则生成器
export const createValidationRules = {
  // 分页验证规则
  pagination: () => [
    {
      field: 'page',
      optional: true,
      validator: customValidators.isValidPage,
      message: '页码必须是大于0的整数'
    },
    {
      field: 'limit',
      optional: true,
      validator: customValidators.isValidLimit,
      message: '每页数量必须是1-100之间的整数'
    }
  ],
  
  // 排序验证规则
  sorting: (validFields: string[]) => [
    {
      field: 'sortBy',
      optional: true,
      validator: customValidators.isValidSortField(validFields),
      message: `排序字段必须是以下之一: ${validFields.join(', ')}`
    },
    {
      field: 'sortOrder',
      optional: true,
      validator: customValidators.isValidSortOrder,
      message: '排序方向必须是 asc 或 desc'
    }
  ],
  
  // ObjectId验证规则
  objectId: (fieldName: string) => ({
    field: fieldName,
    validator: customValidators.isValidObjectId,
    message: `${fieldName} 必须是有效的ObjectId格式`
  })
}