const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const path = require('path');

// 数据库配置
const dbPath = path.resolve('./database.sqlite');
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ssl_oj'
};

// 连接数据库
const db = new Database(dbPath);

console.log('🔍 连接到数据库:', dbPath);

try {
  // 查看用户表结构
  console.log('\n📋 用户表结构:');
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  tableInfo.forEach(col => {
    console.log(`  ${col.name}: ${col.type}`);
  });

  // 查看所有用户
  console.log('\n👥 当前用户列表:');
  const users = db.prepare('SELECT id, username, real_name, email, student_id, class, role, created_at FROM users').all();
  
  if (users.length === 0) {
    console.log('  数据库中没有用户数据');
  } else {
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 真实姓名: ${user.real_name || 'N/A'}, 邮箱: ${user.email}, 学号: ${user.student_id || 'N/A'}, 班级: ${user.class || 'N/A'}, 角色: ${user.role}, 创建时间: ${user.created_at}`);
    });
  }

  // 检查是否有测试用户（张三、李四等）
  const testUsers = db.prepare(`
    SELECT id, username, real_name, email 
    FROM users 
    WHERE real_name IN ('张三', '李四', '王五', '赵六', 'Test User', 'test', 'admin') 
       OR username LIKE '%test%' 
       OR username LIKE '%demo%'
       OR email LIKE '%test%'
       OR email LIKE '%demo%'
       OR email LIKE '%example%'
  `).all();

  if (testUsers.length > 0) {
    console.log('\n🧹 发现测试用户:');
    testUsers.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 真实姓名: ${user.real_name || 'N/A'}, 邮箱: ${user.email}`);
    });

    // 询问是否删除
    console.log('\n❓ 是否要删除这些测试用户？');
    console.log('如果要删除，请运行: node cleanup-database.js --delete-test-users');
  } else {
    console.log('\n✅ 没有发现明显的测试用户');
  }

  // 检查是否有其他表（题目、提交等）
  console.log('\n📊 SQLite数据库表列表:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`  ${table.name}: ${count.count} 条记录`);
  });

  // 检查MySQL连接
  console.log('\n🐬 检查MySQL连接状态:');
  let mysqlConnection = null;
  try {
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('  ✅ MySQL连接成功');
    
    // 列出所有表
    const [tables] = await mysqlConnection.execute('SHOW TABLES');
    console.log('\n📊 MySQL表统计:');
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [countResult] = await mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName}: ${countResult[0].count} 条记录`);
    }
    
    // 如果有problems表，显示题目信息
    const problemsTable = tables.find(t => Object.values(t)[0] === 'problems');
    if (problemsTable) {
      console.log('\n📝 MySQL题目列表:');
      const [problems] = await mysqlConnection.execute(
        'SELECT problemId, title, status FROM problems LIMIT 10'
      );
      problems.forEach(problem => {
        console.log(`    ID: ${problem.problemId}, 标题: ${problem.title}, 状态: ${problem.status}`);
      });
    }
    
  } catch (mysqlError) {
    console.log('  ❌ MySQL连接失败或未配置:', mysqlError.message);
  }

  // 检查MongoDB连接（题目数据存储在MongoDB中）
  console.log('\n🍃 检查MongoDB连接状态:');
  try {
    // 尝试连接MongoDB检查题目数据
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssl-oj';
    
    console.log(`  尝试连接MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000 
    });
    
    console.log('  ✅ MongoDB连接成功');
    
    // 检查题目集合
    const db_mongo = mongoose.connection.db;
    const collections = await db_mongo.listCollections().toArray();
    
    console.log('\n📚 MongoDB集合列表:');
    for (const collection of collections) {
      const count = await db_mongo.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} 条记录`);
      
      // 如果是题目集合，显示详细信息
      if (collection.name === 'problems') {
        const problems = await db_mongo.collection('problems').find({}, { 
          projection: { problemId: 1, title: 1, status: 1, author: 1 } 
        }).toArray();
        
        if (problems.length > 0) {
          console.log('\n📝 题目列表:');
          problems.forEach(problem => {
            console.log(`    ID: ${problem.problemId}, 标题: ${problem.title}, 状态: ${problem.status}`);
          });
        }
      }
    }
    
    await mongoose.disconnect();
    
  } catch (mongoError) {
    console.log('  ❌ MongoDB连接失败或未配置:', mongoError.message);
    console.log('  ℹ️  题目数据可能存储在MongoDB中，如果需要清理题目数据，请确保MongoDB正常运行');
  }

  // 如果命令行参数包含删除标志
  if (process.argv.includes('--delete-test-users')) {
    console.log('\n🗑️ 开始删除测试用户...');
    
    const deleteResult = db.prepare(`
      DELETE FROM users 
      WHERE real_name IN ('张三', '李四', '王五', '赵六', 'Test User', 'test', 'admin') 
         OR username LIKE '%test%' 
         OR username LIKE '%demo%'
         OR email LIKE '%test%'
         OR email LIKE '%demo%'
         OR email LIKE '%example%'
    `).run();
    
    console.log(`✅ 已删除 ${deleteResult.changes} 个测试用户`);
  }

  // 如果命令行参数包含清空所有数据标志
  if (process.argv.includes('--clear-all')) {
    console.log('\n🗑️ 清空所有用户数据...');
    const deleteAllResult = db.prepare('DELETE FROM users').run();
    console.log(`✅ 已删除 ${deleteAllResult.changes} 个用户`);
  }

  // 如果命令行参数包含清空MySQL题目数据标志
  if (process.argv.includes('--clear-mysql-problems')) {
    if (mysqlConnection) {
      console.log('\n🗑️ 正在清空MySQL题目数据...');
      try {
        await mysqlConnection.execute('DELETE FROM submissions');
        await mysqlConnection.execute('DELETE FROM problems');
        console.log('✅ 已清空MySQL题目和提交数据');
      } catch (error) {
        console.log('❌ 清空MySQL数据失败:', error.message);
      }
    }
  }

} catch (error) {
  console.error('❌ 数据库操作错误:', error);
} finally {
  db.close();
  if (mysqlConnection) {
    await mysqlConnection.end();
  }
  console.log('\n🔒 数据库连接已关闭');
}