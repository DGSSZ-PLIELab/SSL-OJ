import nodemailer from 'nodemailer'
import { config } from '../config'
import fs from 'fs'
import path from 'path'
import handlebars from 'handlebars'

// 邮件配置接口
interface EmailConfig {
  to: string | string[]
  subject: string
  template?: string
  html?: string
  text?: string
  data?: Record<string, any>
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer | string
    contentType?: string
  }>
}

// 创建邮件传输器
const createTransporter = () => {
  if (config.env === 'development') {
    // 开发环境使用Ethereal Email（测试邮箱）
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }
  
  // 生产环境使用实际的SMTP配置
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// 加载邮件模板
const loadTemplate = (templateName: string): string => {
  const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`)
  
  try {
    return fs.readFileSync(templatePath, 'utf8')
  } catch (error) {
    console.error(`邮件模板加载失败: ${templateName}`, error)
    return ''
  }
}

// 编译邮件模板
const compileTemplate = (templateContent: string, data: Record<string, any>): string => {
  try {
    const template = handlebars.compile(templateContent)
    return template(data)
  } catch (error) {
    console.error('邮件模板编译失败:', error)
    return ''
  }
}

// 发送邮件
export const sendEmail = async (emailConfig: EmailConfig): Promise<void> => {
  try {
    const transporter = createTransporter()
    
    let htmlContent = emailConfig.html || ''
    let textContent = emailConfig.text || ''
    
    // 如果指定了模板，则加载并编译模板
    if (emailConfig.template) {
      const templateContent = loadTemplate(emailConfig.template)
      if (templateContent) {
        htmlContent = compileTemplate(templateContent, emailConfig.data || {})
        // 从HTML生成纯文本版本
        textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      }
    }
    
    const mailOptions = {
      from: {
        name: 'SSL Online Judge',
        address: process.env.SMTP_FROM || 'noreply@ssloj.com'
      },
      to: emailConfig.to,
      subject: emailConfig.subject,
      html: htmlContent,
      text: textContent,
      attachments: emailConfig.attachments
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    if (config.env === 'development') {
      console.log('邮件发送成功:')
      console.log('Message ID:', info.messageId)
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
    } else {
      console.log('邮件发送成功:', info.messageId)
    }
  } catch (error) {
    console.error('邮件发送失败:', error)
    throw new Error('邮件发送失败')
  }
}

// 发送欢迎邮件
export const sendWelcomeEmail = async (to: string, username: string, verificationUrl: string) => {
  await sendEmail({
    to,
    subject: '欢迎加入SSL Online Judge',
    template: 'welcome',
    data: {
      username,
      verificationUrl,
      supportEmail: 'support@ssloj.com',
      websiteUrl: config.frontend.url
    }
  })
}

// 发送邮箱验证邮件
export const sendEmailVerification = async (to: string, username: string, verificationUrl: string) => {
  await sendEmail({
    to,
    subject: 'SSL Online Judge - 邮箱验证',
    template: 'email-verification',
    data: {
      username,
      verificationUrl,
      expirationHours: 24
    }
  })
}

// 发送密码重置邮件
export const sendPasswordResetEmail = async (to: string, username: string, resetUrl: string) => {
  await sendEmail({
    to,
    subject: 'SSL Online Judge - 密码重置',
    template: 'password-reset',
    data: {
      username,
      resetUrl,
      expirationHours: 1
    }
  })
}

// 发送密码修改通知邮件
export const sendPasswordChangeNotification = async (to: string, username: string) => {
  await sendEmail({
    to,
    subject: 'SSL Online Judge - 密码已修改',
    template: 'password-changed',
    data: {
      username,
      changeTime: new Date().toLocaleString('zh-CN'),
      supportEmail: 'support@ssloj.com'
    }
  })
}

// 发送比赛通知邮件
export const sendContestNotification = async (
  to: string | string[],
  contestTitle: string,
  contestUrl: string,
  notificationType: 'start' | 'end' | 'reminder'
) => {
  const subjects = {
    start: `比赛开始通知 - ${contestTitle}`,
    end: `比赛结束通知 - ${contestTitle}`,
    reminder: `比赛提醒 - ${contestTitle}`
  }
  
  await sendEmail({
    to,
    subject: subjects[notificationType],
    template: 'contest-notification',
    data: {
      contestTitle,
      contestUrl,
      notificationType,
      websiteUrl: config.frontend.url
    }
  })
}

// 发送提交结果通知邮件
export const sendSubmissionResultNotification = async (
  to: string,
  username: string,
  problemTitle: string,
  submissionId: string,
  status: string,
  score?: number
) => {
  await sendEmail({
    to,
    subject: `提交结果通知 - ${problemTitle}`,
    template: 'submission-result',
    data: {
      username,
      problemTitle,
      submissionId,
      status,
      score,
      submissionUrl: `${config.frontend.url}/submissions/${submissionId}`
    }
  })
}

// 发送系统公告邮件
export const sendAnnouncementEmail = async (
  to: string | string[],
  title: string,
  content: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
) => {
  const priorityLabels = {
    low: '一般',
    normal: '重要',
    high: '紧急'
  }
  
  await sendEmail({
    to,
    subject: `[${priorityLabels[priority]}] ${title}`,
    template: 'announcement',
    data: {
      title,
      content,
      priority: priorityLabels[priority],
      websiteUrl: config.frontend.url
    }
  })
}

// 发送账户状态变更通知
export const sendAccountStatusNotification = async (
  to: string,
  username: string,
  newStatus: string,
  reason?: string
) => {
  const statusLabels: Record<string, string> = {
    active: '已激活',
    banned: '已封禁',
    suspended: '已暂停'
  }
  
  await sendEmail({
    to,
    subject: `账户状态变更通知 - ${statusLabels[newStatus] || newStatus}`,
    template: 'account-status-change',
    data: {
      username,
      newStatus: statusLabels[newStatus] || newStatus,
      reason,
      supportEmail: 'support@ssloj.com'
    }
  })
}

// 批量发送邮件
export const sendBulkEmail = async (
  recipients: string[],
  subject: string,
  template: string,
  data: Record<string, any>,
  batchSize: number = 50
) => {
  const batches = []
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize))
  }
  
  const results = []
  for (const batch of batches) {
    try {
      await sendEmail({
        to: batch,
        subject,
        template,
        data
      })
      results.push({ success: true, count: batch.length })
    } catch (error) {
      console.error(`批量邮件发送失败 (批次大小: ${batch.length}):`, error)
      results.push({ success: false, count: batch.length, error })
    }
    
    // 批次间延迟，避免发送过快
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

// 验证邮箱地址格式
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 获取邮件发送统计
export const getEmailStats = () => {
  // 这里可以实现邮件发送统计功能
  // 比如记录发送成功/失败的数量、发送历史等
  return {
    totalSent: 0,
    totalFailed: 0,
    lastSent: null
  }
}