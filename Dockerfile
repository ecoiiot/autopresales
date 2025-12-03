# Stage 1: 构建前端
FROM node:18 AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm install

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# Stage 2: 构建后端并整合前端
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖（用于健康检查）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件并安装
# requirements.txt 中已包含 uvicorn[standard]
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./backend/

# 从 Stage 1 复制构建好的前端静态文件
# 路径：/app/frontend/dist
COPY --from=frontend-builder /app/dist ./frontend/dist

# 暴露端口
EXPOSE 80

# 启动命令
# 使用 uvicorn 运行 FastAPI 应用，监听所有网络接口的 80 端口
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]

