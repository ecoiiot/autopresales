import React from 'react';
import { Button, Dropdown, message, Modal } from 'antd';
import type { ScoringConfig } from '../types';

export interface Template {
  key: string;
  label: string;
  config: ScoringConfig;
}

interface TemplateSelectorProps {
  templates: Record<string, ScoringConfig>;
  onSelect: (config: ScoringConfig) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => {
  const templateMenuItems = [
    {
      key: 'template1',
      label: '模板1：标准配置（去1高1低，K=0.95）',
    },
    {
      key: 'template2',
      label: '模板2：保守配置（K=1.0，多级去极值）',
    },
    {
      key: 'template3',
      label: '模板3：严格配置（去2高2低，多区间）',
    },
    {
      key: 'template4',
      label: '模板4：宽松配置（K=0.92，简单规则）',
    },
  ];

  const handleSelect = ({ key }: { key: string }) => {
    const template = templates[key];
    if (template) {
      Modal.confirm({
        title: '确认加载模板',
        content: '加载模板将覆盖当前已录入的规则配置，是否继续？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          onSelect(template);
          message.success('模板加载成功');
        },
      });
    }
  };

  return (
    <Dropdown menu={{ items: templateMenuItems, onClick: handleSelect }}>
      <Button>加载模板</Button>
    </Dropdown>
  );
};

export default TemplateSelector;

