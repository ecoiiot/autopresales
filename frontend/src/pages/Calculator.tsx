import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Form, Typography, message, Button, Space } from 'antd';
import axios from 'axios';
import type { ScoringConfig, Bidder, CalculationResult } from '../types';
import RuleConfig from '../components/RuleConfig';
import DataEntry from '../components/DataEntry';
import TemplateSelector from '../components/TemplateSelector';
import ExportRules from '../components/ExportRules';

// localStorage 键名
const STORAGE_KEY = 'calculator_data';

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

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log('从 localStorage 加载的数据:', data);
        
        // 恢复规则配置
        if (data.config) {
          console.log('恢复规则配置:', data.config);
          console.log('high_price_factor:', data.config.high_price_factor);
          console.log('low_price_factor:', data.config.low_price_factor);
          form.setFieldsValue(data.config);
          // 验证设置后的值
          setTimeout(() => {
            const afterSet = form.getFieldsValue();
            console.log('设置后的表单值:', afterSet);
            console.log('设置后的 high_price_factor:', afterSet.high_price_factor);
            console.log('设置后的 low_price_factor:', afterSet.low_price_factor);
          }, 100);
        }
        
        // 恢复投标单位数据
        if (data.bidders && Array.isArray(data.bidders)) {
          setBidders(data.bidders);
        }
        
        // 恢复计算结果（可选）
        if (data.result) {
          setResult(data.result);
        }
        
        // 恢复左侧宽度
        if (data.leftWidth !== undefined) {
          setLeftWidth(data.leftWidth);
        }
      }
    } catch (error) {
      console.error('加载保存的数据失败:', error);
    }
  }, [form]);

  // 保存数据的函数（使用防抖）
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveData = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      try {
        const config = form.getFieldsValue();
        const dataToSave = {
          config,
          bidders,
          result: result || null,
          leftWidth,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('保存数据失败:', error);
      }
    }, 300);
  }, [form, bidders, result, leftWidth]);

  // 保存数据到 localStorage
  useEffect(() => {
    saveData();
  }, [saveData]);

  // 加载模板
  const handleTemplateSelect = (config: ScoringConfig) => {
    form.setFieldsValue(config);
  };

  // 计算评分
  const handleCalculate = async () => {
    try {
      // 先验证表单
      await form.validateFields();
      // 然后获取最新的表单值（确保获取到用户输入的最新值）
      const config = form.getFieldsValue();
      
      // 详细打印表单中的所有字段值
      console.log('=== 表单所有字段值 ===');
      console.log('form.getFieldsValue():', config);
      console.log('high_price_type:', form.getFieldValue('high_price_type'));
      console.log('high_price_factor:', form.getFieldValue('high_price_factor'));
      console.log('low_price_type:', form.getFieldValue('low_price_type'));
      console.log('low_price_factor:', form.getFieldValue('low_price_factor'));
      
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

      // 处理单调式规则：将单个规则转换为数组格式
      const processedConfig = { ...config };
      
      // 打印原始配置，用于调试
      console.log('=== 原始配置（计算前） ===');
      console.log('high_price_type:', config.high_price_type);
      console.log('high_price_factor:', config.high_price_factor);
      console.log('low_price_type:', config.low_price_type);
      console.log('low_price_factor:', config.low_price_factor);
      console.log('high_price_rules:', config.high_price_rules);
      console.log('low_price_rules:', config.low_price_rules);
      
      // 判断是否为统一规则模式：如果存在 high_price_type 和 high_price_factor，说明是统一规则模式
      const isMonotonicMode = config.high_price_type !== undefined && config.high_price_factor !== undefined && config.high_price_factor !== null;
      
      if (isMonotonicMode) {
        // 统一规则模式：使用 high_price_type 和 high_price_factor
        console.log('检测到统一规则模式');
        console.log('高价规则 - 类型:', config.high_price_type, '系数:', config.high_price_factor);
        console.log('低价规则 - 类型:', config.low_price_type, '系数:', config.low_price_factor);
        
        // 高价规则：使用统一规则的系数
        if (config.high_price_type && config.high_price_factor !== undefined && config.high_price_factor !== null) {
          processedConfig.high_price_rules = [{
            min_dev: 0,
            max_dev: 100,
            type: config.high_price_type,
            factor: config.high_price_factor,
          }];
        }
        
        // 低价规则：使用统一规则的系数
        if (config.low_price_type && config.low_price_factor !== undefined && config.low_price_factor !== null) {
          processedConfig.low_price_rules = [{
            min_dev: 0,
            max_dev: 100,
            type: config.low_price_type,
            factor: config.low_price_factor,
          }];
        }
        
        // 删除临时字段
        delete processedConfig.high_price_type;
        delete processedConfig.high_price_factor;
        delete processedConfig.low_price_type;
        delete processedConfig.low_price_factor;
      } else {
        // 分段规则模式：使用 high_price_rules 和 low_price_rules
        console.log('检测到分段规则模式，使用 high_price_rules 和 low_price_rules');
        // 删除临时字段（如果存在）
        delete processedConfig.high_price_type;
        delete processedConfig.high_price_factor;
        delete processedConfig.low_price_type;
        delete processedConfig.low_price_factor;
      }
      
      console.log('=== 处理后的配置 ===');
      console.log('high_price_rules:', processedConfig.high_price_rules);
      console.log('low_price_rules:', processedConfig.low_price_rules);

      // 打印传递的数据
      const requestData = {
        config: processedConfig,
        bidders,
      };
      console.log('=== 计算评分 - 传递的数据 ===');
      console.log('完整数据:', JSON.stringify(requestData, null, 2));
      console.log('配置信息:', processedConfig);
      console.log('投标单位:', bidders);
      console.log('============================');

      setLoading(true);
      const response = await axios.post<CalculationResult>('/calculate', requestData);
      
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
        <Space>
          <Button 
            type="link" 
            danger 
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              console.log('已清理 localStorage 缓存');
              message.success('缓存已清理，页面将刷新');
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }}
            style={{ color: '#fff' }}
          >
            清理缓存
          </Button>
          <ExportRules form={form} />
        </Space>
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
          <RuleConfig 
            form={form}
            onValuesChange={saveData}
          />
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
            form={form}
          />
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default Calculator;
