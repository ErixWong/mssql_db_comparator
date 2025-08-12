import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseConnection } from './database.js';
import { DatabaseComparator } from './comparator.js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

// 中间件
app.use(cors());
app.use(bodyParser());

// 静态文件服务 - 提供前端文件
app.use(serve(path.join(__dirname, '../wwwroot'), { index: 'index.html' }));

// 路由
router.get('/api/health', (ctx) => {
  ctx.body = { status: 'ok', message: 'MSSQL Database Comparison Tool API is running' };
});

// 数据库连接测试路由
router.post('/api/test-connection', async (ctx) => {
  try {
    const { host, username, password, database, port, instanceName, encrypt, timeout } = ctx.request.body;
    
    const dbConnection = new DatabaseConnection({
      host,
      username,
      password,
      database,
      port,
      instanceName,
      encrypt,
      timeout
    });
    
    const result = await dbConnection.testConnection();
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取数据库结构路由
router.post('/api/database-schema', async (ctx) => {
  try {
    const { connectionConfig, comparisonScope } = ctx.request.body;
    
    const dbConnection = new DatabaseConnection(connectionConfig);
    await dbConnection.connect();
    
    const structure = await dbConnection.getFullDatabaseStructure(comparisonScope);
    
    await dbConnection.disconnect();
    
    ctx.body = {
      success: true,
      message: 'Database schema retrieved successfully',
      data: structure
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 比较数据库路由
router.post('/api/compare-databases', async (ctx) => {
  try {
    const { dbAConfig, dbBConfig, comparisonScope } = ctx.request.body;
    
    const comparator = new DatabaseComparator();
    
    // 初始化数据库连接
    await comparator.initialize(dbAConfig, dbBConfig);
    
    // 执行比较
    const comparisonResult = await comparator.compareDatabases(comparisonScope);
    
    // 断开连接
    await comparator.disconnect();
    
    ctx.body = {
      success: true,
      message: 'Database comparison completed successfully',
      comparisonResult
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 使用路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = 10298;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;