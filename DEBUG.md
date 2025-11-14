# MSSQL 数据库比较工具 - 调试指南

## 项目概述

这是一个基于 Node.js 和 Vue.js 的 MSSQL 数据库比较工具，用于比较两个 SQL Server 数据库的结构差异。

## 开发环境设置

### 前置要求

1. **Node.js** (版本 14 或更高)
2. **npm** 或 **yarn**
3. **SQL Server** (用于测试)
4. **Visual Studio Code** (推荐)

### 安装依赖

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

## 调试配置

### VS Code 调试配置

项目已配置了完整的 VS Code 调试环境，包括：

1. **启动配置** (`.vscode/launch.json`)
   - `Launch Backend with Debug`: 启动后端服务器并附加调试器
   - `Attach to Backend`: 附加到已运行的后端进程
   - `Launch Frontend with Debug`: 启动后端并打开前端页面
   - `Launch Full Stack Debug`: 同时启动前后端调试

2. **任务配置** (`.vscode/tasks.json`)
   - `Start Backend Server`: 启动后端服务器
   - `Install Backend Dependencies`: 安装后端依赖
   - `Stop Backend Server`: 停止后端服务器
   - `Start with Docker`: 使用 Docker 启动服务
   - `Stop Docker`: 停止 Docker 服务
   - `Open Browser`: 打开浏览器访问应用

3. **扩展推荐** (`.vscode/extensions.json`)
   - Vue.js 扩展
   - JavaScript 调试扩展
   - ESLint 和 Prettier
   - 其他有用的开发工具

4. **编辑器设置** (`.vscode/settings.json`)
   - 优化的编辑器配置
   - 调试器设置
   - 文件排除规则
   - 格式化配置

## 调试步骤

### 1. 启动调试会话

#### 方法一：使用 VS Code 调试器

1. 在 VS Code 中打开项目
2. 按 `F5` 或点击"运行和调试"面板中的"启动调试"
3. 选择"Launch Backend with Debug"配置
4. 调试器将启动后端服务器并自动附加

#### 方法二：使用任务

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入"Tasks: Run Task"
3. 选择"Start Backend Server"
4. 服务器将在集成终端中启动

#### 方法三：使用 Docker

1. 确保已安装 Docker 和 Docker Compose
2. 运行任务"Start with Docker"
3. 服务将在容器中启动

### 2. 前端调试

1. 启动后端服务器后，打开浏览器访问 `http://localhost:3000`
2. 使用浏览器开发者工具进行前端调试
3. 或使用 VS Code 的"Launch Frontend with Debug"配置

### 3. 后端调试

1. 在 VS Code 中设置断点：
   - 点击行号左侧设置断点
   - 使用 `debugger;` 语句在代码中设置断点

2. 查看变量：
   - 调试时将鼠标悬停在变量上
   - 使用"变量"面板查看所有变量

3. 调用堆栈：
   - 使用"调用堆栈"面板跟踪函数调用

## 常见调试场景

### 数据库连接问题

1. **检查连接配置**
   ```javascript
   // 在 server.js 中设置断点
   console.log('Database A config:', dbAConfig);
   console.log('Database B config:', dbBConfig);
   ```

2. **验证 SQL Server 连接**
   - 确保 SQL Server 正在运行
   - 检查防火墙设置
   - 验证连接字符串参数

### API 端点调试

1. **测试连接端点**
   ```javascript
   // 在 /api/test-connection 处理程序中设置断点
   app.post('/api/test-connection', (req, res) => {
       console.log('Request body:', req.body);
       // 设置断点
   });
   ```

2. **数据库比较端点**
   ```javascript
   // 在 /api/compare-databases 处理程序中设置断点
   app.post('/api/compare-databases', async (req, res) => {
       console.log('Comparison scope:', req.body.comparisonScope);
       // 设置断点
   });
   ```

### 前端组件调试

1. **Vue 组件状态**
   ```javascript
   // 在组件中添加调试语句
   mounted() {
       console.log('Component mounted with data:', this.$data);
   }
   ```

2. **事件处理**
   ```javascript
   // 在事件处理程序中添加调试
   methods: {
       onConnectionChange(data) {
           console.log('Connection changed:', data);
           debugger; // 浏览器断点
       }
   }
   ```

## 性能调试

### 1. 后端性能

1. **使用 Node.js 性能分析**
   ```bash
   node --prof server.js
   ```

2. **内存使用情况**
   ```javascript
   // 在 server.js 中添加
   setInterval(() => {
       const memoryUsage = process.memoryUsage();
       console.log('Memory usage:', memoryUsage);
   }, 5000);
   ```

