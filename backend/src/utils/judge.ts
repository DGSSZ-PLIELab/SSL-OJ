import { spawn, ChildProcess } from 'child_process'
import { Writable } from 'stream'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { config } from '../config'

// 判题状态枚举
export enum JudgeStatus {
  PENDING = 'Pending',
  JUDGING = 'Judging',
  ACCEPTED = 'Accepted',
  WRONG_ANSWER = 'Wrong Answer',
  TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED = 'Memory Limit Exceeded',
  RUNTIME_ERROR = 'Runtime Error',
  COMPILE_ERROR = 'Compile Error',
  SYSTEM_ERROR = 'System Error',
  PRESENTATION_ERROR = 'Presentation Error'
}

// 编程语言配置
interface LanguageConfig {
  extension: string
  compileCommand?: string
  runCommand: string
  timeMultiplier: number
  memoryMultiplier: number
}

const languageConfigs: Record<string, LanguageConfig> = {
  c: {
    extension: '.c',
    compileCommand: 'gcc -o {output} {source} -O2 -std=c99',
    runCommand: '{executable}',
    timeMultiplier: 1,
    memoryMultiplier: 1
  },
  cpp: {
    extension: '.cpp',
    compileCommand: 'g++ -o {output} {source} -O2 -std=c++17',
    runCommand: '{executable}',
    timeMultiplier: 1,
    memoryMultiplier: 1
  },
  java: {
    extension: '.java',
    compileCommand: 'javac {source}',
    runCommand: 'java -cp {dir} {classname}',
    timeMultiplier: 2,
    memoryMultiplier: 2
  },
  python: {
    extension: '.py',
    runCommand: 'python3 {source}',
    timeMultiplier: 3,
    memoryMultiplier: 2
  },
  javascript: {
    extension: '.js',
    runCommand: 'node {source}',
    timeMultiplier: 2,
    memoryMultiplier: 2
  }
}

// 判题结果接口
interface JudgeResult {
  status: JudgeStatus
  score: number
  timeUsed: number
  memoryUsed: number
  testCases: TestCaseResult[]
  compileOutput?: string
  errorMessage?: string
}

// 测试用例结果接口
interface TestCaseResult {
  id: number
  status: JudgeStatus
  timeUsed: number
  memoryUsed: number
  input: string
  expectedOutput: string
  actualOutput: string
  score: number
}

// 判题配置接口
export interface JudgeConfig {
  timeLimit: number // 毫秒
  memoryLimit: number // MB
  testCases: TestCase[]
  language: string
  code: string
  problemId: string
  submissionId: string
}

// 测试用例接口
interface TestCase {
  id: number
  input: string
  output: string
  score: number
}

// 创建临时工作目录
const createWorkDir = (submissionId: string): string => {
  const workDir = path.join(process.cwd(), 'temp', 'judge', submissionId)
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true })
  }
  return workDir
}

// 清理工作目录
const cleanupWorkDir = (workDir: string): void => {
  try {
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error('清理工作目录失败:', error)
  }
}

// 写入源代码文件
const writeSourceFile = (workDir: string, language: string, code: string): string => {
  const config = languageConfigs[language]
  if (!config) {
    throw new Error(`不支持的编程语言: ${language}`)
  }
  
  const sourceFile = path.join(workDir, `main${config.extension}`)
  fs.writeFileSync(sourceFile, code, 'utf8')
  return sourceFile
}

// 编译代码
const compileCode = async (workDir: string, language: string, sourceFile: string): Promise<{ success: boolean; output: string; executable?: string }> => {
  const config = languageConfigs[language]
  
  if (!config) {
    return { success: false, output: `Unsupported language: ${language}` }
  }
  
  if (!config.compileCommand) {
    // 解释型语言，无需编译
    return { success: true, output: '', executable: sourceFile }
  }
  
  const executable = path.join(workDir, 'main')
  const command = config.compileCommand
    .replace('{source}', sourceFile)
    .replace('{output}', executable)
  
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ')
    
    if (!cmd) {
      resolve({ success: false, output: 'Invalid compile command' })
      return
    }
    
    const compileProcess: any = spawn(cmd, args, {
      cwd: workDir,
      timeout: 30000 // 30秒编译超时
    })
    
    let output = ''
    
    compileProcess.stdout.on('data', (data: any) => {
      output += data.toString()
    })
    
    compileProcess.stderr.on('data', (data: any) => {
      output += data.toString()
    })
    
    compileProcess.on('close', (code: any) => {
      if (code === 0 && fs.existsSync(executable)) {
        resolve({ success: true, output, executable })
      } else {
        resolve({ success: false, output })
      }
    })
    
    compileProcess.on('error', (error: Error) => {
      resolve({ success: false, output: error.message })
    })
  })
}

