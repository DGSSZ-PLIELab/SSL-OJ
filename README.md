# SSL-OJ - 东莞中学松山湖学校在线判题系统

## 项目简介

这是一个专为东莞中学松山湖学校（集团）东莞市第十三高级中学信息学竞赛爱好者开发的在线判题系统（Online Judge）。系统支持多种编程语言的在线编程、自动判题，为学生提供便捷的编程练习和竞赛平台。

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **状态管理**: TanStack Query (React Query)
- **图标库**: Lucide React
- **样式**: Tailwind CSS
- **工具库**: clsx, tailwind-merge

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MySQL + Sequelize ORM（支持SQLite备用）
- **认证**: JWT + bcryptjs
- **文件上传**: Multer
- **实时通信**: Socket.IO
- **安全**: Helmet + CORS + Rate Limiting
- **邮件服务**: Nodemailer
- **模板引擎**: Handlebars

### 判题系统
- **队列管理**: 内置判题队列系统
- **语言支持**: C++, C, Java, Python, JavaScript
- **安全隔离**: 进程隔离 + 资源限制
- **结果处理**: 实时状态更新

## 项目结构

```
SSL-OJ/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   ├── index.html           # HTML模板
│   ├── package.json         # 前端依赖配置
│   ├── vite.config.ts       # Vite配置
│   ├── tailwind.config.js   # Tailwind CSS配置
│   └── tsconfig.json        # TypeScript配置
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── models/          # 数据模型（Sequelize）
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── database/        # 数据库配置
│   │   ├── utils/           # 工具函数（包含判题队列）
│   │   ├── config/          # 配置文件
│   │   ├── templates/       # 邮件模板
│   │   ├── app.ts           # Express应用配置
│   │   └── server.ts        # 服务器启动文件
│   ├── .env                 # 环境变量配置
│   ├── package.json         # 后端依赖配置
│   ├── tsconfig.json        # TypeScript配置
│   └── cleanup-database.js  # 数据库清理脚本
├── package.json             # 根目录脚本配置
├── .gitignore              # Git忽略文件
└── README.md               # 项目文档
```

## 核心功能模块

### 1. 用户系统
- 用户注册/登录（JWT认证）
- 个人信息管理
- 权限管理（学生/教师/管理员）
- 密码加密存储

### 2. 题目系统
- 题目浏览和搜索
- 题目详情展示
- 题目分类和标签
- 题目难度分级
- 题目数据管理

### 3. 提交系统
- 代码在线提交
- 多语言支持（C++, C, Java, Python, JavaScript）
- 提交历史记录
- 实时判题状态更新
- 提交结果详情

### 4. 判题系统
- 内置判题队列
- 安全的代码执行环境
- 资源限制（时间/内存）
- 多种判题结果（AC, WA, TLE, MLE, RE, CE）
- 实时状态通知

### 5. 管理系统
- 题目管理（增删改查）
- 用户管理
- 提交记录管理
- 系统配置管理

## 开发环境要求

### 必需环境
- **Node.js**: 18+ 
- **npm**: 8+
- **Git**: 最新版本

### 可选环境（推荐）
- **MySQL**: 8.0+（用于生产环境，开发环境默认使用SQLite）

### 开发工具推荐
- **IDE**: VS Code / WebStorm
- **数据库管理**: MySQL Workbench / phpMyAdmin / DBeaver
- **API测试**: Postman / Insomnia / Thunder Client
- **版本控制**: Git + GitHub Desktop（可选）

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd SSL-OJ
```

### 2. 安装依赖
```bash
# 方法一：一键安装所有依赖（推荐）
npm run install:all

# 方法二：分别安装
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 3. 配置环境变量

后端环境变量配置文件 `backend/.env` 已包含基本配置：

```env
# 基本配置
NODE_ENV=development
PORT=3001

# 数据库配置（可选，默认使用SQLite）
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=
MYSQL_DATABASE=ssl_oj

# JWT密钥（生产环境请修改）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=.cpp,.c,.java,.py,.js

# 判题配置
JUDGE_TIME_LIMIT=5000
JUDGE_MEMORY_LIMIT=268435456
JUDGE_COMPILE_TIMEOUT=10000
```

