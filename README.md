# 工程招标报价评分系统

一个用于工程招标报价评分的 Web 应用系统，支持复杂的评分规则配置和自动计算。

## 技术栈

- **后端**: Python 3.10+, FastAPI, Pydantic
- **前端**: React 18, TypeScript, Vite, Ant Design 5
- **数据存储**: 本地文件（localStorage + JSON文件）

## 架构说明

本系统采用**无后端数据库 + 本地文件保存**的极简架构：
- 所有项目数据保存在浏览器 localStorage 中
- 支持通过 JSON 文件导入/导出项目数据
- 后端仅提供评分计算服务，无需数据库

## 快速开始

### 后端启动

1. **进入后端目录**：
```bash
cd backend
```

2. **检查 Python 版本**：
```bash
python --version
```
推荐使用 Python 3.10 或 3.11。

3. **安装 Python 依赖**：
```bash
pip install -r requirements.txt
```

4. **启动后端服务**：
```bash
python main.py
```

或者使用启动脚本（在项目根目录）：
```bash
./start-backend.sh
```

后端服务将在 `http://localhost:8000` 启动。

### 前端启动

1. **进入前端目录**：
```bash
cd frontend
```

2. **安装依赖**：
```bash
npm install
```

3. **启动开发服务器**：
```bash
npm run dev
```

或者使用启动脚本（在项目根目录）：
```bash
./start-frontend.sh
```

前端服务将在 `http://localhost:3000` 启动。

## 功能特性

### 项目管理
- 创建、编辑、删除项目
- 项目状态管理（进行中/已完成）
- 支持推荐评分规则快速创建项目

### 评分计算
- 灵活的评分规则配置：
  - K值设置
  - 基准分设置
  - 去极值规则（支持多级规则）
  - 高价扣分系数
  - 低价区间规则（支持多个区间）
- 实时计算评分结果
- 结果排序和展示

### 数据管理
- 所有数据保存在浏览器 localStorage
- 支持 JSON 文件导入/导出
- 自动保存草稿

## API 接口

### 计算评分
- **POST /calculate** - 计算评分（无需认证）
- **POST /api/calculate** - 计算评分（推荐使用）

## 项目结构

```
autopresales/
├── backend/              # 后端服务
│   ├── main.py          # FastAPI 主应用
│   ├── scoring_logic.py # 评分计算逻辑
│   └── requirements.txt # Python 依赖
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   │   ├── Calculator.tsx        # 评分计算页面
│   │   │   └── ProjectManagement.tsx # 项目管理页面
│   │   ├── App.tsx      # 主应用组件
│   │   └── types.ts     # TypeScript 类型定义
│   └── package.json     # Node.js 依赖
└── README.md           # 项目说明文档
```

## 使用说明

1. **创建项目**：在项目管理页面点击"新建项目"，输入项目名称
2. **配置规则**：在计算页面左侧配置评分规则
3. **录入数据**：在中间栏录入投标单位信息
4. **计算评分**：点击"计算评分"按钮，结果将显示在右侧
5. **保存项目**：点击"保存项目"按钮保存当前配置和数据

## 注意事项

- 所有数据保存在浏览器 localStorage，清除浏览器数据会导致数据丢失
- 建议定期使用"保存项目"功能导出 JSON 文件备份
- 后端服务仅用于评分计算，不存储任何数据
