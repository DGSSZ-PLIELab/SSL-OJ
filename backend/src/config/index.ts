import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

interface Config {
  env: string
  port: number
  database: {
    path: string
    type: 'sqlite'
  }
  mysql: {
    host: string
    port: number
    username: string
    password: string
    database: string
    dialect: 'mysql'
  }
  jwt: {
    secret: string
    refreshSecret: string
    expiresIn: string
    refreshExpiresIn: string
  }
  cors: {
    origin: string | string[]
  }
  frontend: {
    url: string
  }
  judge: {
    timeLimit: number
    memoryLimit: number
    languages: string[]
  }
  upload: {
    maxSize: number
    allowedTypes: string[]
  }
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    path: process.env.DATABASE_PATH || './database.sqlite',
    type: 'sqlite' as const
  },
  
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ssl_oj',
    dialect: 'mysql' as const
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:5173']
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  judge: {
    timeLimit: parseInt(process.env.DEFAULT_TIME_LIMIT || '1000', 10), // ms
    memoryLimit: parseInt(process.env.DEFAULT_MEMORY_LIMIT || '128', 10), // MB
    languages: ['cpp', 'c', 'java', 'python', 'javascript']
  },
  
  upload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain']
  }
}

// 验证必需的环境变量
const requiredEnvVars = ['JWT_SECRET']

if (config.env === 'production') {
  requiredEnvVars.push('MONGODB_URI')
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

console.log('✅ Configuration loaded successfully')