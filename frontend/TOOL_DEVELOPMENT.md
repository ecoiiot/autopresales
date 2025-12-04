# 工具开发指南

本文档说明如何在"王得伏"平台中添加新工具。

## 目录结构

```
frontend/src/
├── tools/                    # 工具目录
│   ├── bidding/              # 招投标类工具
│   │   ├── ScoringCalculator.tsx
│   │   └── index.ts
│   ├── design/               # 设计类工具
│   ├── construction/         # 施工类工具
│   └── maintenance/          # 运维类工具
├── config/
│   └── tools.ts              # 工具配置
└── pages/
    └── ToolContainer.tsx     # 工具容器（自动加载工具）
```

## 添加新工具的步骤

### 1. 创建工具组件

在对应的分类目录下创建工具组件文件，例如在 `tools/design/` 下创建 `MaterialCalculator.tsx`：

```typescript
// tools/design/MaterialCalculator.tsx
import React from 'react';
import { Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';

const MaterialCalculator: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Layout.Header style={{ background: '#001529', padding: '0 24px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
            王得伏
          </Typography.Text>
        </Link>
        <Typography.Text style={{ color: '#fff', marginLeft: '16px' }}>
          / 材料计算器
        </Typography.Text>
      </Layout.Header>
      <Layout.Content style={{ padding: '24px' }}>
        {/* 工具内容 */}
        <h1>材料计算器</h1>
      </Layout.Content>
    </Layout>
  );
};

export default MaterialCalculator;
```

### 2. 导出工具组件

在分类目录的 `index.ts` 中导出新工具：

```typescript
// tools/design/index.ts
export { default as MaterialCalculator } from './MaterialCalculator';
```

### 3. 注册工具组件

在 `config/tools.ts` 的 `toolComponents` 中添加组件映射：

```typescript
export const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'bidding_scoring': React.lazy(() => import('../tools/bidding/ScoringCalculator')),
  'design_material': React.lazy(() => import('../tools/design/MaterialCalculator')), // 新增
  // ...
};
```

### 4. 配置工具信息

在 `config/tools.ts` 的 `toolCategories` 中添加工具配置：

```typescript
{
  id: 'design',
  name: '设计类',
  description: '设计相关的工具集合',
  tools: [
    {
      id: 'material',                    // 工具ID（URL路径的一部分）
      name: '材料计算器',                 // 工具名称
      description: '计算材料用量和成本',   // 工具描述
      path: '/tools/design/material',    // 工具路径（必须与路由匹配）
      category: 'design',                // 分类ID
      componentKey: 'design_material',   // 对应 toolComponents 的 key
      enabled: true,                     // 是否启用
    },
  ],
},
```

## 路径规则

工具路径必须遵循以下规则：

- 格式：`/tools/{category}/{toolId}`
- `category` 必须与分类 ID 一致（如 `bidding`、`design`、`construction`、`maintenance`）
- `toolId` 必须与工具的 `id` 字段一致
- `componentKey` 格式：`{category}_{toolId}`（如 `design_material`）

## 示例：完整添加流程

假设要添加一个"施工类"下的"进度管理工具"：

### 1. 创建组件文件

```bash
# 创建文件
touch frontend/src/tools/construction/ProgressManager.tsx
```

### 2. 编写组件代码

```typescript
// tools/construction/ProgressManager.tsx
import React from 'react';
// ... 组件实现
export default ProgressManager;
```

### 3. 导出组件

```typescript
// tools/construction/index.ts
export { default as ProgressManager } from './ProgressManager';
```

### 4. 注册组件

```typescript
// config/tools.ts
export const toolComponents = {
  // ... 现有工具
  'construction_progress': React.lazy(() => import('../tools/construction/ProgressManager')),
};
```

### 5. 配置工具信息

```typescript
// config/tools.ts
{
  id: 'construction',
  name: '施工类',
  tools: [
    {
      id: 'progress',
      name: '进度管理工具',
      description: '管理施工进度和计划',
      path: '/tools/construction/progress',
      category: 'construction',
      componentKey: 'construction_progress',
      enabled: true,
    },
  ],
}
```

完成！工具会自动出现在主页的"施工类"分类下，点击即可访问。

## 注意事项

1. **组件懒加载**：所有工具组件都使用 `React.lazy()` 进行懒加载，实现代码分割
2. **路径一致性**：确保 `path`、`category`、`toolId` 和 `componentKey` 保持一致
3. **错误处理**：`ToolContainer` 会自动处理工具不存在、已禁用等情况
4. **性能优化**：每个工具独立打包，首次访问时才加载，减小初始包体积

## 工具组件规范

### 基本结构

工具组件应该包含：

1. **Header**：显示工具名称和返回链接
2. **Content**：工具的主要内容
3. **样式**：使用 Ant Design 组件和样式

### 示例模板

```typescript
import React from 'react';
import { Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';

const YourTool: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Layout.Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', marginRight: '16px' }}>
          <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
            王得伏
          </Typography.Text>
        </Link>
        <Typography.Text style={{ color: '#fff', fontSize: 16 }}>/</Typography.Text>
        <Typography.Text strong style={{ color: '#fff', fontSize: 18, marginLeft: '16px' }}>
          工具名称
        </Typography.Text>
      </Layout.Header>
      <Layout.Content style={{ padding: '24px' }}>
        {/* 工具内容 */}
      </Layout.Content>
    </Layout>
  );
};

export default YourTool;
```

## 常见问题

### Q: 工具路径不匹配怎么办？

A: 确保 `path` 字段格式为 `/tools/{category}/{toolId}`，且与路由参数一致。

### Q: 工具组件加载失败？

A: 检查 `componentKey` 是否在 `toolComponents` 中正确注册，且导入路径正确。

### Q: 如何禁用某个工具？

A: 将工具的 `enabled` 字段设置为 `false`，工具将不会显示在主页，但已存在的链接会显示"已禁用"提示。

### Q: 工具可以嵌套子路由吗？

A: 可以，但需要在工具组件内部使用 React Router 的嵌套路由。建议简单工具使用单页面，复杂工具可以拆分多个子页面。