### 4. 启动开发服务器

**方法一：根目录一键启动（推荐）**
```bash
# 在项目根目录，同时启动前后端
npm run dev
```

**方法二：分别启动**
```bash
# 终端1：启动后端服务
cd backend
npm run dev

# 终端2：启动前端服务
cd frontend
npm run dev
```

**方法三：单独启动**
```bash
# 仅启动前端
npm run dev:frontend

# 仅启动后端
npm run dev:backend
```

### 5. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **数据库文件**: `backend/database.sqlite`（SQLite模式）

## 数据库配置

### SQLite（默认，推荐开发环境使用）
系统默认使用SQLite数据库，具有以下优势：
- **零配置**: 无需安装额外软件
- **轻量级**: 适合开发和测试
- **便携性**: 数据库文件可随项目移动
- **位置**: `backend/database.sqlite`

### MySQL（生产环境推荐）

1. **安装MySQL服务器**
   ```bash
   # Windows: 下载MySQL安装包或使用Chocolatey
   choco install mysql
   
   # macOS: 使用Homebrew
   brew install mysql
   
   # Ubuntu/Debian
   sudo apt install mysql-server
   
   # CentOS/RHEL
   sudo yum install mysql-server
   ```

2. **启动MySQL服务**
   ```bash
   # Windows
   net start mysql
   
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

3. **创建数据库**
   ```sql
   CREATE DATABASE ssl_oj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **配置环境变量**
   在 `backend/.env` 中设置MySQL连接信息：
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USERNAME=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=ssl_oj
   ```

5. **重启后端服务**
   系统会自动检测MySQL连接并创建表结构

### 数据库切换
- 系统会优先尝试连接MySQL
- 如果MySQL连接失败，会自动回退到SQLite
- 无需修改代码，完全透明切换

## 常见问题

### 1. 后端启动失败

**问题**: MySQL连接失败
```
❌ MySQL数据库连接失败: connect ECONNREFUSED 127.0.0.1:3306
✅ 已回退到SQLite数据库
```

**解决方案**:
- 这是正常现象，系统会自动使用SQLite
- 如需使用MySQL，请确保MySQL服务正在运行
- 检查 `.env` 文件中的数据库配置

**问题**: TypeScript编译错误
```
TSError: Unable to compile TypeScript
```

**解决方案**:
```bash
# 清理并重新安装依赖
cd backend
rm -rf node_modules package-lock.json
npm install

# 或者使用transpile-only模式（已配置）
npm run dev
```

### 2. 前端无法连接后端

**问题**: 网络请求失败或CORS错误

**解决方案**:
- 确保后端服务在 http://localhost:3001 运行
- 检查 `.env` 文件中的 `CORS_ORIGIN` 配置
- 确认防火墙没有阻止端口访问

### 3. 端口冲突

**问题**: 端口已被占用
```
Error: listen EADDRINUSE :::3000
```

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                 # macOS/Linux

# 修改端口配置
# 后端: 修改 backend/.env 中的 PORT
# 前端: 修改 frontend/vite.config.ts
```

### 4. 依赖安装失败

**解决方案**:
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules & del package-lock.json  # Windows
npm install

# 使用国内镜像源
npm config set registry https://registry.npmmirror.com
```

### 5. 判题系统问题

**问题**: 代码提交后没有判题结果

**解决方案**:
- 检查后端控制台是否有错误信息
- 确认提交的代码格式正确
- 检查判题队列是否正常工作

### 6. 数据库相关问题

**问题**: SQLite数据库文件损坏

**解决方案**:
```bash
# 删除SQLite数据库文件，系统会自动重新创建
cd backend
rm database.sqlite  # Linux/macOS
del database.sqlite  # Windows

# 重启后端服务
npm run dev
```

## 开发指南

### 代码规范
- **TypeScript**: 严格类型检查，提高代码质量
- **ESLint**: 代码风格检查和错误检测
- **文件命名**: 组件使用PascalCase，工具函数使用camelCase
- **代码格式**: 统一使用2空格缩进

### 项目结构规范
```
前端组件结构:
src/
├── components/     # 通用组件
├── pages/         # 页面组件
├── services/      # API服务层
└── utils/         # 工具函数

