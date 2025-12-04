# 部署说明

## 单容器部署方案

本项目采用前后端合并的单容器方案，使用 Docker 和 Docker Compose 进行部署。包含 MySQL 数据库服务用于管理后台数据存储。

## 文件说明

### 1. `backend/main.py`
- 配置了静态文件服务，挂载 `frontend/dist` 目录
- 实现了 SPA 路由回退：所有非 API 路径返回 `index.html`，支持前端路由
- API 路由（`/api/*` 和 `/calculate`）正常工作
- 集成了工具注册机制和管理后台

### 2. `Dockerfile`
- **Stage 1 (Frontend)**: 基于 `node:18`，构建前端应用
- **Stage 2 (Backend)**: 基于 `python:3.10-slim`，运行后端服务
- 从 Stage 1 复制构建好的前端静态文件到 Stage 2
- 安装 MySQL 客户端库
- 最终在 80 端口运行服务

### 3. `docker-compose.yml`
- **MySQL 服务**: 数据库服务，端口 3306
- **主服务**: `engineering-platform`，端口 80
- 重启策略: `restart: always`（服务器重启后自动运行）
- 包含健康检查配置
- 环境变量配置数据库连接

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

### 3. 配置环境变量（可选）

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（设置数据库密码等）
nano .env
```

环境变量说明：
- `DB_PASSWORD`: MySQL root 密码（默认: password）
- `DB_NAME`: 数据库名称（默认: wangdefu）
- `DB_USER`: 数据库用户（默认: root）
- `DB_PORT`: 数据库端口（默认: 3306）

### 4. 构建和启动容器

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

### 5. 初始化数据库

数据库表会在应用启动时自动创建。如果遇到问题，可以手动初始化：

```bash
# 进入应用容器
docker compose exec engineering-platform /bin/bash

# 在容器内运行（如果需要）
python -c "from backend.admin.database import init_db; init_db()"
```

### 6. 验证部署

```bash
# 检查容器是否运行
docker ps

# 检查健康状态
docker compose ps

# 检查 MySQL 连接
docker compose exec engineering-platform python -c "from backend.admin.database import engine; print('Database connected:', engine.connect())"

# 访问应用
curl http://localhost/
```

### 7. 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f engineering-platform
docker compose logs -f mysql

# 进入容器（调试用）
docker compose exec engineering-platform /bin/bash
docker compose exec mysql mysql -uroot -p

# 查看数据库
docker compose exec mysql mysql -uroot -p${DB_PASSWORD:-password} -e "USE wangdefu; SHOW TABLES;"

# 更新代码后重新部署
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 数据库管理

### 备份数据库

```bash
# 导出数据库
docker compose exec mysql mysqldump -uroot -p${DB_PASSWORD:-password} wangdefu > backup.sql

# 或使用 docker exec
docker exec wangdefu-mysql mysqldump -uroot -ppassword wangdefu > backup.sql
```

### 恢复数据库

```bash
# 导入数据库
docker compose exec -T mysql mysql -uroot -p${DB_PASSWORD:-password} wangdefu < backup.sql
```

### 查看数据库数据

```bash
# 进入 MySQL 命令行
docker compose exec mysql mysql -uroot -p${DB_PASSWORD:-password} wangdefu

# 查看访问记录
SELECT * FROM tool_access ORDER BY access_time DESC LIMIT 10;

# 查看工具统计
SELECT * FROM tool_statistic;
```

## 注意事项

1. **端口占用**: 确保服务器的 80 和 3306 端口未被其他服务占用
2. **防火墙**: 确保云服务器的安全组/防火墙规则允许 80 端口访问（3306 端口建议仅内网访问）
3. **数据库安全**: 
   - 生产环境请使用强密码
   - 建议限制 MySQL 端口仅内网访问
   - 定期备份数据库
4. **域名配置**: 如需使用域名，请配置 DNS 解析和反向代理（如 Nginx）
5. **HTTPS**: 生产环境建议使用 Nginx 作为反向代理，配置 SSL 证书
6. **管理后台**: 管理后台无需登录，建议通过 Nginx 或防火墙限制访问

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker compose logs engineering-platform
docker compose logs mysql

# 检查镜像构建是否成功
docker images | grep autopresales
```

### MySQL 连接失败

```bash
# 检查 MySQL 容器是否运行
docker compose ps mysql

# 检查 MySQL 日志
docker compose logs mysql

# 测试 MySQL 连接
docker compose exec mysql mysqladmin -uroot -p${DB_PASSWORD:-password} ping
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
curl -X POST http://localhost/api/tools/bidding/scoring/calculate \
  -H "Content-Type: application/json" \
  -d '{"config": {...}, "bidders": [...]}'
```

### 数据库表未创建

```bash
# 检查数据库连接配置
docker compose exec engineering-platform env | grep DB_

# 手动初始化数据库
docker compose exec engineering-platform python -c "from backend.admin.database import init_db; init_db()"
```

### 访问统计不工作

```bash
# 检查中间件是否正常
docker compose logs engineering-platform | grep "访问追踪"

# 检查数据库表是否存在
docker compose exec mysql mysql -uroot -p${DB_PASSWORD:-password} -e "USE wangdefu; SHOW TABLES;"
```

## 性能优化

1. **数据库连接池**: 已配置连接池，可根据实际情况调整
2. **访问日志**: 采用异步写入，不影响主流程性能
3. **静态文件缓存**: 建议使用 Nginx 配置静态文件缓存
4. **数据库索引**: 访问记录表已添加索引，优化查询性能

## 安全建议

1. **更改默认密码**: 生产环境必须更改数据库默认密码
2. **限制访问**: 管理后台建议通过 Nginx 配置 IP 白名单
3. **定期备份**: 设置定时任务备份数据库
4. **监控日志**: 定期检查访问日志，发现异常访问
