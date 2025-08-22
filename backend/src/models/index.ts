import { sequelize, connectMySQL, syncDatabase, closeMySQL } from '../database/mysql'
import Problem from './ProblemMySQL'
import Submission from './SubmissionMySQL'

// 定义模型关联关系
const defineAssociations = () => {
  // Problem 和 Submission 的关联
  Problem.hasMany(Submission, {
    foreignKey: 'problemId',
    sourceKey: 'problemId',
    as: 'submissions'
  })
  
  Submission.belongsTo(Problem, {
    foreignKey: 'problemId',
    targetKey: 'problemId',
    as: 'problem'
  })
  
  // User 和 Problem 的关联（作者）
  // 注意：这里假设User模型也会迁移到MySQL，暂时注释
  // User.hasMany(Problem, {
  //   foreignKey: 'authorId',
  //   as: 'authoredProblems'
  // })
  // 
  // Problem.belongsTo(User, {
  //   foreignKey: 'authorId',
  //   as: 'author'
  // })
  
  // User 和 Submission 的关联
  // User.hasMany(Submission, {
  //   foreignKey: 'userId',
  //   as: 'submissions'
  // })
  // 
  // Submission.belongsTo(User, {
  //   foreignKey: 'userId',
  //   as: 'user'
  // })
}

// 初始化数据库
export const initializeDatabase = async () => {
  try {
    // 连接数据库
    await connectMySQL()
    
    // 定义关联关系
    defineAssociations()
    
    // 同步数据库表结构（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false) // force: false，不删除现有数据
    }
    
    console.log('✅ MySQL数据库初始化完成')
  } catch (error) {
    console.error('❌ MySQL数据库初始化失败:', error)
    console.log('⚠️  MySQL连接失败，请确保MySQL服务正在运行或配置正确')
    console.log('💡 提示：可以安装并启动MySQL服务，或者暂时使用SQLite数据库')
    // 不抛出错误，让应用继续运行
    return
  }
}

// 关闭数据库连接
export const closeDatabaseConnection = async () => {
  await closeMySQL()
}

// 导出模型
export {
  sequelize,
  Problem,
  Submission
}

// 导出数据库操作函数
export {
  connectMySQL,
  syncDatabase,
  closeMySQL
}