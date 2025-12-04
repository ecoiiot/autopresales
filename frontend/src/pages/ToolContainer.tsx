import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { getToolById, toolComponents } from '../config/tools';

const ToolContainer: React.FC = () => {
  const { category, toolId } = useParams<{ category: string; toolId: string }>();
  const navigate = useNavigate();

  if (!category || !toolId) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="工具路径不正确"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  const tool = getToolById(category, toolId);

  if (!tool) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="工具不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  if (!tool.enabled) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="该工具已禁用"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  // 获取工具组件
  const componentKey = tool.componentKey || `${category}_${toolId}`;
  const ToolComponent = toolComponents[componentKey];

  if (!ToolComponent) {
    return (
      <Result
        status="500"
        title="500"
        subTitle={`工具组件未找到: ${componentKey}`}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Spin size="large" tip="加载工具中..." />
        </div>
      }
    >
      <ToolComponent />
    </Suspense>
  );
};

export default ToolContainer;

