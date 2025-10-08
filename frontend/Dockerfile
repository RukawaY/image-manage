# frontend/Dockerfile

# --- 第一阶段: 构建 React 应用 ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 第二阶段: 使用 Nginx 托管静态文件 ---
FROM nginx:1.23-alpine

# 从第一阶段拷贝编译好的文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]