// 工具分类和工具列表配置
import React from 'react';

// 工具组件映射（懒加载）
export const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'bidding_scoring': React.lazy(() => import('../tools/bidding/ScoringCalculator')),
  // 后续添加新工具时，在这里注册组件
  // 'design_tool1': React.lazy(() => import('../tools/design/Tool1')),
  // 'construction_tool1': React.lazy(() => import('../tools/construction/Tool1')),
};

export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
  icon?: string;
  enabled: boolean;
  componentKey?: string; // 对应 toolComponents 的 key
}

export interface ToolCategory {
  id: string;
  name: string;
  description?: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'bidding',
    name: '招投标类',
    description: '招投标相关的工具集合',
    tools: [
      {
        id: 'scoring',
        name: '报价评分计算器',
        description: '工程招标报价评分计算工具，支持自定义评分规则和批量计算',
        path: '/tools/bidding/scoring',
        category: 'bidding',
        componentKey: 'bidding_scoring', // 对应 toolComponents 的 key
        enabled: true,
      },
    ],
  },
  // {
  //   id: 'design',
  //   name: '设计类',
  //   description: '设计相关的工具集合',
  //   tools: [],
  // },
  // {
  //   id: 'construction',
  //   name: '施工类',
  //   description: '施工相关的工具集合',
  //   tools: [],
  // },
  // {
  //   id: 'maintenance',
  //   name: '运维类',
  //   description: '运维相关的工具集合',
  //   tools: [],
  // },
];

// 获取所有工具
export const getAllTools = (): Tool[] => {
  return toolCategories.flatMap(category => category.tools);
};

// 根据路径获取工具
export const getToolByPath = (path: string): Tool | undefined => {
  return getAllTools().find(tool => tool.path === path);
};

// 根据分类和工具ID获取工具
export const getToolById = (category: string, toolId: string): Tool | undefined => {
  const categoryData = toolCategories.find(cat => cat.id === category);
  if (!categoryData) return undefined;
  return categoryData.tools.find(tool => tool.id === toolId);
};
