# 王得伏工具平台

一个工程工具集合平台，提供招投标、设计、施工、运维等各类工程工具。

## 技术栈

- **后端**: Python 3.10+, FastAPI, SQLAlchemy, MySQL
- **前端**: React 18, TypeScript, Vite, Ant Design 5, React Router
- **数据库**: MySQL 8.0
- **部署**: Docker, Docker Compose

## 架构说明

本平台采用**插件式架构**，支持灵活扩展：

- **核心模块** (`backend/core/`): 工具注册机制、路由管理、中间件
- **工具模块** (`backend/tools/`): 各工具独立模块，便于扩展
- **管理后台** (`backend/admin/`): 访问统计、数据管理
- **前端路由**: 单页应用（SPA），支持客户端路由

## 快速开始

### 使用 Docker Compose（推荐）

1. **克隆项目**：
```bash
git clone <repository-url>
cd autopresales
```

2. **配置环境变量**（可选）：
```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库密码等
```

3. **启动服务**：
```bash
docker-compose up -d
```

服务将在 `http://localhost` 启动。

### 本地开发

#### 后端启动

1. **安装 Python 依赖**：
```bash
cd backend
pip install -r requirements.txt
```

2. **配置数据库**：
   - 确保 MySQL 服务已启动
   - 创建数据库：`CREATE DATABASE wangdefu;`
   - 配置环境变量或修改 `backend/admin/database.py`

3. **启动后端服务**：
```bash
python main.py
```

后端服务将在 `http://localhost:8000` 启动。

#### 前端启动

1. **安装依赖**：
```bash
cd frontend
npm install
```

2. **启动开发服务器**：
```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## 功能特性

### 工具平台

- **主页**: 网格卡片式布局，展示工具分类和入口
- **工具分类**: 招投标类、设计类、施工类、运维类等
- **工具管理**: 插件式架构，便于添加新工具

### 现有工具

#### 报价评分计算器（招投标类）

- 灵活的评分规则配置：
  - K值设置
  - 基准分设置
  - 去极值规则（支持多级规则）
  - 高价扣分规则（统一规则/分段规则）
  - 低价区间规则（统一规则/分段规则）
- 实时计算评分结果
- 结果排序和展示（前三名颜色标识）
- 导出规则为 Word 文档
- 数据持久化（localStorage）

### 管理后台

- **访问统计**: 各工具使用次数、访问记录
- **数据可视化**: 图表展示工具使用情况
- **访问记录**: 详细的访问日志查询

## 项目结构

```
autopresales/
├── backend/
│   ├── core/                    # 核心模块
│   │   ├── tool_registry.py     # 工具注册机制
│   │   └── middleware.py        # 访问追踪中间件
│   ├── tools/                   # 工具模块
│   │   └── bidding_scoring/     # 报价评分计算器
│   │       ├── router.py        # 工具路由
│   │       └── logic.py         # 业务逻辑
│   ├── admin/                   # 管理后台
│   │   ├── models.py            # 数据模型
│   │   ├── router.py            # API 路由
│   │   └── database.py          # 数据库配置
│   ├── main.py                  # FastAPI 主应用
│   └── requirements.txt        # Python 依赖
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx          # 主页
│       │   ├── ScoringCalculator.tsx  # 报价评分计算器
│       │   └── Admin.tsx        # 管理后台
│       ├── components/
│       │   └── ToolCard.tsx     # 工具卡片组件
│       ├── config/
│       │   └── tools.ts         # 工具配置
│       └── App.tsx              # 路由配置
├── docker-compose.yml           # Docker Compose 配置
├── Dockerfile                   # Docker 构建文件
└── README.md                    # 项目说明文档
```

## API 接口

### 工具 API

#### 报价评分计算器
- **POST /api/tools/bidding/scoring/calculate** - 计算评分

#### 兼容性端点（保留）
- **POST /api/calculate** - 计算评分（旧端点）
- **POST /calculate** - 计算评分（旧端点）

### 管理后台 API

- **GET /api/admin/stats/tools** - 获取工具使用统计
- **GET /api/admin/stats/access** - 获取访问记录
- **GET /api/admin/stats/summary** - 获取统计摘要

## 开发新工具

### 1. 创建工具模块

在 `backend/tools/` 下创建新目录，例如 `design_tool/`：

```python
# backend/tools/design_tool/router.py
from fastapi import APIRouter
from ...core.tool_registry import tool_registry

router = APIRouter(prefix="/api/tools/design/tool", tags=["设计工具"])

@router.get("/hello")
async def hello():
    return {"message": "Hello from design tool"}

def register_tool():
    tool_registry.register_tool(
        tool_id="design_tool",
        name="设计工具",
        description="设计相关工具",
        router=router,
        category="design",
        path="/tools/design/tool"
    )

register_tool()
```

### 2. 在主应用中注册

在 `backend/main.py` 中导入工具模块：

```python
from tools.design_tool import router as design_tool_router
```

### 3. 在前端配置工具

在 `frontend/src/config/tools.ts` 中添加工具配置：

```typescript
{
  id: 'design_tool',
  name: '设计工具',
  description: '设计相关工具描述',
  path: '/tools/design/tool',
  category: 'design',
  enabled: true,
}
```

### 4. 创建前端页面

在 `frontend/src/pages/` 下创建工具页面，并在 `App.tsx` 中添加路由。

## 部署

详细部署说明请参考 [DEPLOY.md](DEPLOY.md)。

## 注意事项

- 管理后台无需登录认证，建议通过 Nginx 或防火墙限制访问
- 数据库连接配置通过环境变量管理，生产环境请使用强密码
- 访问统计采用异步写入，不影响主流程性能
- 工具模块化设计，便于后续扩展和维护

## 许可证

MIT License
