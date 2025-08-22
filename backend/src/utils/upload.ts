import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import crypto from 'crypto'
import sharp from 'sharp'
import { config } from '../config'

// 文件类型配置
interface FileTypeConfig {
  allowedTypes: string[]
  maxSize: number
  destination: string
}

// 不同类型文件的配置
const fileConfigs: Record<string, FileTypeConfig> = {
  avatar: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    destination: 'uploads/avatars'
  },
  problem: {
    allowedTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'application/pdf'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    destination: 'uploads/problems'
  },
  submission: {
    allowedTypes: [
      'text/plain',
      'text/x-c',
      'text/x-c++src',
      'text/x-java-source',
      'text/x-python'
    ],
    maxSize: 1 * 1024 * 1024, // 1MB
    destination: 'uploads/submissions'
  },
  contest: {
    allowedTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    destination: 'uploads/contests'
  },
  export: {
    allowedTypes: [
      'application/json',
      'text/csv',
      'application/zip'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    destination: 'uploads/exports'
  }
}

// 确保上传目录存在
const ensureUploadDir = (dir: string) => {
  const fullPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
  return fullPath
}

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName)
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${random}${ext}`
}

// 文件类型验证
const fileFilter = (fileType: string) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const config = fileConfigs[fileType]
    if (!config) {
      return cb(new Error('未知的文件类型配置'))
    }
    
    if (config.allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  }
}

// 存储配置
const createStorage = (fileType: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const config = fileConfigs[fileType]
      const uploadDir = ensureUploadDir(config.destination)
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const fileName = generateFileName(file.originalname)
      cb(null, fileName)
    }
  })
}

// 创建上传中间件
export const createUploadMiddleware = (fileType: string, fieldName: string = 'file') => {
  const config = fileConfigs[fileType]
  if (!config) {
    throw new Error(`未知的文件类型: ${fileType}`)
  }
  
  return multer({
    storage: createStorage(fileType),
    fileFilter: fileFilter(fileType),
    limits: {
      fileSize: config.maxSize,
      files: 1
    }
  }).single(fieldName)
}

// 创建多文件上传中间件
export const createMultiUploadMiddleware = (fileType: string, fieldName: string = 'files', maxCount: number = 10) => {
  const config = fileConfigs[fileType]
  if (!config) {
    throw new Error(`未知的文件类型: ${fileType}`)
  }
  
  return multer({
    storage: createStorage(fileType),
    fileFilter: fileFilter(fileType),
    limits: {
      fileSize: config.maxSize,
      files: maxCount
    }
  }).array(fieldName, maxCount)
}

// 头像上传处理
export const uploadAvatar = createUploadMiddleware('avatar', 'avatar')

// 题目文件上传处理
export const uploadProblemFiles = createMultiUploadMiddleware('problem', 'files', 5)

// 代码提交上传处理
export const uploadSubmission = createUploadMiddleware('submission', 'code')

// 比赛文件上传处理
export const uploadContestFiles = createMultiUploadMiddleware('contest', 'files', 3)

// 数据导出文件上传处理
export const uploadExportFile = createUploadMiddleware('export', 'file')

// 图片处理函数
export const processImage = async (
  inputPath: string,
  outputPath: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
) => {
  try {
    const {
      width = 300,
      height = 300,
      quality = 80,
      format = 'jpeg'
    } = options
    
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFormat(format, { quality })
      .toFile(outputPath)
    
    return outputPath
  } catch (error) {
    console.error('图片处理失败:', error)
    throw new Error('图片处理失败')
  }
}

// 头像处理
export const processAvatar = async (inputPath: string, userId: string) => {
  const avatarDir = ensureUploadDir('uploads/avatars/processed')
  const outputPath = path.join(avatarDir, `${userId}.jpg`)
  
  await processImage(inputPath, outputPath, {
    width: 200,
    height: 200,
    quality: 85,
    format: 'jpeg'
  })
  
  return outputPath
}

// 文件删除
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error('文件删除失败:', error)
    return false
  }
}

// 批量删除文件
export const deleteFiles = async (filePaths: string[]): Promise<{ success: number; failed: number }> => {
  let success = 0
  let failed = 0
  
  for (const filePath of filePaths) {
    const result = await deleteFile(filePath)
    if (result) {
      success++
    } else {
      failed++
    }
  }
  
  return { success, failed }
}

// 获取文件信息
export const getFileInfo = (filePath: string) => {
  try {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filePath)
    const name = path.basename(filePath, ext)
    
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      name,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 验证文件扩展名
export const validateFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = path.extname(filename).toLowerCase()
  return allowedExtensions.includes(ext)
}

// 清理过期文件
export const cleanupExpiredFiles = async (directory: string, maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.promises.readdir(directory)
    const now = Date.now()
    let deletedCount = 0
    
    for (const file of files) {
      const filePath = path.join(directory, file)
      const stats = await fs.promises.stat(filePath)
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.promises.unlink(filePath)
        deletedCount++
      }
    }
    
    console.log(`清理过期文件完成，删除了 ${deletedCount} 个文件`)
    return deletedCount
  } catch (error) {
    console.error('清理过期文件失败:', error)
    return 0
  }
}

// 获取目录大小
export const getDirectorySize = async (directory: string): Promise<number> => {
  try {
    const files = await fs.promises.readdir(directory)
    let totalSize = 0
    
    for (const file of files) {
      const filePath = path.join(directory, file)
      const stats = await fs.promises.stat(filePath)
      
      if (stats.isFile()) {
        totalSize += stats.size
      } else if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath)
      }
    }
    
    return totalSize
  } catch (error) {
    console.error('获取目录大小失败:', error)
    return 0
  }
}

// 创建文件备份
export const createFileBackup = async (filePath: string): Promise<string> => {
  try {
    const backupPath = `${filePath}.backup.${Date.now()}`
    await fs.promises.copyFile(filePath, backupPath)
    return backupPath
  } catch (error) {
    console.error('创建文件备份失败:', error)
    throw new Error('创建文件备份失败')
  }
}

// 文件上传错误处理
export const handleUploadError = (error: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return { message: '文件大小超出限制', code: 'FILE_TOO_LARGE' }
      case 'LIMIT_FILE_COUNT':
        return { message: '文件数量超出限制', code: 'TOO_MANY_FILES' }
      case 'LIMIT_UNEXPECTED_FILE':
        return { message: '意外的文件字段', code: 'UNEXPECTED_FIELD' }
      default:
        return { message: '文件上传错误', code: 'UPLOAD_ERROR' }
    }
  }
  
  return { message: error.message || '未知上传错误', code: 'UNKNOWN_ERROR' }
}

// 获取文件的MIME类型
export const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++src',
    '.java': 'text/x-java-source',
    '.py': 'text/x-python',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.csv': 'text/csv'
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}

export default {
  createUploadMiddleware,
  createMultiUploadMiddleware,
  uploadAvatar,
  uploadProblemFiles,
  uploadSubmission,
  uploadContestFiles,
  uploadExportFile,
  processImage,
  processAvatar,
  deleteFile,
  deleteFiles,
  getFileInfo,
  formatFileSize,
  validateFileExtension,
  cleanupExpiredFiles,
  getDirectorySize,
  createFileBackup,
  handleUploadError,
  getMimeType
}