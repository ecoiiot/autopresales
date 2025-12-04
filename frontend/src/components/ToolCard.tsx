import React from 'react';
import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Tool } from '../config/tools';

const { Title, Text } = Typography;

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tool.enabled) {
      navigate(tool.path);
    }
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{
        height: '100%',
        cursor: tool.enabled ? 'pointer' : 'not-allowed',
        opacity: tool.enabled ? 1 : 0.6,
        transition: 'all 0.3s',
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{ textAlign: 'center' }}>
        {tool.icon ? (
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{tool.icon}</div>
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold',
            }}
          >
            {tool.name.charAt(0)}
          </div>
        )}
        <Title level={5} style={{ marginBottom: '8px', marginTop: 0 }}>
          {tool.name}
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {tool.description || '暂无描述'}
        </Text>
      </div>
    </Card>
  );
};

export default ToolCard;

