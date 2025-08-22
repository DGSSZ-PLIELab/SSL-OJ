// 数据库模型统一导出
export { User, IUser, UserRole, UserStatus } from './User';
export { Problem, IProblem, ProblemDifficulty, ProblemStatus, JudgeMode, ITestCase, IResourceLimit } from './Problem';
export { Submission, ISubmission, SubmissionStatus, ProgrammingLanguage, ITestResult, ICompileInfo } from './Submission';
export { Contest, IContest, ContestType, ContestStatus, ContestMode, IContestProblem, IContestParticipant, IContestRanking } from './Contest';

// 数据库连接和初始化
import mongoose from 'mongoose';
import { User } from './User';
import { Problem } from './Problem';
import { Submission } from './Submission';
import { Contest } from './Contest';

// 数据库连接函数
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssl-oj';
  try {
    await mongoose.connect(uri, {
      // 连接选项
      maxPoolSize: 10, // 最大连接池大小
      serverSelectionTimeoutMS: 5000, // 服务器选择超时
      socketTimeoutMS: 45000, // Socket超时
    });
    
    console.log('✅ MongoDB连接成功');
    
    // 创建初始管理员用户（如果不存在）
    await createInitialAdmin();
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    console.log('⚠️  数据库连接失败，但API服务将继续运行（部分功能可能不可用）');
    // 不退出程序，允许API服务继续运行
  }
};

// 创建初始管理员用户
const createInitialAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ssl-oj.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        realName: '系统管理员',
        role: 'admin',
        school: process.env.SCHOOL_NAME || '东莞中学松山湖学校（集团）东莞市第十三高级中学'
      });
      
      await admin.save();
      console.log('✅ 初始管理员用户创建成功');
      console.log(`📧 管理员邮箱: ${adminEmail}`);
      console.log(`🔑 管理员密码: ${adminPassword}`);
    }
  } catch (error) {
    console.error('❌ 创建初始管理员用户失败:', error);
  }
};

// 数据库断开连接
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB断开连接成功');
  } catch (error) {
    console.error('❌ MongoDB断开连接失败:', error);
  }
};

// 监听数据库连接事件
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose连接到MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose断开连接');
});

// 优雅关闭
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

// 导出所有模型
export const models = {
  User,
  Problem,
  Submission,
  Contest
};

export default models;