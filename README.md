# SSL-OJ - 东莞中学松山湖学校在线判题系统

## 项目简介

这是一个专为东莞中学松山湖学校（集团）东莞市第十三高级中学信息学竞赛爱好者开发的在线判题系统（Online Judge）。

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **状态管理**: Redux Toolkit
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **代码编辑器**: Monaco Editor
- **样式**: Tailwind CSS + CSS Modules

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + bcrypt
- **文件上传**: Multer
- **API文档**: Swagger
- **日志**: Winston

### 判题系统
- **容器化**: Docker
- **语言支持**: C++, Python, Java, JavaScript
- **安全隔离**: Docker容器 + 资源限制
- **队列管理**: Bull Queue (Redis)

### 部署架构
- **前端**: Nginx静态文件服务
- **后端**: PM2进程管理
- **数据库**: MongoDB集群
- **缓存**: Redis
- **反向代理**: Nginx

## 项目结构

```
SSL-OJ/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── store/           # Redux状态管理
│   │   ├── services/        # API服务
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型定义
│   ├── public/
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型定义
│   ├── judge/               # 判题系统
│   └── package.json
├── docker/                   # Docker配置
├── docs/                     # 项目文档
└── scripts/                  # 部署脚本
```

## 核心功能模块

### 1. 用户系统
- 用户注册/登录
- 个人信息管理
- 权限管理（学生/教师/管理员）

### 2. 题目系统
- 题目浏览和搜索
- 题目详情展示
- 题目分类和标签
- 题目难度分级

### 3. 提交系统
- 代码在线编辑
- 多语言支持
- 提交历史记录
- 实时判题结果

### 4. 判题系统
- 安全的代码执行环境
- 多种判题模式（ACM/OI）
- 资源限制（时间/内存）
- 详细的错误信息

### 5. 比赛系统
- 比赛创建和管理
- 实时排行榜
- 比赛统计分析

### 6. 管理系统
- 题目管理
- 用户管理
- 系统监控
- 数据统计

## 开发环境要求

- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- Docker 20.0+
- Git

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd SSL-OJ
```

### 2. 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
# 编辑配置文件
```

### 4. 启动开发服务器
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

项目维护者：东莞中学松山湖学校信息学竞赛团队

---

**为东莞中学松山湖学校信息学竞赛爱好者量身打造的专业OJ平台** 🚀