# 部署说明

## 单容器部署方案

本项目采用前后端合并的单容器方案，使用 Docker 和 Docker Compose 进行部署。

## 文件说明

### 1. `backend/main.py`
- 配置了静态文件服务，挂载 `frontend/dist` 目录
- 实现了 SPA 路由回退：所有非 API 路径返回 `index.html`，支持前端路由
- API 路由（`/api/*` 和 `/calculate`）正常工作

### 2. `Dockerfile`
- **Stage 1 (Frontend)**: 基于 `node:18`，构建前端应用
- **Stage 2 (Backend)**: 基于 `python:3.10-slim`，运行后端服务
- 从 Stage 1 复制构建好的前端静态文件到 Stage 2
- 最终在 80 端口运行服务

### 3. `docker-compose.yml`
- Service 名称: `engineering-platform`
- 端口映射: `80:80`（直接占用服务器的 HTTP 端口）
- 重启策略: `restart: always`（服务器重启后自动运行）
- 包含健康检查配置

## 部署步骤

### 1. 在 Ubuntu 云服务器上安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

### 2. 上传项目文件到服务器

```bash
# 使用 scp 或 git clone 将项目上传到服务器
# 例如：
git clone <your-repo-url> /opt/autopresales
cd /opt/autopresales
```

### 3. 构建和启动容器

```bash
# 构建镜像（首次部署或代码更新后）
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 查看服务状态
docker compose ps
```

### 4. 验证部署

```bash
# 检查容器是否运行
docker ps

# 检查健康状态
docker compose ps

# 访问应用
curl http://localhost/
```

### 5. 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f engineering-platform

# 进入容器（调试用）
docker compose exec engineering-platform /bin/bash

# 更新代码后重新部署
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 注意事项

1. **端口占用**: 确保服务器的 80 端口未被其他服务占用
2. **防火墙**: 确保云服务器的安全组/防火墙规则允许 80 端口访问
3. **域名配置**: 如需使用域名，请配置 DNS 解析和反向代理（如 Nginx）
4. **HTTPS**: 生产环境建议使用 Nginx 作为反向代理，配置 SSL 证书

## 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker compose logs engineering-platform

# 检查镜像构建是否成功
docker images | grep autopresales
```

### 前端页面无法访问
```bash
# 检查静态文件是否存在
docker compose exec engineering-platform ls -la /app/frontend/dist

# 检查后端服务是否正常
docker compose exec engineering-platform curl http://localhost:80/
```

### API 接口无法访问
```bash
# 测试 API 接口
curl -X POST http://localhost/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"config": {...}, "bidders": [...]}'
```
