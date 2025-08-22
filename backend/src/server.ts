import dotenv from 'dotenv';
import path from 'path';
import { startServer } from './app';

// 加载环境变量
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// 验证必需的环境变量
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n请检查 .env 文件并确保所有必需的环境变量都已设置。');
  process.exit(1);
}

// 设置默认环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3001';

// 显示启动信息
console.log('🎯 SSL-OJ 后端服务启动中...');
console.log(`📦 环境: ${process.env.NODE_ENV}`);
console.log(`🔗 数据库: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')}`);
console.log(`🔑 JWT密钥: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);
console.log(`🔄 刷新密钥: ${process.env.JWT_REFRESH_SECRET ? '已设置' : '未设置'}`);

// 启动服务器
const port = parseInt(process.env.PORT, 10);
startServer(port).catch((error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
});