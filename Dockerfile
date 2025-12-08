# 构建后端服务
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖（用于健康检查）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件并安装
# requirements.txt 中已包含 uvicorn[standard]
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./backend/

# 暴露端口
EXPOSE 8001

# 启动命令
# 使用 uvicorn 运行 FastAPI 应用，监听所有网络接口的 8001 端口
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]