### 2. 前端性能

1. **浏览器性能工具**
   - 使用 Chrome DevTools Performance 面板
   - 记录页面加载和交互性能
   - 分析 JavaScript 执行时间

2. **Vue DevTools**
   - 安装 Vue DevTools 浏览器扩展
   - 检查组件状态和事件

## 错误处理调试

### 1. 后端错误

1. **全局错误处理**
   ```javascript
   process.on('uncaughtException', (error) => {
       console.error('Uncaught Exception:', error);
   });
   
   process.on('unhandledRejection', (reason, promise) => {
       console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   });
   ```

2. **数据库错误**
   ```javascript
   try {
       const result = await database.query(sql);
   } catch (error) {
       console.error('Database error:', error);
       // 检查错误对象属性
       console.log('Error code:', error.code);
       console.log('Error number:', error.number);
   }
   ```

### 2. 前端错误

1. **Vue 错误处理**
   ```javascript
   // 在 Vue 应用中添加全局错误处理
   app.config.errorHandler = (error, instance, info) => {
       console.error('Vue error:', error);
       console.log('Error info:', info);
   };
   ```

2. **API 请求错误**
   ```javascript
   try {
       const response = await fetch('/api/test-connection', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(config)
       });
       
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }
   } catch (error) {
       console.error('API request failed:', error);
   }
   ```

## 日志调试

### 1. 后端日志

1. **配置日志级别**
   ```javascript
   // 在 server.js 中
   const winston = require('winston');
   
   const logger = winston.createLogger({
       level: 'debug',
       format: winston.format.json(),
       transports: [
           new winston.transports.Console(),
           new winston.transports.File({ filename: 'debug.log' })
       ]
   });
   ```

2. **请求日志**
   ```javascript
   // 添加请求日志中间件
   app.use((req, res, next) => {
       console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
       next();
   });
   ```

### 2. 前端日志

1. **控制台日志**
   ```javascript
   // 使用不同级别的日志
   console.log('Info message');
   console.warn('Warning message');
   console.error('Error message');
   
   // 使用分组和表格
   console.group('Database Comparison');
   console.table(comparisonResult);
   console.groupEnd();
   ```

## 测试数据

### 1. 创建测试数据库

```sql
-- 创建测试数据库 A
CREATE DATABASE TestDB_A;
GO

USE TestDB_A;
GO

-- 创建测试表
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 创建测试数据库 B
CREATE DATABASE TestDB_B;
GO

USE TestDB_B;
GO

-- 创建略有不同的表
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME -- 额外字段
);
GO
```

### 2. 测试连接配置

```javascript
// 测试配置 A
const configA = {
    host: 'localhost',
    username: 'sa',
    password: 'YourPassword',
    database: 'TestDB_A',
    port: 1433,
    encrypt: false,
    timeout: 60
};

// 测试配置 B
const configB = {
    host: 'localhost',
    username: 'sa',
    password: 'YourPassword',
    database: 'TestDB_B',
    port: 1433,
    encrypt: false,
    timeout: 60
};
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口 3000 是否被占用
   - 修改 `server.js` 中的端口配置

2. **SQL Server 连接失败**
   - 验证 SQL Server 身份验证模式
   - 检查 TCP/IP 是否已启用
   - 确认 SQL Server Browser 服务正在运行

3. **前端路由问题**
   - 检查静态文件服务配置
   - 验证 API 端点路径

4. **Vue 组件不渲染**
   - 检查控制台错误
   - 验证组件注册
   - 确认模板语法

### 调试技巧

1. **使用条件断点**
   ```javascript
   // 只在特定条件下中断
   if (req.body.database === 'TestDB_A') {
       debugger; // 只在访问 TestDB_A 时中断
   }
   ```

2. **监控网络请求**
   - 使用浏览器 Network 面板
   - 检查请求/响应头
   - 验证负载大小

3. **内存泄漏检测**
   ```javascript
   // 在组件销毁时检查
   beforeUnmount() {
       console.log('Component unmounting, cleaning up...');
       // 清理定时器、事件监听器等
   }
   ```

## 生产环境调试

### 1. 启用源映射

```javascript
// 在生产构建中启用源映射
const sourceMap = require('source-map-support');
sourceMap.install();
```

### 2. 错误监控

```javascript
// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // 发送到错误监控服务
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // 发送到错误监控服务
});
```

## 联系信息

如果在调试过程中遇到问题，请检查：

1. 控制台输出
2. 网络请求/响应
3. 服务器日志
4. 数据库连接状态

更多调试技巧和工具信息，请参考 VS Code 官方文档和 Vue.js 调试指南。