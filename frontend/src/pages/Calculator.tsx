import React, { useState } from 'react';
import { Layout, Form, Button, Typography, message } from 'antd';
import { FolderOpenOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { ScoringConfig, Bidder, CalculationResult, ProjectFile } from '../types';
import RuleConfig from '../components/RuleConfig';
import DataEntry from '../components/DataEntry';
import TemplateSelector from '../components/TemplateSelector';

const { Text } = Typography;

// 预设模板
const templates: Record<string, ScoringConfig> = {
  template1: {
    k_factor: 0.95,
    base_score: 100,
    outlier_rules: [
      { min_count: 5, remove_high: 1, remove_low: 1 },
    ],
    high_price_rules: [
      { min_dev: 0, max_dev: 100, type: 'deduct', factor: 0.5 },
    ],
    low_price_rules: [
      { min_dev: 0, max_dev: 5, type: 'add', factor: 0.3 },
      { min_dev: 5, max_dev: 10, type: 'add', factor: 0.2 },
      { min_dev: 10, max_dev: 15, type: 'deduct', factor: 0.1 },
    ],
  },
  template2: {
    k_factor: 1.0,
    base_score: 100,
    outlier_rules: [
      { min_count: 3, remove_high: 1, remove_low: 0 },
      { min_count: 7, remove_high: 1, remove_low: 1 },
    ],
    high_price_rules: [
      { min_dev: 0, max_dev: 100, type: 'deduct', factor: 0.8 },
    ],
    low_price_rules: [
      { min_dev: 0, max_dev: 3, type: 'add', factor: 0.5 },
      { min_dev: 3, max_dev: 8, type: 'add', factor: 0.3 },
    ],
  },
  template3: {
    k_factor: 0.98,
    base_score: 100,
    outlier_rules: [
      { min_count: 10, remove_high: 2, remove_low: 2 },
    ],
    high_price_rules: [
      { min_dev: 0, max_dev: 100, type: 'deduct', factor: 1.0 },
    ],
    low_price_rules: [
      { min_dev: 0, max_dev: 2, type: 'add', factor: 0.4 },
      { min_dev: 2, max_dev: 5, type: 'add', factor: 0.2 },
      { min_dev: 5, max_dev: 10, type: 'deduct', factor: 0.2 },
      { min_dev: 10, max_dev: 20, type: 'deduct', factor: 0.5 },
    ],
  },
  template4: {
    k_factor: 0.92,
    base_score: 100,
    outlier_rules: [
      { min_count: 5, remove_high: 1, remove_low: 1 },
      { min_count: 15, remove_high: 2, remove_low: 2 },
    ],
    high_price_rules: [
      { min_dev: 0, max_dev: 100, type: 'deduct', factor: 0.6 },
    ],
    low_price_rules: [
      { min_dev: 0, max_dev: 8, type: 'add', factor: 0.25 },
    ],
  },
};

const Calculator: React.FC = () => {
  const [form] = Form.useForm<ScoringConfig>();
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // 左侧宽度百分比
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 打开JSON文件
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ProjectFile = JSON.parse(content);
        
        // 加载配置
        if (data.config) {
          form.setFieldsValue(data.config);
        }
        
        // 加载投标单位
        if (data.bidders && data.bidders.length > 0) {
          setBidders(data.bidders);
        }
        
        // 加载结果
        if (data.result) {
          setResult(data.result);
        }
        
        message.success('文件加载成功');
      } catch (error) {
        message.error('文件格式错误，请选择有效的JSON文件');
        console.error('加载文件失败:', error);
      }
    };
    reader.readAsText(file);
    
    // 清空input，以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 保存为JSON文件
  const handleSaveFile = () => {
    try {
      const config = form.getFieldsValue();
      
      const fileData: ProjectFile = {
        version: '1.0',
        timestamp: Date.now(),
        config,
        bidders,
        result: result || undefined,
      };
      
      // 创建JSON字符串
      const jsonString = JSON.stringify(fileData, null, 2);
      
      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `评分项目_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('文件已保存');
    } catch (error) {
      console.error('保存文件失败:', error);
      message.error('保存文件失败');
    }
  };

  // 加载模板
  const handleTemplateSelect = (config: ScoringConfig) => {
    form.setFieldsValue(config);
  };

  // 计算评分
  const handleCalculate = async () => {
    try {
      const config = await form.validateFields();
      
      if (bidders.length === 0) {
        message.error('请至少输入一个投标单位');
        return;
      }

      // 验证所有投标单位都有名称和价格
      const invalidBidders = bidders.filter(b => !b.name || !b.price || b.price <= 0);
      if (invalidBidders.length > 0) {
        message.error('请确保所有投标单位都有有效的名称和报价');
        return;
      }

      setLoading(true);
      const response = await axios.post<CalculationResult>('/calculate', {
        config,
        bidders,
      });
      
      setResult(response.data);
      message.success('计算完成');
    } catch (error: any) {
      if (error.response) {
        message.error(`计算失败: ${error.response.data?.detail || error.message}`);
      } else if (error.errorFields) {
        message.error('请检查表单配置');
      } else {
        message.error(`计算失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <Layout.Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text strong style={{ color: '#fff', fontSize: 18 }}>
          报价规则计算工具
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<FolderOpenOutlined />} onClick={handleOpenFile}>
            打开文件
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveFile}>
            保存文件
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </Layout.Header>

      {/* Body: 左右两栏布局 */}
      <Layout.Content style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* 左侧：规则配置 */}
        <div
          style={{
            width: `${leftWidth}%`,
            background: '#fff',
            padding: '24px',
            overflow: 'auto',
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>规则配置</Typography.Title>
            <TemplateSelector templates={templates} onSelect={handleTemplateSelect} />
          </div>
          <RuleConfig form={form} />
        </div>

        {/* 拖拽分隔条 */}
        <div
          style={{
            width: '4px',
            background: '#f0f0f0',
            cursor: 'col-resize',
            position: 'relative',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startLeftWidth = leftWidth;
            const containerWidth = window.innerWidth;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaPercent = (deltaX / containerWidth) * 100;
              const newLeftWidth = Math.max(20, Math.min(80, startLeftWidth + deltaPercent));
              setLeftWidth(newLeftWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '40px',
              background: '#d9d9d9',
              borderRadius: '1px',
            }}
          />
        </div>

        {/* 右侧：数据录入 */}
        <div
          style={{
            width: `${100 - leftWidth}%`,
            background: '#fff',
            padding: '24px',
            overflow: 'auto',
          }}
        >
          <DataEntry
            bidders={bidders}
            setBidders={setBidders}
            onCalculate={handleCalculate}
            loading={loading}
            result={result}
          />
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default Calculator;
