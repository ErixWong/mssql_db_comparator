# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用程序代码
COPY backend/ ./

# 复制前端文件
COPY wwwroot/ ../wwwroot/

# 暴露端口
EXPOSE 10298

# 启动应用程序
CMD ["npm", "start"]