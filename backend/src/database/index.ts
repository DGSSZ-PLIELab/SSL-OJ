import Database from 'better-sqlite3'
import { config } from '../config'
import { connectMySQL, closeMySQL } from './mysql'
import { initializeDatabase } from '../models'
import path from 'path'

// SQLite数据库实例
let db: Database.Database | null = null

// 连接数据库
export const connectDatabase = async (): Promise<void> => {
  try {
    // 连接SQLite（用于用户数据）
    const dbPath = path.resolve(config.database.path)
    
    db = new Database(dbPath)
    
    // 启用外键约束
    db.pragma('foreign_keys = ON')
    
    // 创建用户表
    createUserTable()
    
    console.log(`✅ Connected to SQLite database: ${dbPath}`)
    
    // 连接MySQL并初始化模型（用于题目和提交数据）
    await initializeDatabase()
    console.log('✅ Connected to MySQL database')
    
  } catch (error) {
    console.error('❌ Failed to connect to databases:', error)
    throw error
  }
}

// 断开数据库连接
export const disconnectDatabase = async (): Promise<void> => {
  try {
    // 断开SQLite连接
    if (db) {
      db.close()
      db = null
      console.log('✅ Disconnected from SQLite')
    }
    
    // 断开MySQL连接
    await closeMySQL()
    console.log('✅ Disconnected from MySQL')
    
  } catch (error) {
    console.error('❌ Error disconnecting from databases:', error)
    throw error
  }
}

// 创建用户表
const createUserTable = (): void => {
  if (!db) throw new Error('Database not connected')
  
  const createUserTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      student_id TEXT,
      class TEXT,
      role TEXT DEFAULT 'student',
      status TEXT DEFAULT 'active',
      avatar TEXT,
      bio TEXT,
      school TEXT,
      grade TEXT,
      total_submissions INTEGER DEFAULT 0,
      accepted_submissions INTEGER DEFAULT 0,
      solved_problems INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 1000,
      rank INTEGER DEFAULT 0,
      contests_participated INTEGER DEFAULT 0,
      email_notifications INTEGER DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  
  db.exec(createUserTableSQL)
}

// 获取数据库实例
export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.')
  }
  return db
}

// 清空数据库（仅用于测试）
export const clearDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase can only be used in test environment')
  }
  
  try {
    if (!db) throw new Error('Database not connected')
    
    db.exec('DELETE FROM users')
    
    console.log('✅ Database cleared')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

export default { connectDatabase, disconnectDatabase, getDatabase, clearDatabase }