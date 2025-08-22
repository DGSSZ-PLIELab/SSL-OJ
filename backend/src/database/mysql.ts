import { Sequelize } from 'sequelize'
import { config } from '../config'

// 创建MySQL数据库连接
export const sequelize = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    port: config.mysql.port,
    dialect: 'mysql',
    logging: config.env === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
)

// 测试数据库连接
export const connectMySQL = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    console.log('✅ MySQL数据库连接成功')
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error)
    throw error
  }
}

// 同步数据库表结构
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force })
    console.log('✅ 数据库表结构同步成功')
  } catch (error) {
    console.error('❌ 数据库表结构同步失败:', error)
    throw error
  }
}

// 初始化MySQL数据库
export const initializeMySQL = async (): Promise<void> => {
  await connectMySQL()
  await syncDatabase()
}

// 关闭数据库连接
export const closeMySQL = async (): Promise<void> => {
  try {
    await sequelize.close()
    console.log('✅ MySQL数据库连接已关闭')
  } catch (error) {
    console.error('❌ 关闭MySQL数据库连接失败:', error)
    throw error
  }
}

export default sequelize