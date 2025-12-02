# 工程招标报价评分系统

一个用于工程招标报价评分的 Web 应用系统，支持复杂的评分规则配置和自动计算。

## 技术栈

- **后端**: Python 3.8+, FastAPI, Pydantic
- **前端**: React 18, TypeScript, Vite, Ant Design 5

## 快速开始

### 后端启动

1. 安装 Python 依赖：
```bash
pip install -r requirements.txt
```

2. 启动后端服务：
```bash
python main.py
```

后端服务将在 `http://localhost:8000` 启动。

### 前端启动

1. 安装 Node.js 依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

## 功能特性

### 评分规则配置

- **基础参数**: 基准分、K值
- **去极值规则**: 支持多级规则，例如"当>5家时，去1高1低"
- **高价扣分**: 报价高于基准价时的线性扣分系数
- **低价区间规则**: 支持多个区间，每个区间可设置加分或扣分

### 数据录入

- 支持从 Excel 复制粘贴
- 格式：每行一个投标单位，格式为"单位名称 报价"

### 计算结果

- 自动计算基准价
- 显示每个投标单位的偏离度和最终得分
- 按得分自动排名

### 预设模板

系统提供 4 种预设模板，可快速加载常用配置。

## API 文档

启动后端后，访问 `http://localhost:8000/docs` 查看 Swagger API 文档。

## 开发说明

### 后端文件结构

- `main.py`: FastAPI 应用入口，定义 API 路由
- `scoring_logic.py`: 核心评分计算逻辑和数据模型

### 前端文件结构

- `src/App.tsx`: 主应用组件
- `src/main.tsx`: React 应用入口
- `src/index.css`: 全局样式