后端模块结构:
src/
├── controllers/   # 业务逻辑控制器
├── models/        # 数据模型定义
├── routes/        # 路由配置
├── middleware/    # 中间件
└── utils/         # 工具函数和判题系统
```

### 开发流程
1. **功能开发**: 先写接口，再写实现
2. **数据库**: 优先使用SQLite开发，生产环境切换MySQL
3. **API设计**: RESTful风格，统一返回格式
4. **错误处理**: 完善的错误捕获和用户提示

### Git提交规范
```bash
# 功能开发
git commit -m "feat: 添加用户登录功能"

# 问题修复
git commit -m "fix: 修复提交按钮无响应问题"

# 文档更新
git commit -m "docs: 更新README安装说明"

# 样式调整
git commit -m "style: 优化登录页面布局"

# 重构代码
git commit -m "refactor: 重构判题队列逻辑"
```

## 部署指南

### 生产环境部署

1. **环境准备**
   ```bash
   # 确保Node.js版本
   node --version  # 需要18+
   
   # 安装PM2（推荐）
   npm install -g pm2
   ```

2. **构建前端**
   ```bash
   cd frontend
   npm run build
   # 构建产物在 dist/ 目录
   ```

3. **配置生产环境变量**
   ```bash
   # backend/.env.production
   NODE_ENV=production
   PORT=3001
   
   # 数据库配置（推荐MySQL）
   MYSQL_HOST=your-mysql-host
   MYSQL_PORT=3306
   MYSQL_USERNAME=your-username
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=ssl_oj
   
   # 安全配置
   JWT_SECRET=your-super-secure-production-secret
   CORS_ORIGIN=https://your-domain.com
   
   # 判题配置
   JUDGE_TIME_LIMIT=5000
   JUDGE_MEMORY_LIMIT=268435456
   ```

4. **构建并启动后端**
   ```bash
   cd backend
   npm run build
   
   # 方法一：直接启动
   npm start
   
   # 方法二：使用PM2（推荐）
   pm2 start dist/server.js --name ssl-oj-backend
   pm2 save
   pm2 startup
   ```

5. **配置Web服务器（Nginx示例）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # 后端API代理
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### 快速部署脚本

创建 `deploy.sh` 脚本：
```bash
#!/bin/bash
echo "开始部署SSL-OJ..."

# 拉取最新代码
git pull origin main

# 安装依赖
npm run install:all

# 构建前端
cd frontend
npm run build
cd ..

# 构建后端
cd backend
npm run build

# 重启服务
pm2 restart ssl-oj-backend || pm2 start dist/server.js --name ssl-oj-backend

echo "部署完成！"
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 贡献类型
- 🐛 Bug修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX优化
- ⚡ 性能优化
- 🔧 配置优化

## 更新日志

### v2.0.0 (当前版本)
- ✨ **数据库迁移**: 从MongoDB完全迁移到MySQL + Sequelize ORM
- ✨ **备用数据库**: 添加SQLite支持，开发环境零配置
- ✨ **判题系统**: 重构为内置判题队列，提升性能
- 🔧 **技术栈升级**: 更新依赖包，优化项目结构
- 🐛 **错误修复**: 修复TypeScript编译错误和类型问题
- 📝 **文档完善**: 全面更新README，添加详细部署指南
- 🛡️ **安全增强**: 添加Helmet、CORS、Rate Limiting
- 📧 **邮件功能**: 集成Nodemailer邮件服务
- 🎨 **前端优化**: 使用TanStack Query优化数据管理

### v1.0.0 (初始版本)
- ✨ 基础OJ系统功能
- ✨ 用户认证系统（JWT）
- ✨ 题目管理系统
- ✨ 在线判题功能
- ✨ MongoDB数据存储
- ✨ React + Express技术栈

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

**项目维护者**: 东莞中学松山湖学校（集团）东莞市第十三高级中学程序语言与信息工程实验室

**技术支持**: 
- 📧 Email: [联系邮箱]
- 💬 QQ群: [QQ群号]
- 🌐 官网: [学校官网]

---

**为松湖十三中信息学竞赛爱好者量身打造的OJ平台** 🚀