// 运行单个测试用例
const runTestCase = async (
  workDir: string,
  language: string,
  executable: string,
  testCase: TestCase,
  timeLimit: number,
  memoryLimit: number
): Promise<TestCaseResult> => {
  const langConfig = languageConfigs[language]
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`)
  }
  
  const adjustedTimeLimit = timeLimit * langConfig.timeMultiplier
  const adjustedMemoryLimit = memoryLimit * langConfig.memoryMultiplier
  
  let command = langConfig.runCommand
  if (language === 'java') {
    const classname = 'main'
    command = command.replace('{dir}', workDir).replace('{classname}', classname)
  } else {
    command = command.replace('{source}', executable).replace('{executable}', executable)
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now()
    const [cmd, ...args] = command.split(' ')
    
    if (!cmd) {
      resolve({
        id: testCase.id,
        status: JudgeStatus.SYSTEM_ERROR,
        timeUsed: 0,
        memoryUsed: 0,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: '',
        score: 0
      })
      return
    }
    
    const childProcess: any = spawn(cmd, args, {
      cwd: workDir,
      timeout: adjustedTimeLimit,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let output = ''
    let errorOutput = ''
    let memoryUsed = 0
    let killed = false
    
    // 监控内存使用
    const memoryMonitor = setInterval(() => {
      try {
        if (childProcess.pid) {
          // 这里可以实现更精确的内存监控
          // 简化实现，实际应该使用系统调用获取准确的内存使用量
          memoryUsed = Math.max(memoryUsed, 10) // 模拟内存使用
        }
      } catch (error) {
        // 进程可能已经结束
      }
    }, 100)
    
    // 设置超时处理
    const timer = setTimeout(() => {
      killed = true
      childProcess.kill('SIGKILL')
    }, adjustedTimeLimit)
    
    childProcess.stdout?.on('data', (data: any) => {
       output += data.toString()
     })
     
     childProcess.stderr?.on('data', (data: any) => {
       errorOutput += data.toString()
     })
     
     childProcess.on('close', (code: any, signal: any) => {
      clearInterval(memoryMonitor)
      clearTimeout(timer)
      const timeUsed = Date.now() - startTime
      
      let status: JudgeStatus
      let score = 0
      
      if (killed || signal === 'SIGTERM' || timeUsed >= adjustedTimeLimit) {
        status = JudgeStatus.TIME_LIMIT_EXCEEDED
      } else if (memoryUsed > adjustedMemoryLimit) {
        status = JudgeStatus.MEMORY_LIMIT_EXCEEDED
      } else if (code !== 0) {
        status = JudgeStatus.RUNTIME_ERROR
      } else {
        // 比较输出
        const actualOutput = output.trim()
        const expectedOutput = testCase.output.trim()
        
        if (actualOutput === expectedOutput) {
          status = JudgeStatus.ACCEPTED
          score = testCase.score
        } else {
          // 检查是否是格式错误
          const normalizedActual = actualOutput.replace(/\s+/g, ' ')
          const normalizedExpected = expectedOutput.replace(/\s+/g, ' ')
          
          if (normalizedActual === normalizedExpected) {
            status = JudgeStatus.PRESENTATION_ERROR
            score = Math.floor(testCase.score * 0.8) // 格式错误给80%分数
          } else {
            status = JudgeStatus.WRONG_ANSWER
          }
        }
      }
      
      resolve({
        id: testCase.id,
        status,
        timeUsed,
        memoryUsed,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: output.trim(),
        score
      })
    })
    
    childProcess.on('error', (error: Error) => {
      clearInterval(memoryMonitor)
      clearTimeout(timer)
      resolve({
        id: testCase.id,
        status: JudgeStatus.SYSTEM_ERROR,
        timeUsed: Date.now() - startTime,
        memoryUsed: 0,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: error.message,
        score: 0
      })
    })
    
    // 写入输入数据
    const stdin = (childProcess as any).stdin as Writable | null
    if (testCase.input && stdin) {
      stdin.write(testCase.input)
      stdin.end()
    } else if (stdin) {
      stdin.end()
    }
  })
}

// 主判题函数
export const judgeSubmission = async (judgeConfig: JudgeConfig): Promise<JudgeResult> => {
  const workDir = createWorkDir(judgeConfig.submissionId)
  
  try {
    // 写入源代码
    const sourceFile = writeSourceFile(workDir, judgeConfig.language, judgeConfig.code)
    
    // 编译代码
    const compileResult = await compileCode(workDir, judgeConfig.language, sourceFile)
    
    if (!compileResult.success) {
      return {
        status: JudgeStatus.COMPILE_ERROR,
        score: 0,
        timeUsed: 0,
        memoryUsed: 0,
        testCases: [],
        compileOutput: compileResult.output
      }
    }
    
    // 运行测试用例
    const testCaseResults: TestCaseResult[] = []
    let totalScore = 0
    let maxTime = 0
    let maxMemory = 0
    let overallStatus = JudgeStatus.ACCEPTED
    
    for (const testCase of judgeConfig.testCases) {
      const result = await runTestCase(
        workDir,
        judgeConfig.language,
        compileResult.executable!,
        testCase,
        judgeConfig.timeLimit,
        judgeConfig.memoryLimit
      )
      
      testCaseResults.push(result)
      totalScore += result.score
      maxTime = Math.max(maxTime, result.timeUsed)
      maxMemory = Math.max(maxMemory, result.memoryUsed)
      
      // 更新整体状态
      if (result.status !== JudgeStatus.ACCEPTED) {
        if (overallStatus === JudgeStatus.ACCEPTED) {
          overallStatus = result.status
        }
      }
    }
    
    return {
      status: overallStatus,
      score: totalScore,
      timeUsed: maxTime,
      memoryUsed: maxMemory,
      testCases: testCaseResults,
      compileOutput: compileResult.output
    }
    
  } catch (error) {
    console.error('判题过程出错:', error)
    return {
      status: JudgeStatus.SYSTEM_ERROR,
      score: 0,
      timeUsed: 0,
      memoryUsed: 0,
      testCases: [],
      errorMessage: error instanceof Error ? error.message : '未知系统错误'
    }
  } finally {
    // 清理工作目录
    setTimeout(() => cleanupWorkDir(workDir), 5000) // 5秒后清理
  }
}

// 获取支持的编程语言
export const getSupportedLanguages = (): string[] => {
  return Object.keys(languageConfigs)
}

// 验证编程语言
export const isLanguageSupported = (language: string): boolean => {
  return language in languageConfigs
}

// 获取语言配置
export const getLanguageConfig = (language: string): LanguageConfig | null => {
  return languageConfigs[language] || null
}

// 估算判题时间
export const estimateJudgeTime = (testCaseCount: number, timeLimit: number, language: string): number => {
  const config = languageConfigs[language]
  if (!config) return 0
  
  const baseTime = testCaseCount * timeLimit * config.timeMultiplier
  const compileTime = config.compileCommand ? 5000 : 0 // 编译时间
  const overhead = 2000 // 系统开销
  
  return baseTime + compileTime + overhead
}

// 创建测试用例
export const createTestCase = (id: number, input: string, output: string, score: number = 10): TestCase => {
  return { id, input, output, score }
}

// 验证代码安全性（简单检查）
export const validateCodeSecurity = (code: string, language: string): { safe: boolean; issues: string[] } => {
  const issues: string[] = []
  
  // 检查危险函数调用
  const dangerousPatterns = {
    c: [/system\s*\(/, /exec\s*\(/, /popen\s*\(/],
    cpp: [/system\s*\(/, /exec\s*\(/, /popen\s*\(/],
    java: [/Runtime\.getRuntime\(\)/, /ProcessBuilder/, /System\.exit\(/],
    python: [/import\s+os/, /import\s+subprocess/, /exec\s*\(/, /eval\s*\(/],
    javascript: [/require\s*\(/, /import\s+.*fs/, /process\./]
  }
  
  const patterns = dangerousPatterns[language as keyof typeof dangerousPatterns] || []
  
  for (const pattern of patterns) {
    if (pattern.test(code)) {
      issues.push(`检测到潜在危险代码: ${pattern.source}`)
    }
  }
  
  // 检查代码长度
  if (code.length > 100000) {
    issues.push('代码长度超出限制')
  }
  
  return {
    safe: issues.length === 0,
    issues
  }
}

// 生成判题队列ID
export const generateJudgeId = (): string => {
  return crypto.randomBytes(16).toString('hex')
}

export default {
  judgeSubmission,
  getSupportedLanguages,
  isLanguageSupported,
  getLanguageConfig,
  estimateJudgeTime,
  createTestCase,
  validateCodeSecurity,
  generateJudgeId,
  JudgeStatus
}